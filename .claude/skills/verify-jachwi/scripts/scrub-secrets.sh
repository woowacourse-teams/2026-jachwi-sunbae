#!/usr/bin/env bash
# 아티팩트와 이력 폴더에서 secret 값을 지우고, 남은 것이 없는지 확인한다. 값은 출력하지 않는다.
# 사용: SCRUB_VALUES 에 줄마다 값을 넣고 scripts/scrub-secrets.sh <폴더>...
# 남은 값이 있으면 끝 코드 1(올리기 전에 멈춘다). 값이 비었으면 아무것도 하지 않는다.
set -euo pipefail
found=0
while IFS= read -r value; do
  [[ ${#value} -lt 4 ]] && continue
  for dir in "$@"; do
    [[ -d "${dir}" ]] || continue
    while IFS= read -r file; do
      SCRUB_VALUE="${value}" perl -pi -e 's/\Q$ENV{SCRUB_VALUE}\E/***/g' "${file}"
    done < <(grep -rlF -- "${value}" "${dir}" || true)
    if grep -rqF -- "${value}" "${dir}"; then found=1; fi
  done
done <<< "${SCRUB_VALUES:-}"
if (( found )); then echo '::error::secret 값이 결과에 남아 있다'; exit 1; fi
echo 'secret 값 확인: 남은 것 없음'
