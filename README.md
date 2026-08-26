![자취선배](docs/assets/key-visual.png)

# 자취선배 MVP2

> **집은 매물 앱에서 찾고, 결정은 자취선배에서.**

여러 플랫폼에서 찾은 매물 후보를 한곳에 모으고, 방문 전·현장·계약 전 확인 내용을 사진과 메모로 기록해 비교하도록 돕는 임차인용 집 선택 도구입니다.

외부 계정 없이 닉네임만으로 시작할 수 있고, 기록 보호가 필요하면 선택 비밀번호를 설정합니다. 매물별 3단계 체크리스트, 실제 사진 업로드, 주소·지도·주변 시설 분석, 선택 매물 비교 PDF와 외부 사용자용 공개 소개 화면을 제공합니다.

## 실행 환경

| 환경 | 브랜치 | 프론트엔드 | 백엔드 |
| --- | --- | --- | --- |
| dev | `develop` | `https://dev.jachwi-sunbae.kr` | `https://dev-api.jachwi-sunbae.kr` |
| prod | `main` | `https://www.jachwi-sunbae.kr` | `https://api.jachwi-sunbae.kr` |

`develop`과 `main` 병합은 GitHub Actions 필수 검사를 거칩니다. 배포는 팀 AWS 계정의 CodePipeline Commands, CodeDeploy, S3와 CloudFront가 담당하며 실제 비밀값은 저장소에 커밋하지 않습니다.

## 문서

### 제품과 디자인

- [제품 문서 안내](docs/product/README.md) — MVP1 기준선, MVP2 범위·명세·흐름·결정의 읽기 순서
- [MVP2 기능 명세](docs/product/specs/README.md) — 인증, 매물, 사진, 메모, 체크리스트, 진행, 지도, 공개 소개
- [MVP2 사용자 흐름](docs/product/flows/mvp2-user-flow.md) — 공개 소개부터 매물 비교까지의 실제 흐름
- [MVP2 와이어프레임](docs/design/wireframes/README.md) — `.pen` 원본과 17개 화면 PNG
- [실험 기록](docs/experiments/)과 [학습](docs/learnings/) — 시점 고정 가설·관측·피벗 이력

### 개발과 운영

- [컨벤션](docs/convention/README.md) — 브랜치·커밋, 이슈·PR, 코드 리뷰, 문서 관리
- [백엔드 문서](backend/docs/README.md) — API·데이터 모델·환경변수·로컬 실행·운영
- [배포 아키텍처](docs/operations/deployment-architecture.md) — 팀 AWS의 dev/prod 구성
- [백엔드 배포](backend/docs/operations/deployment.md)와 [프론트엔드 배포](frontend/docs/deployment.md)

## 저장소 구조

```text
2026-jachwi-sunbae/
├── .agents/              # Codex 문서 검토 Skill
├── .claude/              # Claude Code 규칙·Skill·훅
├── .codex/               # Codex 문서 훅
├── .github/              # Issue·PR 템플릿, CI, 문서 검사
├── backend/              # Spring Boot, MySQL, MinIO, CodeDeploy 파일
├── frontend/             # React, TypeScript, Webpack, S3·CloudFront 배포 파일
├── docs/
│   ├── assets/           # 브랜드와 공개 소개 QR
│   ├── convention/       # 저장소 공통 규칙
│   ├── design/           # 와이어프레임 원본과 화면 이미지
│   ├── experiments/      # 시점 고정 실험 기록
│   ├── learnings/        # 피벗 히스토리와 학습
│   ├── operations/       # AWS 배포 아키텍처와 검증 기록
│   └── product/          # MVP 범위·명세·흐름·결정
├── .editorconfig
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
└── README.md
```

## 로컬 실행

외부 키 없이 demo 지도와 MinIO를 사용합니다.

```bash
cd backend
cp .env.example .env
docker compose up -d
./gradlew bootRun
```

다른 터미널에서 실행합니다.

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

- 앱: `http://localhost:3000`
- 공개 소개: `http://localhost:3000/intro`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- MinIO 콘솔: `http://localhost:9001`

처음 보는 닉네임은 새 기록 공간을 만듭니다. 비밀번호를 비우면 같은 닉네임을 아는 사람이 기록을 함께 수정할 수 있고, 비밀번호를 입력하면 해당 닉네임을 보호합니다. 실제 Kakao 지도와 팀 S3 전환 값은 [환경변수](backend/docs/guides/environment-variables.md)와 [지도 연동](backend/docs/guides/map-integration.md)을 따릅니다.
