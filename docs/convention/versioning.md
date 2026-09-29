# 버전 관리

## 기본 원칙

- 저장소 루트의 `VERSION`을 제품 버전의 단일 기준으로 사용한다.
- 백엔드, 프론트엔드, iOS, Android는 같은 제품 버전을 사용한다.
- 제품 버전은 `MAJOR.MINOR.PATCH` 형식의 시맨틱 버저닝을 따른다.
- 배포 전에 `python3 .github/scripts/check_versions.py`로 버전 동기화를 검사한다.

## 버전 증가 기준

- `MAJOR`: 기존 API, 데이터 또는 핵심 사용자 흐름과 호환되지 않는 변경
- `MINOR`: 하위 호환되는 기능이나 지원 플랫폼 추가
- `PATCH`: 하위 호환되는 버그 수정, 성능 개선 또는 내부 리팩터링

이번 React Native 앱 추가는 지원 플랫폼이 늘어나는 하위 호환 기능이므로 제품 버전을 `1.1.0`으로 설정한다.

## 네이티브 빌드 번호

iOS의 `CURRENT_PROJECT_VERSION`과 Android의 `versionCode`는 제품 버전과 별도로 관리하는 배포 빌드 번호다. 앱 스토어에 새 빌드를 업로드할 때마다 이전 값보다 크게 증가시킨다.

## 릴리스 태그

운영 릴리스가 `main`에 반영된 뒤 `vMAJOR.MINOR.PATCH` 형식으로 태그를 생성한다. 개발 브랜치나 `develop` 반영 시점에는 릴리스 태그를 만들지 않는다.
