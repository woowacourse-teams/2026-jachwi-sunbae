# 테스트 전략

테스트 종류별 작성 기준을 정한다.

## Domain 단위 테스트

Domain 단위 테스트는 Spring과 외부 시스템 없이 순수 Java 객체로 실행한다.

- 비즈니스 규칙의 정상 및 예외를 검증한다

## Service 단위 테스트

기본은 실제 DB를 사용하는 통합 테스트다.
Service 단위 테스트는 Service의 분기와 협력 방식 자체가 중요한 경우에만 예외적으로 작성한다.

### 사용하는 경우

- Repository 응답에 따른 Service 분기를 검증할 때
- 외부 API 응답에 따른 후속 행동을 검증할 때
- 특정 조건에서 저장이나 외부 호출을 생략해야 할 때
- 실패 시 다른 협력이 호출되지 않아야 할 때
- 실제 DB 없이 Service 책임만 빠르게 검증할 가치가 있을 때

### 사용하지 않는 경우

- 실제 SQL의 정확성을 확인하려는 경우
- 트랜잭션과 롤백을 검증하려는 경우
- DB UNIQUE 제약을 검증하려는 경우
- 동시성을 검증하려는 경우
- Service가 단순히 Repository 메서드를 순서대로 호출하는 경우
- Mock 설정이 테스트 본문 대부분을 차지하는 경우

## Repository 슬라이스 테스트

순수 `JdbcTemplate`을 사용하므로 Repository 테스트에는 `@JdbcTest`를 사용한다. 실제 MySQL에 붙는 `@JdbcTest`는 `@MySqlJdbcTest`로 대신해 모든 Repository 테스트가 같은 슬라이스 컨텍스트를 함께 쓴다.

### 직접 작성한 핵심 SQL을 검증한다

`JdbcTemplate`에서는 SQL과 RowMapper를 직접 작성하므로 Repository 테스트의 가치가 크다.

**다음 내용을 선택으로 고려해서 검증한다.**

- SQL 문법
- 컬럼명
- Parameter Binding
- RowMapper
- Insert 후 생성 ID
- 결과가 없을 때 `Optional.empty()`
- 목록 결과가 없을 때 빈 List
- 정렬
- Filtering
- Pagination
- DB UNIQUE와 FK 제약
- 날짜와 시간 자료형
- 여러 조건 중 하나만 다른 경계값
- 반복 Query 발생 여부

Service 통합 테스트가 Repository를 사용하더라도 복잡한 SQL의 경계 조건까지 검증하지 않는다면 Repository 테스트를 별도로 작성한다.

## 통합 테스트

여러 계층과 실제 DB가 협력해 Use Case가 끝까지 동작하는지 검증할 때 `@SpringBootTest`를 사용한다. 공통 설정은 `IntegrationTest`를 상속해 받는다. 인수 테스트도 같은 클래스를 상속한다.

기본 `@SpringBootTest`는 Application Context를 로딩하지만 실제 서버를 시작하지 않는다. 실제 서버가 필요하면 `RANDOM_PORT`를 사용한다.

### 검증 대상

- Spring Bean 연결
- Service와 Repository 협력
- Command·Result 변환
- 실제 SQL과 DB 상태 변화
- Service 트랜잭션
- 여러 Repository가 참여하는 Use Case
- 외부 Client와의 통합

### 작성 기준

- 모든 Domain 경계값을 통합 테스트에서 반복하지 않는다.
- 핵심 Use Case의 정상 흐름과 대표 실패 흐름을 검증한다.
- 외부 API는 실제 운영 서버 대신 Stub Server를 사용한다.

## 인수 테스트

인수 테스트는 사용자 관점의 핵심 시나리오를 검증한다.

### 작성 대상 - 정책 문서기반

### 작성 기준

- 기술적인 클래스명보다 사용자 행동의 언어를 사용한다.
- 핵심 정상 시나리오와 중요한 실패 시나리오만 작성한다.
- HTTP 상태, Response Body, 오류 코드를 검증한다.
- 모든 Validation과 Domain 경계값을 인수 테스트에서 반복하지 않는다.
- 구현 내부의 Service나 Repository 호출 여부를 검증하지 않는다.

## DB를 쓰는 테스트의 공통 설정

실제 MySQL이 필요한 테스트는 [`support`](../../src/test/java/com/jachwisunbae/support/) 패키지의 공통 설정을 사용한다. 테스트 JVM 하나에서 MySQL 컨테이너는 하나만 띄우고, Spring 컨텍스트는 설정이 같은 테스트끼리 캐시에서 다시 쓴다.

