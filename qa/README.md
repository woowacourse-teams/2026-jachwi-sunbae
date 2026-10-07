# QA 실행 코드

자취선배 AI E2E QA를 실행하는 코드다. 무엇을 정답으로 보고 어떤 상황을 시험할지는 [QA 기준 문서](../docs/qa/README.md)를 따른다.

## 실행 환경

- Node 22.23.x (`.nvmrc`)
- Playwright, 모바일 화면(Pixel 7, Chromium)
- AI 분석: 로그인된 Claude Code CLI(`claude -p`)
- 기본 대상은 DEV(`https://dev.jachwi-sunbae.kr`)다. 운영 URL을 지정하면 실행하지 않는다.

## 설치

```bash
cd qa
npm ci
npx playwright install chromium
```

## 실행

```bash
npm run test:smoke   # 실행 환경 점검
npm test             # 전체 테스트
npm run report       # 마지막 실행의 HTML 리포트 열기
npm run typecheck    # 타입 검사
npm run analyze -- runs/<Run ID>   # 저장된 Run을 다시 AI 분석
```

## 환경변수

| 이름 | 기본값 | 설명 |
| --- | --- | --- |
| `QA_BASE_URL` | `https://dev.jachwi-sunbae.kr` | QA 대상 프론트엔드 URL. 로컬은 `http://localhost:3000` |
| `QA_AI_ANALYSIS` | `failed` | AI 분석 대상. `failed`는 PASS가 아닌 Run만, `always`는 모든 Run, `off`는 분석하지 않음 |
| `QA_AI_MODEL` | Claude Code 기본 모델 | 분석에 쓸 모델. 예: `sonnet` |
| `QA_AI_TIMEOUT_MS` | `300000` | AI 분석 제한 시간 |
| `QA_FAULT` | 없음 | 의도적으로 주입할 결함 이름. 예: `detail-rent` |

`.env.example`을 `.env`로 복사해 설정하거나 셸 환경변수로 넘긴다. 둘 다 있으면 셸 환경변수가 우선한다. `.env`는 커밋하지 않는다.

## 테스트 데이터와 실행 방식

- `member` fixture를 쓰는 테스트는 새 닉네임 `qa-{runId}`로 비밀번호 없이 시작한다. 로그인 응답에서 새 회원이 아니면 실패시켜 다른 실행의 기록과 섞이지 않게 한다.
- 테스트마다 회원을 새로 만들고 DEV를 공유하므로 한 번에 하나씩 실행한다.
- 불안정한 결과를 가리지 않도록 실패한 테스트를 재시도하지 않는다.
- 제품 분석 데이터에 섞이지 않도록 PostHog 요청을 차단한다.

## 실행 산출물

| 위치 | 내용 |
| --- | --- |
| `runs/{Run ID}/` | Scenario 실행 결과(`result.json`), Evidence(`evidence/`), AI 분석(`analysis.json`) |
| `test-results/` | Playwright가 남기는 실패 테스트의 스크린샷과 trace |
| `playwright-report/` | HTML 리포트 |

모두 Git에 포함하지 않는다. trace는 `npx playwright show-trace <trace.zip 경로>`로 연다.

## Scenario 자동화

- 테스트 파일 이름은 Scenario ID로 시작한다. 예: `tests/F02-S01-property-create.spec.ts`
- `ScenarioRun`이 `docs/qa/scenarios/`의 Scenario 문서에서 상태와 Expected를 읽는다. 기대 결과를 코드에 다시 적지 않아 문서와 실행 결과가 어긋나지 않는다.
- 상태가 `승인` 또는 `자동화`인 Scenario만 실행한다.
- Expected마다 `pass`, `fail`, `needsReview`로 판정하고 실제 결과를 문장으로 남긴다. 단계가 중간에 멈추면 확인하지 못한 Expected는 `BLOCKED`다.
- 최종 판정이 `PASS`가 아니면 테스트를 실패로 표시해 스크린샷과 trace를 남긴다.

```ts
await run.execute(async () => {
  await test.step('매물 등록', async () => {
    // 사용자 행동
  });
  await run.check('E1', async () => (조건 ? pass('실제 결과') : fail('실제 결과')));
  await run.captureScreen('EV2');
});
```

## Evidence 수집

