# 읽기 전용 운영 관리자

`/admin`에서 접속 코드를 입력하면 운영 통계, 최근 가입 회원, CloudWatch API 오류·요청 상세와 PostHog 프론트엔드 오류를 조회한다. 일반 회원 로그인과 별개이며, 관리자 화면 진입으로 익명 회원을 만들지 않는다.

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

## CloudWatch Logs Insights 조회 구조

관리자 메뉴의 **오류 조회 → CloudWatch — 서버 로그**에서 Dev/Prod, 최근 1시간/24시간/7일, 전체(4xx·5xx)/4xx/5xx를 선택하고 조회한다. 조건을 바꾼 뒤 다시 조회 버튼을 눌러야 반영된다. 결과에 실제 조회 환경과 KST 시작·종료 시각을 표시한다. 최신 오류 최대 100건이며 자동 새로고침은 하지 않는다. 두 로그 탭은 어두운 배경, 구분선과 고정 헤더, 상태·등급 배지, 메시지 축약, 가로·세로 스크롤을 사용한다. 행을 선택하면 상세 내용을 확인한다.

1. 프론트가 `POST /api/admin/log-queries`로 조회를 시작한다. 환경·기간·상태와 선택적인 `requestId`만 전달한다.
2. 서버가 허용된 로그 그룹과 고정 Logs Insights 쿼리를 결정해 AWS `StartQuery`를 한 번 호출한다.
3. 서버가 AWS 쿼리 ID와 별도의 임의 조회 ID를 발급한다. 매핑과 실행 상태만 Caffeine 메모리에 최대 100개, 생성 후 5분 동안 보관한다. 조회 결과를 DB나 서버 캐시에 저장하지 않는다.
4. 프론트가 같은 서버 조회 ID로 `GET /api/admin/log-queries/{queryId}`를 1초 간격으로 호출한다. AWS ID를 직접 전달하거나 서버가 발급하지 않은 ID를 사용하면 조회하지 않는다.
5. `Scheduled`, `Running`은 `logs: null`이며 부분 결과를 표시하지 않는다. `Complete`일 때만 `logs` 배열을 표시하고 빈 배열은 조회 결과 없음으로 구분한다. `Failed`, `Cancelled`, `Timeout`은 별도의 오류 코드로 응답한다.

두 API 모두 기존 `AdminAuthenticationFilter`와 공통 성공·오류 응답을 사용한다. 관리자 코드 저장·검증·로그아웃 방식은 동일하다. 요청·응답 계약과 오류 코드는 `AdminLogController`의 Swagger를 따른다.

- SDK 호출 전체 제한은 5초, 시도 제한은 3초다. 응답 유실 시 `StartQuery` 중복 실행을 피하려고 SDK 자동 재시도를 끈다.
- 동시 조회 시작과 동일 ID의 중복 폴링은 대기열에 쌓지 않고 `ADMIN_LOG_QUERY_LIMIT`로 즉시 거절한다.
- 쿼리 실행은 60초까지 허용한다. 폴링뿐 아니라 관리자 로그 전용 스케줄러도 `StopQuery`를 호출하므로 브라우저를 닫아도 중단을 시도한다. 프론트는 전체 요청을 75초 후 취소한다.
- 최근 5분 동안 서버에 등록된 조회가 100개이면 새 조회를 거절한다. AWS 조회 제한도 별도로 적용된다. 반환 100건 제한이 스캔 비용까지 100건으로 제한하는 것은 아니므로 가능한 짧은 기간을 선택한다.
- 조회 ID는 현재 서버 프로세스에만 존재한다. 재시작 후나 다른 인스턴스로 폴링하면 다시 조회해야 한다. 같은 권한의 관리자는 유효한 서버 조회 ID를 알면 결과를 확인할 수 있다.
- 프로세스 강제 종료, 시작 응답 유실 또는 `StopQuery` 권한·네트워크 오류 시 AWS 쿼리가 남을 수 있다. 운영자는 콘솔에서 상태를 확인한다. 이 경우에도 사용자 요청은 무기한 기다리지 않는다.

AWS 동작은 [StartQuery](https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_StartQuery.html), [GetQueryResults](https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_GetQueryResults.html), [StopQuery](https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_StopQuery.html)를 참고한다.

### 환경과 IAM 권한

AWS SDK for Java v2의 기존 BOM에 `cloudwatchlogs` 모듈을 추가한다. 리전은 `ap-northeast-2`로 고정하며 기본 자격 증명 체인을 사용한다. EC2에서는 기존 인스턴스 IAM Role을 사용하고 별도 Access Key/Secret Key를 코드나 신규 설정에 추가하지 않는다.

