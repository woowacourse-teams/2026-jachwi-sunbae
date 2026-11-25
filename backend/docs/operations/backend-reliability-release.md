# 백엔드 신뢰성 변경 배포·복구

## 문제와 선택

기존 배포는 `systemd`, health와 배포 SHA를 검증하지만, 핵심 API의 읽기·쓰기를 확인하지 않는다.
추가 컬럼이 있는 DB에 구버전이 기동되더라도 선점 UUID, 사진 보존, 체크 버전 검사를 지킨다는 보장은 없다.
DB 복원은 파일과 외부 OAuth 상태를 되돌리지 않으며, 버전·식별자 번호가 과거로 돌아가는 문제도 고려해야 한다.

| 대안                                                           | 선택 이유                                                                        |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| health·SHA만 확인                                              | 기동과 리비전 식별에는 필요하지만 사용자 동작의 성공 조건으로 부족하다.          |
| 배포 훅에서 실제 회원 탈퇴·외부 연결 해제까지 자동 실행        | 실제 제공자 계정과 운영 데이터를 바꾸므로 채택하지 않았다.                       |
| 기존 기동 검증을 보완하고 전용 회원의 별도 읽기·쓰기 점검 실행 | 선택. CodeDeploy의 역할을 유지하고 핵심 계약·복구 후 동작을 확인할 수 있다.      |
| 실패 시 무조건 직전 JAR·DB 백업으로 복귀                       | 계약·보존 정책과 복원 이후의 버전/ID 안전성을 보장하지 못하므로 채택하지 않았다. |

이 문서는 실행 절차다. 이 작업에서 운영 배포, AWS 설정 변경, 운영 RDS·S3 복원은 실행하지 않았다.

## 1. 배포 전 기록과 전환 순서

1. 대상 환경, 새 소스 SHA·아티팩트, 현재 정상 SHA, 복귀 가능한 **호환 리비전**을 기록한다. 첫 전환에는 호환 리비전이 아직 없을 수 있다.
2. 원본 RDS의 백업 보존 범위·`LatestRestorableTime`, 복원 권한과 암호화 키, S3 Versioning·버전/백업의 실제 존재를 확인한다. 설정 상태를 추정하지 않는다.
3. DB 변경은 V21~V23이며 기존 데이터를 보존하는 추가 변경이다. V21은 선점 UUID, V22는 사진 복구 기록·파일 파기 상태, V23은 상태·메모 버전이다.
4. 새 체크 저장은 버전이 필수이므로 백엔드·프론트엔드를 함께 전환한다. 전환 중 변경 요청을 차단하고, 구버전 노드·적재 명령·작업자가 남아 있지 않은지 확인한다.
5. 새 백엔드의 마이그레이션·기동 검증과 새 프론트엔드 배포를 확인한다. 오래 열린 웹 화면·앱 WebView는 새로고침하도록 안내한다. 버전 없는 쓰기를 임시 허용하지 않는다.
6. 전용 점검 회원의 읽기·쓰기 검증과 브라우저 충돌 동작까지 통과한 뒤 변경 요청을 다시 허용한다.

변경 차단은 배포 담당자가 ALB·게이트웨이 등 실제 요청 경로에서 수행한다. 차단 범위는 API의 POST·PUT·PATCH·DELETE, 별도 월세·교통 적재 명령과 스케줄러다.
점검은 격리된 대상 또는 통제된 점검 경로로 실행한다. 차단한 공개 경로에서 점검 요청이 거절되는 것을 애플리케이션 결함으로 오판하지 않는다.

## 2. 기동과 핵심 읽기·쓰기 확인

### 기존 기동 검증

`validate.sh`는 서비스 실행, 단일 JSON 문서의 최상위 `status=UP`, 정확한 `build.commit` 일치를 확인한다.
다른 경로의 `commit`, 하위 구성 요소만 `UP`, 잘못된 JSON·여러 문서를 이어 붙인 응답은 통과시키지 않는다. 공백이 있는 유효한 JSON은 허용한다.
기존 Vault 준비에서도 사용하는 `jq`와 `curl`이 필요하다.

기본 재시도는 48회, 간격은 5초이고 각 HTTP 요청에도 최대 시간이 있다. 간격의 합을 실제 전체 제한 시간으로 계산하지 않는다.
CodeDeploy의 `ValidateService` 훅 제한은 현재 `appspec.yml`의 300초다. 배포 SHA 파일은 기존처럼 소문자 40자리여야 한다.

### 전용 회원 점검 스크립트

`scripts/smoke.sh`는 CodeDeploy 훅에 자동 연결하지 않았다. 운영자가 **환경별 전용 점검 회원**으로 실행한다. CI에는 비밀값이나 실제 쓰기 권한을 넣지 않는다.
실제 회원의 토큰을 사용하지 않는다. 토큰 파일과 예상 회원 ID를 함께 지정해 다른 계정이면 새 매물 생성 전에 중단한다.

