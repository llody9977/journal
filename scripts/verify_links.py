#!/usr/bin/env python3
"""Check that external links in journal pages and the decision register resolve.

Reference rot is invisible to every other check in this repository:
``verify_writing_style.py`` confirms that a ``Primary references`` section
exists and contains at least one ``http`` link, but never requests it, and
``verify_content_decisions.py`` validates that a decision record stores a
source URL without fetching it. Dead citations therefore pass every gate.

This check is deliberately NOT part of the deploy quality gate — a remote
host being briefly unavailable must not block publishing. Run it during a
review, or on a schedule.

Run:
    python3 scripts/verify_links.py                  # topics + decision register
    python3 scripts/verify_links.py topics/ssh.md    # specific files
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
                urls.setdefault(url, set()).add(path.relative_to(REPO_ROOT).as_posix())
    return urls


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


def main(argv: list[str]) -> int:
    if argv:
        paths = [Path(a) if Path(a).is_absolute() else REPO_ROOT / a for a in argv]
    else:
        paths = sorted(TOPICS_DIR.glob("*.md"))
        if DECISIONS.exists():
            paths.append(DECISIONS)

    missing = [p for p in paths if not p.is_file()]
    if missing:
        for path in missing:
            print(f"no such file: {path}", file=sys.stderr)
        return 2

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
        print(f"❌ {len(broken)} link(s) failed:\n")
        for url, status, error in broken:
            detail = f"HTTP {status}" if status is not None else f"unreachable ({error})"
            print(f"  {url}\n    {detail}")
            for citing in sorted(urls[url]):
                print(f"       cited in {citing}")
        return 1

    print(f"✅ All {len(urls) - len(unverifiable)} verifiable external links resolved.")
    print(
        "ℹ️  A 200 response proves the URL resolves. It does not prove the page "
        "still says what the citation claims — verify content during review."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