[QA 실행 결과 형식](../docs/qa/report-schema.md#3-evidence)의 세 계층을 따른다.

| 계층 | 수집 방법 | 파일 |
| --- | --- | --- |
| Scenario 지정 | 테스트에서 `run.captureScreen(EV ID)`, `run.captureApi(EV ID, response)` 호출. 설명은 Scenario 문서의 Required Evidence에서 가져온다 | `EV1-api.json`, `EV2-screen.png` |
| 항상 | 실행이 끝나면 마지막 화면 저장 | `EV+1-final-screen.png` |
| 실패 시 추가 | 최종 판정이 `PASS`가 아니면 콘솔, 네트워크 기록, trace 저장 | `EV+2-console.json`, `EV+3-network.json`, `EV+4-trace.zip` |

- Scenario 문서에 없는 EV ID로 수집하면 오류가 난다. 요구한 Evidence를 수집하지 못하면 `result.json`의 `missingEvidence`에 남는다.
- API Evidence와 네트워크 기록에는 요청 ID(`X-Request-Id`)를 남겨 서버 로그와 대조할 수 있게 한다.
- 요청과 응답 본문의 토큰, 비밀번호, 쿠키 값은 `***`로 가린다.
- trace는 테스트가 끝난 뒤 만들어지므로 `src/reporter.ts`가 Run 디렉터리로 옮긴다.

## AI 분석

테스트가 모두 끝나면 `src/reporter.ts`가 Run마다 `claude -p`로 분석을 요청한다.

- 입력은 QA 기준 문서(`source-of-truth.md`, `report-schema.md`), 제품 명세 전체, Scenario 문서, `result.json`, Evidence다. 근거 문서를 요약하지 않고 원문으로 넘긴다.
- AI에게는 읽기 도구(Read)만 주고, `--restricted`로 실행 도구와 사용자, 프로젝트 설정을 막는다. 스크린샷은 AI가 직접 열어 본다.
- 응답 형식은 JSON Schema로 강제하고, `report-schema.md`의 AI 분석 항목을 따른다.
- AI가 인용한 명세 ID와 Evidence ID가 실제로 있는지 코드가 확인해 `validation`에 남긴다.
- 의도적 결함 주입 여부(`faultInjection`)는 AI에게 넘기지 않는다.

| 파일 | 내용 |
| --- | --- |
| `analysis.json` | 분석 결과, 사용 모델, 소요 시간, 비용, 인용 검증 결과 |
| `analysis-prompt.md` | AI에게 보낸 프롬프트 원문 |

## 의도적 결함 주입

실제 결함 없이 실패 경로를 확인하거나, 원인을 아는 실패로 AI 분석이 맞는지 채점할 때 쓴다. 제품 코드와 DEV 데이터는 바꾸지 않고 브라우저가 받는 응답만 바꾼다. 주입한 결함은 `result.json`의 `faultInjection`에 남는다.

| 이름 | 바꾸는 것 |
| --- | --- |
| `detail-rent` | 매물 상세 조회 응답의 월세를 실제 값의 1/10로 바꾼다 |

```bash
QA_FAULT=detail-rent npx playwright test tests/F02-S01-property-create.spec.ts
```

## 디렉터리 구조

```text
qa/
├── playwright.config.ts   # 실행 설정
├── src/
│   ├── config.ts          # 환경변수, 운영 실행 차단
│   ├── run-id.ts          # runId 생성
│   ├── member.ts          # 새 회원으로 시작(F01)
│   ├── fixtures.ts        # 공통 fixture
│   ├── api.ts             # API 응답 대기와 본문 읽기
│   ├── scenario-doc.ts    # Scenario 문서 읽기
│   ├── scenario-run.ts    # Expected 판정 기록
│   ├── evidence.ts        # Evidence 수집과 민감 정보 가림
│   ├── faults.ts          # 의도적 결함 주입
│   ├── ai-analysis.ts     # claude -p 분석과 인용 검증
│   ├── analyze-cli.ts     # 저장된 Run 재분석 명령
│   └── reporter.ts        # Run 마무리(trace 이동, AI 분석, 결과 요약)
└── tests/
    ├── smoke.spec.ts                    # 실행 환경 점검
    └── F02-S01-property-create.spec.ts  # F02-S01 정상 매물 등록 후 재조회
```