현재 환경의 전용 회원 ID를 `TEST_MEMBER_ID`, 이번 배포 SHA를 `RELEASE_REVISION`에 먼저 기록한다.
전용 Refresh 쿠키가 담긴 curl 설정 파일은 `/etc/jachwi-sunbae/smoke/refresh.curl`에 운영자가 보호된 방식으로 준비한다. 디렉터리는 0700, 비밀 파일은 0600으로 관리한다.
Access Token이 만료됐으면 새 회원을 만들지 않는 `/api/auth/refresh`로 발급한다. 명령 추적을 켜거나 응답 본문·헤더를 장애 기록에 남기지 않는다.

```bash
set +x
umask 077
export SMOKE_BASE_URL=https://dev-api.jachwi-sunbae.kr
curl -fsS --connect-timeout 5 --max-time 20 \
  --config /etc/jachwi-sunbae/smoke/refresh.curl \
  --request POST "${SMOKE_BASE_URL}/api/auth/refresh" \
  | jq -er '.data.accessToken' > /etc/jachwi-sunbae/smoke/access-token

SMOKE_ACCESS_TOKEN_FILE=/etc/jachwi-sunbae/smoke/access-token \
SMOKE_MEMBER_ID="${TEST_MEMBER_ID:?전용 점검 회원 ID 필요}" \
SMOKE_EXPECTED_REVISION="${RELEASE_REVISION:?배포 SHA 필요}" \
bash /opt/jachwi-sunbae/scripts/smoke.sh
```

Prod에서는 URL·점검 회원·SHA를 Prod의 값으로 바꾼다. HTTPS를 검증하며 리다이렉트를 따라가지 않는다. HTTP는 로컬 검증 주소만 허용한다.

점검은 다음 순서로 실행하고 하나라도 다르면 0이 아닌 종료 코드를 반환한다.

| 범위                           | 통과 조건                                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| health·SHA·현재 회원·매물 목록 | 기대한 리비전과 점검 회원, 정상 응답                                                                |
| 월세 조회                      | 법정동 코드에 맞는 정상 페이지. 기본 코드는 `1162010200`이며 `SMOKE_LEGAL_DONG_CODE`로 바꿀 수 있음 |
| 새 점검 매물·체크 항목 조회    | 새 매물의 이름·ID와 항목의 초기 두 버전 확인                                                        |
| 상태·메모                      | 같은 값 재시도는 버전 증가 없음, 오래된 변경은 400 충돌, 상태·메모와 두 버전이 서로 보존됨          |
| 사진                           | 1px PNG 업로드, 원본 바이트 일치, 썸네일 또는 기존 정책의 대체 원본 읽기                            |
| 삭제·오류 정리                 | 만든 사진·매물의 논리 삭제와 이후 404. 중간 실패 시 확인한 점검 매물만 정리                         |

월세가 비어 있는 정상 응답도 가능하므로, 수집본 교체 직후에는 아래 SQL과 적재 보고서로 기간·해시·건수·시세를 별도 확인한다.
점검 사진·DB 기록은 기존 보존 정책을 따른다. 스크립트가 파일을 즉시 파기하거나 실제 회원을 탈퇴시키지 않는다.
생성 응답이 유실돼 ID를 얻지 못하면 자동 재시도·일괄 삭제하지 않는다. 로그의 `run=reliability-...` 이름으로 전용 회원의 기록을 확인해 해당 점검 매물만 정리한다.

### 신뢰성 상태 확인

아래 조회는 개별 토큰·식별정보를 출력하지 않는다. 실행 시각과 집계 결과를 기록하고 배포 전 결과와 비교한다.

```sql
SELECT version, type, success FROM flyway_schema_history ORDER BY installed_rank;

SELECT COUNT(*) AS pending_unlinks, MIN(next_attempt_at) AS next_unlink_attempt
FROM oauth_unlink_requests;
SELECT COUNT(*) AS pending_photo_cleanup, MIN(next_attempt_at) AS next_photo_attempt
FROM photo_storage_cleanup_requests;

SELECT d.dataset_key, d.row_count, COUNT(t.id) AS actual_rows
FROM rental_datasets d
LEFT JOIN rental_transactions t ON t.dataset_key = d.dataset_key
GROUP BY d.dataset_key, d.row_count;
SELECT dataset_key, transaction_sha256, legal_dong_sha256, contract_from, contract_to, collected_at
FROM rental_datasets;
SELECT rent_start_date, rent_end_date, COUNT(*) AS priced_admin_dongs
FROM admin_dong_rents GROUP BY rent_start_date, rent_end_date;
```