| 테스트                       | 사용하는 설정                                 | 컨텍스트                       |
| ---------------------------- | --------------------------------------------- | ------------------------------ |
| 통합·인수 테스트             | `IntegrationTest` 상속                        | 설정이 같으면 하나를 함께 쓴다 |
| Repository 슬라이스 테스트   | `@MySqlJdbcTest`                              | 하나를 함께 쓴다               |
| Spring 없이 DB만 쓰는 테스트 | `MySqlTestContainer.get()`과 `@ResetDatabase` | 없음                           |

- 컨테이너는 `MySqlTestContainer`가 처음 쓰일 때 한 번 띄우고, JVM이 끝나면 Testcontainers가 정리한다. 테스트 클래스에 `@Container`나 `new MySQLContainer<>()`를 새로 선언하지 않는다.
- 접속 정보는 `MySqlContainerInitializer`가 넣는다. 테스트 클래스에서 `spring.datasource.*`를 `@DynamicPropertySource`로 다시 등록하지 않는다.
- 테스트 클래스가 시작하기 전에 `@ResetDatabase`가 이전 클래스가 남긴 행을 지우고, 마이그레이션이 넣은 기본 데이터(시스템 체크 항목)를 처음 상태로 되돌린다. 자동 증가 값도 다시 1부터 시작한다. 같은 클래스 안의 테스트끼리 데이터를 정리하는 책임은 지금처럼 각 테스트에 있다.
- CI처럼 테스트 JVM을 여러 개 띄우면 JVM마다 컨테이너가 하나씩 뜨므로 서로의 데이터를 건드리지 않는다. 한 JVM 안에서 테스트 클래스를 병렬로 실행하지 않는다.

### 컨텍스트를 갈라지게 만드는 설정

Spring은 테스트 설정이 조금이라도 다르면 컨텍스트를 새로 띄운다. 다음 설정을 테스트 클래스에 추가하면 그 클래스만을 위한 컨텍스트가 하나 더 생긴다.

- 클래스마다 다른 `@MockitoBean`, `@MockitoSpyBean`
- `@DynamicPropertySource`, `@TestPropertySource`, `@SpringBootTest(properties = ...)`
- `@Import`로 가져오는 테스트 전용 설정
- `@AutoConfigureMockMvc`의 옵션, `@ActiveProfiles`, `@DirtiesContext`

외부 시스템 빈(`PushSender`, `PhotoStorage`, `BedrockPropertyExtractor`, `PropertyAiUsageLimiter`)은 `IntegrationTest`가 항상 목으로 바꾸고, 호출을 확인하거나 일부만 바꿔야 하는 빈(`OAuthProviderClient`, `MemberIdentityRepository`, `Emart24PromotionFetcher`, `JdbcPropertyRepository`)은 스파이로 둔다. 하위 클래스는 같은 타입을 `@Autowired`로 받아 스텁한다. 목과 스파이는 테스트가 끝날 때마다 초기화된다. 새 목이 필요하면 하위 클래스가 아니라 `IntegrationTest`에 추가한다.

시간은 `IntegrationTest`가 등록한 `TestClock`으로 통제한다. 테스트마다 현재 시각으로 돌아가므로, 시각이 필요한 테스트는 `@BeforeEach`에서 `TestClock.set()`으로 고정하고 `advance()`로 앞당긴다. 테스트 전용 `Clock` 빈을 따로 등록하지 않는다.

테스트용 설정 값은 클래스마다 넣지 않고 [`application-test.yml`](../../src/test/resources/application-test.yml)에 둔다. 다음 테스트는 다른 테스트와 함께 쓸 수 없는 설정이 있어 컨텍스트를 따로 쓴다.

| 테스트                                                                | 따로 쓰는 이유                                    |
| --------------------------------------------------------------------- | ------------------------------------------------- |
| `AnonymousAuthenticationAcceptanceTest`                               | OAuth 제공자 설정 값                              |
| `NativeOAuthAcceptanceTest`                                           | 테스트용 공개 키 서버 주소                        |
| `CommuteRentAreaAcceptanceTest`, `CommuteStationDedupeAcceptanceTest` | 테스트마다 만든 행정동·GTFS 파일 경로             |
| `SevenElevenPromotionIntegrationTest`                                 | 세븐일레븐 수집 활성화와 세븐일레븐 클라이언트 목 |

테스트 실행 시간과 컨텍스트 수를 확인하는 방법은 [테스트 성능 측정](../guides/test-performance.md)을 따른다.
