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
│   │   │   ├── StatCards.jsx               # 통계 카드 (GET /api/stats)
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
│   └── 예정된작업.md                       # 예정 작업 메모
│
├── deploy/backend-build.sh                 # 백엔드 빌드 스크립트
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
| GET | `/api/stats` | 전체 통계 (통계 카드용). 목록이 페이지네이션돼 프론트가 합계를 못 낸다 |
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
- Task: Fargate 0.5 vCPU / 1GB Memory
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

# 배포 (프론트엔드) — Workers `twilight-base-302d`, 자동 배포 없음. `wrangler login`은 이 머신에 돼 있다
# ⚠️ `.env.local`이 localhost라 셸 env로 덮어야 한다 (Vite는 셸 env > .env*). 안 덮으면 dev에 localhost가 박힌다
cd frontend
VITE_API_BASE_URL=https://dailystudy-workbook-api-dev.yejicraft-cf.com/api npm run build
npx wrangler deploy                    # frontend/wrangler.jsonc (assets=./dist, SPA 폴백)
```

## 요구사항 명세 체계 & 계획 번호 부여 (docs/specs/)

### 넘버링 규칙

명세 파일명: `YYYYMMDD-REQ-{prefix}{seq}-{kebab-slug}.md`

`REQ-{prefix}{seq}`의 prefix는 작업 성격을 나타낸다:

| Prefix | 의미 | 점유 범위 (2026-07-29) |
|--------|------|-----------|
| (숫자) | 핵심·v2·v3 기능 (기획 단위) | REQ-01~28 |
| `B` | 버그 수정 (Bug) | REQ-B01~B09 |
| `C` | 보완 기능 (Complement) | REQ-C01~C08 |
| `D` | 디자인·레이아웃 변경 (Design) | REQ-D01~D10 |
| `E` | 실험·인프라성 기능 (Enhancement) | REQ-E01 |
| `F` | 프론트 UX 개선 (Frontend) | REQ-F01~F10 |
| `P` | 성능 (Performance) | REQ-P01~P03 |

기능 대분류 참고: REQ-01~09(핵심), REQ-10~15(v2), REQ-16~26(v3), REQ-27~28(계정·공유).

> "점유 범위"는 **미착수·기각 번호를 포함한다.** 번호는 한 번 부여하면 재사용하지 않는다.

### 계획 번호 추출 방식

새 작업의 번호는 **해당 prefix의 마지막 seq + 1**로 부여한다.

> ⚠️ **`ls docs/specs/`만 보면 안 된다.** 스펙 파일 없이 번호만 점유된 REQ가 여럿이다 —
> 구현됐지만 스펙이 없는 것(C08), 제안 단계에서 예약된 것(D08·F09·D09·F10·D10·REQ-27·REQ-28).
> 파일 목록만 믿고 부여하면 **이미 남이 쓰기로 한 번호와 충돌한다.**
> **[`docs/PROGRESS.md`](docs/PROGRESS.md)의 요구사항 인덱스(특히 "미착수 — 번호만 부여된 것" 표)가
> 단일 출처다.** 아래 명령은 교차 확인용으로만 쓴다.

```bash
# 스펙 파일 + 인덱스를 함께 본다 (둘 중 하나만 보면 놓친다)
{ ls docs/specs/; cat docs/PROGRESS.md; } | grep -oE 'REQ-[A-Z]?[0-9]+' | sort -u
```

2026-08-10 기준 각 prefix 다음 번호: `B11`, `C09`, `D11`, **`F12`**, `P05`, 숫자 `29`.
(그 사이 점유: `B10`·`F09`·`F11`·`P04`)

## 진행 현황

**시간순 작업 로그와 REQ 상태 인덱스는 [`docs/PROGRESS.md`](docs/PROGRESS.md)에 있다.**
조회는 `/progress [오늘|어제|금주|전주|N일|REQ번호]`, 기록은 `/checkpoint`.

- 미래 작업(아직 REQ 번호 없음): `docs/예정된작업.md`
- 진행 중: **REQ-D07** 프론트 전면 리디자인 — Phase 1~4 완료(스펙 §4-2).
  **REQ-D08(라이트/다크) 완료** · **REQ-F09(완료 알림) v1 완료**(Phase 6 브라우저 알림은 이연) ·
  **REQ-F11(재감지 중 진입 차단) 완료** — 남은 것은 REQ-27 로그인.
  ⚠️ **dev 백엔드는 2026-08-18 `main`으로 배포됐고(rev 2·`latest`), 2026-08-21 프론트 검증을 위해
  `desired 1`로 켜 둔 상태** — 확인 끝나면 `--desired-count 0`으로 내린다(~$23/월 → ~$2/월). **dev 프론트는 2026-08-21 `main`(8-10 빌드)으로 배포됐다** —
  실체는 Pages가 아니라 **Workers `twilight-base-302d`**이고 **자동 배포는 없다**(push로 안 올라간다).
  프론트를 바꾸면 위 "배포 (프론트엔드)" 두 줄을 손으로 돌려야 한다.
  진행 중: **REQ-P04**(상시 폴링 → 서버 푸시) — **Phase 0(인프라 실측) 완료 2026-08-18**: 경로 통과,
  오리진 무전송 125s에 edge가 끊음 → heartbeat 30s. Phase 1~는 `/workplan`으로 정의 예정.
  이 머신에 awscli·docker(colima)·AWS 자격증명이 구성돼 배포가 가능하다.
  (상세: [F09 계획서](docs/plans/PLAN-F09-completion-notification.md) ·
  [F11 계획서](docs/plans/PLAN-F11-analysis-detail-entry-guard.md) ·
  [D07 스펙](docs/specs/20260725-REQ-D07-minimal-template-adoption.md) §4-1,
  [D08 스펙](docs/specs/20260729-REQ-D08-dark-mode.md))

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

### PDF 뷰어

6. **좌표 변환은 `pt = cssPx / scale` 단일 공식** — react-pdf가 pt×scale로 렌더하기 때문.
   실측 오차 <1px(Phase 3-4 재측정 시 왕복 0.00px). 다른 공식을 끼워 넣지 말 것.
7. **가상화 `scrollToPage`는 대상의 "이전" 페이지를 강제 렌더하지 않는다** —
   렌더하면 그 페이지가 아직 0px인 상태로 누적 높이가 계산돼 **한 페이지 짧게 안착**한다.
   대상 + 다음 페이지만 렌더 큐에 넣는다.

### 백엔드

8. **미들웨어 등록 순서** — `add_middleware`는 **나중에 등록한 것이 바깥쪽**이다.
   `TimeoutMiddleware`를 `CORSMiddleware`보다 **먼저** 등록해야 CORS가 바깥을 감싸고,
   타임아웃 504 응답에도 CORS 헤더가 붙어 프론트가 CORS 에러가 아닌 진짜 504로 인식한다.
9. **`job_type` 쿼리는 대문자 enum** (`SOURCE`/`EXPORT`). 소문자는 422.
10. **PDF 한글 텍스트는 `TextWriter` + `fitz.Font("korea")`** — PyMuPDF 1.25.5에는
    `Document.add_font`가 없어 helv로 폴백되고 한글이 점으로 깨진다.
11. **문항 감지 정확도 > 성능** — adaptive 감지를 조건부로 건너뛰는 최적화는
    문항 15개 누락을 유발해 기각했다(P03-06). 감지 경로에 성능 트레이드오프를 넣지 않는다.

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
16. **문항 ID는 복합키** (ADR-0002) — `{job_id}:{page}:{num}`, 수동은 `…:manual:{uuid}`.
    번호만 쓰면 멀티 파일 문제집에서 키가 충돌한다.
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
    담고 있다**(`.env.dev`와 바이트 동일). 격리 없이 테스트를 띄우면 **dev 실데이터에 붙어
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

### 프론트엔드

26. **폴링 경로는 `apiFetch`가 아니라 raw `fetch`를 쓴다** — `client.js`의 `apiFetch`는
    **GET에도** `_setLoading(+1)`을 걸어 `GlobalDim`(전역 딤)을 켠다. 폴링에 쓰면 주기마다
    화면 전체가 번쩍인다. `getStatus`·`getJobInfo`·`listNotifications`가 raw `fetch`인 것은
    누락이 아니라 이 때문이다 — **관례를 따를수록 틀리는 자리**라 명시해 둔다.
    (REQ-F09 Phase 2)

27. **알림 피드를 구독할 때는 기준선을 잡는다** — 피드는 **최근 30일치**를 담고 있어서
    (첫 진입 시 최신 50건) "내 `job_id`의 알림이 피드에 있나"로 판정하면 **작업을 시작하자마자
    지난주 알림을 보고 즉시 완료로 튄다.** `useJobCompletion`은 감시를 시작하는 순간 이미 있던
    알림을 '처리됨'으로 찍어 이걸 막는다 — **새 화면이 피드를 직접 구독하지 말고 훅을 쓸 것**
    (특정 job은 `useJobCompletion`, 목록 재조회는 `useNotificationRefresh`). 목록 쪽은 이유가
    하나 더 있다 — 재조회를 폴링 틱에 걸면 **5초마다 목록 API(페이지네이션 + 썸네일)가 돈다**
    (REQ-P03에서 걷어낸 병목과 같은 계열). 신규가 있을 때만, 여러 건이 와도 1회만 읽는다.
    기준선은 `useEffect`가 아니라 **렌더 중에** 잡아야 한다(effect로 미루면 그 사이 커밋에서
    옛 알림이 이미 처리된다). 증상이 "가끔 즉시 완료로 뜬다"라 재현이 어렵다.
    자동 다운로드처럼 **화면에 묶여야 하는 부수효과는 이 훅의 콜백 안에 둔다** — 훅이 화면
    수명에 묶여 있다는 사실이 B10 불변식을 지키는 방식이다(계약 #22). (REQ-F09 Phase 3)
    ⚠️ **서버의 `unread_count`는 단조 증가하지 않는다** — 읽음 커서 **이후** 개수라
    `mark_all_read()` 뒤 0으로 리셋되고 새 알림마다 1부터 다시 센다. 그래서 뱃지를
    **개수 비교로 가리면 안 된다**(`unread > 마지막에 읽은 개수`). 미읽음 3건일 때 읽으면
    그 뒤 도착한 알림이 1이라 **뱃지가 영영 안 뜬다** — 2026-08-10 육안 검증에서 실제로
    이 상태였다. 가릴 거면 개수가 아니라 **최신 알림의 키**로 가린다(F09-47). (REQ-F09 Phase 5)

## 상시 이슈

- 인증/인가 미구현 (CORS 전체 허용 상태)
- 테스트는 REQ-F09 알림 경로 28건뿐(백엔드 17 · 프론트 11) — 그 외 영역은 여전히 0건.
  실행: `cd backend && pip install -r requirements-dev.txt && pytest` (계약 #24) ·
  `cd frontend && npm test` (vitest)
- 페이지별 문항 API 개별 호출 성능 문제 → REQ-P01/REQ-P02에서 다룸

## ADR (Architecture Decision Records)

- **ADR-0001**: ECS Fargate 선택 (Lambda 대비 실행시간 제한 없음, 컨테이너 표준화)
- **ADR-0002**: 문항 ID 복합키 ({job_id}:{page_num}:{question_num}, 수동은 UUID)
- **ADR-0003**: 배경색 오탐 후처리 (픽셀 분석으로 전체 페이지 문항 감지)
