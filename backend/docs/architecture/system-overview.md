# 시스템 개요

- 상태: MVP2 구현·공개 환경 운영 중
- 문서 성격: 파생
- 대조 대상: 실제 백엔드·프론트엔드 구성 요소, [배포 아키텍처](../../../docs/operations/deployment-architecture.md)

## 현재 경계

```text
사용자 브라우저
  ↓
React SPA
  ↓ JSON + Bearer Access Token
Spring Boot
  ├─ 닉네임·선택 비밀번호 인증 + 자체 JWT
  ├─ 회원·매물·사진·메모·체크리스트 API
  ├─ demo·Naver 지도 및 NAVER API HUB adapter + 선택적 TAGO 버스정류소 adapter
  ├─ Spring JDBC → MySQL 8.4
  ├─ S3 API → 로컬 MinIO 또는 운영 비공개 S3
  ├─ Actuator health/info
  └─ Swagger/OpenAPI
```

인증은 로컬과 운영 모두 외부 키 없이 닉네임과 선택 비밀번호를 사용하며 성공하면 자체 JWT Access Token을 발급한다. 비밀번호 없는 닉네임은 같은 닉네임 사용자와 기록을 공유하고, 보호 닉네임은 BCrypt hash로 확인한다. 지도 로컬 기본은 `demo`, 운영은 프론트 Naver Maps JavaScript SDK와 백엔드 Naver Maps·NAVER API HUB를 사용하고, 설정하면 TAGO 실제 버스정류소를 교통 결과에 합친다.

회원 ID를 기준으로 주소·좌표를 포함한 매물, 구조화 메모와 단계별 체크리스트 스냅샷을 MySQL에 저장한다. 사진 메타데이터는 DB, 바이트는 비공개 객체 저장소에 두고 소유자 검증 백엔드 endpoint로만 조회한다. 새 DB 스키마 정본과 기존 DB의 순방향 보강 절차는 [데이터베이스 초기화](../guides/database-initialization.md)를 따른다.

API의 실행 계약은 구현에서 생성되는 Swagger/OpenAPI를 우선 확인한다. 제품 요구사항은 [MVP2 기능 명세](../../../docs/product/specs/README.md), 스키마 설명은 [MVP2 데이터 모델](mvp2-data-model.md), 외부 지도 전환은 [지도 연동](../guides/map-integration.md)을 따른다.

팀 AWS에서는 프론트엔드를 S3·CloudFront, 백엔드를 ALB 뒤 EC2·systemd로 운영하고 RDS MySQL과 공유 S3의 환경별 접두사를 사용한다. `develop`과 `main` 병합은 각각 dev와 prod CodePipeline·CodeDeploy를 시작한다. 상세 구성과 운영 제한은 [배포 아키텍처](../../../docs/operations/deployment-architecture.md)를 따른다.
