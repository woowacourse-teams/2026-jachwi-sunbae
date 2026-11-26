#!/usr/bin/env bash
# reactivecircus/android-emulator-runner 의 script 에서 부른다(그 action 은 script 를 줄마다 따로 돌려서 파일 하나로 둔다).
# 러너에서 serve.mjs(4302)와 map-sdk-stub.mjs(4443)가 이미 떠 있어야 한다.
# 사용: android/run-on-emulator.sh <셸 apk> <결과 폴더> <지도 목 로그> [회수]
set -euo pipefail
apk="$1"; out="$2"; stub_log="$3"; runs="${4:-5}"
S="$(cd "$(dirname "$0")/../scripts" && pwd)"
adb wait-for-device
adb reverse tcp:4302 tcp:4302
adb reverse tcp:4443 tcp:4443
adb install -r -t "${apk}" > /dev/null
adb shell getprop ro.build.version.release | sed 's/^/Android /'
adb shell dumpsys webviewupdate | grep -i 'current webview package' || true
adb shell dumpsys package com.android.chrome | grep -m1 versionName || echo 'chrome 없음'
for target in chrome webview; do
  mkdir -p "${out}/${target}"
  before=$(grep -c '^request ' "${stub_log}" || true)
  node "${S}/measure-android.mjs" --target "${target}" --screen home --runs "${runs}" --net fast4g --out "${out}/${target}" \
    || echo "::warning::${target} 측정 실패"
  after=$(grep -c '^request ' "${stub_log}" || true)
  echo $((after - before)) > "${out}/${target}/stub-hits.txt"
done
