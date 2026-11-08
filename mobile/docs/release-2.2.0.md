# 앱 2.2.0 제출 준비

앱 `2.2.0(10)`을 App Store와 Play Store에 제출하기 전에 확인할 내용과 스토어 문구 초안이다. 제출 빌드는 #599 브랜치(`chore/526-app-2.2.0-release`)를 기준으로 하며, #586, #587, #591, #589를 합친 상태다. 이 문서를 만든 시점에는 제출, 심사 요청, 스토어 등록 정보 변경을 하지 않았다.

## 포함 내용

| PR   | 내용                                                          | 사용자에게 보이는가               |
| ---- | ------------------------------------------------------------- | --------------------------------- |
| #586 | 빌드 구성별 앱 환경, Firebase 설정 분리, dev 서버용 Staging    | 아니요. 운영 앱은 prod Firebase   |
| #587 | 앱을 쓰는 중에 받은 푸시도 시스템 배너로 표시                  | 예                                |
| #591 | Apple, 카카오 네이티브 로그인 모듈과 웹 `auth` 브리지          | 아니요. 웹이 앱에서 계정 연결을 숨김 |
| #589 | iOS UIScene 생명주기 전환(iOS 27 SDK 대비)                    | 아니요                            |
| #599 | iOS 첫 알림 켜기 실패 수정(APNs 토큰을 기다린 뒤 FCM 토큰 요청) | 예                                |

## 스토어 업데이트 문구 초안

두 스토어에 같은 문구를 쓴다. 앱 안 로그인 기능은 이번 버전에서 보이지 않으므로 문구에 넣지 않는다.

```text
- 앱을 쓰는 중에 온 알림도 화면 위에 바로 보여요.
- 처음 알림을 켤 때 실패하던 문제를 고쳤어요.
- 안정성을 높였어요.
```

- iOS: App Store Connect의 `이 버전의 새로운 기능`에 넣는다.
- Android: Play Console 출시 노트의 `<ko-KR>` 태그 안에 넣는다.

## 제출 전 체크리스트

### 버전과 빌드 번호

- [ ] #591 → #589 → #599 순서로 develop에 머지됐는지 확인한다. #599 본문의 충돌 해결(카카오 복귀 URL 한 줄, Xcode 27 Pod 배포 대상 보정)이 develop에 들어 있어야 한다.
- [ ] `mobile/VERSION`, `package.json`, Android `versionName`이 `2.2.0`, `versionCode`가 `10`인지 확인한다.
- [ ] iOS `MARKETING_VERSION`이 `2.2.0`, `CURRENT_PROJECT_VERSION`이 `10`인지 Debug, Staging, Release 구성 모두에서 확인한다.
- [ ] `npm run check:versions`, `npm run typecheck`, `npm run lint`, `npm test -- --runInBand`를 통과한다.
- [ ] `mobile/README.md`의 준비 중 버전과 빌드 번호 표(현재 `2.1.1`, `9`)를 `2.2.0`, `10`으로 고친다.
- [ ] TestFlight나 Play 내부 테스트에 같은 빌드 번호를 이미 올렸다면 번호를 하나 올려 다시 빌드한다.

### prod Firebase 파일

- [ ] 빌드하는 기기의 `~/.config/jachwi-firebase-prod/`에서 두 파일을 복사한다. 파일은 커밋하지 않는다.
  - `GoogleService-Info.plist` → `ios/firebase/prod/GoogleService-Info.plist`
  - `google-services.json` → `android/app/src/release/google-services.json`
- [ ] `npm run check:firebase -- prod`로 프로젝트가 `jachwi-sunbae-prod`인지 확인한다.
- [ ] prod Firebase 프로젝트에 APNs 인증 키가 등록돼 있는지 확인한다.
- [ ] 백엔드 Prod Vault의 `firebase_service_account_json`이 `jachwi-sunbae-prod` 서비스 계정인지 확인한다. 스토어 앱 `2.1.1`은 dev Firebase로 빌드되어 있어, 이번 빌드가 배포된 뒤부터 운영 푸시가 기기에 닿는다.

### 카카오 네이티브 키와 Sign in with Apple

로그인 UI는 이번 버전에서 숨겨져 있지만, 브리지 계약은 앱이 나간 뒤 바꿀 수 없으므로 키와 capability를 넣어서 빌드한다.

- [ ] iOS: `ios/Config/Kakao.local.xcconfig`에 `KAKAO_NATIVE_APP_KEY`를 적는다. 커밋하지 않는다.
- [ ] Android: `android/local.properties`나 `~/.gradle/gradle.properties`에 `KAKAO_NATIVE_APP_KEY`를 적는다.
- [ ] 카카오 개발자 콘솔의 플랫폼에 iOS 번들 ID `kr.jachwisunbae.app`과 Android 패키지 `com.jachwisunbae`, Play 앱 서명 키 해시가 등록돼 있는지 확인한다.
- [ ] Apple Developer의 App ID `kr.jachwisunbae.app`에 Sign in with Apple capability가 켜져 있고, 배포 프로비저닝 프로필을 다시 받았는지 확인한다. 꺼져 있으면 Archive 서명이 실패한다.
- [ ] 내보낸 IPA의 entitlements에 `com.apple.developer.applesignin`과 `aps-environment = production`이 있는지 확인한다.

### 빌드와 TestFlight

- [ ] iOS Release Archive와 TestFlight 업로드는 모카 랩탑에서 한다. 이 문서의 키와 prod Firebase 파일을 그 랩탑에 같은 경로로 준비한다.
- [ ] Android는 기존 업로드 키로 `cd android && ./gradlew bundleRelease`를 만든다.
- [ ] TestFlight 실기기에서 확인한다.
  - [ ] 새로 설치한 뒤 알림 켜기가 경고 없이 성공하고 `jachwi-service-prod` 토픽을 구독한다.
  - [ ] 앱을 쓰는 중에 온 테스트 푸시가 배너로 보인다.
  - [ ] 운영 웹이 열리고, 마이 화면에 계정 연결 카드가 보이지 않는다.
  - [ ] 외부 링크가 시스템 브라우저로 열린다.

### 심사 메모

App Store 심사 메모 초안이다. 필요하면 Play Console에도 같은 내용을 쓴다.

```text
이 앱은 회원가입이나 로그인 없이 바로 사용할 수 있습니다. 앱을 열면 익명 계정이 자동으로 만들어지므로 심사용 계정이 필요하지 않습니다.

이번 버전에는 다음 버전에서 사용할 Sign in with Apple과 카카오 로그인 모듈이 포함되어 있지만, 이번 버전 화면에서는 로그인 버튼이 표시되지 않습니다. 로그인 기능을 열 때는 Sign in with Apple을 함께 제공합니다.

알림은 사용자가 앱의 알림 설정에서 직접 켤 때만 권한을 요청합니다.
```

### 제출 직전

- [ ] 개인정보처리방침과 App Store 개인정보 표시, Play 데이터 보안 답변이 이번 변경으로 달라지지 않는지 확인한다. 로그인 UI가 숨겨져 있어 수집 항목은 그대로다.
- [ ] App Store는 `수동 출시`로 제출해, 승인 뒤 웹 운영 배포 일정에 맞춰 출시한다.
- [ ] 제출 결과(제출 ID, 심사 상태)를 [푸시 운영 문서](push-notifications.md)의 스토어 제출 기록처럼 남긴다.
