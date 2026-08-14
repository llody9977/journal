#!/usr/bin/env python3
"""Detect markup that renders incorrectly in the published journal.

The site is built by Jekyll with kramdown and loads no math renderer
(no MathJax, no KaTeX). Anything written as LaTeX therefore reaches the
reader as literal source text, or — for ``$$ ... $$`` blocks — as visible
``\\[ ... \\]`` markers. A pipe character inside such an expression is worse
still: kramdown reads the line as a GFM table and silently restructures the
paragraph into a table.

None of that is visible to a syntax check, a link check, or the
page-structure check. It is only visible in rendered output, which is why it
survived several reviews. This script makes it mechanically detectable.

Run:
    python3 scripts/verify_rendering_hazards.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TOPICS_DIR = REPO_ROOT / "topics"

FENCE = re.compile(r"^\s*(```|~~~)")
SCRIPT_OPEN = re.compile(r"<(script|style)\b", re.I)
SCRIPT_CLOSE = re.compile(r"</(script|style)>", re.I)
RAW_OPEN = re.compile(r"\{%-?\s*raw\s*-?%\}")
RAW_CLOSE = re.compile(r"\{%-?\s*endraw\s*-?%\}")

# Code spans are stripped before matching so that prose about shell
# variables, currency, or regex is not reported.
CODE_SPAN = re.compile(r"`[^`\n]*`")

# A "$ ... $" span carrying a LaTeX command, e.g. $\frac{a}{b}$.
MATH_COMMAND = re.compile(r"\$\$?[^$\n]*\\[A-Za-z]+[^$\n]*\$\$?")

# A "$ ... $" span containing a pipe, e.g. $|Z| > 3.0$. This is the worst
# case: kramdown counts the pipes and silently reparses the whole paragraph
# as a GFM table, so the sentence is restructured, not merely unrendered.
MATH_PIPE = re.compile(r"\$[^$\n]*\|[^$\n]*\$")

# A whole-line "$$ ... $$" display block. kramdown emits these as visible
# \[ ... \] markers when no math engine is configured.
DISPLAY_BLOCK = re.compile(r"^\s*\$\$.*\$\$\s*$")

# Bare \[ ... \] display delimiters, which kramdown does not process at all.
DISPLAY_DELIM = re.compile(r"(?<!\\)\\\[|(?<!\\)\\\]")


def scan(text: str) -> list[tuple[int, str, str]]:
    """Return (line number, hazard kind, offending excerpt) for one file."""
    findings: list[tuple[int, str, str]] = []
    in_fence = False
    in_script = False
    in_raw = False

    for number, raw in enumerate(text.splitlines(), start=1):
        # Regions kramdown passes through untouched: fenced code, embedded
        # <script>/<style>, and Liquid {% raw %} blocks. Markup inside them is
        # never rendered as prose, so LaTeX-looking text there is not a hazard.
        if RAW_OPEN.search(raw):
            in_raw = True
        if RAW_CLOSE.search(raw):
            in_raw = False
            continue
        if SCRIPT_OPEN.search(raw):
            in_script = True
        if SCRIPT_CLOSE.search(raw):
            in_script = False
            continue
        if FENCE.match(raw):
            in_fence = not in_fence
            continue
        if in_fence or in_script or in_raw:
            continue

        line = CODE_SPAN.sub("", raw)

        match = MATH_PIPE.search(line)
        if match:
            findings.append((
                number,
                "math span containing '|' — kramdown reparses the line as a table",
                match.group(0).strip(),
            ))
            continue

        match = MATH_COMMAND.search(line)
        if match:
            findings.append((
                number,
                "raw LaTeX — no math renderer is loaded, so it reaches the reader as source",
                match.group(0).strip(),
            ))
            continue

        if DISPLAY_BLOCK.match(line):
            findings.append((
                number,
                "$$ display block — renders as a visible \\[ ... \\] marker",
                line.strip()[:120],
            ))
            continue

        if DISPLAY_DELIM.search(line):
            findings.append(
                (number, "display-math delimiter renders literally", line.strip()[:120])
            )

    return findings


def main() -> int:
    files = sorted(TOPICS_DIR.glob("*.md"))
    print(f"Scanning {len(files)} topic files for rendering hazards...\n")

    failures: list[tuple[str, list[tuple[int, str, str]]]] = []
    for path in files:
        findings = scan(path.read_text(encoding="utf-8"))
        if findings:
            failures.append((path.name, findings))

    if failures:
        total = sum(len(f) for _, f in failures)
        print(f"❌ Found {total} rendering hazard(s) in {len(failures)} file(s):\n")
        for name, findings in failures:
            print(f"  File: topics/{name}")
            for number, kind, excerpt in findings:
                print(f"    - line {number}: {kind}")
                print(f"      {excerpt}")
        print(
            "\nWrite formulas as literal text instead: Unicode operators "
            "(×, ÷, →, ≤, ε), a code span, or a <p class=\"formula\"> block."
        )
        return 1

    print(f"✅ All {len(files)} topic files are free of known rendering hazards.")
    print(
        "ℹ️  This check does not verify factual accuracy, diagram/caption "
        "agreement, or that any diagram renders legibly. Inspect rendered "
        "output for those."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
