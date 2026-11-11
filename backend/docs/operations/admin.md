# 읽기 전용 운영 관리자

`/admin`에서 접속 코드를 입력하면 운영 통계와 최근 가입 회원을 조회한다. 일반 회원 로그인과 별개이며, 관리자 화면 진입으로 익명 회원을 만들지 않는다.

## 접속 방식

- 기존 Vault `app_env`의 `ADMIN_ACCESS_CODES`에 코드 10개를 쉼표로 구분해 설정한다. 코드의 길이·개수·중복을 별도로 검증하지 않으며 빈 설정은 접속을 허용하지 않는다.
- 프론트는 입력 코드를 탭 메모리에만 보관하고 각 관리자 조회 요청에 `Authorization: Admin <접속 코드>`로 전달한다. 서버는 코드 목록에 포함되는지만 확인하며 잘못된 요청은 401을 반환한다.
- 접속 시 운영 통계를 함께 조회하고, 회원 목록은 최근 가입한 20명만 표시한다. 로그아웃은 메모리의 코드를 지우며 새로고침하면 다시 입력한다.
- 서버 세션·쿠키·CSRF·접속 횟수 제한·만료 정책·관리자 전용 캐시 정책은 없다. 기존 회원 JWT와 서비스 공통 CORS는 그대로 사용한다. 프론트 Origin은 기존 `CORS_ALLOWED_ORIGINS` 설정과 맞춘다.
- 실제 코드와 운영 비밀은 Git이나 프론트 빌드 설정에 넣지 않는다. 테스트의 `test-only-admin-code-*`는 테스트 전용이다. 이 단계는 학습용 초기 구현이다.

## 표시하는 데이터

- 전체 활성 계정 수: `members.deleted_at IS NULL AND merged_into_member_id IS NULL`. 익명 계정을 포함한 계정 수이며 실제 사람 수가 아니다.
- 오늘 신규 계정: 위 활성 계정 중 KST 오늘 자정 이상, 다음 자정 미만에 생성된 계정. UTC로 저장된 DB 시각과 비교한다.
- 전체 활성 매물: 활성 계정 소유이며 `properties.deleted_at IS NULL`인 매물.
- 최근 가입 회원: 가입 시각·ID 내림차순 최대 20명. 회원 ID·가입 시각·활성 매물 수·활성 사진 수만 반환한다. 사진은 활성 매물에 속하고 삭제되지 않은 사진만 센다.

요약과 최근 회원 목록은 각각 한 쿼리로 조회한다. 매물·사진 집계를 분리해 조인으로 개수가 부풀거나 N+1이 생기지 않게 한다. 회원 검색·페이지네이션은 포함하지 않는다. 통계는 접속 시점의 값이며 다시 접속하면 갱신된다. API 계약은 `AdminQueryController`의 Swagger 설명을 따른다.

## 로그와 오류 추적

`RequestLoggingFilter`는 관리자 요청의 본문·쿼리·헤더·응답 본문·예외 원문을 기록하지 않고 고정 경로, 요청 ID, 메서드, 상태, 소요 시간만 남긴다.

관리자 화면의 PostHog 이벤트·오류·세션 녹화와 관리자 API 네트워크 녹화도 제외한다. 기존 일반 회원 화면의 수집 정책은 유지한다.

일반 회원 API의 `apiClient.ts`는 서버 `X-Request-Id`를 `ApiError.requestId`와 PostHog `request_id`에 보존한다. JSON·Blob 요청의 HTTP 오류뿐 아니라 성공 응답 이후 파싱·계약 검증 오류에도 같은 ID를 사용한다. 서버 응답이나 헤더가 없으면 ID를 생성하지 않는다. P0/P1/P2 분류, 민감정보 마스킹, 취소·인증 종료 처리도 유지한다.

- [CloudWatch 운영 대시보드](https://ap-northeast-2.console.aws.amazon.com/cloudwatch/home?region=ap-northeast-2#dashboards/dashboard/jachwi-sunbae-operations)
- [PostHog 프로젝트](https://us.posthog.com/project/579863)

각 서비스의 기존 권한으로 접속하고, 일반 회원 API 오류의 `request_id`를 CloudWatch 로그에서 찾는다. 관리자 API는 PostHog 수집 제외 대상이다.

## 확인 방법

코드 일치·불일치·미설정, 최근 20명 정렬, KST 경계와 삭제·병합 제외, 접속·로그아웃·빈 목록·조회 실패, 관리자 로그와 PostHog 수집 제외, 일반 API 요청 ID 연결을 테스트한다.

백엔드는 `./gradlew test`와 `./gradlew testAll`, 프론트는 `npm test`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`를 실행한다. JDBC 테스트에는 Docker의 MySQL이 필요하다. 루트에서 `npm run format:docs`와 `npm run format:docs:check`를 실행한다.

실제 dev에서는 담당자가 기존 Vault 설정으로 코드를 주입한 뒤 접속·조회·로그아웃과 DB 통계 대조, 관리자 로그·PostHog 제외, 일반 API의 요청 ID 교차 추적을 확인한다. 이 변경은 운영 리소스·Vault 값·배포 파이프라인을 수정하지 않는다.
