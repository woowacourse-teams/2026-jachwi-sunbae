#!/usr/bin/env bash
set -euo pipefail

SERVICE_EVENT_LOG="${SERVICE_EVENT_LOG:-/var/log/jachwi-sunbae/service-events.log}"
TIMESTAMP="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

printf '{"@timestamp":"%s","event_type":"service_exit","service":"jachwi-sunbae","service_result":"%s","exit_code":"%s","exit_status":"%s"}\n' \
    "${TIMESTAMP}" \
    "${SERVICE_RESULT:-unknown}" \
    "${EXIT_CODE:-unknown}" \
    "${EXIT_STATUS:-unknown}" \
    >> "${SERVICE_EVENT_LOG}"
