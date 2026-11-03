# 자취선배 모바일

자취선배 웹을 iOS·Android에서 제공하는 React Native WebView 셸이다. 팀 모노레포의 `mobile/`에서 관리하며, 앱 버전은 웹·백엔드 제품 버전과 별도로 관리한다.

| 항목         | iOS                   | Android            |
| ------------ | --------------------- | ------------------ |
| 앱 ID        | `kr.jachwisunbae.app` | `com.jachwisunbae` |
| 준비 중 버전 | `2.1.1`               | `2.1.1`            |
| 빌드 번호    | `8`                   | `8`                |
| 푸시         | FCM → APNs            | FCM                |

두 앱에 같은 확대 크롭 오리 아이콘을 적용했다. 네이티브 하단 탭바는 사용하지 않고 웹 UI를 표시한다. 웹 라우팅·로그인·기존 서비스 기능은 웹 배포를 따른다.

## 실행

Node.js 22.11 이상, npm, Xcode/CocoaPods 또는 Android SDK/JDK가 필요하다. React Native Community CLI 기반이며 Expo 앱이 아니다.

```bash
npm ci
```

Firebase 프로젝트 `jachwi-sunbae-de`의 앱 설정 파일을 아래 위치에 넣는다. 파일과 인증 키는 Git에서 제외된다.

- `ios/JachwiSunbaeMobile/GoogleService-Info.plist`
- `android/app/google-services.json`

```bash
npm run check:firebase
cd ios && pod install && cd ..
npm start
# 다른 터미널에서 npm run ios 또는 npm run android
```

Debug는 `https://dev.jachwi-sunbae.kr`, Release는 `https://www.jachwi-sunbae.kr`을 연다. 기존 서비스 도메인 밖의 링크는 시스템 브라우저로 이동한다. 앱 시작만으로 위치 권한을 요청하지 않는다.

## 푸시 알림

앱 권한·토큰·토픽·알림 이동 모듈과 서버용 Firebase Admin 발송 예제를 포함한다. 서버 발송은 기본 dry-run이고, 실제 운영 발송에는 명시적인 플래그가 필요하다.

Debug에서는 아이폰을 흔들어 React Native 개발자 메뉴를 열고 **알림 받기 안내 다시 보기**를 선택하면 안내를 다시 띄울 수 있다. Firebase가 설정된 경우에만 메뉴가 표시되며, 안내를 다시 보거나 나중에를 눌러도 저장된 알림 선택·로그인·쿠키를 초기화하지 않는다. 알림 받기를 누르면 기존 OS 권한 요청과 FCM 등록 흐름을 실행한다. Release에는 이 메뉴를 추가하지 않는다.

iOS 권한 팝업에서 이미 허용·거절을 선택했다면 요청을 다시 호출해도 OS 팝업은 반복되지 않는다. 이 경우 설정 → 알림 → 자취선배에서 현재 권한을 확인하거나 변경한다. 앱의 안내 재표시는 iOS 권한 초기화와 별개다.

Debug 푸시 진단 로그는 `[push-debug]`로 필터링한다. Xcode로 실행한 앱은 Debug 콘솔에서 확인하고, Metro 터미널에 JS 로그가 보이지 않으면 Metro에서 `j`를 눌러 React Native DevTools의 Console을 연다. 재시도는 개발자 메뉴의 Reload로 최신 JS를 반영한 뒤 **알림 받기 안내 다시 보기 → 알림 받기**를 선택한다. 앱 삭제나 데이터 초기화는 필요 없다.

- `enable`: 전체 활성화 요청의 시작·종료. 그 안에서 `permission` → `auto-init` → `apns-registration`(iOS) → `fcm-token` → `save-registration` → `topic-subscription` → `save-choice` 순서로 기록한다.
- 각 단계는 `start`, `success`, `failure`를 기록한다. `permission denied`는 권한 미허용이며 기존처럼 등록을 진행하지 않는다. `apns-registration success`는 이미 등록되어 추가 요청이 필요 없는 경우도 포함한다.
- `failure`가 붙은 구체적인 단계가 실패 지점이다. 뒤따르는 `enable failure`는 전체 요청의 실패 요약이다. `start`만 남으면 해당 작업이 아직 응답하지 않은 상태일 수 있다.
- 예시: `[push-debug] fcm-token failure code=messaging/unknown nativeCode=505`. 오류 코드는 허용 목록의 값만 출력하고 나머지는 `unknown`으로 처리한다. 실제 토큰, 인증키, 오류 메시지·스택·원본 객체는 출력하지 않으며 Release에서는 진단 로그를 출력하지 않는다.

**설정 파일, APNs 인증 연결, 실제 기기 수신 검증이 완료되기 전에는 배포하지 않는다.** 사용자별 발송은 웹/서버의 인증된 토큰 등록·로그아웃 해제 연동이 추가로 필요하다. 현재 준비 범위와 서버 연동 규약은 [푸시 운영 문서](docs/push-notifications.md)를 따른다.

## 검사

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
node --test server/message.test.mjs
npm run check:versions
npm run format:docs
npm run format:docs:check
```

`VERSION`, package/lock 파일, Android versionName, iOS MARKETING_VERSION을 맞춘다. 앱 배포 빌드 번호는 Android versionCode와 iOS CURRENT_PROJECT_VERSION을 함께 올린다. 앱 버전은 루트 `VERSION`과 맞추지 않으며, 웹·백엔드 릴리스와 별도로 올린다.

## 스토어 준비

- iOS는 `.xcworkspace`로 열고 Push Notifications entitlement를 포함한 올바른 팀/프로파일로 서명한다. APNs 키를 Firebase에 연결한 후 실기기에서 확인한다.
- Android는 기존 업로드 키를 유지한다. 환경 변수 또는 개인 Gradle 설정에 `JACHWI_UPLOAD_STORE_FILE`, `JACHWI_UPLOAD_STORE_PASSWORD`, `JACHWI_UPLOAD_KEY_ALIAS`, `JACHWI_UPLOAD_KEY_PASSWORD`를 제공한 뒤 `cd android && ./gradlew bundleRelease`로 만든다.
- Play Store 등록용 아이콘은 `store-assets/android/play-store-icon-512.png`, App Store 아이콘은 iOS AppIcon asset catalog에 있다.
- 키스토어, APNs 키, 서비스 계정 키, IPA/AAB/아카이브는 커밋하지 않는다. 기존 스토어 앱 ID를 바꾸지 않는다.
- 푸시 목적·토큰 처리에 맞춰 개인정보처리방침과 스토어 수집 데이터 답변을 출시 전에 검토한다.

이 작업에서는 스토어 제출이나 운영 사용자 대상 발송을 하지 않았다.
