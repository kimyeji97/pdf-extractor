# CLAUDE.md — PDF 문항 추출기 프로젝트 가이드

## 프로젝트 개요

기출문제 PDF에서 문항을 자동 감지하고, 원하는 문항을 선택하여 그리드 레이아웃(2/4/6단)으로 새 PDF 문제집을 생성하는 풀스택 웹 서비스.

**핵심 흐름**: PDF 업로드 → 문항 자동 감지 → 문항 선택 → 레이아웃 지정 → PDF 생성/다운로드

## 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| Frontend | React + Vite + TypeScript + MUI | React 19, Vite 7, MUI 7 |
| Backend | Python + FastAPI | Python 3.11(Docker)/3.13(local), FastAPI 0.115 |
| PDF 처리 | pdfplumber(텍스트 추출) + PyMuPDF(렌더링/크롭) | pdfplumber 0.11, pymupdf 1.25 |
| OCR | Tesseract (한국어+영어 fallback) | pytesseract 0.3 |
| Storage | Cloudflare R2 (S3 호환) / 로컬 파일시스템 | boto3 1.35 |
| Infra | AWS ECS Fargate + Cloudflare Tunnel + Cloudflare Workers(프론트 정적 자산) | ap-northeast-2 |

## 디렉토리 구조

```
pdf-extractor/
├── backend/
│   ├── app/
│   │   ├── main.py                         # FastAPI 앱 진입점 (CORS, 라우터 등록, /health)
│   │   ├── core/config.py                  # Pydantic Settings (R2, 스토리지, OCR 설정)
│   │   ├── models/schemas.py               # 요청/응답 Pydantic 모델 (162줄)
│   │   ├── routers/
│   │   │   ├── upload.py                   # 업로드 (presigned URL, 직접 업로드, 파일 서빙)
│   │   │   ├── extract.py                  # 추출 (v1, v2 멀티소스 + 레이아웃)
│   │   │   ├── browse.py                   # 파일/페이지/문항 조회·편집·삭제 (665줄, 최대 라우터)
│   │   │   ├── workbook.py                 # 문제집 CRUD
│   │   │   ├── cover.py                    # 표지 이미지 관리
│   │   │   ├── footnote.py                 # 각주 CRUD — 이름+텍스트 (REQ-29)
│   │   │   ├── watermark.py                # 워터마크 CRUD — 이미지 (REQ-29, 표지와 같은 모양)
│   │   │   └── notification.py             # 완료 알림 조회·읽음 커서 (REQ-F09 Phase 1)
│   │   ├── services/
│   │   │   ├── storage.py                  # 스토리지 팩토리 (local ↔ s3 토글)
│   │   │   ├── local_storage_service.py    # 로컬 파일 기반 스토리지 (개발용)
│   │   │   ├── s3_service.py               # Cloudflare R2 스토리지 (운영용)
│   │   │   ├── pdf_service.py              # PDF 추출 파이프라인 (크롭 + 레이아웃 조립)
│   │   │   ├── thumbnail_service.py        # PyMuPDF 기반 썸네일 생성
│   │   │   ├── notification_service.py     # 알림 저장·조회·30일 lazy 정리 (REQ-F09 Phase 1)
│   │   │   └── textract_service.py         # Tesseract OCR 통합
│   │   └── utils/
│   │       ├── question_parser.py          # 문항 경계 감지 알고리즘 (400줄+, 핵심 로직)
│   │       └── layout_spec.py              # 그리드 레이아웃 상수
│   ├── requirements.txt                    # 10개 의존성
│   └── Dockerfile                          # python:3.11-slim + tesseract + pymupdf
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx                        # 앱 진입점
│   │   ├── App.tsx                         # 루트 컴포넌트 (Outlet)
│   │   ├── App.css                         # 잔존 순수 CSS — `wbp-*`·`pdf-*`만 살아있다 (계약 #4)
│   │   ├── api/client.js                   # API 클라이언트 (470줄, 40+ 함수)
│   │   ├── pages/                          # 라우트 페이지 = 화면 본체 (views/ 없음)
│   │   │   ├── analysis/index.jsx          # 문항 분석 목록 (책 카드 + 업로드)
│   │   │   ├── analysis/work.jsx           # 문항 분석 작업 화면 (뷰어 + 수동 문항)
│   │   │   ├── editor/index.jsx            # 문제집 편집 (선택 → 정렬 → 미리보기)
│   │   │   ├── format/index.jsx            # 표지 관리
│   │   │   └── history/index.jsx           # 생성 이력
│   │   ├── components/                     # UI 컴포넌트
│   │   │   ├── WorkCanvas.jsx              # 작업 화면 셸 — WorkCanvas/CardRow/PanelCard/CardResizeHandle (계약 #19)
│   │   │   ├── PageHeader.jsx              # 페이지 헤더 + 브레드크럼
│   │   │   ├── BookCard.jsx                # 책 은유 카드 (3개 목록 화면 공유)
│   │   │   ├── StatCards.jsx               # 문항분석 현황판 5타일+아코디언 (REQ-F12 — 파일 경로는 계약 #28로 유지)
│   │   │   ├── PdfPreviewPanel.jsx         # PDF 뷰어 (가상화·좌표 변환 — 계약 #2·#6·#7)
│   │   │   ├── QuestionAnalysisPanel.jsx   # 문항 분석 상세
│   │   │   ├── QuestionListPanel.jsx       # 페이지별 문항 목록
│   │   │   ├── SelectionOrderPanel.jsx     # 선택 문항 정렬 바스켓 (DnD)
│   │   │   ├── WorkbookPreview.jsx         # 레이아웃 미리보기 캔버스
│   │   │   ├── FileListPanel.jsx           # 업로드 파일 목록
│   │   │   ├── UploadForm.jsx              # 파일 업로드 폼
│   │   │   ├── ColorSchemeMenu.jsx         # 라이트/다크/시스템 3단 전환 (REQ-D08)
│   │   │   ├── NotificationBell.jsx        # 헤더 벨 + 미읽음 뱃지 + 이력 팝오버 (REQ-F09 Phase 5)
│   │   │   ├── NotificationSnackbar.jsx    # 완료 순간 인앱 스낵바 (App.tsx의 Outlet 밖)
│   │   │   ├── GlobalDim.jsx               # 전역 로딩 딤
│   │   │   ├── common/Logo.tsx
│   │   │   └── loading/PageLoader.tsx
│   │   ├── layouts/                        # 앱 셸
│   │   │   ├── core/                       # 템플릿 조립 primitives (HeaderSection 등)
│   │   │   └── dashboard/                  # layout.tsx · nav.tsx · nav-config.tsx
│   │   ├── theme/                          # MUI 테마 (palette·typography·컴포넌트 오버라이드)
│   │   │   └── tint.js                     # tintBg/tintSx/tintFg — 모드 안전 색조 배경 (계약 #20)
│   │   ├── routes/                         # paths.ts · router.tsx
│   │   ├── contexts/                       # 전역 상태 — NotificationContext (REQ-F09 Phase 2)
│   │   ├── hooks/                          # useDebouncedValue · usePaginatedList · useJobCompletion · useNotificationRefresh (계약 #27)
│   │   ├── lib/utils.ts
│   │   ├── setupTests.js                   # vitest 공용 셋업
│   │   └── utils/workbookLayout.js         # 레이아웃 계산 유틸
│   ├── package.json                        # 32개 의존성 + 테스트 4개(devDependencies)
│   └── vite.config.ts                      # ⚠️ vite.config.js(추적되는 tsc -b 산출물)와 짝
│
├── docs/
│   ├── specs/                              # 요구사항 명세 70+ (REQ-## 넘버링)
│   ├── adr/                                # 아키텍처 결정 기록 (ADR-0001~0003)
│   ├── infra/                              # 인프라 명세 및 배포 가이드
│   └── TODO.md                             # 남은 작업 순서표 (미착수·후속·신규 항목)
│
├── scripts/deploy/backend-build.sh         # dev 백엔드 빌드·ECR 푸시(:latest 갱신) (scripts/ops/ = 운영 스크립트)
├── scripts/deploy/backend-deploy-prod.sh   # prod 백엔드 빌드·배포 한 번에 — `prod-<HEAD>` 태그만 (계약 #37)
├── scripts/deploy/frontend-deploy.sh       # 프론트 빌드·배포 `dev|prod` (인자 필수)
├── QUICKSTART.md                           # 로컬 개발 셋업 가이드
└── README.md                               # 프로젝트 개요
```

## 핵심 아키텍처 패턴

### 1. 스토리지 팩토리 패턴
`storage.py`에서 `STORAGE_BACKEND` 환경변수로 `local` / `s3` 전환. 동일 인터페이스로 로컬 파일시스템(개발)과 Cloudflare R2(운영)를 추상화.

### 2. 비동기 백그라운드 작업
FastAPI `BackgroundTasks`를 사용. 업로드 완료 → 문항 감지, 추출 요청 → PDF 생성이 백그라운드에서 실행되며, 프론트엔드는 `GET /api/status/{job_id}`로 폴링.

**상태 전이**: `PENDING → PROCESSING → DONE | FAILED`

