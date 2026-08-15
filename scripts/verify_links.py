#!/usr/bin/env python3
"""Check that links in journal pages and the decision register resolve.

Reference rot is invisible to every other check in this repository:
``verify_writing_style.py`` confirms that a ``Primary references`` section
exists and contains at least one ``http`` link, but never requests it, and
``verify_content_decisions.py`` validates that a decision record stores a
source URL without fetching it. Dead citations therefore pass every gate.

Two classes of link are checked:

* **External** (``https://…``) — fetched over the network. Deliberately NOT
  part of the deploy quality gate: a remote host being briefly unavailable
  must not block publishing. Run it during a review, or on a schedule.
* **Internal** (``{{ '/topics/…/' | relative_url }}``, and ``url:`` entries in
  the navigation data) — resolved offline against the ``permalink`` declared
  in each page's front matter. A cross-reference to a page that does not
  exist is a hard failure and is safe to gate on, because it needs no network.

Run:
    python3 scripts/verify_links.py                  # topics + nav + register
    python3 scripts/verify_links.py topics/ssh.md    # specific files
    python3 scripts/verify_links.py --internal-only  # offline check only
"""

from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TOPICS_DIR = REPO_ROOT / "topics"
DECISIONS = REPO_ROOT / "reviews" / "CONTENT_DECISIONS.yml"
NAV_DATA = REPO_ROOT / "_data" / "nav.yml"
TOPIC_NAV = REPO_ROOT / "_includes" / "topic-nav.html"
INDEX_PAGE = REPO_ROOT / "index.md"

# Internal cross-references are written as Liquid, so a plain URL regex cannot
# see them. Four shapes appear in this repository:
#   {{ '/topics/foo/' | relative_url }}   prose links and diagram hrefs
#   url: /topics/foo/                     _data/nav.yml
#   assign next_url = '/topics/foo/'      _includes/topic-nav.html
#   ](../foo/)                            plain Markdown sibling-page links
LIQUID_RELATIVE_URL = re.compile(r"""['"](/[^'"]*)['"]\s*\|\s*relative_url""")
NAV_URL = re.compile(r"^\s*-?\s*url:\s*(/\S*)\s*$", re.M)
LIQUID_ASSIGN_URL = re.compile(r"assign\s+\w*url\w*\s*=\s*'(/[^']*)'")
# A sibling-page Markdown link resolves relative to the current page's permalink,
# so from /topics/a/ the target ../b/ is /topics/b/. The Liquid form is preferred
# and is what the rest of the repository uses, but this shape has appeared before
# and is invisible to the three patterns above — which is exactly how a reference
# to a non-existent page would reach production unchecked.
MARKDOWN_SIBLING_LINK = re.compile(r"\]\(\.\./([A-Za-z0-9._-]+)/\)")

# Paths that exist without a declaring page.
STATIC_INTERNAL_PATHS = {"/"}

# Backticks are excluded so a URL is never captured with a code-span
# delimiter attached. Illustrative URLs inside code spans and fenced blocks
# are stripped before extraction — they are examples, not citations, and
# hosts like example.com are not expected to resolve.
URL_PATTERN = re.compile(r'https?://[^\s\)\]"\'<>`]+')
FENCED_BLOCK = re.compile(r"^\s*(```|~~~).*?^\s*\1", re.M | re.S)
CODE_SPAN = re.compile(r"`[^`\n]*`")
TRAILING_PUNCTUATION = ".,;:!?"

# 401/403 mean the host refused an automated client; 429 means it rate-limited
# us. Neither establishes that the page is gone, so they are reported as
# "could not verify" rather than as failures.
BOT_BLOCKED_STATUSES = {401, 403, 429}
TIMEOUT_SECONDS = 25
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120 Safari/537.36"
)


def collect(paths: list[Path]) -> dict[str, set[str]]:
    """Map each URL to the set of files citing it."""
    urls: dict[str, set[str]] = {}
    for path in paths:
        text = path.read_text(encoding="utf-8")
        text = FENCED_BLOCK.sub("", text)
        text = CODE_SPAN.sub("", text)
        for url in URL_PATTERN.findall(text):
            url = url.rstrip(TRAILING_PUNCTUATION)
            if url:
                urls.setdefault(url, set()).add(display_path(path))
    return urls


def display_path(path: Path) -> str:
    """Repository-relative where possible; an explicit path otherwise."""
    try:
        return path.relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def declared_permalinks() -> set[str]:
    """Every page path the site actually publishes, from front-matter permalinks."""
    published = set(STATIC_INTERNAL_PATHS)
    sources = sorted(TOPICS_DIR.glob("*.md"))
    if INDEX_PAGE.exists():
        sources.append(INDEX_PAGE)
    for path in sources:
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.startswith("permalink:"):
                value = line.split(":", 1)[1].strip().strip("\"'")
                if value:
                    published.add("/" + value.strip("/") + "/")
                break
    return published


