# README 프론트 아키텍처

`frontend.png`는 README 표시용 이미지, `frontend.svg`는 확대용 벡터, `frontend.drawio`는 diagrams.net 편집용 원본이다. 아이콘은 파일에 내장되어 있다.

## 범위와 근거

저장소 코드와 문서 기준 구성도이며 AWS 콘솔의 현재 상태를 직접 검증한 결과는 아니다.

- 웹 배포: `frontend/docs/deployment.md`, `frontend/deploy/publish.sh`
- PR 검증: `.github/workflows/frontend-ci.yml`
- 앱 빌드: `mobile/README.md`와 iOS 및 Android 빌드 구성
- PostHog 수집: `frontend/src/shared/lib/analytics/posthog/configuration.ts`
- Discord 알림 조건: `frontend/docs/error-tracking.md`

Source와 Commands는 CodePipeline의 액션이다. 별도 CodeBuild 프로젝트, CodeCommit과 CodeDeploy를 웹 배포 경로에 추가하지 않는다. 앱은 Expo가 아닌 React Native Community CLI 기반이며 네이티브 빌드는 웹 CodePipeline과 별개다.

선은 배포와 제공 경로를 간략화한 것이다. Source의 GitHub 아이콘은 원격 저장소 소스 공급자를 나타내고 Commands의 CodePipeline 아이콘은 파이프라인 내부 실행을 나타낸다. CloudFront는 캐시된 콘텐츠를 제공하며 캐시 미스 시 S3에서 원본을 조회한다. User와 Service API는 사용 흐름의 경계이며 백엔드 내부 구조는 포함하지 않는다.

Discord는 문서에서 확인된 새 오류 이슈 알림만 표현한다. 매 예외, 재발 또는 급증 알림까지 설정되어 있다고 주장하지 않는다.

## 이미지 출처

- AWS 서비스 아이콘: [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/)의 2026-07-31 패키지
- 브랜드 로고: [Simple Icons](https://github.com/simple-icons/simple-icons)
- 사용자와 기기 아이콘: [Lucide](https://github.com/lucide-icons/lucide)
- README의 서비스 로고와 화면: 저장소에서 현재 사용 중인 헤더 이미지와 서비스 소개 화면 예시

각 브랜드와 AWS 아이콘의 권리는 해당 소유자에게 있다.
