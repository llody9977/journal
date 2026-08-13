#!/usr/bin/env python3
"""Compatibility checker for the journal's required topic endings.

This script used to append hard-coded callouts and references to many pages. Those
copies repeatedly drifted from the reviewed topic text. Semantic summaries and
source descriptions cannot be generated safely from a generic template, so the
current helper verifies the canonical page endings and asks the author to write a
page-specific ending when one is missing.
"""

from pathlib import Path
import sys


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
TOPICS_DIRECTORY = REPOSITORY_ROOT / "topics"
CALLOUT = '<span class="callout-title">What I need to remember</span>'
REFERENCES = "## Primary references"


def ending_errors(path: Path) -> list[str]:
    content = path.read_text(encoding="utf-8")
    callout_at = content.rfind(CALLOUT)
    references_at = content.rfind(REFERENCES)
    errors: list[str] = []

    if callout_at < 0:
        errors.append("missing the What I need to remember callout")
    if references_at < 0:
        errors.append("missing the Primary references section")
    if callout_at >= 0 and references_at >= 0 and callout_at > references_at:
        errors.append("places Primary references before the summary callout")
    if references_at >= 0 and not content[references_at + len(REFERENCES):].strip():
        errors.append("has an empty Primary references section")

    return errors


def main() -> int:
    failures: list[str] = []
    topic_files = sorted(TOPICS_DIRECTORY.glob("*.md"))

    for topic_file in topic_files:
        for error in ending_errors(topic_file):
            failures.append(f"{topic_file.relative_to(REPOSITORY_ROOT)}: {error}")

    if failures:
        print("Required ending check failed:")
        for failure in failures:
            print(f"- {failure}")
        print(
            "Write a page-specific summary and primary-source list that accurately "
            "reflect the reviewed page; this helper deliberately does not insert "
            "generic or stale security claims."
        )
        return 1

    print(f"Verified required endings on {len(topic_files)} topic pages.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