| 환경   | 서버가 선택하는 로그 그룹         |
| ------ | --------------------------------- |
| `dev`  | `/jachwi-sunbae/dev/application`  |
| `prod` | `/jachwi-sunbae/prod/application` |

IAM 관리자가 기존 EC2 Role에 다음 권한이 있는지 확인한다. 아래는 계정 ID를 치환해서 검토할 정책 예시이며 애플리케이션이 IAM을 변경하지 않는다.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["logs:StartQuery", "logs:GetQueryResults"],
      "Resource": [
        "arn:aws:logs:ap-northeast-2:ACCOUNT_ID:log-group:/jachwi-sunbae/dev/application:*",
        "arn:aws:logs:ap-northeast-2:ACCOUNT_ID:log-group:/jachwi-sunbae/prod/application:*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "logs:StopQuery",
      "Resource": "*"
    }
  ]
}
```

`StopQuery`는 리소스 단위 제한을 지원하지 않아 `Resource: "*"`가 필요하다. 애플리케이션은 자신이 시작한 쿼리만 중단한다. 로그 그룹 검색, 원본 로그 조회, 데이터 마스킹 해제 권한은 이 기능에 필요하지 않다. 기존 KMS 암호화 정책이 적용되어 있으면 해당 키 정책도 운영자가 확인한다. [AWS 권한 표](https://docs.aws.amazon.com/service-authorization/latest/reference/list_logs.html)와 [IAM 정책 안내](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/iam-identity-based-access-control-cwl.html)를 기준으로 실제 Role에서 검증한다.

### 요청 ID로 상세 추적

- 오류 목록의 요청 ID를 누르면 **목록을 조회했던 환경·기간**으로 상세를 조회한다. 상단 조건을 바꿨더라도 기존 목록 항목의 환경을 사용한다.
- PostHog에서 `request_id`를 복사해 직접 입력할 수도 있다. 직접 검색은 현재 선택한 환경·기간을 사용하며 상태 필터를 적용하지 않으므로 HTTP 200 이후 프론트 파싱 오류도 추적할 수 있다.
- 상세는 동일 `request_id`의 로그를 시간순으로 최대 100건 표시한다. 오래된 목록을 선택해 기간 경계 밖으로 벗어났다면 기간을 늘려 직접 검색한다. 100건 도달 시 이후 로그가 생략될 수 있음을 표시한다.
- 기본 정보는 결과 중 상태 코드가 있는 HTTP 완료 로그에서 가져온다. 애플리케이션 예외 로그의 `error.type`, `error.message`, `error.stack_trace`와 완료 로그의 `error_type`은 서로 구분해 표시한다.
- 현재 ECS 로그에서 `GlobalExceptionHandler`가 기록한 예외와 `RequestLoggingFilter`의 HTTP 완료 기록은 같은 요청 ID로 연결된다. 처리된 예외의 스택은 별도 예외 로그에만 존재할 수 있으므로 완료 로그 한 줄로 추정하지 않는다.
- 없는 필드는 `null`이며 화면에 기록 없음으로 표시한다. 스택이 하나도 없으면 명시적으로 안내한다. 줄바꿈·들여쓰기를 보존하며 긴 스택은 스크롤해서 읽는다.

서버는 `@timestamp`, `request_id`, `http_method`, `path`, `member_id`, `status`, `duration_ms`, `message`, `error_type`과 상세용 예외 필드만 반환한다. AWS의 `@ptr`, `@message` 원문, 인증 헤더, 요청·응답 본문, `query_string`, 실행 쿼리 원문은 반환하지 않는다. 예외 메시지·스택 자체에는 기존 로그의 내부 정보가 포함될 수 있으므로 관리자 화면에서만 확인한다. 프론트는 일반 회원용 `apiClient` 대신 기존 관리자 전용 요청 경로를 사용하며 결과·오류 원문을 PostHog로 전달하지 않는다.

### CloudWatch 회원 ID

`JwtAuthenticationFilter`가 JWT와 회원 존재를 검증한 뒤 저장하는 `MEMBER_ID_ATTRIBUTE`를 `RequestLoggingFilter`가 읽는다. 2xx·4xx·5xx HTTP 요청 완료 로그에 양의 회원 ID를 `member_id`로 추가한다. 기존 MDC의 `request_id`를 그대로 사용하며 헤더·쿼리·본문에서 회원을 추정하지 않는다. 인증 실패, 공개 요청, 관리자 요청에는 회원 ID를 추가하지 않는다. 기존 인증정보·본문 로깅 정책과 JSON 로그 저장·경보 설정은 유지한다.

Logs Insights 결과의 `member_id`는 API의 nullable `memberId`로 매핑한다. 목록과 요청 상세 상단에 표시하며, 값이 없으면 `-`다. 예외 로그에 회원 ID가 없어도 같은 요청의 HTTP 완료 로그에서 확인할 수 있다. 배포 이전 로그는 소급 수정하지 않는다.

### 조회 실패 점검 순서

1. 401이면 기존 접속 코드 설정과 `Authorization: Admin …` 전달을 확인한다. 회원 JWT나 새로운 세션은 사용하지 않는다.
2. `ADMIN_LOG_INPUT_INVALID`이면 환경·기간·상태와 요청 ID를 확인한다. 요청 ID는 영문·숫자·밑줄·하이픈 1~128자만 허용한다.
3. `ADMIN_LOG_ACCESS_DENIED`이면 EC2 Role의 `StartQuery`, `GetQueryResults` 권한과 두 그룹의 ARN을 확인한다. 중단 실패 경고가 있으면 `StopQuery`도 확인한다.
4. `ADMIN_LOG_GROUP_NOT_FOUND`이면 계정·리전과 선택 환경의 그룹이 실제 존재하는지 확인한다. 애플리케이션은 그룹을 생성하지 않는다.
5. `ADMIN_LOG_QUERY_LIMIT`이면 서버의 5분 등록 한도 또는 AWS 제한을 확인하고 잠시 후 다시 조회한다.
6. `ADMIN_LOG_QUERY_NOT_FOUND`이면 만료·서버 재시작·다른 인스턴스 연결 여부를 확인하고 새 조회를 실행한다.
7. `ADMIN_LOG_QUERY_FAILED`, `ADMIN_LOG_QUERY_CANCELLED`, `ADMIN_LOG_QUERY_TIMEOUT`이면 콘솔에서 상태를 확인하고 기간을 줄여 조회한다. `ADMIN_LOG_UNAVAILABLE`이면 기본 자격 증명 체인, 네트워크와 CloudWatch 서비스 상태를 점검한다. AWS 오류 원문은 클라이언트나 관리자 요청 로그로 전달하지 않는다.
8. 조회가 완료됐지만 비어 있으면 환경·기간·로그 수집 지연을 확인한다. 스택 없음은 조회 실패와 다르며, 실제 로그에 예외가 기록됐는지 확인한다.

### 실제 dev 검증 절차

1. dev 배포 후 EC2의 기존 IAM Role과 두 로그 그룹 조회 권한을 확인한다. `aws sts get-caller-identity`는 코드가 실행되는 계정 확인용이며 실제 접속 코드나 키를 이슈에 남기지 않는다.
2. `/admin`에서 기존 코드로 접속하고 통계·회원 조회·외부 모니터링 링크·로그아웃이 그대로 동작하는지 확인한다.
3. dev에서 `curl -i https://dev-api.jachwi-sunbae.kr/api/properties`처럼 인증 없는 읽기 요청을 보내 4xx 응답과 `X-Request-Id`를 확보한다. Dev/1시간/4xx로 조회해 시각·경로·상태·소요 시간·ID를 콘솔 로그와 대조한다. 로그 수집 지연 후 수동 재조회할 수 있다.
4. 기존에 기록된 dev 5xx 요청 ID로 상세를 확인한다. 예외 로그와 HTTP 완료 기록이 시간순이며 콘솔의 실제 스택과 줄바꿈·들여쓰기가 같은지 확인한다. 이 검증을 위해 운영 장애나 새 오류 API를 만들지 않는다.
5. 스택 없는 4xx 요청과 정상 읽기 API의 HTTP 200 요청 ID를 직접 검색한다. 각각 스택 없음 안내와 정상 완료 로그를 확인한다. PostHog에 있는 파싱 오류의 `request_id`가 있다면 같은 절차로 연결한다.
6. Dev/Prod, 1시간/24시간/7일, 전체/4xx/5xx를 전환해 완료·빈 결과·실패를 구분하고 같은 조회 ID로 폴링하는지 확인한다. 화면을 닫은 뒤 장시간 실행 중 쿼리가 중단되는지도 확인한다. 실제 IAM 권한을 일부러 제거하지 않고 실패 상태는 테스트 대역으로 검증한다.
7. 브라우저 네트워크에서 필요한 필드만 반환되는지, 로그·코드가 PostHog 이벤트나 녹화에 포함되지 않는지 확인한다. 서버 로그에도 관리자 입력·응답·AWS 원문이 없는지 확인한다.