### 3. 문항 감지 알고리즘 (question_parser.py)
프로젝트의 핵심 비즈니스 로직. Adaptive Detection v0.2:
1. **정규식 패턴 매칭**: 한국 시험지 형식 11개 패턴 (문1, 제1문, [1], <1>, 유제1-1 등)
2. **시퀀스 + 갭 감지**: 연속 번호 체인 탐지 + 수직 공백 패턴 분석
3. **2단 레이아웃 감지**: X좌표 히스토그램으로 컬럼 분할점 탐지
4. **스코어링**: coverage × (1 + gap_match_ratio) 로 최적 그룹 선택
5. **OCR fallback**: pdfplumber 실패 시 Tesseract로 선택적 페이지 재분석

### 4. PDF 크롭 전략 (pdf_service.py)
- **전체 페이지** (y1=9999 or 거의 전체): `insert_pdf()` — 벡터 무손실
- **부분 영역**: `show_pdf_page()` + clip — 벡터 클리핑, 래스터화 없음

### 5. 캐싱
- **경계 캐시**: `boundaries/{job_id}.json` — 감지 결과 저장, refresh 시 무효화
- **썸네일 캐시**: `thumbnails/{job_id}/page_{n}.png`, `q_{page}_{num}.png` — 재생성 방지

## API 엔드포인트 전체

### Upload (`routers/upload.py`)
| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/upload` | presigned URL 발급 (R2) 또는 직접 업로드 URL (local) |
| POST | `/api/upload/notify` | 업로드 완료 알림 → 문항 감지 트리거 (R2) |
| POST | `/api/upload/direct` | 직접 multipart 업로드 (local) |
| GET | `/api/files/{key:path}` | 파일 서빙 (local) |

### Extract (`routers/extract.py`)
| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/extract` | v1 단일 PDF 추출 |
| POST | `/api/extract-v2` | v2 멀티소스 추출 + 레이아웃 + 표지 |
| GET | `/api/status/{job_id}` | 추출 상태 폴링 |

### Browse (`routers/browse.py`) — 982줄, 가장 큰 라우터
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/stats` | 전체 통계 — 현황판 5타일용(오탐/미탐지/수동/탐지율 캐시 합산, REQ-F12). 목록이 페이지네이션돼 프론트가 합계를 못 낸다 |
| GET | `/api/stats/detail` | 타일 클릭 시 아코디언 상세 (`?field=` 4종 — 파일·페이지 목록, REQ-F12) |
| GET | `/api/jobs` | 전체 작업 목록 (source/export 분리, 페이지네이션·검색) |
| GET | `/api/jobs/{id}` | 작업 상세 |
| PATCH | `/api/jobs/{id}` | 작업 메타 수정 (이름, 유형) |
| DELETE | `/api/jobs/{id}` | 작업 + 연관 저장물 전체 삭제 |
| POST | `/api/jobs/{id}/refresh` | 문항 재감지 트리거 |
| GET | `/api/jobs/{id}/pages` | 페이지 목록 + 썸네일 |
| GET | `/api/jobs/{id}/pages/{n}/thumbnail` | 페이지 PNG (DPI 설정 가능) |
| GET | `/api/jobs/{id}/questions` | 전체 문항 일괄 조회 (페이지별 N회 호출 제거) |
| GET | `/api/jobs/{id}/pages/{n}/questions` | 페이지 문항 목록 (자동+수동) |
| PATCH | `/api/jobs/{id}/pages/{n}/questions/{q}` | 자동 문항 제목 수정 |
| DELETE | `/api/jobs/{id}/pages/{n}/questions/{q}` | 자동 문항 삭제 |
| POST | `/api/jobs/{id}/pages/{n}/questions/bulk-delete` | 문항 벌크 삭제 |
| POST | `/api/jobs/{id}/pages/{n}/questions/manual` | 수동 문항 추가 (드래그 영역) |
| PATCH | `/api/jobs/{id}/pages/{n}/questions/manual/{mid}` | 수동 문항 제목 수정 |
| DELETE | `/api/jobs/{id}/pages/{n}/questions/manual/{mid}` | 수동 문항 삭제 |
| GET | `/api/jobs/{id}/pages/{n}/questions/{q}/thumbnail` | 자동 문항 크롭 PNG |
| GET | `/api/jobs/{id}/pages/{n}/questions/manual/{mid}/thumbnail` | 수동 문항 크롭 PNG |

### Workbook (`routers/workbook.py`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/workbooks` | 문제집 이력 (페이지네이션·이름 검색) |
| GET | `/api/workbooks/{id}` | 문제집 상세 (편집 복원용 selections 포함) |
| POST | `/api/workbooks` | 문제집 저장 |
| DELETE | `/api/workbooks/{id}` | 문제집 + 결과 PDF 삭제 (REQ-C08) |

### Cover (`routers/cover.py`)
| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/covers` | 표지 업로드 |
| GET | `/api/covers` | 표지 목록 |
| GET | `/api/covers/{id}/image` | 표지 이미지 서빙 |
| DELETE | `/api/covers/{id}` | 표지 삭제 |

### Footnote / Watermark (`routers/footnote.py` · `routers/watermark.py`) — REQ-29
| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/footnotes` | 각주 등록 (이름 + 텍스트 JSON) |
| GET | `/api/footnotes` | 각주 목록 |
| DELETE | `/api/footnotes/{id}` | 각주 삭제 |
| POST | `/api/watermarks` | 워터마크 업로드 (JPEG/PNG, 10MB — 표지와 동일 제한) |
| GET | `/api/watermarks` | 워터마크 목록 |
| GET | `/api/watermarks/{id}/image` | 워터마크 이미지 서빙 |
| DELETE | `/api/watermarks/{id}` | 워터마크 삭제 |

> `extract-v2`가 `footnote_id`·`watermark_id`를 받아 **표지 삽입 이전**(grid PDF 자체)에 반영한다 —
> 그래서 "표지 제외 전 페이지"가 성립한다. 워터마크 반투명 삽입은 **계약 #29**를 따른다.

## 데이터 모델 (schemas.py)

**핵심 Enum**:
- `JobStatus`: PENDING, PROCESSING, DONE, FAILED
- `JobType`: SOURCE (업로드 원본), EXPORT (생성 결과)
- `BoundariesStatus`: PENDING, PROCESSING, DONE, FAILED

**핵심 모델**:
- `JobStatusFile`: 작업 상태 (job_id, status, filename, boundaries_status, questions_per_page 등)
- `QuestionBoundary`: 문항 경계 (number, page_index, y_top, y_bottom, col, col_x0, col_x1, title, is_false_positive, is_manual)
- `CropRegion`: PDF 크롭 좌표 (page_index, x0, y0, x1, y1)
- `ExtractV2Request`: 멀티소스 추출 요청 (selections + layout + cover_id)
- `SelectionItem`: 단일 추출 단위 (job/page/question)
- `ManualQuestion`: 사용자 수동 문항 (UUID 기반 manual_id)

## 로컬 스토리지 디렉토리 구조

```
local_storage/
├── uploads/{job_id}/original.pdf
├── results/{job_id}/result.pdf
├── status/{job_id}.json
├── boundaries/{job_id}.json
├── thumbnails/{job_id}/page_{n}.png
├── thumbnails/{job_id}/q_{page}_{num}.png
├── thumbnails/{job_id}/manual_{page}_{manual_id}.png
├── manual_questions/{job_id}.json
├── covers/{cover_id}/meta.json + image.{jpg|png}
├── footnotes/{footnote_id}.json
├── watermarks/{watermark_id}.json + {watermark_id}.{jpg|png}
└── workbooks/{workbook_id}.json
```

## 배포 토폴로지

```
브라우저 → Cloudflare DNS/CDN
  ├─ Frontend: Cloudflare Workers 정적 자산 `twilight-base-302d` (`wrangler deploy` 수동 — Pages 아님)
  └─ Backend API: Cloudflare Tunnel → ECS Fargate Task
       ├─ backend 컨테이너 (FastAPI :8000)
       └─ cloudflared 컨테이너 (터널 데몬)
            ↓
       Cloudflare R2 (오브젝트 스토리지)
```

**AWS 리소스** (ap-northeast-2):
- ECR: `pdf-extractor-backend`
- ECS Cluster: `pdf-extractor-cluster`
- ECS Service: `pdf-extractor-backend-dev-svc`
- Task: Fargate **2 vCPU / 4GB** (rev 8, 2026-10-01 상향 — 0.5 vCPU / 1GB는 오픈 기준 사용량 피크에서 OOM, [perf-infra-capacity.md](docs/infra/perf-infra-capacity.md))
- Secrets Manager: `pdf-extractor/dev` (R2 자격증명 + 터널 토큰)
- CloudWatch: `/ecs/pdf-extractor-dev` (30일 보존)

**서비스 URL (dev)**:
- Frontend: https://dailystudy-workbook-dev.yejicraft-cf.com
- Backend: https://dailystudy-workbook-api-dev.yejicraft-cf.com
- Swagger: https://dailystudy-workbook-api-dev.yejicraft-cf.com/docs

## 환경 설정

| 설정 | 로컬 개발 | 운영 (dev) |
|------|-----------|------------|
| STORAGE_BACKEND | local | s3 |
| CORS | * (전체 허용) | * (TODO: 제한 필요) |
| Frontend | localhost:5173 | Cloudflare Workers (정적 자산) |
| Backend | localhost:8000 | ECS Fargate via Tunnel |

