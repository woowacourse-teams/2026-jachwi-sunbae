// 안드로이드 웹뷰 판정의 이슈 후보를 팀 저장소 이슈로 올린다. 기본은 dry-run(무엇을 할지만 보인다)이다.
// 실제 게시(--publish)는 소유자가 통제하는 환경(소유자 PC의 gh 로그인 등)에서만 한다. 팀 워크플로 안에서는 --publish 를 거부한다.
// 사용:
//   node .claude/skills/verify-jachwi/scripts/perf-issue.mjs                      # 운영 이력의 후보로 dry-run
//   node .claude/skills/verify-jachwi/scripts/perf-issue.mjs --publish            # 소유자 환경에서 게시
//   node .claude/skills/verify-jachwi/scripts/perf-issue.mjs --candidates <파일> --existing-keys <파일>  # 합성 dry-run
// - 후보: 기본은 팀 저장소 calibration-history 브랜치의 android-webview/issues.json(공개 파일)이다. --source <이력 폴더>나
//   --candidates <파일>로 바꿀 수 있다.
// - 갈래: publishable 이 아니면(시험 실행, 정기 실행 아님) "무시", 같은 키의 이슈가 이미 있으면(열림, 닫힘 모두) "중복",
//   그 밖은 "생성"이다. 키는 본문 끝의 <!-- jachwi-perf-key: ... --> 주석으로 찾는다. 다시 돌려도 같은 키라 두 번 만들지 않는다.
// - 게시 전에 gh 로그인 계정이 --expect-author(기본 iftype)인지 확인한다. 다르면 아무것도 올리지 않는다.
// - 라벨, 담당자, 멘션은 넣지 않는다. 이슈 말고 댓글은 달지 않는다.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

export const TEAM_REPO = 'woowacourse-teams/2026-jachwi-sunbae';
export const HISTORY_BRANCH = 'calibration-history';
export const KEY_PATTERN = /<!-- jachwi-perf-key: ([^\s]+) -->/;

// 후보마다 할 일을 정한다. existingKeys 가 null 이면 중복을 확인하지 못한 것이라 "생성"을 "확인 못 함"으로 둔다.
export const planIssues = (candidates, existingKeys) =>
  candidates.map((candidate) => {
    if (!candidate.publishable)
      return { action: 'ignore', reason: `게시 대상 아님(${candidate.channel}, ${candidate.event || '-'})`, candidate };
    if (existingKeys === null) return { action: 'unknown', reason: '기존 이슈를 확인하지 못함', candidate };
    if (existingKeys.has(candidate.key)) return { action: 'duplicate', reason: '같은 키의 이슈가 있음', candidate };
    if (/@[A-Za-z0-9-]/.test(`${candidate.title}\n${candidate.body}`))
      return { action: 'ignore', reason: '본문에 멘션처럼 보이는 글자가 있어 올리지 않음', candidate };
    return { action: 'create', reason: '새 이슈', candidate };
  });

const ACTION_TEXT = { create: '생성', duplicate: '중복', ignore: '무시', unknown: '확인 못 함' };

export const renderPlan = (plan, { publish, author }) => {
  const lines = [
    `## 이슈 게시 ${publish ? '결과' : '계획(dry-run)'}`,
    '',
    `대상 저장소 \`${TEAM_REPO}\`, 작성자 ${author ?? '확인 안 함'}`,
    '',
    '| 갈래 | 제목 | 키 | 이유 |',
    '| --- | --- | --- | --- |',
    ...plan.map(
      (item) =>
        `| ${ACTION_TEXT[item.action]} | ${item.candidate.title} | \`${item.candidate.key}\` | ${item.reason}${item.url ? ` ${item.url}` : ''} |`,
    ),
  ];
  if (plan.length === 0) lines.push('| - | 후보 없음 | - | - |');
  return `${lines.join('\n')}\n`;
};

const gh = (args) => execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

// 작성자가 올린 이슈(열림, 닫힘)에서 키를 모은다. gh 가 없거나 실패하면 null.
const fetchExistingKeys = (author) => {
  try {
    const bodies = gh([
      'api',
      '--paginate',
      `repos/${TEAM_REPO}/issues?state=all&creator=${author}&per_page=100`,
      '--jq',
      '.[] | select(.pull_request | not) | .body // "" | @json',
    ]);
    const keys = new Set();
    for (const line of bodies.split('\n').filter(Boolean)) {
      const match = KEY_PATTERN.exec(JSON.parse(line));
      if (match) keys.add(match[1]);
    }
    return keys;
  } catch {
    return null;
  }
};

const loadCandidates = async (args) => {
  if (args.candidates) return JSON.parse(readFileSync(resolve(args.candidates), 'utf8')).candidates ?? [];
  if (args.source) {
    const file = join(resolve(args.source), 'android-webview', 'issues.json');
    return existsSync(file) ? Object.values(JSON.parse(readFileSync(file, 'utf8')).candidates ?? {}) : [];
  }
  const response = await fetch(
    `https://raw.githubusercontent.com/${TEAM_REPO}/${HISTORY_BRANCH}/android-webview/issues.json`,
  );
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`후보를 읽지 못했다: ${response.status}`);
  return Object.values((await response.json()).candidates ?? {});
};

const main = async () => {
  const { values: args } = parseArgs({
    options: {
      publish: { type: 'boolean', default: false },
      source: { type: 'string' },
      candidates: { type: 'string' },
      'existing-keys': { type: 'string' },
      'expect-author': { type: 'string', default: 'iftype' },
      out: { type: 'string' },
    },
  });
  if (args.publish && process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_REPOSITORY === TEAM_REPO)
    throw new Error('팀 워크플로 안에서는 게시하지 않는다. 소유자 환경에서 --publish 로 돌린다');
  if (args.publish && (args.candidates || args['existing-keys']))
    throw new Error('합성 후보나 키 파일로는 게시하지 않는다');
  const candidates = await loadCandidates(args);
  const existingKeys = args['existing-keys']
    ? new Set(JSON.parse(readFileSync(resolve(args['existing-keys']), 'utf8')))
    : fetchExistingKeys(args['expect-author']);
  const plan = planIssues(candidates, existingKeys);
  let author = null;
  if (args.publish) {
    author = gh(['api', 'user', '--jq', '.login']);
    if (author !== args['expect-author'])
      throw new Error(`gh 로그인 계정(${author})이 ${args['expect-author']}가 아니라 올리지 않는다`);
    if (existingKeys === null) throw new Error('기존 이슈를 확인하지 못해 중복을 막을 수 없어 올리지 않는다');
    for (const item of plan.filter((entry) => entry.action === 'create')) {
      item.url = gh([
        'api',
        '-X',
        'POST',
        `repos/${TEAM_REPO}/issues`,
        '-f',
        `title=${item.candidate.title}`,
        '-f',
        `body=${item.candidate.body}`,
        '--jq',
        '.html_url',
      ]);
    }
  }
  const markdown = renderPlan(plan, { publish: args.publish, author });
  if (args.out) writeFileSync(resolve(args.out), markdown);
  console.log(markdown);
  console.log(JSON.stringify(plan.map((item) => ({ action: item.action, key: item.candidate.key }))));
};

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) await main();
