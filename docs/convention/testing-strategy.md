# 테스트 전략

코드 변경 뒤 기존 기능이 깨졌는지 병합 전에 확인하고, 실패한 계층에서 원인을 빠르게 찾기 위한 프로젝트 공통 기준이다. 테스트는 구현 세부사항보다 사용자가 관찰하는 동작과 백엔드·프론트엔드·모바일 사이의 계약을 보호한다.

## 목표

- 기능 추가·수정·리팩터링 때 기존 사용자 흐름의 회귀를 자동으로 발견한다.
- 빠른 단위 테스트로 순수 로직의 원인을 좁히고, 화면·API·앱 셸이 함께 동작하는 흐름은 통합 테스트로 보호한다.
- 실제 브라우저, WebView, 지도 SDK, 권한처럼 테스트 환경이 재현하지 못하는 범위는 수동 점검 또는 E2E 도입 기준으로 명시한다.
- 모든 PR에서 변경된 파트의 자동 검증이 실행되도록 CI와 완료 조건을 연결한다.

## 테스트 피라미드

| 계층 | 대상 | 도구·위치 | 적용 기준 |
| --- | --- | --- | --- |
| 단위 | 포맷터, 검증, 도메인 계산, 저장소, 브리지 파서 | 프론트 Vitest, 모바일 Jest, 백엔드 JUnit | 입력과 출력만으로 검증할 수 있는 로직 |
| 컴포넌트 | 공통 UI, 폼, 포커스, 접근성, 네이티브 분기 | React Testing Library, `frontend/test/**` | 사용자가 조작하는 독립 UI 계약 |
| 화면 통합 | 라우팅, React Query, API 성공·실패·재시도 | React Testing Library + MSW, `frontend/test/app/router` | 여러 컴포넌트와 서버 상태가 함께 변하는 흐름 |
| 백엔드 통합 | 서비스·저장소·외부 provider 계약 | Spring Boot Test, JUnit, `backend/src/test` | 트랜잭션, 인증, DB, 외부 API 경계 |
| 앱 셸 통합 | WebView 메시지, 딥링크, 네이티브 기능 협상 | 모바일 Jest, `mobile/__tests__` | 웹과 앱 사이 JSON 계약 및 구버전 호환 |
| E2E | 실제 로그인·등록·지도·권한 흐름 | 현재 수동 점검, 필요 시 Playwright/기기 테스트 | jsdom·Jest로 재현할 수 없는 배포 위험 |
| 시각 | 반응형 레이아웃, 지도, 네이티브 탭바 | 현재 수동 점검 | 픽셀·브라우저 엔진·SDK 차이가 원인인 회귀 |

테스트에서 CSS 클래스, 내부 함수 호출 순서, 컴포넌트 구조를 직접 검증하지 않는다. 버튼·링크·입력·메시지·경로처럼 사용자가 관찰하는 계약을 기준으로 작성한다.

## 주요 기능별 보호 범위

| 기능 | 자동화 범위 | 회귀 시 우선 확인할 테스트 |
| --- | --- | --- |
| 인증·보호 라우트 | 로그인, 세션 복원, 401, 로그아웃, 잘못된 경로 | `AppRoutes.test.tsx`, `authStore.test.ts`, 백엔드 auth 테스트 |
| 매물 | 등록·수정·삭제, 사진, 메모, 비교 | `PropertyRoutes.test.tsx`, property API·form 테스트 |
| 체크리스트 | 생성·수정·적용, 상태·메모 저장, 실패 복구 | `ChecklistRoutes.test.tsx`, checklist 모델·API 테스트 |
| 지도·위치 | 검색, 위치 선택, 핀·주변 시설, SDK 오류 | `MapRoutes.test.tsx`, map hook·canvas·API 테스트 |
| WebView·네이티브 탭바 | 탭 표시, 경로 동기화, 딥링크, 구버전 앱 호환 | `PropertyAppLayout.test.tsx`, `nativeApp.test.ts`, `webBridge.test.ts`, `navigationPolicy.test.ts` |
| API 계약 | DTO 파싱, 오류 코드, MSW fixture 필드 | `contractShape.test.ts`, `handlers.test.ts`, 각 API 테스트 |

## 변경 유형별 작성 기준

- 순수 함수나 도메인 규칙을 바꾸면 정상값·경계값·잘못된 값의 단위 테스트를 먼저 작성한다.
- API DTO나 응답 필드를 바꾸면 파서·계약 테스트와 MSW fixture를 함께 수정한다.
- 화면 기능은 성공 상태만 테스트하지 않고 로딩·빈 결과·실패·재시도 중 사용자에게 중요한 상태를 포함한다.
- 공통 컴포넌트나 props를 리팩터링하면 기존 화면 통합 테스트를 먼저 통과시키고, 새 사용자 상호작용이 생긴 경우 컴포넌트 테스트를 추가한다.
- WebView·네이티브 기능은 양방향 메시지, 알 수 없는 메시지 무시, 구버전 앱의 fallback을 테스트한다.
- CSS·지도·권한처럼 렌더링 엔진 의존성이 큰 변경은 자동 테스트와 별도로 실제 브라우저·시뮬레이터 점검 항목을 PR에 남긴다.

## 로컬·CI 검증 명령

프론트엔드:

```bash
cd frontend
npm ci
npm run lint
npm run format:check
npm test
npm run build
```

백엔드:

```bash
cd backend
./gradlew clean build --no-daemon
```

모바일 JavaScript·브리지:

```bash
cd mobile
npm ci
npm run typecheck
npm run lint
npm test -- --runInBand
```

iOS 네이티브 UI는 CocoaPods 설치 후 `JachwiNativeUI` 스킴을 먼저 빌드하고, 서명·시뮬레이터 환경이 갖춰진 경우 앱 스킴까지 빌드한다. App Store 제출 전에는 실제 iPhone에서 로그인, 지도, 권한, 딥링크, 탭 전환을 점검한다.

## PR 완료 조건

1. 변경 위험에 맞는 테스트를 추가했거나 기존 테스트가 보호하는 이유를 PR에 설명한다.
2. 관련 파트의 타입체크·린트·포맷·테스트·빌드를 통과한다.
3. 사용자 흐름이 바뀌면 성공·실패·재시도와 호환성 동작을 검증한다.
4. 실제 브라우저·WebView·지도·권한이 필요한 범위는 수동 점검 결과나 후속 E2E 이슈를 남긴다.
5. 테스트가 실패하면 배포하지 않고, 실패한 계층의 로그와 재현 단계를 기록한다.

## E2E·시각 테스트 도입 기준

현재는 React Testing Library·MSW와 모바일 브리지 테스트로 빠르게 회귀를 잡고, 다음 조건이 반복되면 실제 브라우저 E2E를 도입한다.

- 운영 번들에서만 발생하는 Webpack·라우팅 회귀
- 로그인부터 매물 등록까지 전체 흐름의 배포 장애
- 지도 SDK, 파일 다운로드, 브라우저 권한, WebView 쿠키처럼 실제 환경이 필요한 장애

첫 E2E는 로그인 → 첫 매물 등록 → 상세 확인 한 경로로 제한하고, 안정화한 뒤 체크리스트·지도·딥링크로 확장한다. 시각 테스트는 레이아웃 변형이 잦은 화면부터 기준 이미지를 합의한 뒤 도입한다.
