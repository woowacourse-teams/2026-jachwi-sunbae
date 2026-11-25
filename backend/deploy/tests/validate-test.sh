#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "${WORK}"' EXIT
mkdir -p "${WORK}/bin"
export MOCK_DIR="${WORK}"
export PATH="${WORK}/bin:${PATH}"
export REVISION_FILE="${WORK}/revision"
export HEALTH_URL=http://validation.invalid/health
export INFO_URL=http://validation.invalid/info
export ATTEMPTS=1 INTERVAL=0
export SYSTEMCTL="${WORK}/bin/systemctl" JOURNALCTL="${WORK}/bin/journalctl"
REVISION=1111111111111111111111111111111111111111
printf '%s\n' "${REVISION}" > "${REVISION_FILE}"
printf '#!/usr/bin/env bash\nexit "${MOCK_INACTIVE:-0}"\n' > "${SYSTEMCTL}"
printf '#!/usr/bin/env bash\nexit 0\n' > "${JOURNALCTL}"
cat > "${WORK}/bin/curl" <<'EOF'
#!/usr/bin/env bash
case "${*: -1}" in
    */health) cat "${MOCK_DIR}/health" ;;
    */info) cat "${MOCK_DIR}/info" ;;
    *) exit 1 ;;
esac
EOF
chmod +x "${WORK}/bin/"*

PASSED=0 FAILED=0
check() {
    local name="$1" expected="$2" actual=0
    bash "${DEPLOY_DIR}/scripts/validate.sh" > "${WORK}/output" 2>&1 || actual=$?
    if [[ "${actual}" == "${expected}" ]]; then
        echo "PASS: ${name}"
        PASSED=$((PASSED + 1))
    else
        echo "FAIL: ${name} (expected=${expected}, actual=${actual})" >&2
        cat "${WORK}/output" >&2
        FAILED=$((FAILED + 1))
    fi
}

printf '{"status":"UP"}' > "${WORK}/health"
printf '{"build":{"commit":"%s"}}' "${REVISION}" > "${WORK}/info"
check '정상 health와 정확한 build.commit만 통과' 0
MOCK_INACTIVE=1 check '서비스가 중지됐으면 거절' 1
printf '{"build":{"commit":"2222222222222222222222222222222222222222"}}' > "${WORK}/info"
check '다른 빌드 SHA 거절' 1
printf '{"build":{"commit":"wrong"},"other":{"commit":"%s"}}' "${REVISION}" > "${WORK}/info"
check '다른 JSON 경로의 commit으로 성공 처리하지 않음' 1
printf '{"build":{"commit":"%s"}}' "${REVISION}" > "${WORK}/info"
printf '{"status":"DOWN","components":{"db":{"status":"UP"}}}' > "${WORK}/health"
check '하위 구성 요소만 UP이면 거절' 1
printf '{"status":"UP"} invalid-json' > "${WORK}/health"
check '잘못된 health JSON 거절' 1
printf '{"status":"DOWN"}{"status":"UP"}' > "${WORK}/health"
check '여러 health JSON을 이어 붙인 응답 거절' 1
printf '{"status":"UP"}' > "${WORK}/health"
printf '{"build":{"commit":"%s"}}{}' "${REVISION}" > "${WORK}/info"
check '여러 info JSON을 이어 붙인 응답 거절' 1
printf '{"build":{"commit":"%s"}}' "${REVISION}" > "${WORK}/info"
printf '{\n  "status": "UP"\n}\n' > "${WORK}/health"
check '유효한 공백 포함 JSON 허용' 0
rm "${REVISION_FILE}"
check '리비전 파일 누락 거절' 1

echo "${PASSED} passed, ${FAILED} failed"
[[ "${FAILED}" == 0 ]]
