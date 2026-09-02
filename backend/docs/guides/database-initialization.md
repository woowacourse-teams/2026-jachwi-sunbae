# 데이터베이스 초기화와 업그레이드

- 문서 성격: 파생
- 대조 대상: `backend/src/main/resources/db/migration/`, `backend/src/main/resources/application.yml`, `backend/compose.yaml`, 테스트 설정

애플리케이션은 Flyway가 관리하는 버전 마이그레이션만 실행한다. 새 DB는 전체 버전을 순서대로 적용하고, 기존 DB는 `integrated_schema_history`에 기준선을 기록한 뒤 기준선 이후 버전만 적용한다. 결정 배경은 [ADR-0013](../adr/0013-use-flyway-for-integrated-schema.md)에 기록한다.

## 정본

| 파일 | 책임 |
| --- | --- |
| `db/migration/V1__baseline_mvp2_schema.sql` | 현재 애플리케이션이 사용하는 기준 스키마 |
| `db/migration/V2__seed_mvp2_reference_data.sql` | 시스템 체크 항목과 다섯 가지 매물 부가정보 기준 데이터 |
| `db/migration/V3__expand_integrated_schema.sql` | 통합 컬럼·테이블·소프트 삭제·조회 인덱스 확장 |
| `db/migration/V4__backfill_integrated_schema.sql` | 기존 회원·주소·메모 데이터를 새 구조로 복사하고 변환 실패를 기록 |
| `db/init/`, `db/upgrade/` | 이전 실행 경로와 테스트 호환을 위한 보관 파일. 기본 프로필에서는 실행하지 않음 |

Flyway 이력 테이블은 `integrated_schema_history`를 사용한다. 팀 RDS에 남아 있는 과거 `flyway_schema_history`는 변경하지 않는다. 이미 애플리케이션 테이블이 있는 DB에서 첫 기동하면 `baseline-on-migrate`가 버전 1을 기준선으로 기록하고 V2 이후를 적용한다.

## 로컬 새 DB 초기화

`docker compose up -d`는 MySQL만 기동한다. 스키마와 기준 데이터는 백엔드가 기동할 때 Flyway로 적용한다.

보존할 데이터가 없는 로컬 DB를 현재 스키마로 다시 만들 때만 다음을 실행한다.

```bash
docker compose down
docker compose down -v
docker compose up -d
./gradlew bootRun
```

`docker compose down -v`는 로컬 MySQL과 MinIO 볼륨의 데이터를 모두 삭제한다. 보존할 데이터가 없는지 먼저 확인한다.

## 기존 DB 업그레이드

Flyway는 애플리케이션이 요청을 받기 전에 마이그레이션을 실행한다. 체크섬이 바뀌거나 하나라도 실패하면 기동을 중단한다. 운영 DB에는 `clean`이나 자동 down migration을 실행하지 않는다.

V3은 기존 코드가 읽는 레거시 컬럼을 즉시 제거하지 않고 통합 구조를 먼저 확장한다. V4는 다음 원칙으로 기존 데이터를 보존한다.

- 회원 자격정보가 이미 있으면 닉네임·식별 key·BCrypt hash를 그대로 `members`에 복사한다. 자격정보가 없는 회원을 비밀번호 없는 계정으로 자동 전환하지 않는다.
- 주소는 기존 도로명 주소를 우선하고, 없으면 지번 주소를 `properties.address`에 복사한다.
- 매물마다 `property_details` 행을 만들고 입주 가능일·관리비·방문 일정·확인한 곳을 구조화한다. 방 옵션과 포함 공과금은 허용된 코드만 연결 테이블에 저장한다.
- 변환할 수 없는 구조화 메모 값은 NULL로 두고 `migration_backfill_failures`에 원문과 사유를 남긴다. 자유 메모는 기존 `property_memos.free_memo`를 그대로 유지한다.

`LEGACY_DATABASE_UPGRADE_ENABLED=true`를 명시한 테스트에서만 이전 `DatabaseUpgradeInitializer`를 실행할 수 있다. 운영과 기본 테스트 프로필에서는 이 호환 경로가 등록되지 않는다.

## 스키마 변경 절차

1. 새 버전 파일을 `db/migration/V<번호>__<설명>.sql` 형식으로 추가한다. 이미 배포한 파일은 수정·삭제·이름 변경하지 않는다.
2. 새 DB와 기준선 이후의 기존 DB 모두에서 적용될 수 있도록 DDL과 backfill 경계를 분리한다.
3. 운영 적용 전에 논리 백업과 복원 리허설을 수행하고, 실패 시 애플리케이션 기동이 중단되는지 확인한다.
4. Testcontainers MySQL에서 전체 버전 적용, 재기동 시 pending 없음, 기존 데이터 backfill과 실패 목록을 검증한다.
5. 백엔드 테스트와 `python3 .github/scripts/check_docs.py`를 실행한다.

테스트 프로필은 빈 Testcontainers MySQL에 Flyway V1~V4를 적용한다. 별도 호환 테스트만 `LEGACY_DATABASE_UPGRADE_ENABLED=true`를 켜서 이전 `DatabaseUpgradeInitializer`를 검증하며, 기본 데이터베이스 테스트는 Flyway 이력과 pending 상태를 확인한다.

## 운영 주의사항

운영 데이터가 있는 DB에서 `docker compose down -v`, `flyway clean`, init SQL 재실행을 하지 않는다. 마이그레이션은 순방향으로만 진행하며 컬럼·테이블 제거는 API 전환과 데이터 검증이 끝난 별도 버전에서 수행한다. 여러 인스턴스가 동시에 기동해도 Flyway 잠금이 한 번만 적용하도록 보장하지만, 장시간 DDL은 배포 전에 실행 시간을 측정한다.
