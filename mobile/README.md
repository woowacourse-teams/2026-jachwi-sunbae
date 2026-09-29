# 자취선배 모바일 셸

기존 React 웹을 제품 코드의 단일 소스로 유지하면서 iOS·Android 앱으로 배포하기 위한 React Native WebView 셸입니다. 웹의 화면·API 로직은 `frontend/`에서 계속 개발하고, 앱 전용 기능만 이 디렉터리에 둡니다.

## 기술 선택

| 항목 | 버전 | 선택 이유 |
| --- | --- | --- |
| Node.js | `>=22.11.0` | React Native 0.87의 최소 요구 버전이며 LTS 계열에서 개발 환경을 통일합니다. |
| npm | `10.9.7` | 프론트엔드와 패키지 매니저를 통일해 설치·CI·문서 운영을 단순화합니다. |
| React Native | `0.87.1` | 생성 시점의 최신 안정 버전이며 iOS·Android 네이티브 셸을 함께 유지할 수 있습니다. |
| React | `19.2.3` | React Native 0.87이 요구하는 호환 버전입니다. |
| react-native-webview | `14.0.1` | 브라우저 서비스를 네이티브 앱 안에 안전하게 표시하는 안정 버전입니다. |
| react-native-safe-area-context | `5.10.0` | 노치와 Dynamic Island 영역을 침범하지 않도록 React Native 0.87 호환 버전을 사용합니다. |

Expo 같은 보일러플레이트는 사용하지 않았습니다. React Native Community CLI로 네이티브 프로젝트를 직접 생성했고, iOS 의존성은 CocoaPods로 관리합니다.

## 동작 구조

- Debug 빌드는 `https://dev.jachwi-sunbae.kr`, Release 빌드는 `https://www.jachwi-sunbae.kr`을 엽니다.
- 서비스 도메인 세 개(`jachwi-sunbae.kr`, `www.jachwi-sunbae.kr`, `dev.jachwi-sunbae.kr`)만 앱 안에서 이동합니다.
- 외부 URL은 Safari 등 시스템 앱으로 넘깁니다.
- `jachwisunbae://properties/10` 형태의 딥링크를 운영 웹의 같은 경로로 변환합니다.
- 로딩, 통신 실패·재시도, iOS 뒤로가기 제스처는 네이티브에서 처리합니다.
- 카메라·사진·위치 권한과 앱 아이콘, 시작 화면을 각 네이티브 프로젝트에 포함했습니다.
- 앱 WebView에서도 제품 이용 현황과 오류를 확인하기 위한 PostHog를 실행합니다.
- 앱 진입만으로 위치 권한을 요청하지 않습니다. 지도에서 현재 위치 버튼을 누를 때 요청합니다.

웹 URL이나 허용 도메인을 바꿀 때는 `src/config.ts`와 `src/navigationPolicy.ts`만 수정합니다. 이후 화면이나 API가 바뀌어도 대부분 `frontend/`만 배포하면 앱이 같은 변경을 사용합니다. 카메라, 푸시 알림, 공유 시트 같은 네이티브 기능을 추가할 때만 모바일 코드를 수정합니다.

## 로컬 실행

필요한 도구는 Node.js 22 이상, npm 10입니다. iOS에는 Xcode와 CocoaPods, Android에는 JDK 17 이상과 Android SDK가 추가로 필요합니다.

```bash
cd mobile
npm ci
cd ios && pod install && cd ..
npm start
```

다른 터미널에서 실행합니다.

```bash
cd mobile
npm run ios
```

Xcode로 열 때는 `.xcodeproj`가 아니라 `ios/JachwiSunbaeMobile.xcworkspace`를 사용합니다.

Android는 에뮬레이터 또는 USB 디버깅을 켠 기기를 연결한 뒤 실행합니다.

```bash
cd mobile
npm run android
```

## 품질 검사

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
```

서명 없이 시뮬레이터 빌드만 확인하려면 다음 명령을 사용합니다. 디스크가 빠듯한 개발 환경을 고려해 단일 arm64 아키텍처만 빌드합니다.

```bash
cd ios
xcodebuild \
  -workspace JachwiSunbaeMobile.xcworkspace \
  -scheme JachwiSunbaeMobile \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  CODE_SIGNING_ALLOWED=NO \
  ONLY_ACTIVE_ARCH=YES \
  ARCHS=arm64 \
  COMPILER_INDEX_STORE_ENABLE=NO \
  build
```

## 스토어 제출 전 공통 버전

`VERSION`, 프론트엔드·백엔드·모바일 패키지 버전, Android `versionName`, iOS `MARKETING_VERSION`은 항상 같은 SemVer를 사용합니다. 같은 릴리스의 iOS `CURRENT_PROJECT_VERSION`과 Android `versionCode`도 같은 양의 정수로 올립니다.

```bash
python3 ../.github/scripts/check_versions.py
```

## TestFlight·App Store 제출 전

코드 외에 Apple Developer 계정이 필요한 작업은 Xcode에서 진행합니다.

1. `JachwiSunbaeMobile` 타깃의 Signing & Capabilities에서 팀을 선택하고 번들 ID `kr.jachwisunbae.app`을 등록합니다.
2. Version과 Build 값을 올리고 실제 iPhone에서 로그인, 지도, 매물 등록, 카메라·사진·위치 권한을 점검합니다.
3. Release 빌드가 운영 주소를 여는지 확인한 뒤 Product > Archive로 업로드합니다.
4. App Store Connect에 개인정보처리방침 URL, 수집 데이터 답변, 앱 설명, 심사용 계정·사용 방법, 스크린샷을 입력합니다.
5. 단순 웹사이트 포장으로 보이지 않도록 앱다운 가치가 있는 기능을 심사 노트에 설명합니다. 현재 셸은 딥링크, 네이티브 오류 복구, 권한, 외부 링크 분리를 제공하지만 향후 공유·푸시 등 네이티브 기능을 더하는 편이 심사와 사용자 경험에 유리합니다.

## Google Play 제출 전

Google Play 앱 패키지 ID는 `com.jachwisunbae`입니다. Android `applicationId`를 변경하면 기존 Play 앱과 다른 앱으로 취급되므로 임의로 바꾸지 않습니다. Google Play에는 디버그 키가 아닌 별도 업로드 키로 서명한 Android App Bundle(`.aab`)을 제출합니다. 키스토어와 비밀번호는 저장소에 커밋하지 않습니다. 아래 값을 `~/.gradle/gradle.properties` 또는 환경 변수로 설정합니다.

```properties
JACHWI_UPLOAD_STORE_FILE=/absolute/path/to/jachwi-sunbae-upload.keystore
JACHWI_UPLOAD_STORE_PASSWORD=...
JACHWI_UPLOAD_KEY_ALIAS=jachwi-sunbae-upload
JACHWI_UPLOAD_KEY_PASSWORD=...
```

릴리스 번들은 운영 웹(`https://www.jachwi-sunbae.kr`)을 열며 다음 명령으로 생성합니다.

```bash
cd android
./gradlew bundleRelease
```

생성 파일은 `android/app/build/outputs/bundle/release/app-release.aab`입니다. 업로드 전에 실제 Android 기기에서 로그인, 지도 현재 위치, 사진 선택, 뒤로가기, 외부 링크와 `jachwisunbae://properties/10` 딥링크를 확인합니다. Play Console에는 개인정보처리방침 URL, 데이터 보안 답변, 앱 설명, 연락처, 스크린샷, 512×512 아이콘과 1024×500 그래픽을 등록합니다.
