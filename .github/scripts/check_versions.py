#!/usr/bin/env python3
"""Validate the shared product version across the monorepo."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SEMVER_PATTERN = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")


def read_json(relative_path: str) -> dict:
    with (ROOT / relative_path).open(encoding="utf-8") as file:
        return json.load(file)


def extract_one(relative_path: str, pattern: str, label: str) -> str:
    text = (ROOT / relative_path).read_text(encoding="utf-8")
    match = re.search(pattern, text, re.MULTILINE)
    if match is None:
        raise ValueError(f"{label}을(를) {relative_path}에서 찾을 수 없습니다.")
    return match.group(1)


def main() -> int:
    version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
    errors: list[str] = []

    if SEMVER_PATTERN.fullmatch(version) is None:
        errors.append(f"VERSION 값 '{version}'은 MAJOR.MINOR.PATCH 형식이 아닙니다.")

    frontend_package = read_json("frontend/package.json")
    frontend_lock = read_json("frontend/package-lock.json")
    mobile_package = read_json("mobile/package.json")

    actual_versions = {
        "frontend/package.json": frontend_package.get("version"),
        "frontend/package-lock.json": frontend_lock.get("version"),
        "frontend/package-lock.json packages['']": frontend_lock.get("packages", {})
        .get("", {})
        .get("version"),
        "mobile/package.json": mobile_package.get("version"),
        "backend/build.gradle": extract_one(
            "backend/build.gradle", r"^version\s*=\s*'([^']+)'$", "version"
        ),
        "mobile/android/app/build.gradle": extract_one(
            "mobile/android/app/build.gradle",
            r'^\s*versionName\s+"([^"]+)"$',
            "versionName",
        ),
    }

    ios_project_path = "mobile/ios/JachwiSunbaeMobile.xcodeproj/project.pbxproj"
    ios_project = (ROOT / ios_project_path).read_text(encoding="utf-8")
    ios_versions = re.findall(r"MARKETING_VERSION\s*=\s*([^;]+);", ios_project)
    if not ios_versions:
        errors.append(f"MARKETING_VERSION을(를) {ios_project_path}에서 찾을 수 없습니다.")
    else:
        for index, ios_version in enumerate(ios_versions, start=1):
            actual_versions[f"{ios_project_path} MARKETING_VERSION #{index}"] = (
                ios_version.strip()
            )

    for path, actual in actual_versions.items():
        if actual != version:
            errors.append(f"{path}: 기대값 {version}, 실제값 {actual}")

    ios_build_numbers = re.findall(r"CURRENT_PROJECT_VERSION\s*=\s*(\d+);", ios_project)
    android_version_code = extract_one(
        "mobile/android/app/build.gradle", r"^\s*versionCode\s+(\d+)$", "versionCode"
    )
    if not ios_build_numbers or any(int(number) < 1 for number in ios_build_numbers):
        errors.append("iOS CURRENT_PROJECT_VERSION은 1 이상의 정수여야 합니다.")
    if int(android_version_code) < 1:
        errors.append("Android versionCode는 1 이상의 정수여야 합니다.")
    if ios_build_numbers and any(number != android_version_code for number in ios_build_numbers):
        errors.append(
            "iOS CURRENT_PROJECT_VERSION과 Android versionCode가 같아야 합니다."
        )

    if errors:
        print("버전 검증에 실패했습니다:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"저장소 버전 {version} 동기화를 확인했습니다.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
