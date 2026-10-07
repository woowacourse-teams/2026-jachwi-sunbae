# QA 실행 코드

자취선배 AI E2E QA를 실행하는 코드다. 무엇을 정답으로 보고 어떤 상황을 시험할지는 [QA 기준 문서](../docs/qa/README.md)를 따른다.

## 실행 환경

- Node 22.23.x (`.nvmrc`)
- Playwright, 모바일 화면(Pixel 7, Chromium)
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
```

## 환경변수

| 이름 | 기본값 | 설명 |
| --- | --- | --- |
| `QA_BASE_URL` | `https://dev.jachwi-sunbae.kr` | QA 대상 프론트엔드 URL. 로컬은 `http://localhost:3000` |

`.env.example`을 `.env`로 복사해 설정하거나 셸 환경변수로 넘긴다. 둘 다 있으면 셸 환경변수가 우선한다. `.env`는 커밋하지 않는다.

## 테스트 데이터와 실행 방식

- `member` fixture를 쓰는 테스트는 새 닉네임 `qa-{runId}`로 비밀번호 없이 시작한다. 로그인 응답에서 새 회원이 아니면 실패시켜 다른 실행의 기록과 섞이지 않게 한다.
- 테스트마다 회원을 새로 만들고 DEV를 공유하므로 한 번에 하나씩 실행한다.
- 불안정한 결과를 가리지 않도록 실패한 테스트를 재시도하지 않는다.
- 제품 분석 데이터에 섞이지 않도록 PostHog 요청을 차단한다.

## 실행 산출물

| 위치 | 내용 |
| --- | --- |
| `test-results/` | 실패한 테스트의 스크린샷과 trace |
| `playwright-report/` | HTML 리포트 |

Git에 포함하지 않는다. trace는 `npx playwright show-trace <trace.zip 경로>`로 연다.

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
});
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
│   └── scenario-run.ts    # Expected 판정 기록
└── tests/
    ├── smoke.spec.ts                    # 실행 환경 점검
    └── F02-S01-property-create.spec.ts  # F02-S01 정상 매물 등록 후 재조회
```
