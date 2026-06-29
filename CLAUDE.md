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
| Infra | AWS ECS Fargate + Cloudflare Tunnel + Cloudflare Pages | ap-northeast-2 |

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
│   │   │   └── cover.py                    # 표지 이미지 관리
│   │   ├── services/
│   │   │   ├── storage.py                  # 스토리지 팩토리 (local ↔ s3 토글)
│   │   │   ├── local_storage_service.py    # 로컬 파일 기반 스토리지 (개발용)
│   │   │   ├── s3_service.py               # Cloudflare R2 스토리지 (운영용)
│   │   │   ├── pdf_service.py              # PDF 추출 파이프라인 (크롭 + 레이아웃 조립)
│   │   │   ├── thumbnail_service.py        # PyMuPDF 기반 썸네일 생성
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
│   │   ├── api/client.js                   # API 클라이언트 (375줄, 40+ 함수)
│   │   ├── pages/                          # 라우트 페이지
│   │   │   ├── analysis/                   # 문항 분석 (메인 워크스페이스)
│   │   │   ├── editor/                     # 문제집 편집
│   │   │   ├── format/                     # 표지/레이아웃 설정
│   │   │   └── history/                    # 생성 이력
│   │   ├── views/                          # 뷰 컴포넌트
│   │   │   ├── QuestionAnalysisView.jsx    # 문항 분석 뷰
│   │   │   ├── WorkbookEditorView.jsx      # 문제집 편집 뷰
│   │   │   ├── WorkbookHistoryView.jsx     # 생성 이력 뷰
│   │   │   └── CoverFormatView.jsx         # 표지 관리 뷰
│   │   ├── components/                     # UI 컴포넌트
│   │   │   ├── PageBrowser.jsx             # PDF 페이지 브라우저
│   │   │   ├── QuestionPicker.jsx          # 문항 선택 UI
│   │   │   ├── SelectionBasket.jsx         # 선택 문항 바스켓 (드래그 정렬)
│   │   │   ├── UploadForm.jsx              # 파일 업로드 폼
│   │   │   ├── WorkbookPreview.jsx         # 레이아웃 미리보기 캔버스
│   │   │   ├── FileListPanel.jsx           # 업로드 파일 목록
│   │   │   ├── FilePagePanel.jsx           # 페이지 썸네일 그리드
│   │   │   ├── QuestionListPanel.jsx       # 페이지별 문항 목록
│   │   │   ├── QuestionAnalysisPanel.jsx   # 문항 분석 상세
│   │   │   ├── StatusPoller.jsx            # 비동기 상태 폴링
│   │   │   ├── settings-panel/             # 설정 패널
│   │   │   ├── loading/                    # 로딩 UI (GlobalDim, 스켈레톤)
│   │   │   └── ...                         # base, icons, common, styled, sections, pagination
│   │   ├── layouts/main-layout/            # 앱 레이아웃 (AppBar, Sidenav, Footer)
│   │   ├── providers/                      # Context (Settings, Theme, Accounts, Breakpoints)
│   │   ├── theme/                          # MUI 테마 (palette, typography, 컴포넌트 오버라이드 50+)
│   │   ├── types/                          # TypeScript 타입 정의
│   │   ├── lib/                            # 유틸 (constants, iconify)
│   │   └── utils/workbookLayout.js         # 레이아웃 계산 유틸
│   ├── package.json                        # 32개 의존성
│   └── vite.config.ts
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

### Browse (`routers/browse.py`) — 665줄, 가장 큰 라우터
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/jobs` | 전체 작업 목록 (source/export 분리) |
| GET | `/api/jobs/{id}` | 작업 상세 |
| PATCH | `/api/jobs/{id}` | 작업 메타 수정 (이름, 유형) |
| POST | `/api/jobs/{id}/refresh` | 문항 재감지 트리거 |
| GET | `/api/jobs/{id}/pages` | 페이지 목록 + 썸네일 |
| GET | `/api/jobs/{id}/pages/{n}/thumbnail` | 페이지 PNG (DPI 설정 가능) |
| GET | `/api/jobs/{id}/pages/{n}/questions` | 페이지 문항 목록 (자동+수동) |
| PATCH | `/api/jobs/{id}/pages/{n}/questions/{q}` | 자동 문항 제목 수정 |
| DELETE | `/api/jobs/{id}/pages/{n}/questions/{q}` | 자동 문항 삭제 |
| POST | `/api/jobs/{id}/pages/{n}/questions/manual` | 수동 문항 추가 (드래그 영역) |
| PATCH | `/api/jobs/{id}/pages/{n}/questions/manual/{mid}` | 수동 문항 제목 수정 |
| DELETE | `/api/jobs/{id}/pages/{n}/questions/manual/{mid}` | 수동 문항 삭제 |
| GET | `/api/jobs/{id}/pages/{n}/questions/{q}/thumbnail` | 자동 문항 크롭 PNG |
| GET | `/api/jobs/{id}/pages/{n}/questions/manual/{mid}/thumbnail` | 수동 문항 크롭 PNG |

### Workbook (`routers/workbook.py`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/workbooks` | 문제집 이력 |
| GET | `/api/workbooks/{id}` | 문제집 상세 |
| POST | `/api/workbooks` | 문제집 저장 |

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
  ├─ Frontend: Cloudflare Pages (dist/ 업로드)
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
| Frontend | localhost:5173 | Cloudflare Pages |
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
```

## 현재 알려진 이슈 / 예정 작업

1. 문항 목록에서 문항 이미지 미표시 (img 태그는 존재)
2. 페이지별 문항 API를 개별 호출하는 성능 문제 → 문제 선택 UX 개선 (마우스 선택 → 키보드 입력 방식)
3. 생성 이력 미리보기를 PDF 뷰어로 제공 (확대/축소/페이지 이동/스크롤)
4. 표지 관리 디자인을 문항 분석 디자인으로 통일
5. 인증/인가 미구현 (CORS 전체 허용 상태)
6. 테스트 코드 없음

## 요구사항 명세 체계 (docs/specs/)

REQ-## 넘버링으로 70+ 명세 관리:
- REQ-01~09: 핵심 기능 (파일 목록, 페이지 미리보기, 문항 선택, 추출)
- REQ-10~15: v2 기능 (네비게이션, 재감지, 제목 편집, 수동 문항, 삭제)
- REQ-16~26: v3 기능 (문제집 브라우징, 캔버스, 레이아웃, 이력, 표지)
- REQ-C01~C06: 보완 기능 (파일명 입력, 6단 레이아웃, 구분선)
- REQ-F01~F05: UX 개선 (로딩 딤, 스켈레톤, 스크롤)

## ADR (Architecture Decision Records)

- **ADR-0001**: ECS Fargate 선택 (Lambda 대비 실행시간 제한 없음, 컨테이너 표준화)
- **ADR-0002**: 문항 ID 복합키 ({job_id}:{page_num}:{question_num}, 수동은 UUID)
- **ADR-0003**: 배경색 오탐 후처리 (픽셀 분석으로 전체 페이지 문항 감지)