**백엔드 주요 환경변수**: `STORAGE_BACKEND`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ROOT_PREFIX`, `R2_PUBLIC_DOMAIN`, `TESSERACT_LANG`, `MAX_FILE_SIZE`, `LOCAL_STORAGE_DIR`, `LOCAL_BASE_URL`

**프론트엔드 환경변수**: `VITE_API_BASE_URL`, `VITE_APP_PORT`

## 개발 명령어

```bash
# 백엔드
cd backend
python3.13 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload          # http://localhost:8000

# 프론트엔드
cd frontend
npm install
npm run dev                            # http://localhost:5173

# 배포 (백엔드)
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 504233295989.dkr.ecr.ap-northeast-2.amazonaws.com
docker buildx build --platform linux/amd64 --push -t 504233295989.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-backend:latest ./backend
aws ecs update-service --cluster pdf-extractor-cluster --service pdf-extractor-backend-dev-svc --force-new-deployment --region ap-northeast-2

# 배포 (프론트엔드) — Workers `twilight-base-302d`, 자동 배포 없음. `wrangler login`은 비대화형 셸에서 못 한다(사용자에게 요청)
# ⚠️ `.env.local`이 localhost라 셸 env로 덮어야 한다 (Vite는 셸 env > .env*). 안 덮으면 dev에 localhost가 박힌다
cd frontend
VITE_API_BASE_URL=https://dailystudy-workbook-api-dev.yejicraft-cf.com/api npm run build
npx wrangler deploy                    # frontend/wrangler.jsonc (assets=./dist, SPA 폴백)
```

## 요구사항 명세 체계 & 계획 번호 부여 (docs/specs/)

### 넘버링 규칙

명세 파일명: `YYYYMMDD-REQ-{prefix}{seq}-{kebab-slug}.md`

`REQ-{prefix}{seq}`의 prefix는 작업 성격을 나타낸다:

| Prefix | 의미 | 점유 범위 (2026-10-02) |
|--------|------|-----------|
| (숫자) | 핵심·v2·v3 기능 (기획 단위) | REQ-01~30 |
| `B` | 버그 수정 (Bug) | REQ-B01~B29 |
| `C` | 보완 기능 (Complement) | REQ-C01~C11 |
| `D` | 디자인·레이아웃 변경 (Design) | REQ-D01~D11 |
| `E` | 실험·인프라성 기능 (Enhancement) | REQ-E01~E02 |
| `F` | 프론트 UX 개선 (Frontend) | REQ-F01~F18 |
| `P` | 성능 (Performance) | REQ-P01~P06 |

기능 대분류 참고: REQ-01~09(핵심), REQ-10~15(v2), REQ-16~26(v3), REQ-27~28(계정·공유), REQ-29~30(템플릿).

> "점유 범위"는 **미착수·기각 번호를 포함한다.** 번호는 한 번 부여하면 재사용하지 않는다.

### 계획 번호 추출 방식

새 작업의 번호는 **해당 prefix의 마지막 seq + 1**로 부여한다.

> ⚠️ **`ls docs/specs/`만 보면 안 된다.** 스펙 파일 없이 번호만 점유된 REQ가 여럿이다 —
> 구현됐지만 스펙이 없는 것(C08), 제안 단계에서 예약된 것(REQ-27·REQ-28 — D08·F09·D09·F10·D10도
> 이 경로로 예약됐다가 스펙 없이 계획서만으로 완료됐다).
> 파일 목록만 믿고 부여하면 **이미 남이 쓰기로 한 번호와 충돌한다.**
> **[`docs/PROGRESS.md`](docs/PROGRESS.md)의 요구사항 인덱스(특히 "미착수 — 번호만 부여된 것" 표)가
> 단일 출처다.** 아래 명령은 교차 확인용으로만 쓴다.

```bash
# 스펙 파일 + 인덱스를 함께 본다 (둘 중 하나만 보면 놓친다)
{ ls docs/specs/; cat docs/PROGRESS.md; } | grep -oE 'REQ-[A-Z]?[0-9]+' | sort -u
```

2026-10-06 기준 각 prefix 다음 번호: `B30`(B29 = 메타 저장 실패 알림 🟡), `C12`, `D12`, `E03`, `F19`, `P07`, 숫자 `31`.
(2026-09-30에 착수 대기 13건을 **B21·B22·F14·F15·C10·C11·P06**으로 예약했다 — 전부 미착수이고 REQ-28은 ⏸.
예약분은 PROGRESS "미착수 — 번호만 부여된 것" 표가 단일 출처다. 번호는 완료돼도 재사용하지 않는다)

## 진행 현황

**시간순 작업 로그와 REQ 상태 인덱스는 [`docs/PROGRESS.md`](docs/PROGRESS.md)에 있다.**
조회는 `/progress [오늘|어제|금주|전주|N일|REQ번호]`, 기록은 `/checkpoint`.

- 남은 작업 순서·미래 작업(아직 REQ 번호 없음): `docs/TODO.md` (2026-08-28 확정, 구 `예정된작업.md`는 삭제)
- **현재 위치 (2026-10-01)**: REQ-27(로그인) 이후 dev 확인 중 나온 버그를 **B14~B20**으로 모두 닫았다 —
  마지막 B20은 HWP 출력 PDF의 숨은 번호 오탐과 문항 식별자 충돌(ADR-0006)이었다. 2026-09-30에 착수 대기 13건을
  B21·B22·F14·F15·C10·C11·P06으로 예약했고, **B21·B22·F14·F15(PR #26)와 C10(PR #27, 문항 원문 이름)을 dev 확인까지 끝냈다.**
  진행 중인 REQ는 없다. 남은 예약 없음 — P06은 2026-10-02 완료(REQ-28 공유는 ⏸). C11(유제 감지)은 2026-10-01 기각 — 2026-10-06 오픈 후 실사용 케이스를 보고 재검토.
  **개별 REQ의 상태·완료일·PR 번호는 [`docs/PROGRESS.md`](docs/PROGRESS.md) 인덱스가 단일 출처다** —
  여기에 옮겨 적지 않는다(옛 이력을 이 절에 쌓다가 실제와 반대로 읽히는 문단이 됐다).
- ⚠️ **REQ-29·30·F13의 잔여 위험** — ①**s3 스토리지 경로**: 자동 테스트는 계약 #24 격리로 항상
  local 백엔드라 안 덮인다. **다만 `backend/.env`가 `STORAGE_BACKEND=s3` + dev R2라 로컬로 띄우면
  실제로 s3 구현이 돈다** — 표지·각주·워터마크·템플릿 스토리지는 그렇게 실제 동작을 확인했다.
  **미검증으로 남는 것은 ECS 배포 경로뿐이다.** ②**브라우저 end-to-end**: 생성·편집·템플릿 관리
  화면은 렌더 무대가 없어 소스 스캔까지만 덮인다(`WorkbookPreview`만 REQ-F13에서 진짜 렌더
  테스트가 됐다). 밀려 있던 프론트 변경은 2026-09-28 dev에 한 번에 반영됐다(아래 배포 상태).
- ⚠️ **렌더 무대 없는 화면(`editor`·`format`·`work`)을 고치면 `npm run build`를 따로 돌린다** —
  소스 스캔 테스트는 JSX를 **컴파일하지 않으므로** 케이스가 전부 녹색이어도 문법 오류를 못 잡는다.
  어떤 테스트도 그 파일들을 import 하지 않기 때문이다 (REQ-30 Phase 2 실측).

### 배포 상태 (세션마다 필요한 사실)

⚠️ **prod 백엔드는 2026-10-05에 띄웠고(REQ-E02 ✅), 당분간(약 한 달) 사용자가 직접 켜고 끄며 월 비용을 본다** — 서비스 `pdf-extractor-backend-prod-svc` · 태스크 정의 `pdf-extractor-backend-prod:3` · 이미지 **`prod-51acedb`(버전 태그 고정, `:latest` 금지 — 2026-10-06 B29 반영. rev 1·2 는 deregister)** · 시크릿 `pdf-extractor/prod` · 로그 `/ecs/pdf-extractor-prod` · API `https://dailystudy-workbook-api.yejicraft-cf.com` · R2 `dailystudy`(prefix `pdf-extractor`). **`desired 0`이어도 장애가 아니다 — 켜고 끄는 건 사용자 몫이니 임의로 켜거나 끄지 말 것.** 상태는 `describe-services`로 직접 본다. prod 프론트는 2026-10-05 Worker **`dailystudy-workbook-prod`**(`wrangler.jsonc` `env.prod`, 커스텀 도메인 `https://dailystudy-workbook.yejicraft-cf.com`, Version `32ad6a44`, 앱 코드 = `c11b8a7`)로 배포됐다 — 2026-10-05 F18까지 갱신 — `frontend-deploy.sh prod`. 상세는 [PLAN-E02](docs/plans/PLAN-E02-prod-environment.md).

