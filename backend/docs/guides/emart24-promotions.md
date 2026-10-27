# 이마트24 행사상품 수집·저장·조회

공식 [행사상품 페이지](https://emart24.co.kr/goods/event)의 공개 상품명·판매가격·이미지 URL·카테고리·행사 유형을 `PromotionProduct`로 변환한다. 이미지는 다운로드하지 않는다.

## 로컬 실행

Java 21을 사용하고 `backend`에서 실행한다. 기존 수집·출력 명령에는 Spring 애플리케이션, DB, 환경변수 설정이 필요하지 않다. 아래 Gradle 작업은 명시적으로 실행할 때만 외부 서버에 요청한다. 일반 `test`, `build`에서는 수집하지 않으며 자동 수집 설정도 기본 비활성화다.

먼저 간편식사 첫 페이지를 한 번만 요청한다.

```bash
cd backend
./gradlew collectEmart24Promotions --args='--sample'
```

HTTP 200, 추출한 카드 수, 응답의 전체 상품 수와 공통 객체의 필드를 확인한 다음 네 카테고리의 첫 페이지를 확인한다.

```bash
./gradlew collectEmart24Promotions --args='--sample-all'
```

전체 페이지 수집은 별도로 실행한다. 카테고리별 수집 수·전체 수·중복 후보 수와 분류별 샘플 상품을 출력한다. 샘플 모드는 요청한 첫 페이지의 상품만 집계하므로 전체 수집 수와 구분해야 한다.

```bash
./gradlew collectEmart24Promotions --args='--all'
```

모드를 생략하거나 잘못 지정하면 네트워크 요청 전에 실패한다. 첫 요청 이후에는 이전 응답 완료부터 다음 요청까지 최소 1초를 기다리며 카테고리가 바뀌어도 같은 간격을 적용한다. 동시에 여러 프로세스로 실행하지 않는다. 운영 수집 빈도는 하루 1회 이하로 계획한다. 이 명령은 수집 결과를 출력하며 DB를 수정하지 않는다. 저장과 스케줄 실행은 아래의 별도 경로에서 담당한다.

## 요청과 공식 분류

```text
GET https://emart24.co.kr/goods/event?page=1&base_category_seq=1
```

`page`는 1부터 시작한다. `base_category_seq`를 모든 페이지 요청에 유지한다. `category_seq`는 혜택 필터이며 생략하면 모든 혜택을 조회한다. 수집에서는 카테고리별 전체 혜택을 한 번씩 조회하고 카드 배지에서 행사 유형을 읽는다.

| 화면 카테고리 | `base_category_seq` | 공통 `ProductCategory` |
| ------------- | ------------------- | ---------------------- |
| 간편식사      | 1                   | `MEAL`                 |
| 과자          | 2                   | `SNACK`                |
| 음료          | 5                   | `BEVERAGE`             |
| 생활용품      | 3                   | `HOUSEHOLD_GOODS`      |

| 화면 혜택 | `category_seq` | 공통 `PromotionType` |
| --------- | -------------- | -------------------- |
| 1+1       | 1              | `ONE_PLUS_ONE`       |
| 2+1       | 2              | `TWO_PLUS_ONE`       |
| 3+1       | 3              | `THREE_PLUS_ONE`     |
| 세일      | 4              | `SALE`               |
| 골라담기  | 12             | `PICK_AND_MIX`       |

두 매핑은 공식 화면의 필터 링크에서 확인했다. 숫자 코드는 제공자 내부에서만 사용하고, `전체`는 상품 분류에 넣지 않는다. 다른 브랜드는 공통 브랜드 enum에만 정의하며 실제 수집 구현은 이마트24 하나다.

## HTML 해석과 실패 기준

일반 HTTP 응답에 상품 카드와 페이지 메타데이터가 포함된다. RestClient로 받은 문자열을 Jsoup으로 해석하며 JavaScript를 실행하지 않는다. Jsoup 버전은 [공식 배포 안내](https://jsoup.org/)를 확인해 지정했다.

| 대상        | 실제 응답에서 확인한 요소                                                              | 처리                                                    |
| ----------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 상품 목록   | `section.itemList div.itemWrap`                                                        | 응답의 페이지 크기·전체 수와 카드 수를 대조             |
| 상품명      | `.itemtitle p a`                                                                       | 연속 공백과 줄바꿈을 정리                               |
| 판매가격    | `.itemTxtWrap .price`                                                                  | 원화 정수 형식과 범위를 검증                            |
| 정상가      | `.priceOff`                                                                            | 수집 가격에서 제외                                      |
| 이미지      | `.itemSpImg img[src]`                                                                  | `src`가 비어 있지 않은지 확인한 후 절대 HTTP URL로 변환 |
| 행사 유형   | `.itemTit .floatR`                                                                     | 배지의 공백을 제거하고 다섯 유형만 허용                 |
| 페이지      | 인라인 스크립트의 `page`, `baseCategorySeq`, `categorySeq`, `pageLength`, `totalCount` | 요청과 응답의 페이지·분류·혜택 및 수량을 검증           |
| 다음 페이지 | `.pageNationWrap .next a`                                                              | 메타데이터의 마지막 페이지 여부와 대조                  |

실제 정상가·판매가격 동시 표시 사례는 `선명)원더풀피스타치오가염150g`의 `.priceOff` 9,980원과 `.price` 7,980원이다. 숫자의 위치에 의존하지 않고 `.price`만 선택한다. 이미지의 실제 속성은 `src`이며 검증되지 않은 `data-src` 대체 규칙은 추가하지 않았다.

서버 HTML의 페이지 링크는 `base_category_seq`를 누락한다. 마지막 페이지에서 숫자 페이지 목록이 비어 있는 경우도 확인했다. 따라서 링크를 그대로 따라가거나 숫자 목록만으로 종료하지 않고, 페이지 번호와 분류를 직접 만들어 요청한다.

빈 카테고리의 실제 응답(`base_category_seq=3&category_seq=3`)은 목록과 페이저를 유지하고 `pageLength`, `totalCount`를 모두 `null`로 표시했다. 요청한 페이지·분류·전체 혜택이 맞고 목록이 비어 있으며 다음 링크가 없는 첫 페이지에서만 이 형태를 정상 빈 결과로 인정한다. 필수 요소·메타데이터가 없거나 전체 수가 양수인데 카드가 없으면 파싱 실패다. 검색어로 조회했을 때의 별도 빈 화면은 수집 대상에 포함하지 않는다.

카테고리당 최대 100페이지를 허용한다. 제한에 도달했는데 다음 페이지가 있거나, 도중에 전체 수가 바뀌거나, 누적 수집 수가 전체 수와 다르면 실패한다. 일부 카드·요청 실패를 무시하지 않으며 이미 수집한 일부 목록도 성공 결과로 반환하지 않는다. HTTP 403·429·리다이렉트를 포함해 200 외 상태는 재시도·우회 없이 중단한다. 연결 제한은 3초, 응답 제한은 15초다.

## 테스트

HTML fixture와 `MockRestServiceServer`, mock 클라이언트를 사용하며 테스트에서 이마트24 서버에 접근하지 않는다.

```bash
./gradlew test --tests 'com.jachwisunbae.promotion.*' \
  --tests 'com.jachwisunbae.weather.provider.kma.*' \
  --tests 'com.jachwisunbae.map.provider.*' \
  --tests 'com.jachwisunbae.common.exception.errorcode.*'
./gradlew clean build --no-daemon
```

기존 테스트 중 DB 통합 테스트에는 Docker가 필요하다. Fixture는 실제 상품 카드 구조를 축약하고 페이지·수량·상품명을 테스트 목적에 맞게 치환한다. 원본 전체 HTML이나 이미지를 저장하지 않는다.

DB 저장 확장 전인 2026-10-27 최초 수집 구현 검증에서는 로컬 `clean build`의 기본 빌드 대상 1,096개 테스트가 실패·오류·생략 없이 통과했다. 당시 신규 행사상품 테스트는 78개이며, 위 패키지 범위에 해당하는 행사상품·기존 공급자·공통 오류 코드 테스트는 전체 빌드에서 440개 통과했다. 해당 최초 검증에서는 별도 `testAll` 인수 테스트 작업을 실행하지 않았다. DB 저장·스케줄링 확장 검증은 아래에 구분해 기록한다.

문서 변경 후 저장소 루트에서 실행한다.

```bash
npm run format:docs
git diff
npm run format:docs:check
```

## 실제 검증 기록

2026-10-27(KST)에 공식 HTML과 네 분류의 첫 페이지, 간편식사 마지막 페이지 및 빈 카테고리 응답을 확인했다. Java 명령을 `--sample` → `--sample-all` → `--all` 순서로 실행했고 모두 성공했다. 샘플은 각각 20개와 80개였고, 전체 수집은 한 번 실행했다.

| 카테고리 | 수집 페이지 수 | 변환한 상품 수 |
| -------- | -------------- | -------------- |
| 간편식사 | 30             | 593            |
| 과자     | 20             | 384            |
| 음료     | 64             | 1,280          |
| 생활용품 | 14             | 270            |
| 합계     | 128            | 2,527          |

전체 실행은 약 2분 45초 걸렸다. 각 카테고리의 응답에 표시된 전체 수와 실제 누적 객체 수가 일치했다. 모든 필드가 같은 반복 항목은 첫 출현을 제외하고 190건이었고, 서로 다른 모든 필드 조합은 2,337개였다. 카테고리 외 필드가 같은 분류 간 중복 후보는 0그룹이었다. 원본 사이트의 중복 등록인지 페이지 조회 사이의 정렬 변화인지는 확인하지 못했으며, 이를 확인하려고 전체 수집을 반복하지 않았다. 2,527개는 원본 분류별 조회 결과의 합이며 고유 상품 수로 해석하지 않는다.

Java 객체로 변환한 샘플:

```text
brand=EMART24
name=질러)볼케이노육포30g
price=4200
imageUrl=https://msave.emart24.co.kr/cmsbo/upload/nHq/plu_image/500x500/8801005632201.JPG
category=MEAL
promotionType=TWO_PLUS_ONE
```

검증 중 빈 `src`에 `absUrl`을 적용하면 기준 페이지 URL이 반환될 수 있음을 발견해, 변환 전에 `src`의 빈 값을 거부하도록 보완했다. 단위 테스트는 이런 결손을 정상 상품으로 허용하지 않는다.

## 구현 경계와 후속 고려 사항

- `promotion/domain`: 공통 불변 상품 모델, 분류·혜택·브랜드.
- `PromotionFetcher`: 전체 수집 결과를 공통 모델 목록으로 제공하는 최소 경계.
- `provider/emart24`: 외부 코드 매핑, HTTP 요청, 순수 HTML 파싱, 페이지 순회와 수동 명령.
- `service/PromotionCollectionService`: 전체 수집, 정확히 같은 항목의 중복 제거, 저장 요청과 단일 Service의 중복 실행 제어.
- `repository/JdbcPromotionProductRepository`: 브랜드별 트랜잭션 교체, 저장 결과 조회와 마지막 정상 수집 시각 조회.
- `collector/PromotionCollectionScheduler`: 설정이 활성화된 경우 매일 한국시간 오전 4시에 Service 호출.
- `controller/PromotionController`와 `service/PromotionQueryService`: 저장된 브랜드별 전체 목록 조회와 응답 DTO 변환. 수집·저장 경로를 호출하지 않는다.
- 공통 예외의 `PROMOTION_PROVIDER_UNAVAILABLE`은 통신·HTTP 실패, `PROMOTION_RESPONSE_INVALID`는 수집 응답 구조·데이터 실패를 구분한다. 조회 API의 입력·인증·서버 오류는 기존 공통 오류 처리와 Swagger 계약을 따른다.

```text
promotion/
├── domain/                  기존 공통 모델·enum
├── provider/
│   ├── PromotionFetcher
│   └── emart24/             기존 HTTP·파서·전체 페이지 수집·출력 명령
├── service/
│   ├── PromotionCollectionService
│   ├── PromotionQueryService
│   └── dto/result/PromotionProductsResult
├── controller/
│   ├── PromotionController
│   └── dto/response/         PromotionProductsResponse, PromotionProductResponse
├── repository/
│   └── JdbcPromotionProductRepository
└── collector/
    └── PromotionCollectionScheduler
```

기존 수집·출력 명령과 Provider는 중복을 포함한 원본을 유지한다. 저장할 때는 Service가 `PromotionProduct` record의 모든 필드가 같은 경우만 제거한다. 브랜드·상품명·가격·이미지 URL·분류·행사 유형 중 하나라도 다르면 같은 항목으로 합치지 않는다. `LinkedHashSet`으로 첫 수집 순서를 보존하고 `rawCount`, `duplicateCount`, `uniqueCount`를 실제 목록에서 계산한다. 상품명만으로 중복 제거하지 않는다.

후속 DB 저장 실험은 사용자 조사에서 확인한 동일 행사 중복 노출과 위의 전체 필드 중복 제거 정책을 기준으로 한다. 190건은 과거 관찰값이며 코드의 고정값이 아니다. 영구 상품 식별자는 아직 없고 `id`는 교체 때 바뀌는 내부 행 번호다. 수집 결과는 브랜드 차원의 공개 행사 정보이며 매장별 재고·판매 여부를 보장하지 않는다.

## DB 저장 구조

최신 마이그레이션 V5를 확인하고 `V6__create_promotion_products.sql`을 추가했다. V1–V5는 수정하지 않는다. `promotion_products`는 브랜드별 최신 목록만 저장하며 이력 테이블이나 영구 상품 ID를 추가하지 않는다.

하루 약 2천 건 규모의 최신 목록이며 원본에서 사라진 행사도 반영해야 하므로 브랜드 전체 교체를 선택했다. Upsert에 필요한 영구 상품 식별·삭제 추적 정책을 추가하지 않고도 한 번의 트랜잭션으로 완성된 목록을 반영할 수 있다.

| 컬럼             | 형식                        | 의미                                |
| ---------------- | --------------------------- | ----------------------------------- |
| `id`             | `BIGINT AUTO_INCREMENT`, PK | 내부 행 번호                        |
| `brand`          | `VARCHAR(20)`               | `ConvenienceBrand` enum 이름        |
| `name`           | `VARCHAR(255)`              | 정리된 상품명                       |
| `price`          | `INT`, 0 이상 CHECK         | 원 단위 판매가격                    |
| `image_url`      | `VARCHAR(2048)`             | 공개 이미지의 절대 URL              |
| `category`       | `VARCHAR(30)`               | `ProductCategory` enum 이름         |
| `promotion_type` | `VARCHAR(30)`               | `PromotionType` enum 이름           |
| `collected_at`   | `DATETIME(6)`               | 전체 수집 후 저장에 전달한 KST 시각 |

모든 컬럼은 NOT NULL이다. InnoDB와 기존 utf8mb4 설정을 사용하고, 브랜드별 조회·삭제와 분류 집계를 위해 `(brand, category)` 인덱스를 둔다. 전체 필드의 긴 문자열에 DB 유일 인덱스를 만들지 않고 Service에서 정확한 record 동등성으로 중복 제거한다. 필드가 DB 길이 제한을 벗어나면 잘라서 저장하지 않고 저장 전체가 실패한다.

```text
PromotionFetcher.fetch()                 전체 HTTP 요청·파싱, 트랜잭션 밖
    ↓ 전체 수집 성공
PromotionCollectionService.collect()     빈 목록·브랜드 검증, 전체 필드 중복 제거
    ↓ Spring Bean 사이 호출
JdbcPromotionProductRepository.replaceByBrand()
    BEGIN
    DELETE FROM promotion_products WHERE brand = 'EMART24'
    Batch INSERT (배치 크기 1000)
    COMMIT
```

Service의 `@Transactional(propagation = NOT_SUPPORTED)`는 호출자 트랜잭션도 HTTP 수집 동안 중단한다. 별도 Repository Bean의 공개 `replaceByBrand()`에 `@Transactional`을 적용하므로 Spring 프록시가 실제로 삭제·모든 배치 삽입·커밋을 묶는다. 기존 날씨 Repository의 패턴을 재사용해 별도의 저장 전용 Service나 DTO를 추가하지 않았다.

전체 수집이 실패하거나 결과가 비어 있으면 Repository를 호출하지 않는다. Repository도 빈 목록·다른 브랜드가 섞인 교체 요청을 거부한다. 삭제는 브랜드 조건을 가진 DML이며 `TRUNCATE`를 사용하지 않는다. 같은 목록을 다시 저장해도 누적되지 않고 다른 브랜드는 보존된다. Insert 또는 커밋이 실패하면 예외가 전파되고 이전 정상 목록과 수집 시각을 유지한다. 성공 로그는 Repository 프록시의 커밋이 끝난 뒤에만 남긴다.

`findByBrand()`는 저장 순서대로 공통 모델을 반환하고 `findLastCollectedAt()`은 해당 브랜드의 `MAX(collected_at)`을 조회한다. 최초 저장 전에는 시각이 없고, 실패한 수집에서는 값이 바뀌지 않는다. 이 시각은 정상 반영된 목록의 수집 시각이며 마지막 실패 시도를 뜻하지 않는다.

## 하루 1회 자동 수집

```yaml
promotion:
  collection:
    enabled: false
```

기본 설정은 false이며 `application-dev.yml`, `application-prod.yml`도 변경하지 않았다. `PromotionCollectionScheduler`는 `@ConditionalOnProperty`로 true일 때만 등록하고, 기존 `WeatherSchedulingConfig`의 Servlet 애플리케이션용 `@EnableScheduling`을 재사용한다. 별도 스케줄링 설정이나 시작 즉시 수집하는 Runner는 추가하지 않는다.

로컬 앱에서 자동 실행을 학습하려면 연결 대상이 로컬 DB임을 먼저 확인하고 다음처럼 명시적으로 활성화한다. 이 작업에서는 이 명령을 실행하지 않았다. 기동 직후가 아니라 다음 오전 4시(KST)에 실행한다.

```bash
./gradlew bootRun --args='--spring.profiles.active=local --promotion.collection.enabled=true'
```

등록한 스케줄은 `@Scheduled(cron = "0 0 4 * * *", zone = "Asia/Seoul")`이다. 실패하면 Service는 실패 유형을 기록하고 예외를 전파한다. Scheduler는 경고를 남기며 다음 날 실행을 유지하고 즉시 재시도하지 않는다. 테스트에서는 실제 등록된 작업의 Runnable을 직접 실행하므로 오전 4시까지 기다리거나 외부 HTTP에 접근하지 않는다.

공유된 Service Bean의 `AtomicBoolean`은 수집과 저장이 끝날 때까지 겹치는 호출을 건너뛴다. 성공·실패 모두 `finally`에서 해제한다. 이 보호는 한 애플리케이션 인스턴스의 같은 Service에만 적용되며 **여러 JVM·인스턴스·별도 수동 명령 간 중복 실행을 보장하지 않는다.** 여러 인스턴스에서 flag를 켜면 각각 수집할 수 있다. 현재 분산 잠금·Quartz·Redis 등을 추가하지 않았으므로 자동 수집은 한 인스턴스에서만 활성화해야 한다.

## 로컬 MySQL 저장 확인

기존 `.env`나 dev/prod DB 설정을 읽는 앱 전체 기동 대신, 개발용 test classpath의 명령이 새 MySQL 8.4.10 컨테이너를 만들고 필요한 Bean만 등록한다. 이 선택으로 DB URL·프로필·`DB_*` 환경변수가 저장 대상을 바꿀 수 없게 했다. 원격 Docker 호스트도 거부하며 기존 컨테이너를 재사용하지 않는다. 로컬 Docker가 필요하다.

외부 사이트 요청 없이 fixture로 실행한다.

```bash
./gradlew storeEmart24PromotionsLocally --args='--fixture'
```

명령은 Flyway V1–V6를 적용한 새 `promotion_local` DB에서 실제 Service와 트랜잭션 Repository를 사용한다. 중복 제거 통계, 이전·신규 건수, 분류별 건수와 마지막 정상 수집 시각을 출력하고 실제 SQL 집계로 비교한다. 자동 스케줄러는 등록하지 않는다. 명령이 끝나면 컨테이너와 데이터는 삭제되므로 기존 로컬 앱의 MySQL 데이터를 바꾸지 않는다. 유지되는 앱 DB 저장은 동일 Repository를 사용하는 위의 Service·Scheduler가 담당한다.

외부 데이터를 새로 수집해 이 일회용 DB에 저장하는 명령도 별도로 제공한다. 이미 당일 수집 결과를 검증했다면 반복 실행하지 않는다.

```bash
./gradlew storeEmart24PromotionsLocally --args='--live'
```

`--fixture`와 `--live` 중 하나만 허용하고 모드 생략·추가 DB URL·프로필 옵션은 Docker 시작 전에 거부한다. 기존 `collectEmart24Promotions`의 세 실행 모드는 그대로 유지한다.

앱의 로컬 DB에서 직접 확인할 때 사용할 조회:

```sql
SELECT brand, COUNT(*) AS product_count, MAX(collected_at) AS last_collected_at
FROM promotion_products
GROUP BY brand;

SELECT category, COUNT(*) AS product_count
FROM promotion_products
WHERE brand = 'EMART24'
GROUP BY category;
```

### 실제 로컬 DB 검증 기록

2026-10-27에 `storeEmart24PromotionsLocally --args='--fixture'`를 실행했다. 학습용 fixture 7건에서 동일 항목 1건을 제거해 MySQL에 6건을 커밋했다. DB 집계는 간편식사 1건·과자 1건·음료 3건·생활용품 1건으로 저장 요청과 일치했다.

```text
rawCount=7 duplicateCount=1 uniqueCount=6
previousCount=0 storedCount=6
collectedAt=2026-10-27T14:14:47.603436 (KST)
실제 SQL 집계: brand=EMART24, product_count=6
```

이 수량은 실제 사이트의 전체 상품 수가 아닌 명시적인 fixture 검증 결과다. 당일 앞서 수행한 2,527건 수집 이력이 있고 전체 객체 목록은 파일로 보관하지 않았으므로 `--live`로 전체 재수집하지 않았다.

### 저장·스케줄링 테스트

```bash
./gradlew test --tests 'com.jachwisunbae.promotion.*'
./gradlew clean build --no-daemon
./gradlew testAll --no-daemon
```

- Service: 전체 필드 중복 제거·순서·같은 이름의 다른 혜택/가격 유지, 빈 결과·수집 실패 시 저장 금지, 통계·실패 로그, 실행 중 중복 호출 방지와 실패 후 해제.
- MySQL 통합: 여러 배치 저장·조회·분류 집계·반복 교체·다른 브랜드 보존, 두 번째 배치가 실패했을 때 이전 행의 ID·내용·수집 시각까지 복원, 호출자 트랜잭션 중단과 독립 저장, V5→V6 업그레이드.
- Scheduler: 기본·local·dev·prod 비활성화, 활성화 시 실제 작업 등록과 Service 호출, KST 매일 4시 cron, 예외 이후 다음 실행 허용.
- 로컬 명령: 모드 생략과 DB URL·프로필 입력 거부. 일반 테스트는 실제 이마트24에 요청하지 않는다.

트랜잭션 검증은 mock만으로 판단하지 않는다. Spring 컨텍스트가 만든 실제 프록시와 Testcontainers MySQL을 사용하고 `rewriteBatchedStatements`의 false/true 두 경우 모두 첫 1000개 Insert 이후 다음 배치를 실패시켜 전체 롤백을 확인한다. 기존 마이그레이션 통합 테스트의 최신 버전 기대값도 V6로 갱신했다.

2026-10-27 확장 검증 결과:

| 실행                      | 테스트 수 | 실패·오류·생략 |
| ------------------------- | --------- | -------------- |
| 행사상품 패키지 선택 실행 | 106       | 모두 0         |
| `clean build --no-daemon` | 1,124     | 모두 0         |
| `testAll --no-daemon`     | 1,180     | 모두 0         |

이번 확장에서 추가한 테스트는 28개다. 기존 행사상품 테스트 78개를 유지했고, 루트 문서 포맷팅·검사와 Git diff 검사를 수행했다. 실제 dev/prod DB를 사용하거나 애플리케이션 자동 수집을 활성화하지 않았다.

## 남은 한계

- 현재 동일성은 전체 필드 조합이다. 제공자별 영구 식별자, 행사 기간과 가격 변경 이력이 필요해지면 별도 정책과 저장 구조를 설계해야 한다.
- 실제 사이트 전체 결과를 DB에 넣는 `--live` 경로는 이번에 재실행하지 않았다. 기존 실제 HTTP 파싱 검증과 새 fixture 기반 저장 검증을 구분한다.
- 단일 인스턴스 실행 중 중복만 막는다. 다중 인스턴스의 잠금·실행 이력·장애 복구와 실패 알림은 후속 범위다.
- 정상적으로 파싱되는 대폭 감소를 탐지하는 최소 상품 수 정책은 없다. 현재는 전체 수집 완료와 비어 있지 않은 결과만 저장하며 구조·페이지 수량 오류는 기존 파서가 거부한다.

## 행사상품 전체 조회 API

프론트엔드 프로토타입에서 사용할 브랜드별 전체 목록을 반환한다. 요청할 때 외부 이마트24에 접근하거나 새 수집·중복 제거·저장을 실행하지 않는다. 이미 DB에 저장된 결과만 읽으며 Repository의 `findByBrand()`와 `findLastCollectedAt()`을 재사용한다.

```http
GET /api/promotions?brand=EMART24
Authorization: Bearer <ACCESS_TOKEN>
Accept: application/json
```

| Query Parameter | 필수 | 값                                                          |
| --------------- | ---- | ----------------------------------------------------------- |
| `brand`         | 예   | `EMART24`, `CU`, `GS25`, `SEVEN_ELEVEN` 중 대문자 enum 이름 |

페이지네이션·검색·필터·정렬 파라미터는 없다. 해당 브랜드의 전체 목록을 기존 `id` 오름차순, 즉 저장 순서로 반환하며 조회 시 다시 중복 제거하지 않는다. 같은 이름의 다른 가격·행사 유형도 그대로 반환한다.

학습용 fixture 상품 2건을 조회했을 때의 응답 예시:

```json
{
  "code": "SUCCESS",
  "message": "요청이 성공했습니다.",
  "data": {
    "brand": "EMART24",
    "count": 2,
    "collectedAt": "2026-10-27T14:14:47+09:00",
    "products": [
      {
        "name": "먼저 저장한 상품",
        "price": 3000,
        "imageUrl": "https://example.com/product.jpg",
        "category": "MEAL",
        "promotionType": "ONE_PLUS_ONE"
      },
      {
        "name": "다음 상품",
        "price": 3000,
        "imageUrl": "https://example.com/product.jpg",
        "category": "MEAL",
        "promotionType": "ONE_PLUS_ONE"
      }
    ]
  }
}
```

`count`는 실제 반환하는 `products.size()`로 계산한다. 상품별 응답은 이름·가격·이미지 URL·분류·행사 유형의 5개 필드이며 내부 DB `id`를 영구 상품 식별자로 노출하지 않는다. 공통 브랜드는 상위 `brand`에 한 번 표시한다. 도메인 객체는 전용 Response DTO로 변환한다.

DB의 `collected_at`은 이미 KST를 표현하는 `LocalDateTime`이므로 응답에서 시계값을 이동하지 않고 `+09:00`을 붙여 `OffsetDateTime`으로 반환한다. 예를 들어 DB의 `14:14:47`은 `14:14:47+09:00`이며 `23:14:47+09:00`으로 바뀌지 않는다. 마이크로초가 있으면 그대로 직렬화한다. 프론트엔드는 ISO 8601 시각으로 해석하고 임의로 9시간을 더하지 않는다.

`PromotionQueryService`는 읽기 전용 `REPEATABLE_READ` 트랜잭션에서 목록과 수집 시각을 조회한다. 두 SELECT 사이에 새 수집 결과가 커밋되더라도 응답의 목록과 시각이 같은 스냅샷에 속하도록 한다. Service는 도메인 목록·KST 시각을 Result로 조합하고 Controller에서 응답 필드와 오프셋 시각으로 변환한다.

### 인증과 빈 결과

기존 `JwtAuthenticationFilter`를 그대로 사용하며 이 API도 JWT가 필요하다. 인증 예외 경로를 추가하지 않았다. 프론트엔드는 기존 `apiRequest()`의 익명 로그인·토큰 발급 및 갱신 흐름을 사용한다.

지원하는 enum이지만 저장된 상품이 없는 브랜드는 오류가 아닌 200 응답이다.

```json
{
  "code": "SUCCESS",
  "message": "요청이 성공했습니다.",
  "data": {
    "brand": "CU",
    "count": 0,
    "collectedAt": null,
    "products": []
  }
}
```

잘못된 브랜드·대소문자·필수 파라미터 누락은 400 `INVALID_REQUEST`, 토큰 누락·유효하지 않은 토큰은 401 `ACCESS_TOKEN_INVALID`를 반환한다. 실제 DB 조회 실패는 기존 전역 처리의 500 `INTERNAL_SERVER_ERROR`로 전파한다. 테이블이 없거나 DB가 끊긴 상황을 미수집 빈 목록으로 바꾸지 않는다.

### 로컬에서 조회 확인

앱이 사용하는 로컬 DB에 V6가 적용되고 데이터가 적재되어 있어야 실제 상품이 반환된다. 위의 일회용 `storeEmart24PromotionsLocally` 명령은 앱 DB를 채우지 않는다. 수집 이력의 2,337건이 현재 앱 DB에 저장되어 있다고 가정하지 말고 앞의 SQL로 실제 행과 마지막 수집 시각을 확인한다.

로컬 앱에서 익명 로그인 응답의 `data.accessToken`을 얻어 조회한다.

```bash
curl -X POST 'http://localhost:8080/api/auth/login'
curl -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  'http://localhost:8080/api/promotions?brand=EMART24'
```

Swagger UI는 로컬 앱의 `/swagger-ui/index.html`에서 확인한다. `Promotions`의 전체 조회 API에서 필수 brand enum, 200·400·401·500 응답과 `bearerAuth` 요구사항을 확인하고 Authorize에 토큰을 입력한다. 실제 계약은 `/v3/api-docs`에 게시한다.

앱 DB를 수정하거나 외부 수집하지 않고 HTTP→QueryService→MySQL 전체 흐름을 검증하려면 다음 테스트를 실행한다.

```bash
./gradlew test --tests 'com.jachwisunbae.promotion.service.PromotionQueryServiceTest' \
  --tests 'com.jachwisunbae.promotion.controller.PromotionApiIntegrationTest'
```

테스트는 새 Testcontainers MySQL에 fixture를 저장하고 실제 JWT 필터와 익명 로그인·MockMvc·Swagger·시간대 직렬화를 검증한다. 수집 Service와 HTTP Client 대역에 호출이 없음을 확인한다. DB 오류를 숨기지 않는지, 전체 교체가 두 조회 사이에 완료되어도 이전 목록과 이전 시각이 함께 반환되는지도 검증한다.

### 응답 크기·조회 시간 측정

기존 로컬 앱 MySQL에 `promotion_products` 테이블이 없어 실상품 전체 데이터를 사용한 측정은 하지 않았다. 기존 DB를 마이그레이션하거나 실제 사이트를 다시 수집하지 않고, 별도 MySQL의 6건·2,337건 합성 fixture를 사용해 조회·직렬화·전체 반환을 확인한다. 이 값은 실제 이마트24 상품 전체의 응답 크기나 운영 성능을 보장하지 않는다.

측정은 `PromotionApiIntegrationTest.measuresLocalFixtureResponse`에서 수행한다. `queryMillis`는 Service 프록시의 두 DB 조회와 Result 조합, `serializationMillis`는 DTO의 Jackson 직렬화, `jsonBytes`는 `ApiResponse` 전체의 UTF-8 바이트 수다. 로컬 단일 측정이며 HTTP 네트워크 전송 시간은 포함하지 않는다. 임의의 캐시·압축·쿼리 최적화는 추가하지 않는다.

2026-10-27 정상 통과한 `clean build`에서의 단일 측정값이다. 테스트 컨텍스트의 Repository spy 비용도 포함한다.

| 합성 fixture 건수 | JSON 바이트 | 조회(ms) | 직렬화(ms) |
| ----------------- | ----------- | -------- | ---------- |
| 6                 | 972         | 8.440    | 0.451      |
| 2,337             | 326,225     | 25.767   | 15.967     |

### 조회 API 검증 결과

2026-10-27에 신규 조회 테스트 25개를 추가했다. 정상·빈 결과·잘못된 입력·JWT·시간대 직렬화·DB 실패·스냅샷 일관성과 OpenAPI 계약을 검증한다.

| 실행                                   | 테스트 수 | 실패·오류·생략 |
| -------------------------------------- | --------- | -------------- |
| 신규 QueryService·API 테스트 선택 실행 | 25        | 모두 0         |
| `clean build --no-daemon`              | 1,149     | 모두 0         |
| `testAll --no-daemon`                  | 1,205     | 모두 0         |

기존 수집·저장·스케줄러·JWT 필터·Repository SQL·DB 스키마는 수정하지 않았다. 조회 계층·DTO·테스트와 이 가이드만 변경했다. 문서 포맷팅과 Git diff 검사를 수행하고 변경 사항은 `test-con`의 로컬 작업 트리에 남긴다.

### 이후 dev 반영 시 확인

- 이번 기능은 `test-con`의 기존 수집·저장 기능에 의존한다. `develop`에 포함되지 않은 상태이므로 API 코드만 먼저 배포하지 않는다.
- dev DB에 기존 V6가 적용되는지 확인한다. 이번 조회 API 작업에는 새 테이블·마이그레이션이 없다.
- dev DB에는 EMART24 상품의 최초 적재가 필요하다. 미적재이면 정상 빈 목록을 반환한다.
- 수집 스케줄러 기본값은 계속 false다. 최초 적재와 자동 수집 활성화는 별도로 결정한다.
- 기존 익명 로그인으로 받은 JWT로 dev API의 정상·빈 결과·인증 실패를 검증한다.

이번 작업에서는 브랜치 병합·배포·실제 dev/prod DB 변경을 수행하지 않는다.
