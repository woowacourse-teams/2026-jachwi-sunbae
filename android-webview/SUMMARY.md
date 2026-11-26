# 안드로이드 웹뷰 시나리오 장기 요약 (시험)

`.github/workflows/android-webview-calibration.yml`이 실행마다 다시 만든다. 손으로 고치지 않는다. 원자료는 `history.jsonl`이다.
최근 30개 기록을 새것부터 보인다. 표시: 재실행(직전과 같은 커밋), 조건 바뀜(직전과 웹뷰, 기기, 회선, 목, 시나리오 버전 중 하나가 다름), 표본 부족(성공 3회 미만).

## 빈 캐시 첫 방문: 첫 목록 카드 (cold)

| 날짜(UTC) | 커밋 | 웹뷰 | 시나리오 | 성공 | 중앙값 | 범위 | 받은 바이트 | 표시 | 실행 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-11-26 08:29 | `32b75169` | com.google.android.webview, 124.0.6367.219 | v1 | 5/5 | 3.59초 | 3.32초~4.35초 | 1205KB | - | [45781315252-1](https://github.com/woowacourse-teams/2026-jachwi-sunbae/actions/runs/45781315252/attempts/1) |
| 2026-11-26 07:45 | `960d1836` | com.google.android.webview, 124.0.6367.219 | v1 | 5/5 | 3.43초 | 3.03초~3.61초 | 1201KB | - | [45776617308-1](https://github.com/woowacourse-teams/2026-jachwi-sunbae/actions/runs/45776617308/attempts/1) |
| 2026-11-26 07:36 | `3cf068b2` | com.google.android.webview, 124.0.6367.219 | v1 | 5/5 | 3.35초 | 3.12초~3.83초 | 1201KB | 재실행 | [45774264324-2](https://github.com/woowacourse-teams/2026-jachwi-sunbae/actions/runs/45774264324/attempts/2) |
| 2026-11-26 07:26 | `3cf068b2` | com.google.android.webview, 124.0.6367.219 | v1 | 5/5 | 3.40초 | 3.12초~4.11초 | 1201KB | - | [45774264324-1](https://github.com/woowacourse-teams/2026-jachwi-sunbae/actions/runs/45774264324/attempts/1) |

## 같은 캐시로 재방문: 첫 목록 카드 (warm)

| 날짜(UTC) | 커밋 | 웹뷰 | 시나리오 | 성공 | 중앙값 | 범위 | 받은 바이트 | 표시 | 실행 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-11-26 08:29 | `32b75169` | com.google.android.webview, 124.0.6367.219 | v1 | 5/5 | 2.65초 | 2.59초~2.93초 | 9KB | - | [45781315252-1](https://github.com/woowacourse-teams/2026-jachwi-sunbae/actions/runs/45781315252/attempts/1) |
| 2026-11-26 07:45 | `960d1836` | com.google.android.webview, 124.0.6367.219 | v1 | 5/5 | 2.87초 | 2.60초~2.92초 | 5KB | - | [45776617308-1](https://github.com/woowacourse-teams/2026-jachwi-sunbae/actions/runs/45776617308/attempts/1) |
| 2026-11-26 07:36 | `3cf068b2` | com.google.android.webview, 124.0.6367.219 | v1 | 5/5 | 2.92초 | 2.34초~3.20초 | 5KB | 재실행 | [45774264324-2](https://github.com/woowacourse-teams/2026-jachwi-sunbae/actions/runs/45774264324/attempts/2) |
| 2026-11-26 07:26 | `3cf068b2` | com.google.android.webview, 124.0.6367.219 | v1 | 5/5 | 2.96초 | 2.77초~3.31초 | 5KB | - | [45774264324-1](https://github.com/woowacourse-teams/2026-jachwi-sunbae/actions/runs/45774264324/attempts/1) |

## 방 등록: "추가"를 누르고 새 방 항목이 보이기까지 (register)

| 날짜(UTC) | 커밋 | 웹뷰 | 시나리오 | 성공 | 중앙값 | 범위 | 받은 바이트 | 표시 | 실행 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-11-26 08:29 | `32b75169` | com.google.android.webview, 124.0.6367.219 | v1 | 5/5 | 0.97초 | 0.96초~0.98초 | 1545KB | - | [45781315252-1](https://github.com/woowacourse-teams/2026-jachwi-sunbae/actions/runs/45781315252/attempts/1) |
| 2026-11-26 07:45 | `960d1836` | com.google.android.webview, 124.0.6367.219 | v1 | 5/5 | 0.98초 | 0.96초~0.99초 | 1545KB | - | [45776617308-1](https://github.com/woowacourse-teams/2026-jachwi-sunbae/actions/runs/45776617308/attempts/1) |
| 2026-11-26 07:36 | `3cf068b2` | com.google.android.webview, 124.0.6367.219 | v1 | 5/5 | 0.98초 | 0.96초~1.00초 | 1545KB | 재실행 | [45774264324-2](https://github.com/woowacourse-teams/2026-jachwi-sunbae/actions/runs/45774264324/attempts/2) |
| 2026-11-26 07:26 | `3cf068b2` | com.google.android.webview, 124.0.6367.219 | v1 | 5/5 | 0.97초 | 0.96초~0.99초 | 1545KB | - | [45774264324-1](https://github.com/woowacourse-teams/2026-jachwi-sunbae/actions/runs/45774264324/attempts/1) |

## 위치 응답 지연 뒤 방 등록: "현재 위치로 이동"부터 새 방 항목까지(위치 3초 지연) (geo-slow)

| 날짜(UTC) | 커밋 | 웹뷰 | 시나리오 | 성공 | 중앙값 | 범위 | 받은 바이트 | 표시 | 실행 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-11-26 08:29 | `32b75169` | com.google.android.webview, 124.0.6367.219 | v1 | 5/5 | 4.66초 | 4.63초~4.71초 | 1545KB | - | [45781315252-1](https://github.com/woowacourse-teams/2026-jachwi-sunbae/actions/runs/45781315252/attempts/1) |

## 위치 거부 뒤 방 등록: 거부 알림, 주소 검색 선택, 권한을 켜고 다시 등록 (denied)

| 날짜(UTC) | 커밋 | 웹뷰 | 시나리오 | 성공 | 중앙값 | 범위 | 받은 바이트 | 표시 | 실행 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-11-26 08:29 | `32b75169` | com.google.android.webview, 124.0.6367.219 | v1 | 5/5 | 1.58초 | 1.56초~1.61초 | 1573KB | - | [45781315252-1](https://github.com/woowacourse-teams/2026-jachwi-sunbae/actions/runs/45781315252/attempts/1) |

## 저장 실패 뒤 초기화: 실패 알림까지, 목 상태 그대로인지, 다시 눌러 등록 (fail-reset)

| 날짜(UTC) | 커밋 | 웹뷰 | 시나리오 | 성공 | 중앙값 | 범위 | 받은 바이트 | 표시 | 실행 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-11-26 08:29 | `32b75169` | com.google.android.webview, 124.0.6367.219 | v1 | 5/5 | 0.64초 | 0.63초~0.64초 | 1546KB | - | [45781315252-1](https://github.com/woowacourse-teams/2026-jachwi-sunbae/actions/runs/45781315252/attempts/1) |