미처리 행이 있다는 이유만으로 오류라고 판정하지 않는다. 각 작업의 다음 실행 시각, 실패 로그와 실제 재처리 여부를 함께 본다.
수집본 해시가 없는 잠금용 행은 미적재 상태다. 수집본이 있다면 메타데이터 건수·기간과 원본 보고서를 대조한다.
행정동 시세 캐시는 서버 기동 시 읽으므로 적재·복원 이후 모든 서버의 재시작 여부도 확인한다.

## 3. 중단·롤백 조건과 호환성

- 서비스 기동·Flyway 검증·health·SHA·전용 회원 점검 중 하나라도 실패하면 배포 완료로 판정하지 않는다.
- 잘못된 리비전, 오래된 체크 저장 허용, 사진 보존 위반, 거래·수집본·시세 불일치를 발견하면 변경 요청 차단을 유지하고 원인을 확인한다.
- 기존 CodePipeline의 자동 롤백은 코드 배포를 되돌릴 뿐 DB·S3·외부 OAuth 상태를 복구하지 않는다. 파이프라인 밖의 수동 배포에는 기존 자동 롤백이 적용되지 않는다.

| 변경               | 구버전 복귀 시 주의점                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| V21 선점 UUID      | 이전 작업자는 UUID 조건 없이 완료·재예약할 수 있다. 구·신 작업자를 겹쳐 실행하지 않는다.                    |
| V22 사진 보존·복구 | 이전 삭제 코드는 파일을 즉시 삭제할 수 있다. 보존 정책을 유지하는 호환 리비전이 필요하다.                   |
| V23 항목 버전      | 이전 코드는 추가 컬럼을 무시하고 오래된 요청도 저장할 수 있다. 기동 성공만으로 쓰기를 다시 허용하지 않는다. |

복귀 대상은 위 동작과 새 요청 계약을 유지하면서 장애만 피하는 리비전이어야 한다. 이미 적용한 V21~V23을 지우거나 이력을 수정하지 않는다.
첫 전환에서 자동 롤백으로 구버전이 올라오더라도 변경 요청·작업자 차단을 해제하지 않는다. 호환되는 수정 리비전을 준비하고 동일 점검을 통과한 뒤 재개한다.
기존 정상 SHA로 돌아왔다는 사실과 사용자 기능 복구 여부를 각각 기록한다.

## 4. 데이터 복구 절차

### 쓰기 중단과 원본 상태 확보

1. 공개 변경 요청, 모든 이전 프로세스의 작업자와 별도 적재 명령을 중단한다. 진행 중 트랜잭션이 끝났는지 확인하고 UTC 기준 장애 시각·복원 대상 시각을 기록한다.
2. 읽을 수 있는 원본 DB에서 삭제 표시, Outbox·정리 작업의 최신 상태, 항목 버전 상한과 AUTO_INCREMENT 값을 보호된 파일에 확보한다. 비밀 토큰을 일반 로그로 내보내지 않는다.
3. 원본을 덮어쓰지 않고 별도 DB에 복원한다. RDS PITR는 새 DB 인스턴스를 만들며, 가능한 시점은 실제 백업과 `LatestRestorableTime`으로 확인한다. [AWS RDS 시점 복원](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html).
4. 복구 인스턴스는 공개 서비스와 분리하고 Outbox·사진 정리·수집 작업을 끈다. DB와 파일을 확인하기 전에 작업자를 시작하지 않는다.

### 데이터·버전·식별자 확인

법정동·거래·수집본·연결표·시세, 회원·매물·체크 질문·상태·메모·사진 메타데이터를 복원 대상과 비교한다.
복원 지점 이후의 삭제·연결 해제 완료·12회 실패 후 정보 파기를 되살리지 않도록 원본의 최신 상태와 대조한다. 재시도 횟수나 선점 UUID를 임의로 초기화하지 않는다.

항목 버전이 과거로 돌아가면 이전 요청이 다시 유효해질 수 있다. 원본에서 변경 요청을 중단한 뒤 아래 상한을 기록한다.

```sql
SELECT COALESCE(MAX(status_version), 0) AS status_high_watermark,
       COALESCE(MAX(memo_version), 0) AS memo_high_watermark
FROM property_checklist_items;

SET SESSION information_schema_stats_expiry = 0;
SELECT TABLE_NAME, AUTO_INCREMENT
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND AUTO_INCREMENT IS NOT NULL;
```

**격리된 복구 DB에서만**, 원본에서 확보한 상한을 `@status_high_watermark`, `@memo_high_watermark`에 먼저 설정한 후 기존 항목의 버전을 상한보다 높인다.
상태와 메모는 바꾸지 않는다. 각 테이블의 AUTO_INCREMENT도 원본에서 확보한 값보다 작아지지 않게 조정해 과거 ID의 재사용을 막는다.

