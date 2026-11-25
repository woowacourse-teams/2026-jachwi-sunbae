#!/usr/bin/env bash
set -euo pipefail

SERVICE="${SERVICE:-jachwi-sunbae.service}"
# 포트는 application-prod.yml 의 server.port 와 같아야 한다.
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:80/actuator/health}"
INFO_URL="${INFO_URL:-http://127.0.0.1:80/actuator/info}"
REVISION_FILE="${REVISION_FILE:-/opt/jachwi-sunbae/deployment-revision.txt}"
ATTEMPTS="${ATTEMPTS:-48}"
INTERVAL="${INTERVAL:-5}"
SYSTEMCTL="${SYSTEMCTL:-systemctl}"
JOURNALCTL="${JOURNALCTL:-journalctl}"

if [[ ! -f "${REVISION_FILE}" ]]; then
    echo "배포 리비전 파일이 없다: ${REVISION_FILE}" >&2
    exit 1
fi

EXPECTED_REVISION="$(tr -d '[:space:]' < "${REVISION_FILE}")"
if [[ ! "${EXPECTED_REVISION}" =~ ^[0-9a-f]{40}$ ]]; then
    echo "배포 리비전 형식이 올바르지 않다: ${EXPECTED_REVISION}" >&2
    exit 1
fi

for attempt in $(seq 1 "${ATTEMPTS}"); do
    if ! "${SYSTEMCTL}" is-active --quiet "${SERVICE}"; then
        echo "${SERVICE} 가 실행 중이 아니다. 기동에 실패했다." >&2
        "${JOURNALCTL}" -u "${SERVICE}" -n 200 --no-pager >&2 || true
        exit 1
    fi

    if ! HEALTH_RESPONSE="$(curl -fsS --max-time 5 "${HEALTH_URL}" 2>/dev/null)" \
        || ! jq -se 'length == 1 and .[0].status == "UP"' <<< "${HEALTH_RESPONSE}" >/dev/null 2>&1; then
        sleep "${INTERVAL}"
        continue
    fi

    if ! INFO_RESPONSE="$(curl -fsS --max-time 5 "${INFO_URL}" 2>/dev/null)"; then
        sleep "${INTERVAL}"
        continue
    fi

    ACTUAL_REVISION="$(jq -ers 'select(length == 1) | .[0].build.commit | select(type == "string")' <<< "${INFO_RESPONSE}" 2>/dev/null)" \
        || ACTUAL_REVISION=unknown
    if [[ "${ACTUAL_REVISION}" == "${EXPECTED_REVISION}" ]]; then
        echo "health와 배포 리비전 확인됨: ${EXPECTED_REVISION} (${attempt}번째 시도)."
        exit 0
    fi

    echo "실행 중인 리비전이 이번 배포와 다르다. expected=${EXPECTED_REVISION}, actual=${ACTUAL_REVISION:-unknown}" >&2
    "${JOURNALCTL}" -u "${SERVICE}" -n 200 --no-pager >&2 || true
    exit 1
done

echo "health와 배포 리비전이 ${ATTEMPTS}회 시도 내에 확인되지 않았다. expected=${EXPECTED_REVISION}" >&2
"${JOURNALCTL}" -u "${SERVICE}" -n 200 --no-pager >&2 || true
exit 1
