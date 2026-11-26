// 운영 PostHog 의 실사용 첫 매물 카드 시간(first_listing_card_visible.time_ms)을 최근 7일 중앙값과 p75로 조회한다.
// .github/workflows/android-webview-calibration.yml 이 부르고, 결과는 calibration-report.mjs 가 흉내 값과 에뮬레이터 값 옆에 붙인다.
// 사용: POSTHOG_PERSONAL_API_KEY=... POSTHOG_PROJECT_ID=579863 node posthog-field.mjs --out <결과 폴더>
// - 키나 프로젝트 번호가 없으면 status: 'no-key' 로 쓰고 끝 코드 0 으로 끝난다. 조회가 실패해도 status: 'error' 로 쓰고 0 이다.
// - 무리(platform, connection_effective_type)마다 표본이 MIN_SAMPLES 보다 적으면 값을 쓰지 않는다. 모든 무리가 적으면 'insufficient'.
// - 키는 Authorization 헤더로만 보내고 출력, 파일, 오류 메시지에 넣지 않는다.
// 결과: <out>/field.json
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

export const MIN_SAMPLES = 20;
export const FIELD_QUERY = `
SELECT
  toString(properties.platform) AS platform,
  ifNull(toString(properties.connection_effective_type), 'unknown') AS net,
  count() AS n,
  round(quantile(0.5)(toFloat(properties.time_ms))) AS p50,
  round(quantile(0.75)(toFloat(properties.time_ms))) AS p75
FROM events
WHERE event = 'first_listing_card_visible'
  AND timestamp > now() - INTERVAL 7 DAY
  AND properties.environment = 'production'
  AND toFloat(properties.time_ms) > 0
GROUP BY platform, net
ORDER BY n DESC
LIMIT 50`;

// 조회 결과 행([platform, net, n, p50, p75])을 요약한다. 표본이 적은 무리는 값을 비운다.
export const summarizeField = (rows) => {
  const groups = rows.map(([platform, net, n, p50, p75]) => {
    const count = Number(n);
    const enough = count >= MIN_SAMPLES;
    return { platform, net, n: count, p50: enough ? Number(p50) : null, p75: enough ? Number(p75) : null, enough };
  });
  return {
    status: groups.some((group) => group.enough) ? 'ok' : 'insufficient',
    minSamples: MIN_SAMPLES,
    window: '최근 7일, environment=production',
    groups,
  };
};

const main = async () => {
  const { values: args } = parseArgs({
    options: {
      out: { type: 'string' },
      host: { type: 'string', default: process.env.POSTHOG_API_HOST || 'https://us.posthog.com' },
    },
  });
  if (!args.out) throw new Error('--out 이 필요하다');
  const out = resolve(args.out);
  mkdirSync(out, { recursive: true });
  const key = process.env.POSTHOG_PERSONAL_API_KEY ?? '';
  const project = process.env.POSTHOG_PROJECT_ID ?? '';
  let field;
  if (key === '' || project === '') {
    field = { status: 'no-key', reason: 'POSTHOG_PERSONAL_API_KEY 나 POSTHOG_PROJECT_ID 가 없다' };
  } else {
    try {
      const response = await fetch(`${args.host}/api/projects/${encodeURIComponent(project)}/query/`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({ query: { kind: 'HogQLQuery', query: FIELD_QUERY }, name: 'android-webview-calibration' }),
      });
      if (!response.ok) {
        field = { status: 'error', reason: `PostHog 조회 실패 ${response.status}` };
      } else {
        const body = await response.json();
        field = summarizeField(Array.isArray(body.results) ? body.results : []);
      }
    } catch (error) {
      field = { status: 'error', reason: `PostHog 조회 실패 ${String(error?.name ?? 'Error')}` };
    }
  }
  writeFileSync(join(out, 'field.json'), `${JSON.stringify(field, null, 2)}\n`);
  console.log(`실사용 값: ${field.status}${field.reason ? ` (${field.reason})` : ''}`);
};

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) await main();