⚠️ **dev 백엔드는 2026-10-05 main `eaa7f38`(B28까지, 이미지 태그 `b28-eaa7f38` = `:latest`)로 배포돼 있고, 육안 확인 뒤 사용자가 `desired 0`으로 내렸다.** (F18은 프론트 전용이라 dev 백엔드 재배포가 필요 없었다. 실행 당시 태스크 digest `sha256:ffca2c03…` 가 ECR 과 일치함을 확인했다.)
(F17은 `pdf_service`가 바뀌어 **백엔드 배포가 따라왔다** — B25처럼 프론트 전용이 아니었다. 실행 digest `04af8fb8…`가 ECR `f17-25ee3d2`와 일치함을 확인했다.)
(**쓸 때만 켠다** — 2 vCPU / 4GB라 켜 두면 약 $85/월 추정, 꺼 두면 ~$2/월. 내릴 때는 `--desired-count 0`). 태스크 정의는 **rev 8**(2 vCPU / 4GB · `:latest` +
`JWT_SECRET_KEY` secret · 터널 기본 QUIC, 2026-10-01 — rev 4는 deregister). 빌드는 `scripts/deploy/backend-build.sh [접두사]`(latest + 커밋 해시 태그, provenance 끔).
⚠️ **콘솔 "서비스 업데이트"는 최신 활성 리비전을 기본으로 고른다** — 실험용 리비전을 만들면 반드시
deregister할 것(2026-09-28 프로브 rev 3이 이렇게 배포됐다, PROGRESS 참조).
⚠️ **dev 프론트는 2026-10-05 main `c11b8a7` 빌드(F18까지, Worker Version `e7e4bbe7`)다** — 실체는 Pages가 아니라
**Workers `twilight-base-302d`**이고 **자동 배포가 없다**(push로 안 올라간다). 프론트를 바꾸면 위
"배포 (프론트엔드)" 두 줄(= `scripts/deploy/frontend-deploy.sh dev` — 2026-10-05부터 `dev|prod` 인자 필수)을 손으로 돌려야 한다. 그래서 **dev 프론트가 main보다 뒤처진 것이 정상**이다
(2026-08-28 배포 정책 — 변경은 모아서 한 번에). **"dev에서 안 보인다"를 버그로 읽지 말 것.**
⚠️ **그러나 이 줄을 믿고 배포 여부를 판정하지 말 것 — 수동 배포라 기록이 뒤처지기도 앞서기도 한다.**
2026-10-03에 B26을 배포하려 했더니 전날 머지와 같은 분에 이미 떠 있었고(이 줄은 "B27까지", PROGRESS는 "배포 전"이었다) 재배포가 `No updated asset
files to upload`로 드러났다. 라이브를 직접 본다: ① `npx wrangler deployments list | grep '^Created:' | tail -5`
② 라이브 `index.html`의 `assets/*.js` 참조 ↔ 로컬 `dist/index.html`(Vite 내용 해시라 일치 = 같은 번들) ③ 그 변경의 고유 문자열을 라이브 청크에서 grep.
⚠️ dev R2 버킷 CORS는 코드가 아니라 버킷 설정이다(wrangler OAuth로만 닿음, 08-27 dev 오리진 추가).
이 머신에 awscli·docker·AWS 자격증명이 구성돼 배포가 가능하다.
⚠️ **docker 런타임은 머신마다 다르다** — **개인맥은 Docker Desktop**(`open -a Docker`), **회사맥은 colima**(`colima start`).
데몬이 꺼져 있으면 `backend-build.sh`가 `Cannot connect to the Docker daemon`으로 죽는다. 한쪽만 적어 두면
다른 머신에서 `colima not found`를 매번 한 번씩 겪는다(2026-10-03 개인맥에서 실제로 걸렸다) —
런타임 이름을 가정하지 말고 `docker info`로 데몬부터 확인할 것.
⚠️ **`wrangler login` 세션은 사라져 있을 수 있다** — 2026-10-03에 자격증명이 없었다(`~/Library/Preferences/.wrangler`가 새로 생성됨).
**비대화형 셸에선 OAuth 로그인을 끝낼 수 없으므로** 사용자에게 `npx wrangler login`을 요청해야 한다(또는 `CLOUDFLARE_API_TOKEN`).
**`--temporary`로 우회하지 말 것** — 임시 계정에 붙어 엉뚱한 Worker로 배포된다.

## 계약 (깨면 회귀하는 것들)

