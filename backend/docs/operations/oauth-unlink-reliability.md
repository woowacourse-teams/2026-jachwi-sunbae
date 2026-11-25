# 탈퇴 Outbox 신뢰성 검증

백엔드 신뢰성 개선 1단계 기록이다. 2026-11-24 기준이며 운영 배포는 실행하지 않았다.
사진, 월세 수집본, 체크리스트와 전체 배포·복구 점검은 후속 단계에서 다룬다.

## 문제

`MemberService.delete`는 회원 행을 잠근 뒤 소유 기록 삭제, 세션 제거, 제공자 연결 제거와 Outbox 저장, 회원 삭제를 한 트랜잭션에서 실행한다.
`JdbcMemberIdentityRepository.deleteByMemberId`는 Apple 토큰을 복호화하지 않고 암호문 그대로 Outbox에 옮긴다. 이 구조는 유지한다.

기존 처리기는 `next_attempt_at`을 5분 뒤로 바꾸는 조건부 UPDATE로 선점한다. 다음 두 실패를 실제 MySQL에서 재현했다.

1. 작업자 A가 제공자를 호출하는 동안 선점이 만료되어 B가 다시 선점하면, 뒤늦게 완료한 A가 ID만으로 B의 요청을 삭제하거나 재예약한다. A의 12번째 실패도 B의 요청을 삭제한다.
2. 배치 시작 시각을 모든 요청에 재사용한다. 앞 요청에서 6분이 지나면 다음 요청은 선점할 때 이미 만료된 시각을 기록한다.

## 대안

| 대안                           | 장점                                                            | 한계                                                                                        |
| ------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 선점 기간만 연장               | 변경량이 작다                                                   | 임의로 긴 지연·프로세스 정지 이후의 오래된 작업자 쓰기를 막지 못한다                        |
| 외부 호출 동안 DB 행 잠금 유지 | DB 안의 작업자를 직렬화할 수 있다                               | 외부 지연 동안 연결과 트랜잭션을 점유하고, 외부 성공 직후 프로세스가 종료되는 문제는 남는다 |
| 선점별 식별자와 조건부 쓰기    | 외부 호출 동안 DB 트랜잭션 없이 오래된 작업자의 쓰기를 차단한다 | 새 컬럼과 구버전 작업자 종료 절차가 필요하다                                                |

## 선택 이유와 구현

선점별 UUID를 `claim_token`에 저장하는 방법을 선택했다.

- V21은 nullable 컬럼 하나를 추가한다. 기존 행의 식별값·토큰·실패 횟수·시각은 바꾸지 않는다. 기존 INSERT도 계속 가능하다.
- 선점은 `id`와 도래 시각을 조건으로 시각·UUID를 함께 갱신한다. 조회도 자신이 쓴 UUID로 제한한다. 조회 전에 다른 선점으로 바뀌거나 행이 없어졌으면 건너뛴다.
- 성공 삭제, 실패 재예약과 12회 실패 후 삭제 모두 `id + claim_token`이 일치할 때만 실행한다. 재예약하면 UUID를 비운다.
- 선점을 잃은 오래된 작업자의 결과로 완료·포기 로그를 남기지 않는다.
- 각 요청을 선점하기 직전에 시각을 다시 읽어 그 시점부터 5분을 부여한다.

최대 12회 실패 시 요청과 토큰·식별정보를 삭제하는 기존 정책, 실패 간격(1·2·4분부터 최대 12시간), 배치 20개와 스케줄러 1분 간격은 유지했다.
기존과 같이 외부 성공 후 DB 삭제 실패도 처리 실패로 재예약하며 실패 횟수에 반영한다. 재예약 SQL 자체가 실패하면 DB에 남은 선점이 만료된 뒤 재처리한다.
회원 탈퇴 API와 사용자 동작은 변경하지 않았다.

## 검증 결과