```sql
UPDATE property_checklist_items
SET status_version = GREATEST(status_version, @status_high_watermark + 1),
    memo_version = GREATEST(memo_version, @memo_high_watermark + 1);
```

AUTO_INCREMENT 조정은 원본에서 확보한 테이블별 값으로 `ALTER TABLE 테이블명 AUTO_INCREMENT = 확인값`을 검토해 적용한다.
원본 최신 상태·버전 상한·번호 상한을 확보할 수 없다면 이 절차만으로 자동 쓰기 재개를 승인하지 않는다. 복원 범위와 이전 요청·세션의 처리 방안을 별도로 결정한다.

### 파일·외부 작업과 재개

- 활성 사진의 원본·썸네일 키와 객체 존재를 확인한다. 개별 사진 논리 삭제는 보존 상태이므로 404가 정상이다. 매물·회원 삭제 후 90일 보관 정책과 파기 완료 상태를 함께 확인한다.
- S3에 이전 객체 버전·백업이 실제로 있을 때만 복구할 수 있다. 버전의 영구 삭제는 되돌릴 수 없고 DB 복원만으로 파일이 생기지 않는다. 복구가 허용된 객체만 확인한 이전 버전을 복사해 현재 버전으로 만든다. [AWS S3 이전 버전 복구](https://docs.aws.amazon.com/AmazonS3/latest/userguide/RestoringPreviousVersions.html).
- 복원된 Outbox의 외부 연결 해제는 이미 완료됐을 수 있다. 기존의 재호출 성공 처리·UUID 선점·12회 실패 정책을 유지한다. 파일 정리도 참조·보존 상태 확인을 마친 뒤 재개한다.
- 복구 DB에 호환 코드로 기동하고 health·리비전·전체 점검을 실행한다. 이전 버전 요청은 충돌하며, 재조회한 값으로 새 요청이 성공하는지 확인한다.
- 모든 서버의 DB 연결·시세 캐시 반영과 프론트엔드 계약을 확인한 뒤 변경 요청과 작업자를 재개한다. 원본 DB는 검증·복귀 판단이 끝날 때까지 보존한다.

## 5. 실제 검증과 남은 한계

2026-11-24 로컬의 일회용 MySQL 8.4.10·MinIO·합성 회원으로 검증했다.

- 기존 `validate.sh`에서 다른 commit 경로·하위 UP·잘못된 JSON·유효한 공백 JSON을 구분하지 못하는 실패를 재현했다. 구조 파싱 수정 후 10개 검사가 통과했다. Backend CI도 이 검사와 Bash 문법 검사를 실행하도록 연결했다.
- 실제 새 앱에서 전체 `smoke.sh`가 성공했다. 잘못된 SHA·회원 ID는 생성 전 거절됐고, 사진 DB 저장 오류를 주입하면 실패를 반환하면서 만든 점검 매물만 논리 삭제했다.
- 논리 삭제된 점검 사진 2개의 원본·썸네일 객체 4개가 실제 저장소에 남는 것을 확인했다. 이 수는 테스트 관찰값이며 운영 성과가 아니다.
- 초기 리비전 `1c8eb0583e24bb51c1b35d930a11e2792c5fed02`의 소스를 별도 디렉터리로 내보내 JAR를 빌드했다. V23까지 적용한 복제 DB에서 기동됐지만 오래된 상태 요청을 200으로 허용했다. 새 점검 스크립트는 이 API를 실패로 판정했다.
- 실제 적재 명령으로 합성 거래 5건과 시세를 만든 뒤 SQL 백업을 별도 DB에 복원해 거래·수집본·시세·체크 전체 행이 일치함을 확인했다. 항목 버전 상한과 21개 AUTO_INCREMENT 테이블의 기준값을 반영한 복구 앱은 이전 버전 요청을 400으로 거절하고, 새 번호의 생성과 전체 점검을 통과했다.
- 전체 백엔드 `testAll`: 217개 클래스, 1,983개 중 1,982개 성공, 실패·오류 0개, 기존 Bedrock 실호출 테스트 1개 생략. 프론트엔드 223개 파일, 1,487개 테스트 성공, lint·typecheck 통과.

실제 AWS의 백업 설정·권한·PITR·S3 객체 버전 복원, CodePipeline 자동 롤백과 장애조치 실행은 검증하지 않았다.
운영 RPO·RTO, 처리량·실패율 개선 수치는 측정하지 않았다. 저장소 밖 콘솔 설정·연락망·복구 승인 담당자는 운영자가 실제 값으로 채워야 한다.
이전 데이터의 미추적 파일, 장시간 지연된 업로드 등 범위별 한계는 [사진 저장소](photo-storage-reliability.md), [Outbox](oauth-unlink-reliability.md), [월세 교체](rental-import-reliability.md), [체크 저장](checklist-reliability.md) 기록을 함께 따른다.
