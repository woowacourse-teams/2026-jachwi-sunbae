#!/usr/bin/env bash
# 전용 점검 회원으로만 실행한다. 새로 만든 점검 매물·사진을 논리 삭제하며 보존 정책을 따른다.
set +x
set -euo pipefail
umask 077

BASE_URL="${SMOKE_BASE_URL:?SMOKE_BASE_URL is required}"
TOKEN_FILE="${SMOKE_ACCESS_TOKEN_FILE:?SMOKE_ACCESS_TOKEN_FILE is required}"
EXPECTED_REVISION="${SMOKE_EXPECTED_REVISION:?SMOKE_EXPECTED_REVISION is required}"
EXPECTED_MEMBER="${SMOKE_MEMBER_ID:?SMOKE_MEMBER_ID is required}"
[[ "${EXPECTED_MEMBER}" =~ ^[1-9][0-9]*$ ]] || { echo '점검 전용 회원 ID가 필요하다.' >&2; exit 1; }
LEGAL_DONG_CODE="${SMOKE_LEGAL_DONG_CODE:-1162010200}"
[[ "${LEGAL_DONG_CODE}" =~ ^[0-9]{10}$ ]] || { echo '법정동 코드는 10자리여야 한다.' >&2; exit 1; }
BASE_URL="${BASE_URL%/}"
if [[ ! "${BASE_URL}" =~ ^https?://[a-zA-Z0-9.-]+(:[0-9]+)?$ ]]; then
    echo '점검 URL은 경로·쿼리·사용자 정보 없는 origin이어야 한다.' >&2
    exit 1
fi
case "${BASE_URL}" in
    https://*|http://localhost:*|http://127.0.0.1:*) ;;
    *) echo '로컬 주소 외에는 HTTPS가 필요하다.' >&2; exit 1 ;;
esac
for command in curl jq; do command -v "${command}" >/dev/null; done
[[ -f "${TOKEN_FILE}" && -r "${TOKEN_FILE}" ]] || { echo '토큰 파일을 읽을 수 없다.' >&2; exit 1; }
ACCESS_TOKEN="$(cat "${TOKEN_FILE}")"
[[ "${ACCESS_TOKEN}" =~ ^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$ ]] \
    || { echo '토큰 파일에는 JWT 한 개만 있어야 한다.' >&2; exit 1; }

WORK="$(mktemp -d)"
RESPONSE="${WORK}/response"
AUTH="${WORK}/curl.conf"
CREATED_ID=''
RUN_NAME="reliability-$(date +%s)-${RANDOM}"
printf 'header = "Authorization: Bearer %s"\n' "${ACCESS_TOKEN}" > "${AUTH}"
unset ACCESS_TOKEN

cleanup() {
    local result=$? status
    trap - EXIT
    if [[ -n "${CREATED_ID}" ]]; then
        status="$(curl --config "${AUTH}" --silent --show-error --connect-timeout 5 --max-time 20 \
            --output "${RESPONSE}" --write-out '%{http_code}' "${BASE_URL}/api/properties/${CREATED_ID}")" || status=000
        if [[ "${status}" == 200 ]] && jq -e --arg name "${RUN_NAME}" '.data.name == $name' "${RESPONSE}" >/dev/null; then
            status="$(curl --config "${AUTH}" --silent --show-error --connect-timeout 5 --max-time 20 \
                --request DELETE --output "${RESPONSE}" --write-out '%{http_code}' \
                "${BASE_URL}/api/properties/${CREATED_ID}")" || status=000
            if [[ "${status}" != 204 ]]; then
                echo "점검 매물 정리 실패: id=${CREATED_ID}, run=${RUN_NAME}, HTTP=${status}" >&2
                result=1
            fi
        elif [[ "${status}" != 404 ]]; then
            echo "점검 매물 소유·이름 확인 실패. 자동 삭제하지 않음: id=${CREATED_ID}, run=${RUN_NAME}" >&2
            result=1
        fi
    fi
    rm -rf "${WORK}"
    exit "${result}"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

request() {
    local method="$1" path="$2" expected="$3" status
    shift 3
    if ! status="$(curl --config "${AUTH}" --silent --show-error --connect-timeout 5 --max-time 20 \
        --retry 0 --request "${method}" --output "${RESPONSE}" --write-out '%{http_code}' \
        "$@" "${BASE_URL}${path}")"; then
        echo "점검 요청 실패: ${method} ${path}, run=${RUN_NAME}. 생성 요청을 자동 재시도하지 않는다." >&2
        exit 1
    fi
    if [[ "${status}" != "${expected}" ]]; then
        echo "점검 응답 불일치: ${method} ${path}, expected=${expected}, actual=${status}, run=${RUN_NAME}" >&2
        exit 1
    fi
}
check_json() {
    if ! jq -e "$@" "${RESPONSE}" >/dev/null; then
        echo "점검 응답 내용 불일치: run=${RUN_NAME}" >&2
        exit 1
    fi
}
json_request() {
    request "$1" "$2" "$3" --header 'Content-Type: application/json' --data "$4"
}

echo "핵심 읽기·쓰기 점검 시작: run=${RUN_NAME}"
request GET /actuator/health 200
check_json '.status == "UP"'
request GET /actuator/info 200
check_json --arg revision "${EXPECTED_REVISION}" '.build.commit == $revision'
request GET /api/members/me 200
check_json --arg id "${EXPECTED_MEMBER}" '.code == "SUCCESS" and (.data.id | tostring) == $id'
request GET /api/properties 200
check_json '.code == "SUCCESS"'
request GET "/api/rental-transactions?legalDongCode=${LEGAL_DONG_CODE}&size=1" 200
check_json --arg code "${LEGAL_DONG_CODE}" '.code == "SUCCESS" and .data.legalDongCode == $code and (.data.items | type == "array")'

payload="$(jq -n --arg name "${RUN_NAME}" '{name:$name,depositAmount:0,monthlyRentAmount:0}')"
json_request POST /api/properties 201 "${payload}"
check_json --arg name "${RUN_NAME}" '.code == "SUCCESS" and .data.name == $name and (.data.id | type == "number" and . > 0 and floor == .)'
candidate_id="$(jq -r '.data.id' "${RESPONSE}")"
request GET "/api/properties/${candidate_id}" 200
check_json --arg name "${RUN_NAME}" '.data.name == $name'
CREATED_ID="${candidate_id}"
property="/api/properties/${CREATED_ID}"
request GET "${property}/checklists" 200
checklist_id="$(jq -er '.data.stages[] | select(.stage == "ON_SITE" and .applied) | .propertyChecklistId | numbers' "${RESPONSE}")"
request GET "${property}/checklists/${checklist_id}" 200
check_json '.data.items[0] | .status == "UNCONFIRMED" and .statusVersion == 0 and .memoVersion == 0'
item_id="$(jq -er '.data.items[0].id | numbers' "${RESPONSE}")"
item="${property}/checklists/${checklist_id}/items/${item_id}"
json_request PATCH "${item}/status" 200 '{"status":"GOOD","expectedVersion":0}'
check_json '.data.item.status == "GOOD" and .data.item.statusVersion == 1'
json_request PATCH "${item}/status" 200 '{"status":"GOOD","expectedVersion":0}'
check_json '.data.item.statusVersion == 1'
json_request PATCH "${item}/status" 200 '{"status":"CAUTION","expectedVersion":1}'
json_request PATCH "${item}/status" 400 '{"status":"GOOD","expectedVersion":0}'
check_json '.code == "PROPERTY_CHECKLIST_ITEM_CONFLICT"'
json_request PATCH "${item}/memo" 200 '{"memo":"reliability smoke","expectedVersion":0}'
request GET "${property}/checklists/${checklist_id}" 200
check_json --argjson id "${item_id}" '.data.items[] | select(.id == $id) | .status == "CAUTION" and .statusVersion == 2 and .memo == "reliability smoke" and .memoVersion == 1'

# 통합 테스트와 같은 1px PNG. 외부 이미지 생성 도구 없이 원본·썸네일 읽기를 점검한다.
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x04\x00\x00\x00\xb5\x1c\x0c\x02\x00\x00\x00\x0bIDATx\xdacd\xf8\x0f\x00\x01\x05\x01\x01\x27\x18\xe3f\x00\x00\x00\x00IEND\xaeB\x60\x82' > "${WORK}/photo.png"
request POST "${property}/photos" 201 --form "file=@${WORK}/photo.png;type=image/png"
photo_id="$(jq -er '.data.id | numbers' "${RESPONSE}")"
request GET "${property}/photos/${photo_id}" 200
cmp "${WORK}/photo.png" "${RESPONSE}"
request GET "${property}/photos/${photo_id}/thumbnail" 200
[[ -s "${RESPONSE}" ]]
request DELETE "${property}/photos/${photo_id}" 204
request GET "${property}/photos/${photo_id}" 404
request DELETE "${property}" 204
request GET "${property}" 404
CREATED_ID=''
echo "PASS: SHA·회원·월세·매물·체크 버전/재시도/충돌·메모·사진 업로드/읽기/논리 삭제"
