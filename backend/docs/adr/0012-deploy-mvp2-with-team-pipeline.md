# ADR-0012: MVP2를 팀 AWS 네이티브 파이프라인으로 배포한다

- 상태: 승인
- 결정일: 2026-08-26
- 참여자: 자취선배 팀
- 문서 성격: 시점 고정(부분)
- 갱신 정책: 맥락·결정·근거·검토한 대안은 고정한다. 결과와 재검토 조건만 갱신한다
- 대체하는 결정: [ADR-0010](0010-prepare-single-ec2-deployment.md)
- 재채택하는 결정: [ADR-0008](0008-deploy-with-aws-native-pipeline.md)
- 확장하는 결정: [ADR-0011](0011-apply-idempotent-database-upgrades.md)

## 맥락

개인 저장소에서 완성하고 검증한 MVP2 전체를 팀 저장소로 이전한다. 개인 환경은 단일 EC2와 GitHub Actions OIDC·SSM 배포를 사용했지만, 팀 AWS 계정에는 이미 `develop`과 `main`을 각각 dev와 prod로 배포하는 CodePipeline·CodeDeploy·RDS·S3·CloudFront 구성이 있다. 팀 계정은 새 IAM role과 액세스 키 생성을 허용하지 않으며, 기존 MVP1 RDS에는 보존해야 할 데이터와 Flyway V11까지의 스키마가 있다.

MVP2는 닉네임 인증, 주소·좌표, 사진, 체크리스트, 지도와 비교 PDF를 위해 MVP1보다 넓은 스키마와 빌드 설정을 요구한다. 기능 코드를 그대로 옮기되 개인 AWS 구성을 유지하면 팀 인프라의 권한·도메인·배포 트리거와 충돌하고, 새 스키마만 적용하면 기존 데이터를 잃는다.

## 결정

- 팀 저장소에서는 [ADR-0008](0008-deploy-with-aws-native-pipeline.md)의 AWS 네이티브 배포를 다시 현재 결정으로 사용한다. `develop`은 dev, `main`은 prod 파이프라인이 자동 배포한다.
- 개인 환경의 Caddy·Docker MySQL·GitHub Actions OIDC·SSM 릴리스 파일은 이전하지 않는다. 백엔드는 기존 CodeDeploy와 systemd, 프론트엔드는 기존 S3·CloudFront 파이프라인을 사용한다.
- 백엔드는 팀 보안 그룹 계약에 맞춰 `prod` 프로필에서 80 포트를 사용한다. 비밀은 환경별 EC2의 `/etc/jachwi-sunbae/app.env`에 둔다.
- 프론트엔드 `Commands` 빌드는 환경별 `API_BASE_URL`, `MAP_PROVIDER_MODE=kakao`, `KAKAO_MAP_JAVASCRIPT_KEY`를 주입한다.
- 사진은 공유 버킷 `techcourse-project-2026`에서 환경별 접두사로 분리하고 EC2 인스턴스 role로 접근한다. 정적 액세스 키를 두지 않는다.
- 새 DB는 현재 init SQL로 만들고, 기존 팀 MVP1 RDS는 `db/upgrade/003-adapt-team-mvp1-schema.sql`을 포함한 멱등 upgrade를 애플리케이션 시작 시 적용한다. 기존 `flyway_schema_history`는 삭제하지 않지만 새 코드가 읽거나 갱신하지 않는다.
- 첫 dev 배포 전에 논리 백업을 확인하고 애플리케이션 DB 계정에 이번 additive DDL을 실행할 권한이 있는지 검증한다. dev 검증 뒤에만 prod 전환을 별도 작업으로 진행한다.

## 근거

- 이미 검증된 팀 배포 경로를 쓰면 새 IAM 권한이나 AWS 자원을 만들지 않고 보호 브랜치와 자동 롤백을 그대로 활용할 수 있다.
- RDS·S3를 환경별 이름과 접두사로 나누면 관리형 자원을 추가하지 않고도 dev 실험이 prod 데이터와 섞이는 것을 막는다.
- MVP1 V11 형태를 재현하는 Testcontainers 테스트에서 upgrade를 두 번 실행해 스키마 보강과 반복 안전성을 함께 검증할 수 있다.
- `flyway_schema_history`를 보존하면 과거 이력을 훼손하지 않으며, Flyway를 다시 도입하지 않는 MVP2 결정도 유지한다.

## 검토한 대안

| 대안 | 장점 | 선택하지 않은 이유 |
| --- | --- | --- |
| 개인 AWS의 단일 EC2 구성을 그대로 이전 | 이미 동작한 구성을 재사용한다 | 팀 계정의 IAM·네트워크·도메인·배포 규칙과 충돌한다 |
| 팀 RDS의 dev 스키마를 초기화 | 전환이 단순하다 | 기존 dev 기록을 잃고 스키마 전환을 검증할 기회를 없앤다 |
| Flyway V12로만 전환 | 적용 이력이 표준화된다 | MVP2가 이미 선택한 단일 init+멱등 upgrade 경계를 다시 설계해야 한다 |
| 새 RDS와 새 S3 버킷을 만든다 | 환경 격리가 강하다 | 예산과 삭제 권한 제약이 있고 기존 팀 구성을 중복한다 |
| GitHub Actions에서 AWS로 직접 배포 | 워크플로가 저장소에 남는다 | 팀 계정에서 새 OIDC role을 만들 수 없다 |

## 결과와 트레이드오프

- 병합 후 배포 방식은 팀원이 이미 사용하던 흐름과 같고, MVP2 기능만 추가된다.
- 첫 MVP2 기동에는 애플리케이션 DB 계정의 additive DDL 권한이 필요하다.
- 실행 이력을 별도 테이블에 남기지 않으므로 모든 upgrade SQL은 계속 반복 안전해야 한다.
- 프론트 빌드 변수가 AWS 콘솔의 `Commands` 액션에 있어 코드 리뷰만으로 실제 값을 확인할 수 없다. 파이프라인 변경 시 배포 문서를 함께 갱신한다.
- dev와 prod가 RDS·ALB·S3를 공유하므로 환경별 DB 이름, JWT 비밀과 S3 접두사를 잘못 설정하면 격리가 깨진다.

## 검증 방법

- 팀 MVP1 스키마 형태의 Testcontainers DB에 upgrade를 두 번 적용하고 회원·매물 데이터 보존, 신규 컬럼·제약과 시드를 확인한다.
- 전체 백엔드 테스트와 프론트엔드 test·lint·typecheck·build, 문서 검사를 통과시킨다.
- `develop` 병합 뒤 dev 백엔드의 health와 build SHA, 프론트 번들 갱신을 확인한다.
- dev에서 닉네임 인증, 매물 CRUD, 사진 업로드·조회, 단계별 체크, Kakao 지도와 비교 PDF를 모바일 화면으로 검증한다.

## 재검토 조건

- upgrade가 누적되어 실행 이력과 동시 실행 잠금이 필요해진다.
- dev 부하나 데이터가 prod RDS·S3에 영향을 주기 시작한다.
- 팀 전용 IAM·비밀 저장소나 독립 AWS 계정을 사용할 수 있게 된다.
- 무중단 배포나 다중 인스턴스가 필요해진다.