실제 MySQL 8.4.10을 Testcontainers로 실행했다. 로컬·운영 DB는 사용하지 않았다.
회원 트랜잭션 테스트에는 테스트 자체의 `@Transactional`을 붙이지 않아 서비스의 실제 커밋과 롤백을 확인한다.
실패는 일회용 DB의 트리거로 주입하고 테스트가 끝나면 제거한다. 동시성은 별도 스레드와 latch로 순서를 제어하고 시간은 Clock으로 전진시킨다.
제공자 통신은 로컬 HTTP 대역을 사용하며 실제 카카오·Apple 계정은 해제하지 않는다.

| 시나리오                                        | 확인할 결과                                                                            | 테스트                                                                                  |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 정상 탈퇴 커밋                                  | 회원·기록 논리 삭제, 세션·연결 제거, 암호문 그대로 Outbox 저장                         | `MemberDeletionOutboxIntegrationTest.commitsDeletionAndOutboxTogether`                  |
| Outbox INSERT·연결 DELETE·최종 회원 UPDATE 실패 | 회원·매물·사진·세션·연결·Outbox의 전체 스냅샷 복원                                     | `MemberDeletionOutboxIntegrationTest.rollsBackEveryChangeWhenDeletionFails`             |
| 두 처리기 동시 실행                             | 유효한 선점 중 외부 호출은 한 처리기만 실행                                            | `OAuthUnlinkServiceIntegrationTest.claimsExclusively`                                   |
| 선점 직후 중단 후 새 처리기 구성                | 5분 직전에는 처리하지 않고 만료 경계에서 스케줄러 진입점으로 완료                      | `OAuthUnlinkServiceIntegrationTest.resumesExpiredClaimAfterRestart`                     |
| 외부 성공 후 DB DELETE 실패                     | 요청을 보존·재예약하고, 재호출의 Kakao -101·Apple 400 invalid_grant를 성공 처리해 제거 | `OAuthUnlinkServiceIntegrationTest.retriesAfterProviderSuccessAndDatabaseDeleteFailure` |
| 실패 후 재예약 UPDATE도 실패                    | 자격정보·기존 선점을 보존하고 다음 스케줄러 실행에서 회복                              | `OAuthUnlinkServiceIntegrationTest.recoversWhenReschedulingFails`                       |
| 만료된 작업자의 성공·실패·12번째 실패           | 새 선점 행·시각·횟수가 그대로 남고 새 작업자가 완료                                    | `OAuthUnlinkServiceIntegrationTest.fencesExpiredWorker`                                 |
| 배치 앞 요청이 6분 지연                         | 다음 요청은 선점 시각부터 5분 보호                                                     | `OAuthUnlinkServiceIntegrationTest.leasesEachRequestFromCurrentTime`                    |
| V20 → V21                                       | 대기·선점 중인 요청의 기존 모든 컬럼 값을 보존하고 claim_token만 NULL로 추가           | `DatabaseBaselineIntegrationTest.preservesUnlinkRequestsWhenAddingClaimToken`           |

수정 전 환경 문제를 해소한 재현 실행은 12개 중 4개가 실패했다. 새 선점 행이 0개가 되거나, 10분까지인 선점이 6분으로 덮어써졌으며, 배치의 다음 선점이 기대한 11분 대신 5분으로 기록됐다.
수정 후 새 Outbox·탈퇴 테스트 13개가 모두 통과했다. 스케줄러 진입점을 직접 실행해 DB 재예약 실패 후 다음 실행에서 요청이 제거되는 것도 확인했다.

Java 21로 `backend`에서 다음 전체 검사를 실행했다.

```bash
./gradlew testAll --no-daemon
```

- `BUILD SUCCESSFUL`: 216개 테스트 클래스, 전체 1,940개 중 통과 1,939개, 실패·오류 0개, 건너뜀 1개. 건너뛴 항목은 `BEDROCK_LIVE_IMAGES`를 지정해야 실행하는 기존 Bedrock 실호출 테스트다.
- 새 Outbox 테스트 9개, 탈퇴 트랜잭션 테스트 4개, 마이그레이션 테스트 18개가 모두 통과했다.
- 기존 제공자 클라이언트 테스트 28개, 네이티브 OAuth 인수 테스트 38개, HTTP 탈퇴 인수 테스트 2개와 아키텍처 검사도 모두 통과했다.
- 종료 시 이미 내려간 테스트 DB에 대한 Hikari 연결 경고가 출력됐지만 전체 실행 종료 코드는 0이고 테스트 실패는 없었다.
- 루트의 `npm run format:docs`, `npm run format:docs:check`와 `git diff --check`를 실행했다. 디버깅 임시 파일은 제거하고 기존 `.claude/`는 보존했다.