2026-11-11 로컬 검증에서는 `aws sts get-caller-identity`가 `NoCredentials: Unable to locate credentials`로 실패했다. 실제 IAM 권한 부족 여부와 dev/prod 로그 결과는 확인하지 못했다. 위 절차는 EC2 Role이 연결된 dev에서 추가 수행해야 하며 AWS 리소스·IAM·로그 수집·경보 정책은 변경하지 않았다.

## PostHog 프론트엔드 오류 조회

**오류 조회 → PostHog — 프론트엔드 오류**에서 환경, 기간(1시간/24시간/7일), 등급(전체/P0/P1/P2), 선택적인 요청 ID를 입력하고 조회한다. 최신 100건을 반환하고 자동 폴링·새로고침·재시도는 하지 않는다.

1. 프론트가 기존 관리자 접속 코드로 `GET /api/admin/posthog-errors?environment=dev&period=1h&severity=all`을 요청한다. 요청 ID가 있으면 `requestId`를 추가한다.
2. `AdminPostHogService`가 Spring `RestClient`로 `POST https://us.posthog.com/api/projects/579863/query/`를 호출한다. 서버의 개인 API 키를 Bearer 인증에 사용한다.
3. 본문은 `query.kind: HogQLQuery`, 서버가 생성한 `query.query`, `refresh: force_blocking`이다. `$exception`만 조회하고 서버 시계 기준 시작·종료 시각, 환경·등급·요청 ID를 적용한다. 환경·기간·등급은 허용 목록, 요청 ID는 영문·숫자·밑줄·하이픈 1~128자로 검증한다. 임의 SQL/HogQL 입력은 받지 않는다.
4. Query API의 `columns`와 `results`를 컬럼 이름으로 연결한다. 이벤트 ID·시각·사용자 식별자, 지정한 환경·화면·요청 속성과 예외 정보만 추출한다. 이벤트 전체, 쿼리 원문, API 키는 응답하지 않는다.
5. 완료된 빈 배열만 정상적인 결과 없음으로 안내한다. 미완료·잘못된 응답은 조회 실패다. 연결 제한은 3초, 응답 제한은 15초, 브라우저 전체 요청 제한은 20초이며 탭을 떠나면 요청을 취소한다.