def collect_internal(paths: list[Path]) -> dict[str, set[str]]:
    """Map each internal page path to the set of files referencing it."""
    refs: dict[str, set[str]] = {}
    for path in paths:
        text = path.read_text(encoding="utf-8")
        found = (
            LIQUID_RELATIVE_URL.findall(text)
            + NAV_URL.findall(text)
            + LIQUID_ASSIGN_URL.findall(text)
            # A ../slug/ link inside topics/ resolves against /topics/.
            + [
                f"/topics/{slug}/"
                for slug in MARKDOWN_SIBLING_LINK.findall(text)
                if path.parent.name == "topics"
            ]
        )
        for target in found:
            # Only page references are resolvable this way; asset paths are
            # checked by their presence on disk instead.
            if target.startswith("/assets/") or target.startswith("/journal/assets/"):
                continue
            normalized = target if target == "/" else "/" + target.strip("/") + "/"
            refs.setdefault(normalized, set()).add(display_path(path))
    return refs


def collect_assets(paths: list[Path]) -> dict[str, set[str]]:
    """Map each referenced asset path to the set of files referencing it."""
    refs: dict[str, set[str]] = {}
    for path in paths:
        text = path.read_text(encoding="utf-8")
        for target in LIQUID_RELATIVE_URL.findall(text):
            if not target.startswith("/assets/"):
                continue
            refs.setdefault(target, set()).add(display_path(path))
    return refs


def check(url: str) -> tuple[str, int | None, str | None, str]:
    """Return (url, status, error, final_url) for one link."""
    try:
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            return url, response.status, None, response.geturl()
    except urllib.error.HTTPError as error:
        return url, error.code, None, url
    except Exception as error:  # noqa: BLE001 - one bad URL must not abort the run
        reason = getattr(error, "reason", error)
        return url, None, f"{type(error).__name__}: {reason}", url


def run_internal_checks(paths: list[Path]) -> int:
    """Resolve internal page and asset references offline. Returns a failure count."""
    published = declared_permalinks()
    internal = collect_internal(paths)
    assets = collect_assets(paths)

    dead_pages = {t: c for t, c in internal.items() if t not in published}
    dead_assets = {
        t: c for t, c in assets.items() if not (REPO_ROOT / t.lstrip("/")).is_file()
    }

    print(
        f"Resolving {len(internal)} internal page reference(s) and "
        f"{len(assets)} asset reference(s) against {len(published)} published path(s)...\n"
    )

    for label, dead in (("page", dead_pages), ("asset", dead_assets)):
        if not dead:
            continue
        print(f"❌ {len(dead)} internal {label} reference(s) do not exist:\n")
        for target in sorted(dead):
            print(f"  {target}")
            for citing in sorted(dead[target]):
                print(f"       referenced in {citing}")
        print()

    failures = len(dead_pages) + len(dead_assets)
    if failures == 0:
        print("✅ All internal page and asset references resolve.\n")
    return failures


def main(argv: list[str]) -> int:
    internal_only = "--internal-only" in argv
    argv = [a for a in argv if a != "--internal-only"]

    if argv:
        paths = [Path(a) if Path(a).is_absolute() else REPO_ROOT / a for a in argv]
        internal_sources = paths
    else:
        paths = sorted(TOPICS_DIR.glob("*.md"))
        if DECISIONS.exists():
            paths.append(DECISIONS)
        internal_sources = sorted(TOPICS_DIR.glob("*.md"))
        internal_sources += [p for p in (NAV_DATA, TOPIC_NAV, INDEX_PAGE) if p.is_file()]

    missing = [p for p in paths if not p.is_file()]
    if missing:
        for path in missing:
            print(f"no such file: {path}", file=sys.stderr)
        return 2

    internal_failures = run_internal_checks(internal_sources)
    if internal_only:
        return 1 if internal_failures else 0

    urls = collect(paths)
    print(f"Checking {len(urls)} unique external link(s) across {len(paths)} file(s)...\n")

    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(check, sorted(urls)))

    broken: list[tuple[str, int | None, str | None]] = []
    unverifiable: list[tuple[str, int]] = []
    redirected: list[tuple[str, str]] = []
    for url, status, error, final_url in results:
        if status in BOT_BLOCKED_STATUSES:
            # A publisher refusing an automated client says nothing about
            # whether the page exists. Report separately so the tool does not
            # cry wolf; confirm these by hand during review.
            unverifiable.append((url, status))
        elif error is not None or status is None or status >= 400:
            broken.append((url, status, error))
        elif final_url.rstrip("/") != url.rstrip("/"):
            redirected.append((url, final_url))

    if redirected:
        print(f"ℹ️  {len(redirected)} link(s) resolve only via redirect:\n")
        for url, final_url in redirected:
            print(f"  {url}\n    -> {final_url}")
            for citing in sorted(urls[url]):
                print(f"       cited in {citing}")
        print()

    if unverifiable:
        print(
            f"⚠️  {len(unverifiable)} link(s) could not be verified automatically "
            "(the host blocked or rate-limited the request). Check these by hand:\n"
        )
        for url, status in unverifiable:
            print(f"  [{status}] {url}")
        print()

    if broken:
        print(f"❌ {len(broken)} external link(s) failed:\n")
        for url, status, error in broken:
            detail = f"HTTP {status}" if status is not None else f"unreachable ({error})"
            print(f"  {url}\n    {detail}")
            for citing in sorted(urls[url]):
                print(f"       cited in {citing}")
        return 1

    if internal_failures:
        return 1

    print(f"✅ All {len(urls) - len(unverifiable)} verifiable external links resolved.")
    print(
        "ℹ️  A 200 response proves the URL resolves. It does not prove the page "
        "still says what the citation claims — verify content during review."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
