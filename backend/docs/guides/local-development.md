# 로컬 개발

## 1. 준비물

| 항목           | 기준                                       |
|----------------|--------------------------------------------|
| JDK            | Java 21                                    |
| Docker         | MySQL·MinIO 컨테이너를 실행할 수 있는 버전 |
| Node.js        | `frontend/.nvmrc`와 같은 버전              |
| Git            | GitHub 저장소를 복제할 수 있는 버전        |
| HTTP 확인 도구 | `curl` 또는 브라우저                       |

Gradle은 별도로 설치하지 않는다. 저장소의 Gradle Wrapper를 사용한다.

## 2. 환경변수 준비

`backend`에서 개인 환경변수 파일을 만든다.

```bash
cp .env.example .env
```

기본 예시는 외부 키가 필요 없는 닉네임 인증·`demo` 지도와 로컬 MinIO 값을 포함한다. `.env`는 Git에 커밋하지 않는다.

## 3. 로컬 인프라 실행

`backend`에서 실행한다.

```bash
docker compose up -d
docker compose ps
```

MySQL과 MinIO가 healthy여야 한다. 빈 MySQL 볼륨은 [초기화 SQL](../../src/main/resources/db/init/)로 자동 초기화된다. 초기화 SQL은 기존 볼륨에 다시 적용되지
않으며, 볼륨을 삭제하면 로컬 데이터도 사라진다.

## 4. 백엔드 실행

`backend`에서 실행한다.

```bash
set -a
source .env
set +a
./gradlew bootRun
```

IntelliJ IDEA에서 애플리케이션이나 Gradle 작업을 직접 실행하면 `.env`가 자동으로 주입되지 않는다. 이 경우 Run Configuration의 환경변수에 `.env`와 같은 값을 설정하거나 위
터미널 명령으로 실행한다.

로컬 CORS는 `CORS_ALLOWED_ORIGINS=http://localhost:3000`을 사용한다.

| 확인 항목    | 주소                                          |
|--------------|-----------------------------------------------|
| 서버 상태    | `http://localhost:8080/actuator/health`       |
| Swagger UI   | `http://localhost:8080/swagger-ui/index.html` |
| OpenAPI JSON | `http://localhost:8080/v3/api-docs`           |

```bash
curl --fail http://localhost:8080/actuator/health
curl --fail http://localhost:8080/v3/api-docs
```

두 요청이 성공해야 한다. 실제 API 계약은 구현에서 생성되는 Swagger/OpenAPI로 확인한다.

## 5. 프론트엔드 실행

별도 터미널의 `frontend`에서 실행한다.

```bash
npm ci
cp .env.example .env.local
set -a
source .env.local
set +a
npm run dev
```

브라우저에서 `http://localhost:3000`을 열고 닉네임을 입력한다. 비밀번호를 비우면 같은 닉네임을 입력한 사람이 기록을 함께 사용할 수 있고, 처음 사용할 때 비밀번호를 입력하면 이후 같은 비밀번호가
필요하다. 빈 데이터베이스에서는 최초 로그인 시 회원이 생성되며 매물은 직접 등록한다.

실제 네이버 지도를 확인할 때는 백엔드와 프론트엔드의 지도 공급자 모드를 `naver`로 바꾸고 인증 정보를 설정한다. Client Secret은 백엔드에만 설정한다.

실제 주변 시설을 확인할 때는 백엔드 `.env`에 `MAP_NEARBY_PROVIDER=kakao`와 `KAKAO_REST_API_KEY`를 설정하고 백엔드를 다시 실행한다.
`MAP_NEARBY_PROVIDER`가 없으면 `demo` 주변 시설이 반환된다.    
Kakao Developers 앱에 허용 IP를 설정했다면 현재 PC의 공인 IP를 등록해야 한다.    
등록하지 않으면 주변 시설 조회가 503으로 실패하고 서버 로그에 `ip mismatched`가 남는다.

## 6. 검사

```bash
./gradlew test --no-daemon
```

프론트엔드는 변경 범위에 맞춰 `npm run build`를 실행하고, 필요에 따라 타입·린트·포맷·테스트를 확인한다.

## 7. 확인 목록

- [ ] `./gradlew bootRun`으로 애플리케이션이 실행된다.
- [ ] Actuator health가 `UP`을 응답한다.
- [ ] Swagger UI와 OpenAPI JSON에 접근할 수 있다.
- [ ] Docker MySQL과 MinIO가 healthy다.
- [ ] `./gradlew test --no-daemon`이 성공한다.
- [ ] 프론트엔드가 백엔드 `/api` 요청을 보낼 수 있다.
- [ ] 닉네임으로 시작한 뒤 매물·사진·메모·체크리스트·2~5개 매물 비교 PDF·지도 흐름이 동작한다.
