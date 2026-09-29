#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIST_DIR="${FRONTEND_DIR}/dist"

: "${POSTHOG_CLI_API_KEY:?POSTHOG_CLI_API_KEY가 필요하다. error_tracking:write 권한을 사용한다.}"
POSTHOG_CLI_PROJECT_ID="${POSTHOG_CLI_PROJECT_ID:-579863}"
export POSTHOG_CLI_PROJECT_ID

POSTHOG_CLI_VERSION="${POSTHOG_CLI_VERSION:-0.10.0}"
POSTHOG_RELEASE_VERSION="${POSTHOG_RELEASE_VERSION:-$(node -p "require('${FRONTEND_DIR}/package.json').version")}"

if [[ ! -d "${DIST_DIR}" ]]; then
  echo "프론트엔드 빌드 결과가 없다: ${DIST_DIR}" >&2
  exit 1
fi

npx -y "@posthog/cli@${POSTHOG_CLI_VERSION}" sourcemap process \
  --directory "${DIST_DIR}" \
  --public-path-prefix / \
  --release-name jachwi-sunbae-web \
  --release-version "${POSTHOG_RELEASE_VERSION}" \
  --delete-after-upload
