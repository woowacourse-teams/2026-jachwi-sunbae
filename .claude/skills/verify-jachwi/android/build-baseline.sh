#!/usr/bin/env bash
# 판정의 다시 재기에 쓸 이전 커밋을 따로 꺼내 운영 빌드한다. API 주소가 빌드에 박히므로 포트를 받는다.
# 사용: android/build-baseline.sh <커밋> <포트> <폴더>
# - 공개 저장소라 커밋 하나만 얕게 받는다. package-lock.json 이 같으면 지금 체크아웃의 node_modules 를 나눠 쓴다.
set -euo pipefail
sha="$1"; port="$2"; dir="$3"
git fetch -q --depth=1 origin "${sha}"
git worktree add -q --detach "${dir}" "${sha}"
if cmp -s frontend/package-lock.json "${dir}/frontend/package-lock.json"; then
  mkdir "${dir}/frontend/node_modules"
  find "${PWD}/frontend/node_modules" -mindepth 1 -maxdepth 1 ! -name .cache -exec ln -s {} "${dir}/frontend/node_modules/" \;
else
  npm ci --prefix "${dir}/frontend" --no-audit --no-fund --loglevel=error
fi
(cd "${dir}/frontend" && API_BASE_URL="http://localhost:${port}" NAVER_MAP_CLIENT_ID=ci-map-sdk-stub npm run build:bundle --silent \
  > "${dir}.build.log" 2>&1) || { tail -40 "${dir}.build.log"; exit 1; }