> 아래는 전부 **실제로 한 번 이상 깨져서 버그가 났던** 규칙이다. 배경과 재현 경위는
> `docs/PROGRESS.md`의 해당 날짜 항목에 있다. 코드를 고치기 전에 여기부터 확인할 것.
>
> **번호는 고정 ID다 — 재배치하지 않는다.** 새 계약은 주제에 맞는 절에 넣되 번호는 뒤에서 이어 붙인다.
> 그래서 절 안의 번호가 이어지지 않을 수 있다(레이아웃 절의 #18·#19). 한 번 번호를 밀었다가
> 같은 `#6`이 두 문서에서 다른 것을 가리키는 혼란을 겪었다(Phase 3-4). 외부 참조가 깨지는 비용이
> 번호가 예쁜 것보다 크다.

### 레이아웃

1. **높이 체인** — 이 앱은 body가 스크롤되는 문서형이 아니라 **100dvh 작업대**다.
   root → sidebarContainer → main 전 구간에 `flex:1` / `minHeight:0` / `overflow:hidden`이 걸려 있어야 한다.
   한 군데만 빠져도 내부 패널 스크롤이 죽는다. (REQ-B04·B05·B08의 공통 원인)
2. **`PdfPreviewPanel` 소비처 계약** — 소비처가 **flex 컬럼 부모**
   (`display:flex; flexDirection:column; minHeight:0`)를 제공해야 정상 스크롤된다.
3. **`.pdf-page-wrapper { position: relative }`** — 제거 금지.
   빠지면 각 페이지 오버레이(`absolute; inset:0`)가 상위 positioned 조상에 겹쳐 쌓여
   **마지막 페이지 오버레이가 전체 드래그를 가로챈다**(수동 문항 좌표가 마지막 페이지로 고정됨).
4. **`App.css` 클래스는 지우기 전에 사용처를 전수 확인한다** — 과거 `wbe-*` 데드코드 정리 때
   같은 블록에 섞여 있던 `qlist-*`가 함께 삭제돼 문항 선택 스타일이 통째로 날아갔다.
   남아 있는 살아있는 접두사는 **`wbp-*`(WorkbookPreview) · `pdf-*`(PdfPreviewPanel)** 뿐이다.
   (`qap-*`는 Phase 3-4, `qlist-*`는 Phase 3-5에서 MUI 전환과 함께 **정당하게** 제거됐다 —
   이 둘을 되살리지 말 것. 컴포넌트가 더는 그 클래스를 쓰지 않는다.)
5. **flex 컬럼 목록 안의 카드는 `flexShrink: 0`** — 안 걸면 카드가 기본 `flex-shrink:1`로 축소되고,
   카드의 `overflow:hidden`이 축소된 만큼 **내부 이미지를 잘라낸다**(실측 카드 133px vs 이미지 415px).
   **목록이 스크롤되지 않아 증상이 "이미지가 좀 짧다"로만 보인다** — 스크롤 여부만 측정하면 놓친다.
   종전 순수 CSS 카드는 자기 자신이 `display:flex`라 min-content 높이가 버텨 줬다.
   MUI `Paper`는 블록이라 그 보호가 사라진다. (REQ-D07 Phase 3-4)
18. **테마 CSS 변수 접두사는 `--palette-*`** (`--mui-palette-*`가 아니다).
    틀린 이름을 써도 **에러 없이 상속색으로 조용히 떨어진다** — 실측 시 의도한 `rgb(145,158,171)`
    대신 `rgb(99,115,129)`가 나왔다. Phase 1에서 죽은 `--aurora-palette-*`가 한동안 살아남은 것도
    같은 이유다. **raw `var(...)` 대신 sx 토큰**(`color: "text.disabled"`)을 쓰고,
    iconify `Icon`처럼 sx가 없는 것은 부모 Box에 색을 주고 currentColor를 상속받게 한다.
    (REQ-D07 Phase 4)
19. **작업 화면은 `WorkCanvas`/`CardRow`/`PanelCard` 조합을 쓴다** — 2안 카드 레이아웃에서
    높이 체인 래퍼가 한 겹 늘어나는데, 화면마다 손으로 쓰면 계약 #1이 깨지는 지점이 4곳이 된다.
    카드 사이 여백은 `CardResizeHandle`이 만든다 — `CardRow`에 `gap`을 같이 걸면 간격이 두 배가 된다.
    (REQ-D07 Phase 4)
20. **팔레트의 `*.lighter`·`*.darker`·`*.main`은 라이트/다크가 공유한다** — 모드별로 갈리는 것은
    `text`·`background`·`action` 셋뿐이다(`palette.ts`의 `basePalette`는 공유). 그래서 선택·활성
    강조 배경에 `primary.lighter`를 쓰면 **다크에서 어두운 화면에 파스텔 블록이 박힌다.**
    하드코딩 hex가 아니라 **정상 토큰을 썼는데 깨지므로 grep으로 안 잡히고**, 콘솔·빌드도 조용하다.
    → 색조 배경은 `theme/tint.js`의 **`tintBg`/`tintSx`/`tintFg`**를 쓴다(main 채널 알파 + 모드별 글자색).
    **예외는 "흰 지면 위"에 그려지는 것뿐**(`work.jsx`의 드래그 오버레이) — 종이는 다크에서도 희다.
    ⚠️ `tintSx`/`tintFg`는 **함수를 반환**한다. 객체 sx에 `...tintSx('primary')`로 스프레드하면
    **아무것도 안 들어가고 에러도 안 난다** — `sx={(theme) => ({ ...tintSx('primary')(theme) })}`.
    (REQ-D08. 계약 #18과 같은 "조용히 틀린 색" 계열)
36. **뱃지·칩의 색과 이름은 `frontend/src/utils/badges.js` 한 곳에서만 정한다** — 감지 상태(`detectionBadge`: 대기 default
    "대기 중" · 분석 중 info · 실패 error "분석 실패" · 완료 success "N문항") · 표식(`MARK_COLOR`: 오탐 warning · 수동 secondary) ·
    그 외 정보성 칩(`INFO_CHIP`: primary 테두리형). 화면마다 표를 들고 있다가 **같은 "분석 중"이 info·warning·"감지 중…" 세 가지**가
    됐고 "수동"은 세 색이었다(REQ-F14). 새 칩은 여기서 가져다 쓴다 — F14-18·19가 import와 옛 이름을 스캔하지만 칩 하나하나는 못 본다.
    ⚠️ **`default`(회색)는 MUI 팔레트 키가 아니다** — `tintSx('default')`/`tintBg('default')`는 `palette.default` 가 없어 **화면이 죽는다.**
    회색 배경은 모드별로 갈리는 `action.selected`·`text.secondary` 토큰으로 칠한다(현황판 대기 타일, 계약 #20과 같은 이유)

### PDF 뷰어

6. **좌표 변환은 `pt = cssPx / scale` 단일 공식** — react-pdf가 pt×scale로 렌더하기 때문.
   실측 오차 <1px(Phase 3-4 재측정 시 왕복 0.00px). 다른 공식을 끼워 넣지 말 것.
7. **가상화 `scrollToPage`는 대상의 "이전" 페이지를 강제 렌더하지 않는다** —
   렌더하면 그 페이지가 아직 0px인 상태로 누적 높이가 계산돼 **한 페이지 짧게 안착**한다.
   대상 + 다음 페이지만 렌더 큐에 넣는다.
   ⚠️ **"강제 렌더"만이 그 경로가 아니다 — 외부 이동 요청은 `numPages`가 아니라 첫 쪽 실측이
   도착한 뒤에 발행한다.** `onDocumentLoadSuccess`가 `pageSizes`를 비우고 `renderedPages`를 `{1}`로
   되돌리므로, `numPages`만 보고 발행하면 그 커밋에서 1쪽은 **렌더됐지만 아직 0px**이고 2쪽 이후
   placeholder는 A4 기본값(595×842)으로 깔린다 — 같은 "한 페이지 짧게" + 비A4는 쪽 수에 비례해
   어긋난다(B5 516×729로 150쪽 점프 시 ~23쪽). 게이트는 `pageSizes`가 비었는지로 본다.
   **jsdom에는 레이아웃이 없어 이 계열은 테스트로 안 보인다** — B25에서 케이스 8건이 녹색인 채로
   결함이 남아 `/review` 코드 읽기로 발견됐다. 적용 시점을 바꿀 땐 dev 육안(212쪽)이 유일한 판정이다.
   (REQ-B25)

### 백엔드

8. **미들웨어 등록 순서** — `add_middleware`는 **나중에 등록한 것이 바깥쪽**이다.
   `TimeoutMiddleware`를 `CORSMiddleware`보다 **먼저** 등록해야 CORS가 바깥을 감싸고,
   타임아웃 504 응답에도 CORS 헤더가 붙어 프론트가 CORS 에러가 아닌 진짜 504로 인식한다.
   ⚠️ **단, 앱 밖에서는 보장되지 않는다** — dev(Cloudflare Tunnel 경유)의 504에는 CORS 헤더가 없었다(같은 경로
   401·200엔 있음, 로컬 uvicorn 504엔 있음). 순서가 맞아도 **Cloudflare 쪽 5xx는 브라우저에 CORS 에러로 보일 수 있다**
   — "CORS 에러"를 보면 설정보다 상태 코드·백엔드 로그부터 볼 것. (REQ-B19 Phase 2, 대체 여부는 미확인)
9. **`job_type` 쿼리는 대문자 enum** (`SOURCE`/`EXPORT`). 소문자는 422.
10. **PDF 한글 텍스트는 `TextWriter` + `fitz.Font("korea")`** — PyMuPDF 1.25.5에는
    `Document.add_font`가 없어 helv로 폴백되고 한글이 점으로 깨진다.
11. **문항 감지 정확도 > 성능** — adaptive 감지를 조건부로 건너뛰는 최적화는
    문항 15개 누락을 유발해 기각했다(P03-06). 감지 경로에 성능 트레이드오프를 넣지 않는다.
29. **PyMuPDF `Page.insert_image()`의 `mask`는 `Pixmap`이 아니라 bytes-like(png 등)여야
    하고, `pixmap=`이 아니라 `stream=`(원본 이미지 바이트)과 짝을 이뤄야 한다** — `mask`에
    `Pixmap` 객체를 그대로 넘기면 `TypeError`, `pixmap=`과 함께 쓰면 `mask requires stream
    or filename` `ValueError`가 난다(실측, PyMuPDF `utils.py`의 `insert_image` 소스로 확인,
    REQ-29 워터마크 반투명 삽입). 반투명 이미지를 넣을 땐 원본 바이트를 `stream=`으로,
    알파 마스크는 별도로 인코딩한 bytes를 `mask=`로 넘길 것.
    ⚠️ **그리고 `mask`는 원본 알파를 곱하는 게 아니라 통째로 대체한다.** 균일한 회색 마스크를
    넘기면 **투명해야 할 배경까지 반투명**이 되고, 그 자리 RGB가 보통 (0,0,0)이라 **연회색
    사각 박스**로 보인다(실측: 흰 종이 255 위에 217). 원본에 알파가 있으면 **원본 알파 ×
    투명도**로 마스크를 만들 것 — 알파가 없는 원본(JPEG 등)만 균일 마스크가 옳다.
    형식(위)은 맞는데 의미론(이것)을 모르면 **에러 없이 그림만 틀린다.** 미리보기(CSS
    `opacity`)는 알파를 곱하므로 **미리보기와 PDF가 갈리고, 틀린 쪽은 PDF다.**
    (REQ-29에서 들어와 REQ-F13이 미리보기를 만들면서 드러났다 — F13-21이 회귀를 막는다)
32. **엔티티를 새로 만드는(생성) 라우터에 인증을 걸 때는 `owner_id` 채움을 반드시 같이 한다** —
    인증만 걸고 생성 코드에서 `owner_id`를 안 채우면 레코드는 계속 `owner_id=None`으로
    저장되고, `ensure_owner_or_admin`은 `owner_id is not None`일 때만 소유자 일치를 검사하므로
    **`None`인 레코드는 admin만 통과**시킨다. 그 결과 로그인한 일반 사용자가 방금 자기가
    만든 리소스를 조회하면 **404**가 난다 — 인증을 걸었는데 오히려 더 못 쓰게 되는 역설이고,
    에러 로그도 조용하다(형식은 맞는데 의미론을 놓치는 계열, 계약 #18·#20·#29와 같은 결).
    REQ-27 Phase 2가 조회/수정 6개 엔티티 API에만 인증을 걸고 **생성 경로**(`upload.py`·
    `extract.py`)는 범위 밖에 둬서 실제로 이 상태였다(2026-09-18 발견 → REQ-B14).
    **새 라우터에 인증을 걸 때(계약 #30·#31과 짝)는 그 라우터가 만드는 레코드에 `owner_id`를
    채우는 코드가 같이 들어가는지도 확인할 것.**
33. **새 오탐 판정은 `detect_question_boundaries`의 Step 5-b(`_apply_precision_improvements`) 뒤에 넣는다** —
    5-b가 `b.is_false_positive = _is_false_positive(...)`로 **대입해 덮어쓴다**(OR가 아니다). 그 앞에서 표시하면
    에러 없이 사라진다. 5-c 색상 필터처럼 이미 오탐인 항목을 건너뛰는 판정은 순서만 맞으면 된다.
    그리고 오탐으로 **표시한 경계도 `_fill_y_bottom` 자르기에서 빼지 않는다** — 빼면 "유형 N" 제목 같은
    오탐 줄이 앞 문항 크롭에 딸려 들어온다(변형 실측: 앞 문항 하단 318.9 → 390.5). (REQ-B18 — 정규식 전용
    경계 오탐 표시. 형식은 맞는데 조용히 틀리는 계열, 계약 #18·#20·#29·#32와 같은 결)
34. **조회 엔드포인트는 문항 감지를 돌리지 않고 상태 파일도 쓰지 않는다** — 경계 캐시가 없으면 문항 목록은
    빈 결과, 문항 썸네일은 404다. 감지는 업로드·재감지 경로(B17 동시 5개 한도 안)에서만 돈다.
    예전엔 캐시 미스 때 요청 안에서 동기 감지로 폴백하고 `boundaries_status`를 무조건 `DONE`으로 덮어썼다.
    212쪽은 0.5 vCPU에서 30초를 넘겨 504가 났고, **`TimeoutMiddleware`(`asyncio.wait_for`)는 응답만 끊을 뿐
    스레드풀의 동기 `def`는 끝까지 돌아** 새로고침마다 감지가 하나씩 쌓였다. FAILED도 조용히 DONE이 됐다.
    **"타임아웃이 있으니 무거운 작업도 안전하다"는 가정이 틀렸다.** (REQ-B19 — B17이 FAILED 전환을 만들며
    캐시 없는 job이 목록에 정상적으로 뜨게 되자 드물던 폴백이 주 경로가 됐다)
35. **문항 감지의 두 경로(정규식·adaptive)는 같은 단어 필터를 쓴다** — 지금 기준은 `size <= 1.0`(보이지 않는 글자) 제외.
    B18의 위치 병합은 **두 경로가 같은 글자를 본다**고 전제한다. 정규식만 거르고 adaptive가 안 거르자, HWP 출력 PDF에 숨은
    0.1pt 번호가 빈틈없는 수열로 adaptive 1위가 되고 **보이는 진짜 번호가 "정규식 전용 = 오탐"으로 뒤집혔다**(테스트02 경계
    393→840·오탐 8→378). 필터를 한쪽에 더할 때는 다른 쪽에도 — adaptive 안에서도 수열 탐색과 여백 계산 두 곳이다(단 분할점이
    갈린다). **감지 변경 실측에는 HWP 출력 PDF를 넣는다** — 기출 4종엔 숨은 글자가 거의 없어 B18 실측이 이 회귀를 못 봤다. (REQ-B20)

39. **`fitz.Font("korea")`는 한글 전용 폰트가 아니라 `Droid Sans Fallback Regular`다** — 이름에 속지 말 것(실측:
    `fitz.Font("korea").name`, 로컬·Docker·dev 산출물 모두 동일). 완성형 한글(`가`~`힣`)은 있지만 **한글 자모
    블록(U+1100~U+11FF)이 거의 없다.** 그리고 `TextWriter.append()`는 글리프 없는 문자를 **에러 없이 notdef(`\x00`)로
    치환한다** — 예외도 로그도 없다. 단 종성 `ᆨ`(U+11A8)처럼 **일부 자모는 있어서** 깨진 결과에 `ㄱ`이 한 글자 섞여
    나온다 — "폰트가 한글을 아예 못 그린다"로 읽으면 오진한다. (REQ-B28)
40. **PDF에 그리는 사용자 문자열은 `_draw_text()` 안에서 NFC로 정규화한다** — **macOS가 올린 파일명은 NFD(자모 분해)**
    라(`학` = `ᄒ`+`ᅡ`+`ᆨ`), 그대로 그리면 계약 #39에 걸려 **글자가 통째로 사라진다.** 같은 글자가 Windows/Linux
    업로드에서는 NFC로 와서 **재현이 macOS 업로드에서만 된다.**
    ⚠️ **브라우저는 NFD를 정상 렌더한다**(폰트 폴백이 조합해 준다) — 그래서 **미리보기 화면에서는 영원히 안 드러나고
    생성된 PDF에서만 드러난다.** 실제로 dev에서 미리보기는 멀쩡한데 PDF만 깨진 상태로 발견됐다.
    ⚠️ **문자열만 비교하는 단위 테스트는 통과한다** — `build_source_label()`은 글자를 만들 뿐 그리지 않는다.
    회귀를 막으려면 **렌더한 PDF를 `get_text()`로 되읽는** 케이스여야 한다.
    정규화는 **그리는 자리**에 둔다 — `pdf_service`의 **`_draw_text()` 하나**가 글자를 그리는 통로이고 거기서
    정규화한다(호출부는 라벨·각주 둘). `build_source_label()` 안에 넣으면 각주가 안 덮이고, 그 함수는 프론트와
    **글자 그대로** 같아야 하는 짝이라(계약 #12) 한쪽만 정규화하면 비교가 어긋난다.
    ⚠️ **"통로가 하나"는 테스트가 보장해 주지 못한다 — 소스 스캔은 구문만 본다.** B28-06은 `fitz.TextWriter`라고
    **쓰인** 생성지가 `_draw_text()` 안에만 있는지 보므로, 별칭(`import fitz as _fitz`)·`from fitz import TextWriter`·
    `getattr(fitz, "TextWriter")`·`page.insert_htmlbox()`는 **못 잡는다**(실측). 열거 방식을 세 번 바꿔 가며 세 번 샜고
    (`/review` 회차 0·1·2) 네 번째도 같아서 2026-10-05 감수했다 — 현시점 생성지가 한 자리뿐이라 노출이 0이다.
    **글자를 새로 그릴 일이 생기면 반드시 `_draw_text()`를 거칠 것.** (REQ-B28 — 계약 #18·#20·#29·#33과 같은
    "형식은 맞는데 조용히 틀리는" 계열)

### 동기화가 필요한 짝

12. **라벨 문자열** — 프론트 `WorkbookPreview`와 백엔드 `pdf_service`가 같은 문자열을 그린다.
    `sel.label` 단일 출처를 유지할 것.
13. **배율 상수** — `backend/app/utils/layout_spec.py`의 `MIN/MAX_CELL_SCALE`·`CELL_SCALE_STEP` ↔
    `frontend/src/utils/workbookLayout.js`.
14. **`WorkbookPreview`의 `PAPER` 색은 토큰화하지 않는다** — UI 색이 아니라 생성될 PDF 지면을
    재현한 값이고 `pdf_service`의 라벨 배경과 짝을 이룬다.
21. **`index.html`의 사전 페인트 스크립트는 테마 설정과 3중으로 묶여 있다** — 저장 키 `mui-mode`
    (MUI `modeStorageKey` 기본값) · 속성명 `data-color-scheme`(`theme-config.ts`의
    `colorSchemeSelector`) · 배경 hex `#141A21`/`#F9FAFB`(`grey[900]`/`grey[100]`).
    한쪽만 바꾸면 **에러 없이 다크 사용자에게 흰 화면이 번쩍인다**(FOUC). 번들 로드 전 구간은
    테마 프로바이더가 못 막으므로 이 스크립트가 유일한 방어선이다. (REQ-D08)

### 데이터

15. **썸네일 URL은 결정적이다** (`/api/jobs/{id}/pages/{n}/thumbnail`) —
    URL을 얻으려고 목록 API를 추가 호출하지 말 것(REQ-P02-02에서 제거한 낭비).
16. **문항 ID는 복합키** (ADR-0006, ADR-0002 대체) — `{job_id}:{page}:{num}:{k}`, 수동은 `…:manual:{uuid}`.
    `k`는 같은 쪽·같은 번호 안 순번(위에서부터 0) — B18 위치 병합 뒤로 한 쪽에 같은 번호가 공존한다("유형 01" 제목 ↔ "1.").
    **k가 없으면 k=0**(옛 ID·저장 선택·`?k=` 생략 요청·썸네일 키 `q_{쪽}_{번호}.png`) — 지금 동작("그 쪽 그 번호의 첫 경계")과 같다.
    번호만 쓰면 멀티 파일 문제집에서 키가 충돌하고, k를 빼면 공존 쌍이 같은 썸네일·같은 삭제 대상이 된다.
17. **`workbook_name`은 고유하지 않다** — 사용자 자유 입력이라 서로 다른 파일이 같은 이름을
    가진다(실데이터에 "테스트03" 2건). **식별·구분·색 해시의 키는 항상 `job_id`**로 하고,
    이름은 표시용으로만 쓴다. 이름으로 해시하면 두 출처가 같은 색·같은 글자가 되어
    구분 기능이 조용히 죽는다 — 목록 화면(1권 1카드)에선 안 드러나고 출처가 나란히 놓이는
    편집 화면에서만 드러난다. (REQ-D07 Phase 3-5 브라우저 검증에서 발견)
22. **프론트 폴링의 `DONE` 분기에 영속 부수효과를 두지 않는다** — 그 분기는 **화면 수명에 묶여**
    있다(언마운트에서 `clearInterval`). 넣어도 되는 것은 화면이 살아 있는 동안만 의미가 있는 것
    (UI 상태 전환·진행 표시)뿐이고, **저장·기록처럼 남아야 하는 일은 서버가 완료 시점에 한다.**
    문제집 메타 저장이 이 분기에 있어서, 생성 중 화면을 떠나면 **PDF는 만들어지는데 생성 이력에는
    영원히 안 나타났다** — 사용자에겐 "생성 실패"로 보이고 결과물은 고아가 된다. 서버·프론트 어느
    쪽도 에러를 내지 않아 로그로도 안 잡힌다. (REQ-B10)
23. **문제집 메타의 저장 주체는 백엔드 하나다** — `extract-v2`의 백그라운드 작업이 생성 성공 시
    `_save_workbook_meta()`로 쓴다. **프론트에서 `POST /api/workbooks`를 다시 부르면 이력에
    같은 문제집이 2건 뜬다**(`workbook_id`가 매번 새로 발급되므로 중복으로도 안 잡힌다).
    저장 주체는 요청의 **`workbook_name` 유무**로 갈린다 — 있으면 백엔드가 쓰고, 없으면(구 프론트)
    쓰지 않는다. 그러니 이 필드에 **기본값을 채우면 안 된다.** 값이 아니라 존재 여부가 의미다.
    `client.js`의 `createWorkbookMeta`는 구 프론트 호환용으로 남아 있을 뿐 **호출하지 않는다.**
    (REQ-B10 Phase 1~3)

### 테스트

24. **테스트의 스토리지 격리는 `os.environ` "덮어쓰기"로 한다 — `pop`은 `.env`를 못 막는다.**
    `backend/.env`는 gitignore지만 **실제로 존재하고 `STORAGE_BACKEND=s3` + dev R2 자격증명을
    담고 있다**(`.env.dev`도 같은 내용 — **둘 다 추적 금지.** `.env.dev`는 2026-07-04~08-21 추적돼
    공개 레포에 키가 노출됐고, 추적 해제 + `.env.*` 무시 규칙으로 막았다. 실제 값 파일에 접미사를
    붙이면 `.gitignore`를 비껴간다). 격리 없이 테스트를 띄우면 **dev 실데이터에 붙어
    쓰고 지운다.** pydantic Settings의 우선순위는 `os.environ` > `.env`이므로 —
    - `os.environ["STORAGE_BACKEND"] = "local"`처럼 **값을 덮으면** `.env`를 이긴다.
    - `os.environ.pop("R2_BUCKET_NAME")`처럼 **지우면 아무 효과가 없다.** pydantic이 `.env`에서
      다시 읽는다. 빈 값으로 덮어야(`os.environ[k] = ""`) 실제로 비워진다.
    설정을 강제하는 코드는 **어떤 `app.*` 임포트보다 위**에 있어야 한다 — `storage`는 임포트
    시점에 백엔드를 고르고 `local_storage_service._BASE`도 그때 고정되므로 나중에 바꿔도 늦다.
    `conftest.py`의 세션 픽스처가 이 격리를 단언으로 지킨다. **그 단언을 약화시키지 말 것** —
    실패는 조용한 오염 대신 나는 굉음이다. (REQ-F09 Phase 1, 2026-08-07 실측)

25. **케이스 ID를 테스트명에 박는다** — 백엔드 `test_F09_01_…`, 프론트 `it('[F09-18] …')`.
    계획서 `## 검증 계약` 표의 `ID` 열과 **글자 그대로** 맞아야 한다. 어기면 `/testrun`의
    필터(`pytest -k 'F09'` · `vitest -t 'F09-'`)가 **에러 없이 0건**을 반환하고, 0건은
    초록색으로 보인다 — 표와 코드를 잇는 끈이 이 ID 하나뿐이라 끊기면 추적이 통째로 죽는다.
    같은 이유로 **근거 인용은 원문의 줄바꿈을 넘지 않는 범위에서 딴다.** `grep -F`는 줄
    단위라 여러 줄에 걸친 인용은 원문이 멀쩡해도 0건이 되고, 그러면 "스펙이 바뀌었다"는
    신호와 구별되지 않는다(F09-22에서 실제로 발생). (REQ-F09 Phase 1~2)
    ⚠️ **프론트 컴포넌트는 앱과 같은 `ThemeProvider`(`theme/theme-provider`) 아래에서 렌더한다.**
    `theme/tint.js`가 `theme.vars.palette`를 읽으므로 provider 없이 렌더하면
    `Cannot read properties of undefined (reading 'palette')`로 죽는다 — **구현 결함이 아니라
    테스트가 앱과 다른 무대를 그린 것**이다. 같은 계열로 `renderHook().unmount()` 뒤
    `rerender()`도 React가 거부한다(루트는 살리고 화면 컴포넌트만 언마운트할 것).
    ⚠️ **타이머를 스파이하는 케이스에서 `waitFor`를 쓰지 않는다** — `@testing-library/dom`의
    `waitFor`가 **내부적으로 `setInterval`로 폴링한다.** "인터벌을 만들지 않는다"류 단언과
    함께 쓰면 **어떤 구현도 통과할 수 없다**(측정 도구가 측정 대상에 섞인다). `act` 플러시로
    기다린다. 셋 다 **단언이 아니라 무대가 틀린 경우**이고, 단언에 닿기 전에 터져 원인 판독을
    방해한다. (REQ-F09 Phase 3·5 · REQ-F11 Phase 1 실측)

28. **컴포넌트를 다른 파일로 옮기며 교체하면, 그 파일 경로를 `vi.mock('components/X', ...)`로
    가로채던 무관한 테스트가 조용히 깨진다.** `vi.mock`은 **모듈 경로**를 가로채지 컴포넌트
    이름을 가로채지 않는다 — 새 파일(`StatsBoard.jsx` 등)로 옮기면 그 mock은 더는 아무것도
    가로채지 못하고, 옛 컴포넌트를 스텁으로 바꿔 두던 무관한 테스트에서 **실제 컴포넌트가
    처음으로 렌더돼** 그 테스트의 (일부러 축약해 둔) `api/client` mock에 없는 함수를 호출해
    터진다(실측: `headerSearchRemoval.test.jsx`·`menuRename.test.jsx`가 `components/StatCards`를
    가로채고 있었는데, 내용을 새 `StatsBoard.jsx`로 옮기자 "No getStats export" 로 깨짐,
    REQ-F12 Phase 2). **기존 컴포넌트의 내용을 통째로 바꿀 때는 새 파일을 만들지 말고
    기존 파일 경로를 그대로 쓴다** — 그 경로를 가로채는 테스트가 있는지 먼저
    `grep -rn "vi.mock('components/<이름>'"` 로 확인할 것.

30. **기존 라우터에 인증을 새로 얹으면, 그 라우터를 무인증으로 부르던 기존 테스트가 전부
    401로 깨진다.** 라우터 하나에 인증 미들웨어·의존성(`get_current_user` 등)을 추가하는
    순간 그 경로를 호출하는 모든 기존 케이스가 영향권에 든다 — 새 기능의 테스트만 늘려서는
    안 잡힌다. **admin으로 로그인한 인증 클라이언트 픽스처(예: `authed_client`)를 만들어
    기존 테스트가 그걸 쓰도록 일괄 갱신할 것** — admin은 소유권 필터를 받지 않으므로 인증
    도입 이전의 "제약 없는 접근" 동작을 그대로 재현해, 그 테스트들의 원래 의도(기능 검증)를
    깨지 않고 인증 요건만 통과시킬 수 있다. (REQ-27 Phase 2 — job·workbook·cover·footnote·
    watermark·template 6개 라우터에 인증을 걸자 REQ-29·30·F09·F12·F13의 기존 테스트가
    한꺼번에 깨졌다. `conftest.py`에 `authed_client` 추가로 해결)

### 프론트엔드

26. **상시·배경 경로(알림 기준선 GET·`EventSource` 스트림)는 `apiFetch`를 거치지 않는다** — `client.js`의
    `apiFetch`는 **GET에도** `_setLoading(+1)`을 걸어 `GlobalDim`(전역 딤)을 켠다. 사용자가 시키지 않은
    요청에 쓰면 화면이 번쩍인다. `getStatus`·`getJobInfo`·`listNotifications`가 raw `fetch`이고
    `NotificationContext`가 raw `EventSource`인 것은 누락이 아니라 이 때문이다 — **관례를 따를수록
    틀리는 자리**라 명시해 둔다. (REQ-F09 Phase 2 · REQ-P04 Phase 2에서 폴링→SSE로 바뀌어도 동일)
    ⚠️ **알림·SSE 이벤트로 목록을 다시 읽는 것도 배경 요청이다** — `listJobs`·`getStats`는 `apiFetch`라 그대로 부르면
    **완료 알림이 올 때마다 전역 딤이 켜졌다**(REQ-F14에서 발견). 배경 재조회는 `{ background: true }`로 부른다(raw fetch +
    `_authHeaders()`, 계약 #31). 사용자가 누른 조회(검색·새로고침 버튼)는 옵션 없이 — 딤·토큰 갱신이 그대로다.
    그리고 **저장하지 않는 SSE 이벤트**(`read`·`status`)는 알림 목록·미읽음 수에 넣지 않는다 — 넣으면 벨 뱃지·스낵바에 뜬다.
    `status`(감지 상태 전환, REQ-F14)는 받은 횟수만 `useStatusEvents()`로 내고, **별도 컨텍스트**다(`useNotifications()` 값 키는
    `notifications,unreadCount`로 P04 테스트에 고정 · Provider 밖 0).

27. **알림 피드를 구독할 때는 기준선을 잡는다** — 피드는 **최근 30일치**를 담고 있어서
    (첫 진입 시 최신 50건) "내 `job_id`의 알림이 피드에 있나"로 판정하면 **작업을 시작하자마자
    지난주 알림을 보고 즉시 완료로 튄다.** `useJobCompletion`은 감시를 시작하는 순간 이미 있던
    알림을 '처리됨'으로 찍어 이걸 막는다 — **새 화면이 피드를 직접 구독하지 말고 훅을 쓸 것**
    (특정 job은 `useJobCompletion`, 목록 재조회는 `useNotificationRefresh`). 목록 쪽은 이유가
    하나 더 있다 — 재조회를 피드 갱신마다 걸면 **알림/이벤트가 올 때마다 목록 API(페이지네이션 + 썸네일)가
    돈다**(폴링 시절엔 5초마다였다. REQ-P03에서 걷어낸 병목과 같은 계열). 신규가 있을 때만, 여러 건이 와도 1회만 읽는다.
    ⚠️ 전달 경로가 SSE(REQ-P04)로 바뀌어도 기준선은 그대로 필요하다 — 재연결 시 `Last-Event-ID`로 밀린 알림이
    한꺼번에 오므로, 기준선 없이 구독하면 앱을 연 순간 30일치 스낵바가 쏟아지는 사고가 같은 모양으로 난다.
    기준선은 `useEffect`가 아니라 **기준선 GET이 돌아온 뒤의 렌더 중에** 잡아야 한다 —
    `useNotificationsReady()`가 참이 되는 렌더에서 잡는다(effect로 미루면 그 사이 커밋에서
    옛 알림이 이미 처리된다). "렌더 중"만 지키고 **첫 렌더에서 잡으면 기준선이 빈 배열**이라
    GET 도착분 전체가 신규로 보여 새로고침마다 직전 알림이 토스트로 떴다(REQ-B11).
    증상이 "가끔 즉시 완료로 뜬다"라 재현이 어렵다.
    자동 다운로드처럼 **화면에 묶여야 하는 부수효과는 이 훅의 콜백 안에 둔다** — 훅이 화면
    수명에 묶여 있다는 사실이 B10 불변식을 지키는 방식이다(계약 #22). (REQ-F09 Phase 3)
    ⚠️ **서버의 `unread_count`는 단조 증가하지 않는다** — 읽음 커서 **이후** 개수라
    `mark_all_read()` 뒤 0으로 리셋되고 새 알림마다 1부터 다시 센다. 그래서 뱃지를
    **개수 비교로 가리면 안 된다**(`unread > 마지막에 읽은 개수`). 미읽음 3건일 때 읽으면
    그 뒤 도착한 알림이 1이라 **뱃지가 영영 안 뜬다** — 2026-08-10 육안 검증에서 실제로
    이 상태였다. 가릴 거면 개수가 아니라 **최신 알림의 키**로 가린다(F09-47). (REQ-F09 Phase 5)

31. **계약 #26의 raw fetch 예외는 백엔드가 그 엔드포인트를 보호 라우트로 바꾸면 조용히 깨진다** —
    `apiFetch`를 거치지 않는 함수(`getJobInfo`·`uploadCover`·`uploadWatermark`)는 `Authorization`
    헤더를 자동으로 못 받는다. REQ-27 Phase 2가 `/api/jobs/{id}`·`/api/covers`·`/api/watermarks`에
    인증을 걸면서 이 셋이 로그인 후에도 401이 날 뻔했다 — Phase 4 구현 중 발견해 각각에
    `_authHeaders()`를 직접 붙여 해결했다(에러 없이 조용히 새는 계열이라 계약 #18·#20과 같은
    "관례를 따를수록 틀리는 자리"). **라우터 하나에 인증을 새로 걸 때(계약 #30과 짝)는 그
    엔드포인트를 부르는 raw fetch 호출도 함께 확인할 것.** (REQ-27 Phase 4)
    ⚠️ **raw fetch만이 아니다 — 브라우저가 URL을 직접 여는 곳(`<img src>`·`<a href>`·react-pdf 로딩)은
    헤더를 아예 못 붙인다.** 그런 엔드포인트에 헤더 전용 인증(`get_current_user`)을 걸면 테스트는
    녹색인데(테스트 클라이언트는 헤더를 붙인다) 브라우저에서 전부 401이 난다 — REQ-27 Phase 2가
    썸네일·표지·워터마크 이미지에 이렇게 걸어 dev에서 이미지가 전부 깨졌다(REQ-B15). 이런 엔드포인트는
    `get_current_user_allow_cookie`(헤더 우선, 없으면 access 쿠키)를 쓴다. **쿠키 인증은 GET 조회에만**
    — 상태를 바꾸는 엔드포인트에 쓰면 CSRF 표면이 생긴다. 테스트는 헤더 없이 쿠키만 가진 `https`
    클라이언트로 쓴다(`Secure` 쿠키는 http 요청에 안 실린다). (REQ-B15)
    ⚠️ **이 규칙은 테스트가 강제한다** — `frontend/src/api/client.statusAuth.test.js`(B23-03)가 `client.js`를 스캔해 raw fetch
    export 함수는 `_authHeaders()`를 부르거나 **무인증 예외 목록**(`logout`뿐 — 알림 두 함수는 REQ-B27로 인증이 붙어 빠졌다)에 있어야
    통과시킨다. 새 raw fetch를 만들면 헤더를 붙이거나, 백엔드가 정말 무인증일 때만 예외 목록에 **이유와 함께** 올린다.
    문서만으로는 `getStatus`를 놓쳐 PDF 생성 폴링이 401이 됐다(REQ-B23).
    ⚠️ **그 스캔은 `client.js` 한 파일만 본다 — 다른 파일의 raw fetch 는 안 잡힌다.**
    REQ-F16 이 `utils/savePdf.js` 에 첫 사례를 만들었다(결과 PDF 를 받아 저장). 거기선 **오리진에 따라 일부러 갈린다** —
    우리 API 면 `credentials`+`_authHeaders()`, **R2 공개 도메인·presigned 면 맨 CORS GET**이다.
    자격을 전부 붙이면 R2 버킷 CORS 에 `AllowCredentials` 가 없어 브라우저가 응답을 통째로 막고,
    presigned 에 `Authorization` 을 붙이면 400 이다(실측 — F16 리뷰 회차 1에서 주 경로가 깨졌다).
    **`client.js` 밖에 raw fetch 를 만들면 그 파일에 맞는 가드를 직접 둘 것** — B23-03 은 거기까지 안 본다.

### 배포 (prod)

37. **prod 태스크 정의의 backend 이미지는 버전 태그로 고정한다 — `:latest` 금지** — dev는 `:latest`라 `backend-build.sh`가
    `latest`를 덮어쓰면 다음 재시작 때 따라간다. prod가 같은 태그를 쓰면 **dev에 올린 미검증 이미지가 prod 태스크 재시작
    (장애 복구·스케일)에 조용히 실린다** — 배포한 적 없는데 바뀐다. 그래서 prod 이미지는 `prod-<커밋>` 태그만 푸시하고
    `latest`는 건드리지 않는다. cloudflared는 예외로 `:latest`(2026-10-05 사용자 결정 — 보안 패치 자동 수용).
    ⚠️ 콘솔 "서비스 업데이트"는 최신 활성 리비전을 고르므로 실험 리비전은 deregister(배포 상태 절, 2026-09-28). (REQ-E02)
38. **R2 공개 URL을 만드는 경로를 새로 추가하면 prod WAF 허용 경로도 함께 고친다** — prod 공개 도메인
    `dailystudy.yejicraft-cf.com`은 WAF 규칙 `dailystudy-prod-r2-public-paths`가 `/pdf-extractor/` 안에서
    **`uploads/`·`results/`만** 통과시킨다(`users/{id}.json` 등 버킷 전체가 무인증·무만료로 열리는 걸 막으려고).
    지금 공개 URL을 만드는 코드는 `generate_download_presigned_url` 호출부(원본·결과) 둘뿐이다. 썸네일 등을 공개 URL로
    바꾸면 **dev엔 규칙이 없어 dev·테스트 모두 녹색인데 prod에서만 403**이 난다. `R2_ROOT_PREFIX`를 바꿔도 같다.
    규칙은 대시보드에서만 고친다(wrangler OAuth는 zone `read`뿐). 같은 버킷의 `docs/`(환불 정책 공개)는 규칙 밖이다. (REQ-E02)

## 상시 이슈

- 인증/인가 미구현 (CORS 전체 허용 상태)
- 테스트는 **REQ 단위로 붙은 것만 있다** — 알림 경로(F09·B11·C09·P04·P05) · D09/F10 · D10 · D11 · B12 ·
  F12 · REQ-29. 최근 실측은 2026-09-11 `/testrun`의 **백엔드 83 · 프론트 140**(회귀 없음)이다.
  **문항 감지(`question_parser`)·PDF 생성 본체는 여전히 0건**이고, `work.jsx`·`editor/index.jsx`·
  `format/index.jsx`는 **렌더 무대가 없어**(API mock 5~6개 필요) 소스 스캔·순수 함수 분리로만 검증한다.
  실행: `cd backend && pip install -r requirements-dev.txt && pytest` (계약 #24) ·
  `cd frontend && npm test` (vitest)
- 페이지별 문항 API 개별 호출 성능 문제 → REQ-P01/REQ-P02에서 다룸

## ADR (Architecture Decision Records)

- **ADR-0001**: ECS Fargate 선택 (Lambda 대비 실행시간 제한 없음, 컨테이너 표준화)
- **ADR-0002**: 문항 ID 복합키 ({job_id}:{page_num}:{question_num}, 수동은 UUID) — **대체됨 → ADR-0006**
- **ADR-0003**: 배경색 오탐 후처리 (픽셀 분석으로 전체 페이지 문항 감지)
- **ADR-0004**: 템플릿은 **참조** 조합 (스냅샷 기각 — 대가로 dangling 처리 A′·E가 따라온다)
- **ADR-0005**: 인증은 세션 쿠키가 아니라 JWT(access+refresh)
- **ADR-0006**: 문항 ID에 같은 쪽·같은 번호 안 순번 k를 항상 붙인다(k 없으면 0 — y 좌표·쪽 안 전체 순번·겹칠 때만 접미사 기각)
