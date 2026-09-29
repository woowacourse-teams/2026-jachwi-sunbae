# 변경 내역

이 문서는 제품 릴리스별 사용자 영향과 주요 변경을 기록한다.

## [Unreleased]

아직 릴리스하지 않은 변경을 기록한다.

## [0.0.0] - 2026-09-29

### Added

- FSD Lite 기반 프론트엔드 아키텍처를 도입한다.
- React Native WebView 기반 iOS·Android 앱 셸을 추가한다.
- 제품 버전을 백엔드·프론트엔드·iOS·Android에 동기화하고 CI에서 검증한다.

### Changed

- 앱 환경에서 웹 분석 SDK가 실행되지 않도록 분리한다.
- 개인정보·모바일 실행·배포 문서를 보강한다.

### Performance

- WebView 지도 마커 위치 갱신을 `transform` 기반으로 최적화한다.
- 매물 사진 Object URL을 재사용해 지도 확대·이동 중 불필요한 재생성을 줄인다.

[Unreleased]: https://github.com/woowacourse-teams/2026-jachwi-sunbae/compare/v0.0.0...HEAD
[0.0.0]: https://github.com/woowacourse-teams/2026-jachwi-sunbae/releases/tag/v0.0.0
