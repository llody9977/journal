#!/usr/bin/env python3
"""Validate and query the durable journal content-decision register."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


ALLOWED_STATUSES = {"accepted", "rejected", "superseded"}
ALLOWED_IMPLEMENTATION_STATES = {"implemented", "not_applicable", "pending"}
REQUIRED_FIELDS = {
    "id",
    "title",
    "status",
    "implementation_state",
    "scope",
    "originating_feedback",
    "decision",
    "rationale",
    "authoritative_sources",
    "verification_methods",
    "approved_outcome",
    "invalidation_conditions",
    "related_decisions",
    "supersedes",
    "superseded_by",
    "originated_on",
    "last_reviewed_on",
}


def repository_root() -> Path:
    return Path(__file__).resolve().parent.parent


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--file",
        action="append",
        default=[],
        help="Show validated decisions that apply to this repository-relative file; repeat as needed.",
    )
    parser.add_argument(
        "--concept",
        action="append",
        default=[],
        help="Show validated decisions whose concepts contain this case-insensitive text.",
    )
    return parser.parse_args()


def load_registry(path: Path) -> dict[str, object]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"cannot parse {path.relative_to(repository_root())}: {error}") from error


def validate(registry: dict[str, object], root: Path) -> list[str]:
    errors: list[str] = []
    if registry.get("schema_version") != 1:
        errors.append("schema_version must be 1")

    decisions = registry.get("decisions")
    if not isinstance(decisions, list) or not decisions:
        return errors + ["decisions must be a non-empty list"]

    ids: set[str] = set()
    titles: set[str] = set()
    for index, decision in enumerate(decisions, start=1):
        label = f"decision #{index}"
        if not isinstance(decision, dict):
            errors.append(f"{label} must be an object")
            continue

        missing = sorted(REQUIRED_FIELDS - decision.keys())
        if missing:
            errors.append(f"{label} is missing: {', '.join(missing)}")

        decision_id = decision.get("id")
        if not isinstance(decision_id, str) or not re.fullmatch(r"CD-\d{4}", decision_id):
            errors.append(f"{label} has invalid id {decision_id!r}; expected CD-NNNN")
        elif decision_id in ids:
            errors.append(f"duplicate decision id: {decision_id}")
        else:
            ids.add(decision_id)
            label = decision_id

        title = decision.get("title")
        if not isinstance(title, str) or not title.strip():
            errors.append(f"{label} requires a non-empty title")
        elif title in titles:
            errors.append(f"duplicate decision title: {title}")
        else:
            titles.add(title)

        status = decision.get("status")
        if status not in ALLOWED_STATUSES:
            errors.append(f"{label} has invalid status {status!r}")

        implementation_state = decision.get("implementation_state")
        if implementation_state not in ALLOWED_IMPLEMENTATION_STATES:
            errors.append(f"{label} has invalid implementation_state {implementation_state!r}")
        if implementation_state == "pending" and decision.get("allow_pending") is not True:
            errors.append(f"{label} is pending without allow_pending: true")

        scope = decision.get("scope")
        if not isinstance(scope, dict):
            errors.append(f"{label} scope must be an object")
        else:
            files = scope.get("files")
            concepts = scope.get("concepts")
            if not isinstance(files, list) or not files:
                errors.append(f"{label} scope.files must be a non-empty list")
            else:
                for raw_path in files:
                    if not isinstance(raw_path, str) or not raw_path:
                        errors.append(f"{label} contains an invalid scope file")
                    elif not (root / raw_path).is_file():
                        # A superseded record is preserved history. The decision
                        # that superseded it may well have been to delete the very
                        # file it governed, so requiring that file to still exist
                        # would force the old record to be rewritten — which
                        # CONTENT_DECISION_GUIDE.md explicitly forbids. Accepted
                        # and rejected records must still name live files.
                        if status != "superseded":
                            errors.append(
                                f"{label} scope file does not exist: {raw_path}"
                            )
            if not isinstance(concepts, list) or not concepts or not all(
                isinstance(item, str) and item.strip() for item in concepts
            ):
                errors.append(f"{label} scope.concepts must contain non-empty strings")

        sources = decision.get("authoritative_sources")
        methods = decision.get("verification_methods")
        if not isinstance(sources, list) or not isinstance(methods, list):
            errors.append(f"{label} sources and verification_methods must be lists")
        elif not sources and not methods:
            errors.append(f"{label} requires at least one source or verification method")
        if isinstance(sources, list):
            for source in sources:
                if not isinstance(source, dict):
                    errors.append(f"{label} contains a non-object source")
                    continue
                if not all(source.get(field) for field in ("title", "url", "supports")):
                    errors.append(f"{label} source requires title, url, and supports")
                elif not re.match(r"https://", str(source["url"])):
                    errors.append(f"{label} source URL must use HTTPS: {source['url']}")

        for field in ("originating_feedback", "decision", "rationale", "approved_outcome"):
            if not isinstance(decision.get(field), str) or not decision[field].strip():
                errors.append(f"{label} requires non-empty {field}")

        for field in ("invalidation_conditions", "related_decisions", "supersedes"):
            if not isinstance(decision.get(field), list):
                errors.append(f"{label} {field} must be a list")

        if status == "superseded" and not decision.get("superseded_by"):
            errors.append(f"{label} is superseded but has no superseded_by id")
        if status != "superseded" and decision.get("superseded_by") is not None:
            errors.append(f"{label} is not superseded but superseded_by is set")

    for decision in decisions:
        if not isinstance(decision, dict):
            continue
        decision_id = decision.get("id", "unknown")
        references = list(decision.get("related_decisions", [])) + list(decision.get("supersedes", []))
        if decision.get("superseded_by"):
            references.append(decision["superseded_by"])
        for reference in references:
            if reference not in ids:
                errors.append(f"{decision_id} references unknown decision {reference}")
            if reference == decision_id:
                errors.append(f"{decision_id} cannot reference itself")

    return errors


def relevant_decisions(
    decisions: list[dict[str, object]], files: list[str], concepts: list[str]
) -> list[dict[str, object]]:
    normalized_files = {Path(item).as_posix() for item in files}
    lowered_concepts = [item.casefold() for item in concepts]
    matches: list[dict[str, object]] = []
    for decision in decisions:
        scope = decision["scope"]
        scoped_files = {Path(item).as_posix() for item in scope["files"]}
        scoped_concepts = [item.casefold() for item in scope["concepts"]]
        file_match = bool(normalized_files & scoped_files)
        concept_match = any(
            query in concept
            for query in lowered_concepts
            for concept in scoped_concepts
        )
        if file_match or concept_match:
            matches.append(decision)
    return matches


def main() -> int:
    args = parse_args()
    root = repository_root()
    registry_path = root / "reviews" / "CONTENT_DECISIONS.yml"
    try:
        registry = load_registry(registry_path)
    except ValueError as error:
        print(f"Decision-register validation failed: {error}", file=sys.stderr)
        return 1

    errors = validate(registry, root)
    if errors:
        print(f"Decision-register validation failed with {len(errors)} error(s):", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    decisions = registry["decisions"]
    if args.file or args.concept:
        matches = relevant_decisions(decisions, args.file, args.concept)
        if not matches:
            print("No applicable durable content decisions found.")
            return 0
        for decision in matches:
            print(
                f"{decision['id']} [{decision['status']}/{decision['implementation_state']}] "
                f"{decision['title']}"
            )
        return 0

    print(f"Validated {len(decisions)} durable content decisions.")
    print("This check validates registry structure and references, not technical correctness.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