## 적용·복구 시 주의점

V21은 추가만 하는 스키마 변경이지만, 구버전 처리기는 UUID 조건 없이 쓰므로 신·구버전 작업자를 섞어 실행하면 경합 차단을 보장할 수 없다.
아래는 적용 절차이며 이 작업에서는 실행하지 않았다.

1. 대상 DB와 복구 가능한 백업을 확인한다. 모든 인스턴스의 구버전 unlink 스케줄러와 진행 중 호출이 종료됐는지 확인한다. 필요하면 `AUTH_OAUTH_UNLINK_ENABLED=false`로 재기동하여 처리기를 끈다. 환경변수만 바꾸고 프로세스를 그대로 두면 적용되지 않는다.
2. 처리기를 끈 상태에서 새 버전으로 기동해 V21 성공과 요청 보존을 확인한다. 식별값·토큰을 로그나 점검 결과에 출력하지 않는다.
3. 모든 처리기가 새 코드인 것을 확인한 뒤 `AUTH_OAUTH_UNLINK_ENABLED=true`로 재기동한다. 완료·실패·포기 로그와 대기 요청의 변화를 확인한다.
4. 롤백이 필요하면 먼저 모든 처리기를 정지한다. V21 컬럼을 삭제하거나 이력을 지우지 않는다. 구버전으로 되돌아가 처리기를 켜면 기존 경합이 다시 생기므로, 가능하면 이 보완이 포함된 리비전으로 복구한다. 구버전 복귀 시 Flyway 검증도 별도로 확인한다.

민감정보 없이 확인할 수 있는 조회 예시는 다음과 같다.

```sql
SELECT COUNT(*) AS pending_count,
       MIN(created_at) AS oldest_created_at,
       COALESCE(SUM(next_attempt_at <= UTC_TIMESTAMP(6)), 0) AS due_count
FROM oauth_unlink_requests;

SELECT attempts, COUNT(*) AS request_count
FROM oauth_unlink_requests
GROUP BY attempts
ORDER BY attempts;
```

## 남은 한계

- 외부 API와 DB를 한 트랜잭션으로 묶을 수 없으므로 외부 호출은 중복될 수 있다. 이번 보완은 이전 선점의 DB 쓰기를 막는다. 외부 성공 후 DB 반영 전에 종료되는 구간은 이미 해제된 계정의 재호출 성공 처리로 회복한다.
- 재시작 테스트는 선점을 DB에 남긴 뒤 새 서비스·저장소 객체를 구성한다. OS 프로세스 강제 종료, 실제 다중 호스트 장애와 운영 네트워크 단절 실험은 하지 않았다.
- 서버 간 Clock 오차와 DB 쓰기 전 장시간 프로세스 정지는 5분 선점의 실제 길이에 영향을 준다. UUID는 새 선점 이후 오래된 쓰기를 막지만 외부 호출 자체를 취소하지 않는다.
- 12회 실패 후 삭제된 토큰·식별정보로는 자동 재시도를 재구성할 수 없다. 기존 `OAuth unlink abandoned` ERROR를 운영자가 확인해야 한다. 삭제 정책과 보존 기간은 바꾸지 않았다.
- 이미 탈퇴한 계정이 재시도 전에 같은 제공자로 다시 연결되는 경우, 제공자의 사용자 단위 연결 해제가 새 연결에 영향을 줄 수 있다. 이 사용자 동작·충돌 정책은 이번에 변경하지 않았다.
- 처리량·응답 시간·장애율 개선 수치는 측정하지 않았다.
