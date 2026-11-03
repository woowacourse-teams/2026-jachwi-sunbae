# 생활 날씨 푸시 운영 배포 기록 (#524)

## 결정과 현재 증거

2026-11-03 기준. **Dev·Production 실기기 수신은 아직 미확인**이다. 코드 검사와 실제 콘솔·수신 상태를 구분한다.

| 항목           | 확인한 내용                                                                                                  | 아직 필요한 증거                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| 소스           | `develop=4373bed2`, `main=0aeb0c9a`에서 시작                                                                 | 병합 직전 최신 diff 재확인                                            |
| 실행 서버      | 공개 `/actuator/info`에서 Dev `4373bed2`, Prod `0aeb0c9a`, 둘 다 3.1.0                                       | 배포 후 대상 SHA 일치                                                 |
| iOS 스토어     | Apple 공개 lookup에서 `kr.jachwisunbae.app`, 2.1.1, 2026-11-02 출시 확인. 사용자도 App Store 2.1.1 사용 확인 | App Store Connect 빌드 8 매핑, 실제 브리지·수신                       |
| Android 스토어 | #487 및 모바일 문서에 2.1.1(8) 활성 기록                                                                     | Play Console 현재 활성 버전·실제 설치 수신. 공개 조회로 확정하지 못함 |
| 모바일 소스    | #488의 `46906810`에서 가져온 2.1.1(8). `status/enable/disable/token/settings`, 토큰 갱신 이벤트 구현         | 버전 문자열만으로 스토어 바이너리와 소스의 완전한 동일성 입증 불가    |
| Firebase       | 앱 기록은 `jachwi-sunbae-de`, sender ID `987875942634`. 기존 Prod YAML은 `jachwi-sunbae-prod`                | 콘솔 앱 구성, 서비스 계정 권한·APNs                                   |
| Dev 푸시       | 최신 YAML은 enabled=true. 예전 문서의 Dev OFF 설명은 오래됨                                                  | Vault 환경변수 우선 적용 여부·실제 ADC                                |

가장 빠른 경로는 스토어 앱을 유지하고 **발신 대상 프로젝트를 `jachwi-sunbae-de`로 맞추는 것**이다. 프로젝트 이름의 `de`와 서비스 배포 환경은 별개다. Prod도 이 프로젝트의 발송 권한이 있는 서버용 서비스 계정을 사용한다. 가능하면 Dev와 Prod 서비스 계정은 분리하되 대상 프로젝트는 같다. 별도 프로젝트로 옮기려면 해당 설정으로 네이티브 앱을 다시 빌드·배포해야 한다.

