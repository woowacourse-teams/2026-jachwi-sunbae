# 자취선배 프론트엔드

- 상태: MVP2 구현 완료
- 문서 성격: 파생
- 대조 대상: `frontend/package.json`, `frontend/webpack.config.js`, `frontend/.env.example`, `frontend/src/`

React 19·TypeScript 6·Webpack 5 기반 모바일 우선 SPA입니다. 백엔드 실행과 전체 로컬 절차는 [로컬 개발](../backend/docs/guides/local-development.md)을 따릅니다.

## 설치와 실행

Node.js는 [`.nvmrc`](./.nvmrc)의 `22.23.1`을 사용합니다.

```bash
nvm use
npm ci
cp .env.example .env.local
set -a
source .env.local
set +a
npm run dev
```

기본 `.env.example`은 외부 키가 필요 없는 닉네임 인증·데모 지도 모드입니다. `.env.example`을 `.env.local`로 복사하면 Webpack이 빌드 시작에 그 값을 읽습니다(`.env.local`은 저장소에 올라가지 않으며, 이미 설정된 셸 환경변수를 덮어쓰지 않습니다). `http://localhost:3000`에서 닉네임과 선택 비밀번호로 바로 시작합니다.

백엔드 없이 UI fixture만 확인하려면 `npm run dev:mock`을 사용합니다. MSW는 개발 빌드에서만 켜지며 운영 번들에는 포함되지 않습니다.

## 공개 빌드 설정

| 환경변수                   | 데모 기본               | 설명                                  |
| -------------------------- | ----------------------- | ------------------------------------- |
| `API_BASE_URL`             | `http://localhost:8080` | 백엔드 기준 URL                       |
| `MAP_PROVIDER_MODE`        | 키가 있으면 `naver`     | `demo` 또는 `naver`                  |
| `NAVER_MAP_CLIENT_ID`      | 비움                    | `naver` 모드의 공개 Maps Client ID   |
| `META_PIXEL_ID`            | 비움                    | 동의 기반 Meta Pixel 공개 데이터셋 ID |

JWT secret, 지도 Client Secret, S3 자격증명은 프론트에 넣지 않습니다. `META_PIXEL_ID`가 비면 광고 측정 고지와 Pixel을 모두 비활성화합니다. 실제 지도 설정은 [환경변수](../backend/docs/guides/environment-variables.md)와 [지도 외부 연동](../backend/docs/guides/map-integration.md)을 따릅니다.

## 화면과 경로

| 화면      | 경로                                                      | 기능                                              |
| --------- | --------------------------------------------------------- | ------------------------------------------------- |
| `00`      | `/login`                                                  | 닉네임과 선택 비밀번호로 시작                     |
| 공개 안내 | `/intro`, `/privacy`                                      | 서비스 소개와 광고 측정 동의·철회                 |
| `01`      | `/properties`                                             | 최근 활동순 매물, 단계별 진행 현황, PDF 비교 진입 |
| 매물 비교 | `/compare`                                                | 2~5개 매물 선택과 전체 기록 PDF 다운로드          |
| `02`      | `/properties/new`                                         | 이름·보증금·월세 입력 후 지도에서 주소 확정       |
| `03`      | `/properties/:propertyId`                                 | 기본·부가 정보 즉시 수정, 사진·메모·체크 요약     |
| `03-1`    | `/properties/:propertyId/photos`                          | 업로드·대표 지정·삭제                             |
| `03-2`    | `/properties/:propertyId/memo`                            | 네 개 구조화 메모와 자유 메모 저장                |
| `03-3`    | `/properties/:propertyId/edit`                            | 위치가 없는 매물의 주소·좌표 보정                 |
| `04`      | `/properties/:propertyId/active-checklists/:stage`        | 기본 또는 내 체크리스트 적용·교체                 |
| `05`      | `/properties/:propertyId/checklists/:propertyChecklistId` | 상태 즉시 저장·메모 자동 저장·진행 집계           |
| `06`      | `/checklists`                                             | 현장 단계 내 체크리스트 목록                      |
| `08`      | `/checklists/:checklistId`                                | 체크리스트 상세·수정                              |
| `09`      | `/checklists/new`                                         | 기본·선택 항목 조합 생성                          |
| `10`      | `/me`                                                     | 계정·모드·주요 기능 이동·로그아웃                 |
| `13-1`    | `/map`                                                    | 현재 위치 500m 시작·검색창·매물 핀과 시세 표시    |
| `13-2`    | `/map/select-location`                                    | 현재 위치·접힌 주소 검색·역지오코딩               |
| `13-3`    | `/properties/:propertyId/nearby`                          | 반경별 시설 개수·선택 시설 핀 상세·스크롤 목록    |

하단 메뉴는 홈·체크리스트·지도·마이를 제공합니다. 모든 보호 화면은 조회 중·저장 중·빈 결과·오류·재시도 상태를 제공하고 키보드 포커스와 명시적 label을 유지합니다.

## 상태와 보안

- Access Token은 탭 단위 `sessionStorage`에 `expiresAt`과 함께 저장해 새로고침만 복구합니다. `localStorage`에는 쓰지 않습니다.
- 401·만료·로그아웃은 인증 Query Cache와 토큰을 함께 지웁니다.
- 사진 콘텐츠는 URL을 `<img>`에 직접 주지 않고 Bearer 인증 Blob으로 조회해 Object URL을 만든 뒤 해제합니다.
- 사진은 JPEG·PNG·WebP, 파일당 5MiB, 매물당 30장으로 선택 단계부터 검증합니다.
- 서버 상태는 TanStack Query가 관리하고, 체크 항목 상태와 메모 저장 채널은 서로 독립적입니다.
- Meta Pixel은 사용자가 명시적으로 동의한 뒤에만 불러옵니다. 페이지 방문·신규 닉네임 생성·첫 매물 등록 여부만 전송하며 닉네임·비밀번호와 매물 기록 내용은 보내지 않습니다.

## 검사

```bash
npm run lint
npm run format:check
npm test
npm run build
```

`npm run build`는 번들 생성 전에 `npm run typecheck`를 실행합니다. 개발 중 타입 오류만 빠르게 확인하려면 `npm run typecheck`를 직접 실행합니다.

실제 모바일 브라우저 확인은 운영 엔트리포인트를 `390x844`와 일반 모바일 폭에서 실행해 17개 경로와 주요 CRUD·체크·지도 흐름을 확인합니다.