| 화면 환경     | 실제 `properties.environment` | 근거                          |
| ------------- | ----------------------------- | ----------------------------- |
| Dev (`dev`)   | `development`                 | 기존 PostHog 개발 환경 수집값 |
| Prod (`prod`) | `production`                  | 기존 PostHog 운영 환경 수집값 |

예외는 공식 `$exception_list` 배열의 각 항목에서 `type`, `value`, `stacktrace.frames`를 읽는다. HogQL이 배열을 JSON 문자열로 반환하는 경우도 처리한다. 스택은 실제 저장된 `filename`, `function`, `lineno`, `colno`만 표시하며 파일 URL의 쿼리·해시, 코드 변수·문맥·mechanism은 전달하지 않는다. 예외나 스택이 없으면 `null`/기록 없음으로 안내하고 생성하지 않는다. 소스맵 복원이나 별도 이벤트 수집은 수행하지 않는다.

API 계약은 `AdminPostHogController`의 Swagger와 [PostHog SQL](https://posthog.com/docs/sql), [Query API](https://posthog.com/docs/api/queries), [예외 이벤트 구조](https://posthog.com/docs/error-tracking/issues-and-exceptions)를 참고한다.

### 조회용 API 키 설정

- 기존 Vault `app_env` 등 서버 환경 주입 경로로 `POSTHOG_PERSONAL_API_KEY`를 설정한다. 기존 `ADMIN_ACCESS_CODES`도 계속 필요하다. 배포 파이프라인을 수정하지 않는다.
- 담당자가 PostHog의 개인 API 키 설정에서 프로젝트 `579863`에 대한 **Query 읽기** 권한을 가진 키를 발급한다. 권한 UI와 계정 접근 범위는 [개인 API 키 문서](https://posthog.com/docs/api/personal-api-keys)를 따른다.
- 기존 브라우저 수집용 프로젝트 토큰은 이벤트 전송용이며 이 조회 키를 대체하지 않는다. 조회용 키는 프론트 환경변수·공개 설정·Git·응답·로그에 넣지 않는다. API 호스트는 수집 호스트 `us.i.posthog.com`과 다른 `us.posthog.com`이다.
- 키가 비어 있으면 `503 ADMIN_POSTHOG_NOT_CONFIGURED`를 반환한다. 외부 호출 없이 빈 성공 응답으로 숨기지 않는다.
- PostHog의 401·403·429·시간 초과·기타 장애는 각각 `502 ADMIN_POSTHOG_AUTH_FAILED`, `ADMIN_POSTHOG_ACCESS_DENIED`, `ADMIN_POSTHOG_RATE_LIMITED`, `ADMIN_POSTHOG_TIMEOUT`, `ADMIN_POSTHOG_UNAVAILABLE`로 구분한다. 관리자 접속 코드가 틀린 401과 PostHog 키 오류는 별개다. 원본 오류 응답·키·실행 쿼리를 로그나 응답에 연결하지 않는다.

### 사용자 식별과 서버 로그 연결

기존 `identifyPostHogMember`의 `distinct_id = member-{memberId}` 규칙을 그대로 사용한다. 정확한 접두사와 양의 정수로 확인할 수 있는 회원만 `memberId`로 반환한다. 숫자만 있는 임의 ID, 익명 ID, 누락·잘못된 ID는 `null`이다. 이 기준은 기존·새 이벤트에 동일하게 적용하며 과거의 없는 ID를 복원하지 않는다. 회원 식별·로그아웃·세션 복원·사용자 행동 수집 코드는 변경하지 않는다.

오류 행을 선택하고 **서버 로그 확인**을 누르면 이벤트의 `request_id`와 해당 목록을 실제 조회했던 환경·기간으로 CloudWatch 탭의 기존 `useAdminLogs` 및 요청 상세를 실행한다. 조회 이후 필터 입력을 수정했더라도 원래 조회 조건을 사용한다. 요청 ID 검색에는 HTTP 오류 상태 필터를 적용하지 않으므로 HTTP 200 이후 프론트 파싱 오류도 추적할 수 있다. 요청 ID가 없으면 연결 버튼을 표시하지 않으며, 보존 기간 경과·수집 지연 등으로 서버 로그가 없으면 빈 결과를 안내한다. 이벤트·로그를 별도 DB에 복제하거나 동기화하지 않는다.

### PostHog 실제 dev 검증 절차

1. 담당자가 서버에 Query 읽기 권한의 개인 API 키를 주입하고 dev를 배포한다. 서버 설정·로그·브라우저 공개 설정에 키 원문이 노출되지 않는지 확인한다.
2. 기존 코드로 `/admin`에 접속해 PostHog 탭에서 Dev/1시간/전체를 수동 조회한다. PostHog 콘솔의 `$exception` 시각·환경·등급·예외 목록과 비교한다. 결과가 없으면 콘솔에 실제 이벤트가 있는 기간을 선택한다.
3. 기존 인증 회원 이벤트에서 `member-123` 같은 식별자와 회원 ID를 대조하고 익명·과거 이벤트는 `-`인지 확인한다. 새로운 일반 회원 API 요청의 CloudWatch 완료 로그에도 `member_id`가 동일한 `request_id`로 남는지 확인한다.
4. 요청 ID가 있는 기존 오류에서 **서버 로그 확인**을 눌러 환경·기간과 HTTP 200/4xx/5xx 상세를 대조한다. HTTP 200 이후 프론트 파싱 오류가 기록된 사례도 확인한다. 검증용 운영 장애를 만들지 않는다.
5. 누락된 요청 ID·예외·스택과 빈 결과 안내, P0/P1/P2 필터, 긴 메시지 상세, 좁은 화면의 가로 스크롤을 확인한다. 외부 키 권한 변경 없이 실패 응답은 테스트 대역으로 검증한다.
6. 관리자 호출·조회한 이벤트·로그가 PostHog 이벤트나 녹화로 다시 전송되지 않는지 확인하고 기존 통계·회원 조회·로그아웃도 확인한다.

2026-11-11 로컬 환경에는 `POSTHOG_PERSONAL_API_KEY`가 없어 실제 프로젝트 Query API 결과를 확인하지 못했다. 공식 API·예외 문서와 설치된 PostHog SDK 타입을 기준으로 구현하고 HTTP 테스트 대역으로 검증했다. 실제 프로젝트의 권한, 저장 속성 및 스택 유무는 위 절차로 추가 확인해야 한다. AWS IAM·PostHog 프로젝트 설정은 변경하지 않았다.

이번 범위에는 다중 인스턴스 조회 상태 공유, 로그 페이지네이션·내보내기, 관리자 인증 개선, 장애 분석·자동 복구를 포함하지 않는다.
