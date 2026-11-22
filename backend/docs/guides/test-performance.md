# 테스트 성능 측정

DB를 쓰는 테스트의 실행 시간, MySQL 컨테이너 기동 수와 Spring 컨텍스트 로딩 수를 확인하는 방법이다. 공통 설정의 규칙은 [테스트 전략](../conventions/test-strategy.md#db를-쓰는-테스트의-공통-설정)에 있다.

## 측정 방법

Docker가 실행 중인 상태에서 `backend`에서 실행한다. 이전 실행 결과가 섞이지 않도록 `clean`과 `--rerun-tasks`를 함께 쓴다.

```bash
cd backend
./gradlew clean testAll --rerun-tasks
```

명령이 끝나면 `BUILD SUCCESSFUL in`에 나온 시간을 전체 실행 시간으로 기록하고, 테스트 결과 XML에서 컨테이너와 컨텍스트 기동 횟수를 센다.

```bash
# MySQL 컨테이너 기동 횟수
grep -ho 'Container mysql:[0-9.]* started in' build/test-results/testAll/*.xml | wc -l
# Spring 컨텍스트 로딩 횟수와 로딩에 쓴 시간(초)
grep -ho 'Started [A-Za-z0-9]* in [0-9.]* seconds' build/test-results/testAll/*.xml | wc -l
grep -ho 'Started [A-Za-z0-9]* in [0-9.]* seconds' build/test-results/testAll/*.xml \
  | awk '{sum += $4} END {print sum}'
# 테스트 클래스 실행 시간 합계(초)
grep -ho '<testsuite [^>]* time="[0-9.]*"' build/test-results/testAll/*.xml \
  | sed 's/.*time="\([0-9.]*\)"/\1/' | awk '{sum += $1} END {print sum}'
```

`./gradlew test`(인수 테스트 제외)로 측정할 때는 경로의 `testAll`을 `test`로 바꾼다. CI는 테스트 JVM을 2개까지 띄우므로 컨테이너도 최대 2개 뜬다.

## 공통 설정 전후 비교

컨텍스트 수는 Spring이 컨텍스트 캐시 키로 쓰는 설정(`MergedContextConfiguration`)을 테스트 클래스마다 만들어 같은 것끼리 묶어 센 값이다. 시간은 위 명령으로 같은 기기에서 측정해 채운다.

| 항목                                     | 이전 | 이후 |
| ---------------------------------------- | ---: | ---: |
| MySQL 컨테이너를 쓰는 테스트 클래스      |   50 |   50 |
| MySQL 컨테이너 기동 (`testAll`)          |   50 |    1 |
| MySQL 컨테이너 기동 (`test`)             |   41 |    1 |
| Spring 컨텍스트 로딩 (`testAll`)         |   37 |    7 |
| Spring 컨텍스트 로딩 (`test`)            |   29 |    3 |
| 클래스마다 선언한 테스트 전용 `Clock` 빈 |    6 |    0 |

- 이전에는 테스트 클래스마다 컨테이너를 따로 띄웠다. 컨테이너가 다르면 DB 접속 주소가 달라 컨텍스트 캐시 키도 달라지므로, 설정이 같아 보이는 테스트도 컨텍스트를 매번 새로 띄웠다. `@SpringBootTest` 24개와 `@JdbcTest` 13개가 각각 컨텍스트를 하나씩 만들었다.
- 이후에는 컨테이너 하나를 공유하고, 목·스파이·시계·MockMvc 설정을 `IntegrationTest` 한 곳에 모았다. 통합·인수 테스트 컨텍스트 1개, 설정이 달라 따로 쓰는 컨텍스트 5개, Repository 슬라이스 컨텍스트 1개가 남는다.
- 대신 테스트 클래스마다 DB를 처음 상태로 되돌리는 작업이 추가된다. 데이터가 남은 표만 비우므로 클래스마다 수십 밀리초 정도로 예상하며, 측정 결과로 확인한다.

| 측정 항목 (`./gradlew clean testAll`) | 이전   | 이후   |
| ------------------------------------- | ------ | ------ |
| 전체 실행 시간                        | 미측정 | 미측정 |
| 컨텍스트 로딩 시간 합계               | 미측정 | 미측정 |
| 테스트 클래스 실행 시간 합계          | 미측정 | 미측정 |