근거: [FCM 자격증명·프로젝트 불일치](https://firebase.google.com/docs/cloud-messaging/error-codes), [Apple APNs 연결](https://firebase.google.com/docs/cloud-messaging/ios/get-started), [스토어](https://apps.apple.com/kr/app/id6816321229), [이슈 #524](https://github.com/woowacourse-teams/2026-jachwi-sunbae/issues/524).

## 구현 경계

- 기존 브리지·회원 인증·위치/설정/기기 API를 재사용한다. 신규 SDK, 서비스, DB 마이그레이션, 네이티브 변경은 없다.
- origin별 UUID와 32바이트 난수 base64url 설치 비밀키를 WebView localStorage에 보관한다. 계정 초기화에도 유지하고 FCM 토큰은 메모리에서 API로만 전달한다. 저장소 실패·손상 때 임시 소유 증명으로 등록하지 않는다.
- ON은 위치·기기 등록 성공 후 동의 저장. OFF는 동의 저장 후 기기 해제. OFF 이후 정리 실패는 OFF와 재시도 안내로 표시한다.
- 로그인, 앱 복귀, 네트워크 복구, 토큰 갱신에 동기화한다. 같은 설치의 회원 이전 때 이전 수신 동의를 새 회원에게 복사하지 않는다. 권한 확인 중 회원이 바뀌면 이전 요청을 새 회원 인증으로 보내지 않는다.
- OS 권한 철회는 서버 동의 OFF·기기 해제로 반영한다. 날씨 OFF 때문에 공개 서비스 안내 토픽까지 해제하지 않는다. 설치 소유 충돌은 이전 회원에 남은 FCM 토큰을 네이티브에서 폐기하고 실패로 알린다.
- 클릭은 기존 앱이 처리하는 `data.url=/me`를 사용한다. 발송 대상은 단일 토큰이고 토픽은 사용하지 않는다.
- FCM 실패는 분류 코드만 기록한다. 예외 원문·토큰·키는 로그/분석에 남기지 않는다. 기기 API는 PostHog 네트워크 녹화에서도 제외한다.

## 발신·예약·검증 스위치

| Spring 설정                                 | Dev 기본         | Prod 기본        | 용도                                                                                            |
| ------------------------------------------- | ---------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| `weather.notification.enabled`              | true             | false            | Firebase Sender. ADC 준비 필요                                                                  |
| `weather.notification.schedule-enabled`     | false            | false            | enabled와 둘 다 true일 때만 07·22시 스케줄러 등록                                               |
| `weather.notification.test-enabled`         | true             | false            | 인증된 본인 기기 테스트 API 노출                                                                |
| `weather.notification.test-installation-id` | 미지정           | 미지정           | Prod 테스트는 지정한 UUID와 현재 회원 기기의 설치 ID가 같을 때만 발송. 미지정이면 발송하지 않음 |
| `weather.notification.firebase-project-id`  | jachwi-sunbae-de | jachwi-sunbae-de | 기존 스토어 앱과 같은 FCM 대상 프로젝트                                                         |

기존 `POST /api/members/me/weather-notifications/test`를 재사용한다. Prod에서 `test-enabled=true`만 설정해도 발송되지 않는다. 설정 API의 `testAvailable`이 true인 기기에만 웹의 수신 테스트 버튼을 보이고, 사용자가 눌렀을 때만 호출한다. 토큰이나 인증값을 사용자에게 표시·공유하도록 요구하지 않는다. 요청 본문으로 대상·문구를 바꿀 수 없다. `test-installation-id`를 지정하면 07시·22시 스케줄러도 그 설치에만 발송한다. 지정하지 않은 정상 예약 발송은 전체 수신 동의 기기를 대상으로 한다. `sent=true`는 FCM 접수 성공일 뿐 기기 수신 증거가 아니다. 테스트 문구는 위치·예보·수신 동의와 독립적이므로 실제 발송은 사용자 확인 후 한 번씩 수행한다.

## 실제 설정과 실기기 검증 순서

대화에서는 아래 항목을 한 번에 요청하지 않고 단계 결과에 맞춰 하나씩 안내한다. 비밀값을 채팅·PR·로그로 전달하지 않는다.

1. Firebase `jachwi-sunbae-de`의 Cloud Messaging → Apple 앱 `kr.jachwisunbae.app`에서 APNs 운영 키 등록을 확인한다. 과거 `jachwi-sunbae` 프로젝트의 키가 자동 복사되지는 않는다. Bundle ID, Apple Team ID, 운영 환경·허용 Topic을 확인한다. 유효한 키가 있으면 새로 발급·폐기하지 않는다. Android는 `com.jachwisunbae`와 sender ID가 같은 프로젝트인지 확인한다.
2. 서버용 서비스 계정의 대상 프로젝트 권한과 FCM API 활성 상태를 확인한다. 키 원문은 서버에만 둔다. 앱의 plist/JSON은 서버 서비스 계정 파일이 아니다.
3. Vault KV v2 `secret/jachwi-sunbae/dev`의 `firebase_service_account_json` 문자열에 서버 계정을 보관하고 `app_env`에 `GOOGLE_APPLICATION_CREDENTIALS=/etc/jachwi-sunbae/firebase/service-account.json`을 지정한다. `fetch_env.sh`가 EC2 신원 인증 후 파일을 `0640 root:jachwi`로 배치한다. `app.env`는 `0600 root:root`. Vault 변경만으로 실행 프로세스가 바뀌지 않으며 배포 시 fetch와 재시작이 필요하다. 기존 DB/JWT 등 다른 필드를 덮어쓰지 않는다.
4. Dev 배포 SHA·health 확인 후 같은 소스의 **Debug 실기기 빌드**로 Dev 웹에 접속한다. 스토어/Release 앱은 Prod origin에 고정되어 있어 Dev 웹을 그대로 열 수 없다. Debug 설치는 스토어 제출과 별개다. 같은 Bundle ID 설치가 기존 앱·데이터에 영향을 줄 수 있으므로 별도 테스트 기기나 백업/재설치 계획을 확인한다. Dev 성공을 스토어 바이너리 성공으로 기록하지 않는다.
5. Dev에서 권한 허용 → 알림 ON → 기기 등록 메타데이터 확인 → 본인 테스트 API → 실제 수신·클릭을 확인한다. OFF, 권한 철회, 재진입, 계정 초기화 후 OFF도 검증한다. 테스트 대상은 선택한 설치 한 대로 제한한다.
6. Dev 실기기 성공 뒤 Prod 서비스 계정과 Vault `secret/jachwi-sunbae/prod`를 별도 확인한다. 승인받은 운영 변경·승격·배포 후, 예약 발송은 OFF인 채 지정한 설치 한 대로 테스트한다. 최종 iOS 증거는 Debug/TestFlight가 아닌 **App Store 설치 앱**에서 확인한다. Android도 Play 설치 앱 증거가 필요하다.
7. 테스트 API를 다시 닫고 `test-installation-id`는 지정한 한 대로 유지한 채 사용자 확인 후 예약 스위치를 켠다. 다음 07시·22시 KST의 실제 수신과 로그/이력 연결을 검증한다. 완료된 예보의 필수 시간별 TMP·PTY가 있어야 한다. 데이터가 없거나 이미 처리한 슬롯이면 미발송이 정상이며 이를 수신 성공으로 기록하지 않는다. 두 슬롯의 단일 기기 검증을 마친 후에만 별도 승인을 받아 설치 제한을 제거하고 정상 수신 동의 사용자에게 발송한다.

Firebase를 공유해도 Dev와 Prod DB·웹 origin·Vault 역할은 분리한다. Prod 토큰을 Dev DB로 복사하거나 `jachwi-service-prod` 토픽을 테스트 대상으로 쓰지 않는다.

## main 승격 범위와 배포 검증

작업 시작 시 두 트리의 차이는 335개 파일, develop 전용 커밋 28개다. 날씨 이외에 #494 초기화 UI·개인정보 문구, #503 회원 탈퇴와 인증/소유 데이터 정리, 지도 마커·경계 선조회, 화면 로딩·라우팅 변경, 모바일 소스 복귀와 CI 변경이 있다. 추가 DB 마이그레이션 파일 차이는 없다.

기본 경로는 작업 PR → develop → Dev 검증 → develop→main 승격 PR이다. **전체 승격은 푸시만 배포하는 것이 아니다.** 기존 변경 전체의 수용 여부를 승격 전에 확인한다. 푸시만 격리한 운영 브랜치가 필요하면 승격 규칙 예외와 의존성(특히 회원 삭제 시 토큰 해제)을 별도 검토한다.

백엔드는 CodePipeline → CodeDeploy → Vault 다운로드 → systemd restart → health 및 `/actuator/info` SHA 검증이다. 웹은 별도 CodePipeline → S3 → CloudFront 무효화 완료 → 실제 번들 참조 검증이다. 두 파이프라인 성공을 각각 확인한다. CI 성공이 실기기 성공을 대신하지 않는다.

## 롤백

- 발송 문제: 승인 후 해당 Vault `app_env`에서 `WEATHER_NOTIFICATION_ENABLED=false`, `WEATHER_NOTIFICATION_SCHEDULE_ENABLED=false`, `WEATHER_NOTIFICATION_TEST_ENABLED=false`로 설정하고 검증된 배포 절차로 읽기/재시작한다. 예약만 중단하려면 schedule-enabled를 먼저 끈다. 설정 파일만 바꾸면 실행 프로세스는 계속 발송할 수 있다.
- 코드 문제: [백엔드 롤백](../../backend/docs/operations/rollback.md)과 [웹 배포](../../frontend/docs/deployment.md)를 따라 직전 정상 리비전을 배포하고 실행 SHA·CloudFront 번들을 확인한다.
- 이전 코드는 schedule-enabled를 모를 수 있으므로 **enabled=false**도 유지한다. 이미 FCM에 접수된 메시지는 회수할 수 없다. DB/토큰/기존 키를 일괄 삭제하거나 APNs 키를 폐기하지 않는다.

## 완료 증거 (미완료)

- [ ] Dev 단일 실기기 수신 시각·OS·앱 빌드·배포 SHA
- [ ] OFF/권한 철회/토큰 갱신/계정 초기화 검증
- [ ] Firebase 프로젝트·APNs 운영 키·서비스 계정 권한 확인 (비밀값 제외)
- [ ] Prod 승격 범위 승인 및 두 배포 파이프라인 성공
- [ ] 지정한 App Store 설치 앱의 테스트 수신·클릭 증거
- [ ] 지정한 Google Play 설치 앱의 테스트 수신·클릭 증거
- [ ] 07시·22시 자동 발송 실제 수신·중복 방지 확인

현재 운영 설정 변경·병합·발송은 수행하지 않았다. 위 증거가 없으면 이슈를 완료 처리하지 않는다.
