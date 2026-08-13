#!/usr/bin/env python3
"""Capture a deterministic repository state for an auditable content review."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import subprocess
import sys
from pathlib import Path


def git(root: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=root,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    return result.stdout.rstrip("\n")


def repository_root() -> Path:
    script_directory = Path(__file__).resolve().parent
    result = subprocess.run(
        ["git", "-C", str(script_directory), "rev-parse", "--show-toplevel"],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    return Path(result.stdout.strip()).resolve()


def repository_files(root: Path) -> list[Path]:
    names = git(root, "ls-files", "--cached", "--others", "--exclude-standard")
    return [root / name for name in names.splitlines() if name]


def resolve_scope(root: Path, requested: list[str]) -> list[Path]:
    available = repository_files(root)
    if not requested:
        return sorted(available)

    selected: set[Path] = set()
    for raw_scope in requested:
        candidate = (root / raw_scope).resolve()
        try:
            candidate.relative_to(root)
        except ValueError as error:
            raise ValueError(f"scope is outside the repository: {raw_scope}") from error

        if candidate.is_file():
            selected.add(candidate)
            continue
        if candidate.is_dir():
            selected.update(path for path in available if candidate in path.parents)
            continue
        raise ValueError(f"scope does not exist: {raw_scope}")

    return sorted(selected)


def file_digest(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def capture(root: Path, files: list[Path], requested: list[str]) -> dict[str, object]:
    entries: list[dict[str, object]] = []
    aggregate = hashlib.sha256()

    for path in files:
        relative = path.relative_to(root).as_posix()
        digest = file_digest(path)
        size = path.stat().st_size
        entries.append({"path": relative, "sha256": digest, "bytes": size})
        aggregate.update(relative.encode("utf-8"))
        aggregate.update(b"\0")
        aggregate.update(digest.encode("ascii"))
        aggregate.update(b"\0")

    status = git(root, "status", "--porcelain=v1", "--untracked-files=all")
    head = git(root, "rev-parse", "HEAD")
    branch = git(root, "branch", "--show-current") or "DETACHED"
    scoped_fingerprint = aggregate.hexdigest()
    state_material = "\n".join((head, branch, status, scoped_fingerprint))
    state_id = hashlib.sha256(state_material.encode("utf-8")).hexdigest()

    return {
        "schema_version": 1,
        "captured_at_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "repository": str(root),
        "branch": branch,
        "commit": head,
        "worktree": "clean" if not status else "dirty",
        "git_status_porcelain": status.splitlines(),
        "requested_scope": requested or ["<entire repository>"],
        "file_count": len(entries),
        "scoped_content_fingerprint_sha256": scoped_fingerprint,
        "review_state_id_sha256": state_id,
        "files": entries,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--scope",
        action="append",
        default=[],
        metavar="PATH",
        help="Repository-relative file or directory; repeat to define the complete scope.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Write JSON to this path instead of standard output.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        root = repository_root()
        files = resolve_scope(root, args.scope)
        if not files:
            raise ValueError("scope contains no tracked or untracked files")
        payload = capture(root, files, args.scope)
    except (subprocess.CalledProcessError, OSError, ValueError) as error:
        print(f"capture failed: {error}", file=sys.stderr)
        return 1

    rendered = json.dumps(payload, indent=2, sort_keys=True) + "\n"
    if args.output:
        output = (
            args.output.expanduser()
            if args.output.is_absolute()
            else Path.cwd() / args.output
        ).resolve()
        try:
            output.relative_to(root)
        except ValueError:
            pass
        else:
            print(
                "capture failed: --output must be outside the repository so the snapshot does not change its own baseline",
                file=sys.stderr,
            )
            return 1
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(rendered, encoding="utf-8")
    else:
        sys.stdout.write(rendered)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
