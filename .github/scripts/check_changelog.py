#!/usr/bin/env python3
"""Validate and print a release section from CHANGELOG.md."""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SEMVER_PATTERN = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")


def main() -> int:
    if len(sys.argv) != 2:
        print("사용법: check_changelog.py MAJOR.MINOR.PATCH", file=sys.stderr)
        return 2

    version = sys.argv[1]
    if SEMVER_PATTERN.fullmatch(version) is None:
        print(f"버전 '{version}'이 MAJOR.MINOR.PATCH 형식이 아닙니다.", file=sys.stderr)
        return 2

    lines = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8").splitlines(keepends=True)
    heading = re.compile(rf"^## \[{re.escape(version)}\](?: - \d{{4}}-\d{{2}}-\d{{2}})?\s*$")
    matches = [index for index, line in enumerate(lines) if heading.fullmatch(line.rstrip("\n"))]

    if len(matches) != 1:
        print(f"CHANGELOG.md에 [{version}] 릴리스 섹션이 정확히 하나 있어야 합니다.", file=sys.stderr)
        return 1

    start = matches[0]
    end = next((index for index in range(start + 1, len(lines)) if lines[index].startswith("## ")), len(lines))
    section = "".join(
        line for line in lines[start + 1 : end] if not re.match(r"^\[[^]]+\]:\s", line)
    ).strip()
    if not section or not re.search(r"^###?\s+", section, re.MULTILINE):
        print(f"CHANGELOG.md의 [{version}] 섹션에 변경 내역이 없습니다.", file=sys.stderr)
        return 1

    print(section)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
