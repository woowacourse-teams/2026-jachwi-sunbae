# 데이터베이스 초기화와 업그레이드

- 문서 성격: 파생
- 대조 대상: `backend/src/main/resources/db/init/`, `backend/src/main/resources/db/upgrade/`, `backend/compose.yaml`, 테스트 설정

MVP2는 Flyway를 다시 도입하지 않는다. 새 MySQL은 현재 스키마 한 벌로 초기화하고, 실제 데이터가 있는 기존 MySQL은 번호가 붙은 멱등 SQL을 애플리케이션 시작 시 순서대로 적용한다. 결정 배경은 [ADR-0009](../adr/0009-use-disposable-database-schema.md)와 운영 데이터가 생긴 뒤의 보강 결정을 기록한 [ADR-0011](../adr/0011-apply-idempotent-database-upgrades.md)을 따른다.

## 정본

| 파일 | 책임 |
| --- | --- |
| `db/init/001-schema.sql` | 새 DB가 즉시 사용할 현재 테이블·인덱스·제약 |
| `db/init/002-seed.sql` | 새 DB에 필요한 시스템 기본 항목 |
| `db/upgrade/NNN-*.sql` | 기존 사용자 데이터를 보존하는 순방향·멱등 보강 |

과거 Flyway SQL은 현재 실행 경로에서 관리하지 않는다. 팀 RDS의 기존 `flyway_schema_history`는 과거 적용 기록으로 보존하며 새 애플리케이션은 읽거나 갱신하지 않는다. MVP1 당시의 변경 과정은 Git 이력에서 확인한다.

## 로컬 새 DB 초기화

`docker compose up -d`는 MySQL 데이터 볼륨이 비어 있을 때만 `/docker-entrypoint-initdb.d`의 두 init 파일을 실행한다. 이미 만들어진 볼륨에서는 init SQL을 바꿔도 다시 실행하지 않는다.

보존할 데이터가 없는 로컬 DB를 현재 스키마로 다시 만들 때만 다음을 실행한다.

```bash
docker compose down
docker compose down -v
docker compose up -d
```

`docker compose down -v`는 로컬 MySQL과 MinIO 볼륨의 데이터를 모두 삭제한다. 보존할 데이터가 없는지 먼저 확인한다.

## 기존 DB 업그레이드

Spring Boot의 `DatabaseUpgradeInitializer`는 요청을 받기 전에 `db/upgrade/*.sql`을 파일명 순서로 실행한다. 각 SQL은 매번 실행될 수 있으므로 테이블·인덱스 생성과 데이터 보강이 반복되어도 결과가 같아야 하며 기존 비밀번호나 사용자 데이터를 덮어쓰면 안 된다. 실패하면 애플리케이션 시작도 실패해 새 코드가 불완전한 스키마에서 요청을 받지 않는다.

`004-property-comparison-view-events.sql`은 기존 회원·매물을 변경하지 않고 비교 화면 진입 이벤트 테이블만 추가한다. 새 테이블이 이미 있으면 다시 만들지 않는다.

닉네임 인증 전환의 `001-nickname-credentials.sql`과 초기화 코드는 다음만 수행한다.

- 자격정보 테이블이 없으면 만든다.
- 초기화 코드가 기존 회원 중 자격정보가 없는 행만 NFKC 정규화한 보호되지 않은 닉네임으로 보강한다.
- 같은 정규화 표시 이름이나 이미 사용 중인 닉네임은 내부 회원 ID suffix로 분리한다.
- 이미 생성된 닉네임과 비밀번호 hash는 바꾸지 않는다.

체크리스트 문항 전환의 `002-custom-checklist-items.sql`은 다음을 수행한다. 파일명과 nullable 컬럼은 이전 버전에서 저장한 직접 질문과 스냅샷을 지우지 않기 위한 호환 경계이며 현재 API는 새 직접 질문을 허용하지 않는다.

