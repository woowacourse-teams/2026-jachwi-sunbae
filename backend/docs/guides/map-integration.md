# 지도 외부 연동

- 상태: 구현 완료 v1
- 문서 성격: 파생
- 대조 대상: [지도 명세](../../../docs/product/specs/map.md), Naver Maps·NAVER API HUB 공식 문서

## 선택

- 지도 렌더링: Naver Maps JavaScript SDK
- 주소 검색·역지오코딩: Naver Maps REST API, 장소 검색: NAVER API HUB 지역 검색 API
- 로컬 기본: 외부 호출 없는 `demo`
- 실제 데이터: `live`

Naver Maps Client ID는 프론트에 공개되며, Maps Client Secret과 NAVER API HUB Client Secret은 백엔드에만 둔다.

## 사용자가 준비할 값

### Naver Cloud Platform

1. Maps 이용 신청 후 Application을 등록한다.
2. `Dynamic Map`, `Geocoding`, `Reverse Geocoding`을 선택한다.
3. Web 서비스 URL에 `http://localhost:3000`과 실제 프론트 도메인을 등록한다.
4. Application의 Client ID와 Client Secret을 확인한다.
5. NAVER API HUB에서 `지역 검색 결과 조회` Application을 등록하고 Client ID와 Client Secret을 확인한다.

공식 문서:

- [Maps Application 등록](https://guide.ncloud-docs.com/docs/application-maps-app-vpc)
- [Geocoding API](https://api.ncloud-docs.com/docs/ai-naver-mapsgeocoding-geocode)
- [Reverse Geocoding API](https://api.ncloud-docs.com/docs/ai-naver-mapsreversegeocoding-gc)

## 환경변수

### 백엔드

| 변수 | `demo` | `live` | 설명 |
| --- | --- | --- | --- |
| `MAP_PROVIDER_MODE` | `demo` | `naver` | 외부 adapter 선택 |
| `NAVER_MAP_CLIENT_ID` | 불필요 | `naver`에서 필수 | Maps Client ID |
| `NAVER_MAP_CLIENT_SECRET` | 불필요 | `naver`에서 필수 | 서버 전용 Client Secret |
| `NAVER_SEARCH_CLIENT_ID` | 불필요 | `naver`에서 필수 | NAVER API HUB Client ID |
| `NAVER_SEARCH_CLIENT_SECRET` | 불필요 | `naver`에서 필수 | 서버 전용 API HUB Client Secret |
| `BUS_STOP_PROVIDER` | `none` | `none` 또는 `tago` | 실제 버스정류소 adapter 선택 |
| `DATA_GO_KR_SERVICE_KEY` | 불필요 | TAGO 사용 시 필수 | 공공데이터포털 일반 인증키(Decoding) |
| `MAP_CACHE_TTL_SECONDS` | `600` | `600` | 주변 조회 cache TTL |
| `MAP_CONNECT_TIMEOUT_MILLIS` | `2000` | `2000` | 연결 제한 |
| `MAP_READ_TIMEOUT_MILLIS` | `5000` | `5000` | 응답 제한 |

### 프론트엔드

| 변수 | `demo` | `live` | 설명 |
| --- | --- | --- | --- |
| `MAP_PROVIDER_MODE` | `demo` | `naver` | 지도 component 선택 |
| `NAVER_MAP_CLIENT_ID` | 불필요 | `naver`에서 필수 | 등록 도메인에서 사용하는 Maps Client ID |

## 로컬 확인

### 키 없이

`MAP_PROVIDER_MODE=demo`로 실행한다. 고정 지도 배경·주소·다섯 카테고리 장소가 동일 API 계약으로 제공되어 위치 선택과 주변 분석을 확인할 수 있다.

### 실제 Naver

백엔드와 프론트엔드 모두 `naver` 모드로 맞추고 각 키를 설정한다. 프론트는 Maps Client ID가 없으면 설정 오류 화면을 표시하고, 백엔드는 Client Secret이 없으면 시작에 실패한다.

NAVER API HUB 지역 검색은 카테고리 코드·거리·페이징을 제공하지 않는다. 그래서 백엔드는 조회 중심을 역지오코딩한 주소에 카테고리별 검색어를 붙여 카테고리마다 한 번, 공급자 최대치인 5건을 조회한 뒤 반환 좌표로 중심과의 거리를 계산해 반경 밖 결과를 제거한다. 지역 검색이 좌표를 1000만 배 정수로 주는 응답 형식도 있어 위경도 범위를 벗어난 값은 나누어 정규화한다. `TRANSPORT`는 `지하철역` 검색 결과에 `BUS_STOP_PROVIDER=tago`일 때의 TAGO 정류소를 합치고, TAGO가 실패하면 지역 검색 결과만 반환한다.

프론트의 확대 단계는 1이 가장 확대된 상태이고 Naver `zoom`은 21이 가장 확대된 상태다. `MapCanvas`가 지도 SDK 경계에서 두 값을 서로 바꾼다.

주변 조회의 `counts`는 공급자의 전체 검색 건수가 아니라 실제로 정규화해 반환한 장소 수다. 프론트는 이 실제 장소 좌표를 사용하며, 지도 축소 단계에서는 같은 카테고리의 가까운 장소를 좌표 중심 군집으로 묶고 확대 단계 3 이하에서는 개별 핀으로 표시한다. 개별 핀 상세의 이름·거리·주소도 이 정규화 결과를 사용한다. 모든 카테고리의 캐시 미적중 시 네이버 호출은 역지오코딩 1회와 카테고리별 지역 검색 5회를 합쳐 최대 6회이고 TAGO를 켰으면 정류소 호출 1회를 더한다. 동일한 정규화 좌표·반경·카테고리는 합친 결과를 10분 캐시한다.

## 운영 보호

- REST 키·정확한 현재 좌표·전체 Naver 응답을 로그에 남기지 않는다.
- Naver의 429와 5xx는 503 도메인 오류로 바꾸고 키 값은 응답하지 않는다.
- TAGO 조회가 실패하면 해당 요청에서 버스정류소만 제외하고 Naver 지역 검색 결과를 계속 반환한다.
- 좌표·반경·카테고리를 cache key로 사용하되 좌표는 소수점 4자리로 정규화한다.
- cache는 성능 최적화이며 정본이 아니다. 장애 시 오래된 장소를 DB에서 제공하지 않는다.
