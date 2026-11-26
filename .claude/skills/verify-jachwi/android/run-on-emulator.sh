#!/usr/bin/env bash
# reactivecircus/android-emulator-runner 의 script 에서 부른다(그 action 은 script 를 줄마다 따로 돌려서 파일 하나로 둔다).
# 러너에서 serve.mjs(4302, --faults)와 map-sdk-stub.mjs(4443)가 이미 떠 있어야 한다.
# 사용: android/run-on-emulator.sh <셸 apk> <결과 폴더> <지도 목 로그> [회수]
# 판정용 환경 변수(없으면 다시 재기를 건너뛴다): HISTORY_DIR(이력 폴더), CHANNEL(prod|test), COMMIT(이번 커밋),
#   CONFIRM_MODE(auto|always|never). 의심 시나리오가 있으면 이전 커밋을 4303 으로 빌드해 같은 에뮬레이터에서 번갈아 다시 잰다.
# 실제 지도: MAP_REAL=1 이고 실제 키로 빌드한 dist 가 러너의 localhost:3000 에 떠 있으면 real-* 시나리오를 webview-map 에 잰다.
#   NAVER_MAP_CLIENT_ID 는 measure-android.mjs 가 원자료에서 키를 가리는 데만 쓴다.
set -euo pipefail
apk="$1"; out="$2"; stub_log="$3"; runs="${4:-5}"
here="$(cd "$(dirname "$0")" && pwd)"
S="$(cd "${here}/../scripts" && pwd)"
adb wait-for-device
adb reverse tcp:4302 tcp:4302
adb reverse tcp:4443 tcp:4443
adb install -r -t "${apk}" > /dev/null
# 방 등록 시나리오는 현재 위치를 쓴다. 측정 스크립트도 CDP로 같은 좌표를 덮어쓴다.
adb emu geo fix 126.9236 37.5563 > /dev/null 2>&1 || true
adb shell getprop ro.build.version.release | sed 's/^/Android /'
adb shell dumpsys webviewupdate | grep -i 'current webview package' || true
adb shell dumpsys package com.android.chrome | grep -m1 versionName || echo 'chrome 없음'
for target in chrome webview; do
  mkdir -p "${out}/${target}"
  before=$(grep -c '^request ' "${stub_log}" || true)
  node "${S}/measure-android.mjs" --target "${target}" --runs "${runs}" --net fast4g --out "${out}/${target}" \
    || echo "::warning::${target} 측정 실패"
  after=$(grep -c '^request ' "${stub_log}" || true)
  echo $((after - before)) > "${out}/${target}/stub-hits.txt"
done

if [[ "${MAP_REAL:-0}" == 1 ]]; then
  adb reverse tcp:3000 tcp:3000
  mkdir -p "${out}/webview-map"
  node "${S}/measure-android.mjs" --target webview --map-sdk real --base http://localhost:3000 --runs "${runs}" \
    --net fast4g --out "${out}/webview-map" || echo "::warning::실제 지도 측정 실패"
else
  echo "실제 지도 시나리오 건너뜀(키 없음, 포크, 또는 PR 실행)."
fi

if [[ -z "${HISTORY_DIR:-}" || ! -f "${out}/webview/result.json" ]]; then exit 0; fi
node "${S}/calibration-judge.mjs" suspects --dir "${out}" --history "${HISTORY_DIR}" --channel "${CHANNEL}" \
  --commit "${COMMIT}" --mode "${CONFIRM_MODE:-auto}" > /dev/null
base="$(jq -r '.baselineCommit // empty' "${out}/suspects.json")"
list="$(jq -r '.confirm | join(",")' "${out}/suspects.json")"
if [[ -z "${base}" || -z "${list}" ]]; then
  echo "다시 잴 시나리오 없음."
  exit 0
fi
echo "다시 재기: ${list}, 이전 커밋 ${base:0:8}, 이번 커밋 ${COMMIT:0:8}"
if ! "${here}/build-baseline.sh" "${base}" 4303 "${RUNNER_TEMP}/baseline"; then
  echo "::warning::이전 커밋을 빌드하지 못해 다시 재지 못했다"
  exit 0
fi
# 이전 커밋 빌드도 같은 serve.mjs(이번 커밋의 목 핸들러)로 띄운다.
nohup node "${S}/serve.mjs" --dist "${RUNNER_TEMP}/baseline/frontend/dist" --port 4303 --api mock --delay 300 \
  --cache prod --faults > "${RUNNER_TEMP}/serve-baseline.log" 2>&1 &
for _ in $(seq 60); do curl -sf http://localhost:4303/ > /dev/null && break; sleep 0.5; done
adb reverse tcp:4303 tcp:4303
rounds=5
for round in $(seq "${rounds}"); do
  # 짝마다 앞뒤를 바꿔 먼저 재는 쪽이 늘 손해나 이득을 보지 않게 한다. 첫 회차만 데우기를 한다.
  if (( round % 2 == 1 )); then order=(base head); else order=(head base); fi
  warmup=0; (( round == 1 )) && warmup=1
  for side in "${order[@]}"; do
    port=4302; [[ "${side}" == base ]] && port=4303
    node "${S}/measure-android.mjs" --target webview --base "http://localhost:${port}" --scenarios "${list}" \
      --runs 1 --warmup "${warmup}" --net fast4g --out "${out}/confirm/${side}-r${round}" \
      || echo "::warning::다시 재기 ${side} ${round} 실패"
  done
done
node "${S}/calibration-judge.mjs" confirm-summary --dir "${out}" --baseline-commit "${base}" --head-commit "${COMMIT}" > /dev/null
