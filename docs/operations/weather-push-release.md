# 생활 날씨 푸시 운영 배포 기록 (#524)

## 현재 증거와 배포 경로

2026-11-03 기준. **Dev·Production 실기기 수신은 아직 미확인**이다. 운영 변경·병합·실제 발송은 사용자 확인 후 진행한다.

- 사용자 기기는 App Store 2.1.1이다. Apple 공개 조회에서도 `kr.jachwisunbae.app`, 2.1.1을 확인했다. 소스는 #488의 2.1.1(8)이며 실제 스토어 빌드와의 매핑·브리지 동작은 실기기로 확인해야 한다.
- 사용자 콘솔 화면에서 프로젝트 ID `jachwi-sunbae-de`, FCM API V1 활성화, `kr.jachwisunbae.app`의 개발·운영 APNs 키 등록을 확인했다. 키 유효성·서비스 계정 권한·수신 성공을 확인한 것은 아니다.
- 기존 앱을 유지하고 Dev·Prod 발신 대상을 `jachwi-sunbae-de`로 맞춘다. 네이티브 수정·스토어 재제출 없이 기존 브리지와 사용자별 기기 등록 API를 연결하는 경로다.
- Release 앱은 Prod 웹, Debug 앱은 Dev 웹에 고정되어 있다. Dev 전체 경로는 같은 소스의 Debug 실기기로 검증하며, 같은 Bundle ID 설치가 기존 앱·데이터에 영향을 줄 수 있어 설치 전 확인한다. 최종 증거는 스토어 설치 앱에서 얻는다. Android의 현재 Play 빌드·Firebase 설정·수신도 별도 확인 대상이다.

## 설정과 인증정보

| Spring 설정                                 | Dev 기본         | Prod 기본        | 의미                                        |
| ------------------------------------------- | ---------------- | ---------------- | ------------------------------------------- |
| `weather.notification.enabled`              | true             | false            | Firebase Sender 활성화                      |
| `weather.notification.schedule-enabled`     | false            | false            | enabled와 둘 다 true일 때 07·22시 KST 발송  |
| `weather.notification.test-installation-id` | 미지정           | 미지정           | 지정하면 예약 발송을 해당 설치 한 대로 제한 |
| `weather.notification.firebase-project-id`  | jachwi-sunbae-de | jachwi-sunbae-de | 기존 앱과 같은 발신 대상                    |

인증정보 배치는 [기존 Vault·systemd 배포 절차](../../backend/docs/operations/deployment.md#5-vault-환경변수-관리)를 그대로 사용한다. 환경별 KV `secret/jachwi-sunbae/dev`, `secret/jachwi-sunbae/prod`의 `firebase_service_account_json` 문자열을 기존 스크립트가 파일로 배치한다. **`GOOGLE_APPLICATION_CREDENTIALS` 경로는 systemd가 지정하므로 `app_env`에 추가하지 않는다.** 기존 DB·JWT 등 다른 값은 보존한다. Vault 수정만으로 실행 프로세스가 바뀌지 않으며 fetch 성공 후 재시작과 health·SHA 확인이 필요하다.

## 한 기기 검증 순서

대화에서는 설정을 한 번에 하나씩 안내한다. 키·FCM 토큰·설치 비밀키는 채팅·PR·로그에 출력하지 않는다.

1. 서비스 계정 권한과 Dev Vault 적용을 확인한 뒤 Dev에 배포한다. Debug 실기기의 알림 ON → 기기 등록 → 기존 `POST /api/members/me/weather-notifications/test`로 본인 기기 수신을 확인한다. 테스트 API는 기존대로 Prod에서 비노출하며 테스트 버튼·운영 API 확장은 없다. OFF·권한 철회·토큰 갱신·계정 초기화도 검증한다.
2. Dev 성공 후 Prod 설정·승격 범위를 검토하고 승인을 받아 배포한다. Sender와 예약은 별도로 활성화하며, 실기기 기기 등록 메타데이터에서 지정한 설치 ID를 확인한다. Firebase Console의 단일 기기 테스트는 토큰을 콘솔에만 안전하게 전달할 수 있을 때 앱 수신 확인에 사용할 수 있지만, 운영 백엔드의 인증정보·날씨 발송 검증을 대신하지 않는다.
3. 예약 OFF 상태에서 Prod의 `test-installation-id`를 지정한 한 대로 설정하고 적용값을 확인한다. **이 값이 비어 있으면 전체 수신 동의 기기가 대상이므로 테스트 중에는 비워 두지 않는다.** 사용자 확인 후 예약을 켜고 다음 07시·22시 수신과 이력을 확인한다. 예보의 필수 TMP·PTY가 없거나 이미 처리된 슬롯이면 미발송이며 성공으로 기록하지 않는다. 운영 테스트 API가 없으므로 이 전체 경로 검증은 예약 시각을 기다린다.
4. 단일 기기 검증 후 별도 승인으로 설치 제한을 해제해 정상 서비스를 활성화한다. 토픽 테스트나 Prod 토큰의 Dev DB 복사는 하지 않는다. FCM 접수 성공과 실제 수신은 구분한다.

## 승격·롤백·완료 증거

- 시작점은 `develop=4373bed2`, `main=0aeb0c9a`이며 두 트리는 335개 파일 차이였다. 초기화/탈퇴·인증·지도·화면·CI 등 무관한 변경도 포함하므로 푸시 PR 축소와 별개로 승격 직전 전체 범위를 승인받는다. 기본 경로는 작업 PR → develop → Dev 검증 → develop→main 승격 PR이다.
- 백엔드는 CodePipeline/CodeDeploy의 Vault 적용·restart·health·실행 SHA를, 웹은 별도 파이프라인의 S3·CloudFront·실제 번들을 확인한다. CI 성공은 실기기 성공이 아니다.
- 중단은 승인 후 `WEATHER_NOTIFICATION_ENABLED=false`, `WEATHER_NOTIFICATION_SCHEDULE_ENABLED=false`를 Vault `app_env`에 적용하고 fetch·restart로 반영한다. 이전 코드에는 예약 스위치가 없을 수 있어 enabled도 끈다. 코드 복구는 [백엔드 롤백](../../backend/docs/operations/rollback.md)과 [웹 배포](../../frontend/docs/deployment.md)를 따른다. 이미 접수된 메시지는 회수할 수 없다.
- 완료에는 Dev·스토어 앱의 실제 수신 시각/버전/배포 SHA, OFF·계정 변경 검증, Prod 설정·배포 확인, 지정한 기기의 07시·22시 수신 증거가 필요하다. 현재 이 증거는 확보되지 않았으며 #524를 완료 처리하지 않는다.
