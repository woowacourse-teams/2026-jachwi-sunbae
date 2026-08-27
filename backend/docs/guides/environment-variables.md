# 환경변수

- 문서 성격: 파생
- 대조 대상: `backend/.env.example`

## 관리 원칙

Spring Boot 애플리케이션은 CORS 허용 Origin과 인증·저장소 설정을 환경변수로 주입받는다. 아래 값 중 로컬 인프라용 값은 Docker Compose에서 사용하고, 애플리케이션 설정에 연결된 값은 실행 환경에 맞게 제공한다.

- 예시와 기본값은 `backend/.env.example`에 기록하고 Git에 커밋한다.
- 개인 값은 `backend/.env`에 기록하며 Git에 커밋하지 않는다.
- 실제 비밀번호, 토큰과 운영 비밀값은 문서, 코드, 예시 파일에 기록하지 않는다.
- 환경변수를 추가하거나 이름을 변경하면 애플리케이션 설정, Compose, `.env.example`과 이 문서를 같은 PR에서 수정한다.

## 로컬 인프라용 환경변수

| 환경변수 | 로컬 기본값 | 용도 |
| --- | --- | --- |
| `DB_HOST` | `localhost` | MySQL 호스트 |
| `DB_PORT` | `3306` | MySQL 포트 |
| `DB_NAME` | `jachwi_sunbae` | 데이터베이스 이름 |
| `DB_USERNAME` | `jachwi_sunbae` | 애플리케이션 계정 |
| `DB_PASSWORD` | `local_password` | 애플리케이션 계정 비밀번호 |
| `DB_ROOT_PASSWORD` | `local_root_password` | 로컬 MySQL root 비밀번호 |
| `DB_SSL_MODE` | `DISABLED` | 운영 JDBC TLS 모드. 로컬 프로필은 별도 설정을 사용한다 |
| `JWT_SECRET_BASE64` | Base64 인코딩한 32바이트 이상 값 | HS256 서명 비밀값. 운영에서는 환경별 무작위 값을 사용한다 |
| `DEMO_MEMBER_NAME` | `이자취` | 데모 회원 표시 이름 |
| `DEMO_SEED_ENABLED` | `true` | 데모 매물·메모·체크 상태 초기화 여부 |
| `NICKNAME_AUTH_MAX_FAILURES` | `5` | 보호 닉네임의 제한 시간 내 최대 인증 실패 횟수 |
| `NICKNAME_AUTH_FAILURE_WINDOW_SECONDS` | `600` | 닉네임별 인증 실패 제한 시간(초) |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | 쉼표로 구분한 프론트엔드 Origin 허용 목록 |
| `PHOTO_STORAGE_ENDPOINT` | `http://localhost:9000` | S3 호환 객체 저장소 API endpoint. 정적 자격증명으로 접속하는 환경에서만 쓴다 |
| `PHOTO_STORAGE_REGION` | `us-east-1` | S3 서명에 사용하는 region |
| `PHOTO_STORAGE_BUCKET` | `jachwi-sunbae-photos` | 로컬 MinIO 사진 객체 bucket |
| `PHOTO_STORAGE_KEY_PREFIX` | 비움 | 객체 key 앞에 붙일 경로. 버킷을 다른 팀과 공유할 때 사용하며 로컬은 전용 버킷이라 비운다 |
| `PHOTO_STORAGE_ACCESS_KEY` | 로컬 전용 예시 값 | 객체 저장소 access key. 정적 자격증명으로 접속하는 환경에서만 쓴다 |
| `PHOTO_STORAGE_SECRET_KEY` | 로컬 전용 예시 값 | 객체 저장소 secret key. 정적 자격증명으로 접속하는 환경에서만 쓴다 |
| `PHOTO_STORAGE_PORT` | `9000` | 로컬 MinIO API 포트 |
| `PHOTO_STORAGE_CONSOLE_PORT` | `9001` | 로컬 MinIO 관리 화면 포트 |
| `MAP_PROVIDER_MODE` | `demo` | `demo` 또는 `kakao` 지도·주소 adapter 선택 |
| `KAKAO_REST_API_KEY` | 비움 | `kakao` 모드의 서버 전용 Local REST API 키 |
| `BUS_STOP_PROVIDER` | `none` | `none` 또는 `tago` 버스정류소 adapter 선택 |
| `DATA_GO_KR_SERVICE_KEY` | 비움 | `tago` 모드의 공공데이터포털 일반 인증키(Decoding) |
| `MAP_CACHE_TTL_SECONDS` | `600` | 주변 시설 응답 cache TTL(초) |
| `MAP_CONNECT_TIMEOUT_MILLIS` | `2000` | 지도 외부 공급자 연결 제한 시간 |
| `MAP_READ_TIMEOUT_MILLIS` | `5000` | 지도 외부 공급자 응답 제한 시간 |
| `DEPLOYMENT_ENVIRONMENT` | `local` | 구조화 로그의 실행 환경. EC2에서는 `dev` 또는 `prod`를 사용한다 |
| `LOG_PATH` | `./logs` | `prod` 프로필에서 JSON 로그 파일을 저장할 디렉터리 |