- 사용자·매물 체크 항목의 `system_check_item_id`를 nullable로 유지해 이전 직접 질문을 보존한다.
- 이전 제공 문항 18개는 FK와 기존 스냅샷을 위해 삭제하지 않고 최초 실행 시각으로 비활성화한다.
- 현재 제공 문항 53개를 고정 ID로 upsert하며 반복 실행에서도 활성 상태와 문구를 같은 값으로 유지한다.
- 기존 사용자 체크리스트와 매물의 질문·상태·메모 스냅샷은 수정하지 않는다.

팀 MVP1 RDS 전환의 `003-adapt-team-mvp1-schema.sql`은 다음을 수행한다.

- 회원 최근 로그인 시각과 매물의 주소·좌표·최근 활동 컬럼을 추가하고 기존 행을 보강한다.
- MVP1의 nullable 핵심 매물 값을 현재 기본값으로 정규화한다.
- `property_memo_items.system_meno_id` 오타 컬럼을 현재 이름으로 바꾸고 최신 기본 메모 항목을 등록한다.
- 매물당 대표 사진 하나, 대표 사진의 소유 매물 일치와 위도·경도 범위 제약을 DB에서 보장한다. 기존 관계가 이 계약을 위반하면 행을 자동 삭제하지 않고 기동을 실패시킨다.
- 기존 회원·매물·사진·메모·체크 상태와 `flyway_schema_history`는 삭제하지 않는다.

2단계 체크리스트 개편의 `006-remove-online-phone-and-structured-memos.sql`은 다음을 수행한다.

- `ONLINE_PHONE` 단계의 매물 체크 항목·매물 체크리스트·사용자 체크 항목·사용자 체크리스트·회원 최근 선택·시스템 체크 항목을 삭제한다. `002-custom-checklist-items.sql`이 매번 3단계 문항 53개를 다시 upsert하므로, 이 스크립트가 그 뒤 번호로 실행되어 `ONLINE_PHONE` 문항을 매 시작마다 다시 제거한다.
- 더 이상 쓰지 않는 `property_memo_items`, `system_memo_items` 테이블을 DROP한다.
- `system_check_items`, `user_checklists`, `member_checklist_preferences`, `property_checklists`의 단계 CHECK 제약을 `ON_SITE`, `PRE_CONTRACT` 둘로 축소한다.

## 스키마 변경 절차

1. 새 DB용 `001-schema.sql`을 코드가 기대하는 최종 상태로 수정한다.
2. 기존 데이터가 있는 DB에도 필요한 변경이면 다음 번호의 `db/upgrade/NNN-*.sql`을 추가한다. 배포된 upgrade 파일은 수정하지 않는다.
3. 시스템 기본 항목이 바뀌면 `002-seed.sql`과 기존 DB 보강 필요 여부를 각각 검토한다.
4. upgrade SQL을 기존 형태의 Testcontainers DB에 두 번 적용해 멱등성과 데이터 보존을 확인한다. 팀 RDS 변경은 `TeamMvp1DatabaseUpgradeIntegrationTest`가 Flyway V11 형태를 재현한다.
5. 백엔드 전체 테스트와 관련 문서 검사를 실행한다.
6. 운영 적용 전 MySQL 논리 백업과 복원 가능 여부를 확인한다.

테스트 프로필은 빈 Testcontainers MySQL에 init 파일을 적용한 뒤 애플리케이션 시작 upgrade도 실행한다. 별도 데이터베이스 테스트가 레거시 회원이 있는 상태의 반복 실행을 검증한다.

## 운영 주의사항

운영 데이터가 생긴 뒤에는 `001-schema.sql`을 기존 DB에 다시 실행하거나 볼륨을 초기화하지 않는다. upgrade는 additive 변경과 작은 멱등 데이터 보강에만 사용한다. 테이블 대규모 재작성, 장시간 잠금, 하위 호환이 깨지는 변경이나 여러 인스턴스 동시 배포가 필요해지면 Flyway 같은 전용 마이그레이션 도구를 다시 검토한다.