## 사용 방법

`backend`에서 개인 파일을 생성한다.

```bash
cp .env.example .env
```

Docker Compose는 같은 디렉터리의 `.env`를 자동으로 읽는다. Spring Boot를 직접 실행할 때는 셸 또는 실행 환경에 필요한 값을 주입한다.

## dev·prod 프로필

dev와 prod EC2는 모두 `SPRING_PROFILES_ACTIVE=prod`로 기동하며 `/etc/jachwi-sunbae/app.env`에서 환경변수를 읽는다. 애플리케이션은 80 포트를 직접 사용한다. 실제 값은 환경마다 분리하고 파일 권한은 `root:root`, `0600`으로 유지한다.

| 설정 | dev | prod |
| --- | --- | --- |
| `CORS_ALLOWED_ORIGINS` | `https://dev.jachwi-sunbae.kr` | `https://www.jachwi-sunbae.kr` |
| `PHOTO_STORAGE_REGION` | `ap-northeast-2` | `ap-northeast-2` |
| `PHOTO_STORAGE_BUCKET` | `techcourse-project-2026` | `techcourse-project-2026` |
| `PHOTO_STORAGE_KEY_PREFIX` | `jachwi-sunbae/photos-dev/` | `jachwi-sunbae/photos/` |
| `DEMO_SEED_ENABLED` | `false` | `false` |
| `MAP_PROVIDER_MODE` | `kakao` | `kakao` |
| `DEPLOYMENT_ENVIRONMENT` | `dev` | `prod` |
| `LOG_PATH` | `/var/log/jachwi-sunbae` | `/var/log/jachwi-sunbae` |

DB 접속값과 `JWT_SECRET_BASE64`, `KAKAO_REST_API_KEY`는 환경별 실제 값이 필요하다. 버스정류소를 켜면 `BUS_STOP_PROVIDER=tago`와 공공데이터포털 일반 인증키의 Decoding 값인 `DATA_GO_KR_SERVICE_KEY`도 넣는다. 활용 승인이 끝나기 전에는 `BUS_STOP_PROVIDER=none`으로 배포해 병원·학교·편의점·중개업소와 지하철 결과를 먼저 사용한다.

AWS S3는 EC2 `ec2-project` instance role로 접근하므로 `PHOTO_STORAGE_ENDPOINT`, `PHOTO_STORAGE_ACCESS_KEY`, `PHOTO_STORAGE_SECRET_KEY`를 EC2에 두지 않는다. 이 세 값은 로컬 MinIO에만 사용한다. 프론트엔드에는 공개 Kakao JavaScript 키만 빌드 타임에 주입한다.

첫 MVP2 기동은 기존 팀 DB에 `db/upgrade/*.sql`을 적용한다. 애플리케이션 DB 계정은 이 전환 동안 필요한 `ALTER`, `CREATE`, `INDEX`, `SELECT`, `INSERT`, `UPDATE` 권한을 가져야 한다. 전환 전에 자동 백업의 최신 복구 지점을 확인한다.

새 환경변수를 도입할 때 [배포 아키텍처](../../../docs/operations/deployment-architecture.md)와 [백엔드 배포](../operations/deployment.md)를 함께 갱신한다.

닉네임 인증은 외부 키가 필요 없다. 지도 기본 모드를 `demo`로 두면 외부 키 없이 전체 로컬 흐름을 실행할 수 있다.

실제 비밀값은 `.env.example`, 애플리케이션 설정, 문서와 Git에 커밋하지 않는다.
