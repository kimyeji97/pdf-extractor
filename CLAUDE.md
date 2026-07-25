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

## 요구사항 명세 체계 & 계획 번호 부여 (docs/specs/)

### 넘버링 규칙

명세 파일명: `YYYYMMDD-REQ-{prefix}{seq}-{kebab-slug}.md`

`REQ-{prefix}{seq}`의 prefix는 작업 성격을 나타낸다:

| Prefix | 의미 | 현재 범위 |
|--------|------|-----------|
| (숫자) | 핵심·v2·v3 기능 (기획 단위) | REQ-01~26 |
| `B` | 버그 수정 (Bug) | REQ-B01~B04 |
| `C` | 보완 기능 (Complement) | REQ-C01~C06 |
| `D` | 디자인·레이아웃 변경 (Design) | REQ-D01~D05 |
| `E` | 실험·인프라성 기능 (Enhancement) | REQ-E01 |
| `F` | 프론트 UX 개선 (Frontend) | REQ-F01~F06 |
| `P` | 성능 (Performance) | REQ-P01~P02 |

기능 대분류 참고: REQ-01~09(핵심), REQ-10~15(v2), REQ-16~26(v3).

### 계획 번호 추출 방식

새 작업의 번호는 **해당 prefix의 마지막 seq + 1**로 부여한다. 현재 사용 중인 번호는 아래로 확인한다:

```bash
# prefix별 사용 중인 번호 목록
ls docs/specs/ | grep -oE 'REQ-[A-Z]?[0-9]+' | sort -u

# 특정 prefix(B)의 다음 번호 계산 예시
ls docs/specs/ | grep -oE 'REQ-B[0-9]+' | grep -oE '[0-9]+' | sort -n | tail -1
```

2026-07-21 기준 각 prefix 다음 번호: `B10`, `C08`, `D07`, `F09`, `P04`.
(2026-07-04 기준은 `B05`, `C07`, `D06`, `F07`, `P03` 이었음)

## 예정 작업 계획 (2026-07-04 스냅샷)

`docs/예정된작업.md`를 기반으로 계획 번호를 부여하고 사전 논의 사항·작업 순서를 정리한다.

### 0. 진행 현황 (2026-07-25 업데이트)

**완료 (9건)** — B05~F08은 커밋 `9601355`(코드)/`8ef1f05`(스펙), F07·D06은 별도 커밋. 이후 성능(§0-2 P03 / §0-3 P02)과 디자인(§0-4 테마·로고) 작업이 이어짐:

- **REQ-B08** 문제집 편집 문항 목록 내부 스크롤 복구 + **파일 목록 내부 스크롤**(별건 함께 처리)
- **REQ-F08** 편집 미리보기 스크롤 좌우→상하(세로 스택)
- **REQ-B07** 오탐 문항 체크박스 활성화 → 최종 **옵션 ②(완전 일반 취급)**: 개별·전체 선택·벌크 삭제 모두 오탐 포함
- **REQ-B06** 문항 벌크 삭제 경쟁 상태 해결 → **`POST /api/jobs/{id}/pages/{n}/questions/bulk-delete`** 신설
- **REQ-C07** 라벨에 문항 이름 추가(미리보기·PDF 문자열 동기화, `sel.label` 단일 출처)
- **REQ-B09** PDF 라벨 한글 미렌더(점 표시) 수정 → **원인은 축약 아님**: PyMuPDF 1.25.5에 `Document.add_font` 부재 → helv 폴백 → 한글 깨짐. **`TextWriter` + `fitz.Font("korea")`** 로 해결 + 폰트 자동 축소(긴 라벨 셀 폭 맞춤)
- **REQ-B05** PDF 뷰어 툴바 고정 + 이전/다음 이동 수정. 원인=`history/index.jsx` 래퍼의 깨진 flex 높이 체인 + smooth `scrollIntoView` 취소. → 래퍼 flex 컬럼화 + 컨테이너 직접 `scrollTo({behavior:"instant"})`
- **REQ-F07** 문항 분석 ② 미리보기를 PDF 뷰어(`PdfPreviewPanel` 재사용)로 전환. 백엔드 `GET /api/jobs/{id}.original_pdf_url` 신설, 뷰어에 `onPageChange`·`renderPageOverlay`·`ref.scrollToPage`(forwardRef) 확장(전부 optional=생성이력 무영향). **좌표변환은 `pt = cssPx / scale` 단일 공식**(react-pdf가 pt×scale 렌더)으로 해결 — 실측 오차<1px. ①↔뷰어 양방향 동기화(250ms 디바운스). 데드코드(views/ 전체+FilePagePanel+PageBrowser+App.css ~1,200줄) 별도 커밋 `52e4b7d`로 제거.

> `PdfPreviewPanel` 계약: **소비처가 flex 컬럼 부모(`display:flex; flexDirection:column; minHeight:0`)를 제공**해야 정상 스크롤(B05·F07에서 확인).

- **REQ-D06** 표지 관리 2패널(D05) → **1패널 래핑 그리드 + 업로드 모달**로 재작성(`pages/format/index.jsx`). `+표지 업로드` 카드 클릭 → Dialog(드롭존 DnD + 이름 + 업로드). 분석 목록 페이지(`pages/analysis/index.jsx`)도 가로 스크롤 → **여러 줄 래핑 그리드**로 통일(사용자 결정). 카드 규격·업로드 패턴 공유. 백엔드 API 무변경. **REQ-D05는 superseded 표기 후 파일 유지**.

### 0-1. 2026-07-22 추가 작업 (버그 회귀 + 성능 착수)

**버그 회귀 수정 (커밋 `c090d2a`)** — 오늘 F07/데드코드 작업에서 생긴 CSS 회귀 2건:
- **수동 추가 좌표 마지막 페이지 고정**: 정리 편집에서 `.pdf-page-wrapper`의 `position:relative` 제거 → 각 페이지 오버레이(`absolute; inset:0`)가 상위 positioned 조상(② Paper)에 겹쳐 쌓여 마지막 페이지 오버레이가 전체 드래그 가로챔. → `position:relative` 복원(검증: idx 3→3, 7→7).
- **편집 문항 선택 CSS 미적용**: 데드코드 커밋 `52e4b7d`에서 `wbe-*` 섹션 삭제 시 **그 안에 섞인 `qlist-*` 규칙까지** 삭제됨. 살아있는 `QuestionListPanel`이 쓰는 클래스라 미적용. → `qlist-*` 25개 규칙 복원(독립 섹션 분리).

**P02/P03 성능 스펙 재구성 (커밋 `71236c0`)**: 구 P02(클라+서버 혼재) → **P02=Frontend / P03=Backend**로 분리. 백엔드 7개 항목을 P03로 이관, P02는 P02-01~10 순차 재번호. 클라 분석 발견 반영(목록 카드 `getPages` 낭비=P02-02, `list_pages`·썸네일 전체 PDF 재read=P03-01).

**StrictMode (커밋 `fef001d`→되돌림 `2d2a0e2`)**: dev 이중 API 요청 제거 목적으로 제거했다가, **현업 기본값·effect cleanup 안전망** 이유로 **다시 켬(최종 ON)**. 이중 요청은 dev 전용 착시(프로덕션 무영향)로 결론. 실질 중복은 P02-03(dedup) 담당.

**REQ-P03 착수 (서버 성능)**:
- **P03-01 프로파일링 완료 (커밋 `b8d40aa`)**: 썸네일 6~10초 병목 = **R2 전체 PDF 다운로드가 ~99%**(~2초/8MB). 파싱 ~14ms·렌더 ~30ms는 무시 수준. 6~10초는 N회 전체 다운로드 누적(카드 5개 × `list_pages` 등). → **DPI·adaptive는 병목 아님**(지연 관점 후순위). 처방=PDF 다운로드를 job당 1회로.
- **P03-02 페이지 메타 캐시 완료 (커밋 `0d8a163`)**: `page_info/{job_id}.json` 캐시 신설(local/s3/facade `get/save/clear_page_info_cache`). `list_pages`가 캐시 우선(`_get_or_build_page_info`), 미스 시만 read+저장. 업로드 감지·refresh에서 `pdf_bytes` 재사용해 프리워밍. **측정: list_pages 2.75s→0.17s(~16배)**. page_info는 job당 PDF 불변이라 무효화 불필요.

### 0-2. 2026-07-22 REQ-P03 진행 (P03-03 제외) — 서버 성능 마무리

**P03-01 전 페이지 썸네일 프리워밍 완료 (커밋 `abaccdc`)**: 신설 `backend/app/services/prewarm_service.py::prewarm_all_thumbnails(job_id, pdf_bytes, boundaries, page_count)`. 업로드 감지(`upload.py`)·재감지(`browse.py`) 둘 다 **`boundaries_status=DONE` 저장 후** 이미 로드된 `pdf_bytes`로 전 페이지 썸네일 + 감지된 전체 문항 크롭을 미리 렌더링해 캐시 저장. **중요 발견**: R2 PUT 1건이 실측 ~270ms라 순차 처리 시 job당(132p/573문항 기준) 3~4분 소요 — 애초 "렌더만 30ms×N≈6초" 추정은 R2 업로드 왕복을 빠뜨린 과소 추정이었음. `ThreadPoolExecutor(max_workers=12)`로 병렬화해 12~20초로 단축. `head_object`의 `LastModified`로 실제 실행 확인, 이후 개별 썸네일 GET은 0.2~0.45초(캐시 히트).

**P03-05 (문항 썸네일 중복 read 제거) 재검토 결과 — 이미 해결돼 있어 조치 불필요**: `get_question_thumbnail_endpoint`(browse.py)를 다시 확인하니 `git blame` 상 **최초 작성 커밋(`d4367ce`)부터** 이미 `pdf_bytes`를 boundary 감지와 썸네일 생성에 재사용하고 있었음. 스펙 작성 당시 진단이 실제 코드와 맞지 않았던 것 — 코드 변경 없이 완료 처리.

**P03-04 추출 작업 ProcessPoolExecutor 분리 완료 (커밋 `d461a3d`)**: `extract.py`에 모듈 레벨 `ProcessPoolExecutor(max_workers=2)`(ECS 0.5 vCPU 고려) 신설. `_process_extraction`(v1)은 CPU-bound `pdf_service.extract_questions` 호출만, `_process_extraction_v2`는 `pdf_service.extract_questions_v2` 전체를 풀로 위임(내부 I/O 포함 — `SelectionItem` pydantic 모델은 pickle 가능 확인함). 목적은 CPU 작업이 **메인 프로세스 GIL**을 점유해 다른 요청 처리를 지연시키는 걸 막는 것(총 vCPU는 그대로지만 GIL 분리 효과). 실측: 풀 경유 vs 직접호출 오버헤드 거의 없음(12.76s vs 12.66s). 예외 전파(`ValueError`) 정상 확인. 실제 `POST /api/extract-v2` 종단 테스트로 검증(테스트 데이터는 R2에서 삭제).

**P03-06 (adaptive 감지 조건부 실행) 시도 후 기각 — 정확도 회귀 발견**: 스펙 원안(정규식 커버리지 페이지 단위 80% 이상이면 adaptive 스킵)을 실제 구현해 `question_parser.py`에 적용하고 실제 job(`19bdc399`, 198p/388문항)으로 검증. **결과: adaptive 강제 실행 393문항 vs 조건부 스킵 378문항 = 15문항 누락.** 원인은 "regex_coverage"가 **페이지 단위**(그 페이지에 정규식 매칭 1개라도 있는지)만 보기 때문 — 한 페이지 안에서 일부 문항만 정규식에 걸리고 나머지를 adaptive가 보완해야 하는 경우를 못 걸러냄. P03-01에서 이미 adaptive 자체가 병목이 아님(전체 파싱 ~14ms)을 확인했으므로 성능 이득도 없음 → **코드 원복, 미적용**. 문항 감지는 핵심 비즈니스 로직이라 이런 트레이드오프는 받아들이지 않기로 결정. (다시 시도한다면 페이지 단위가 아니라 문항 번호 단위 커버리지로 판단 기준을 바꿔야 함.)

**P03-07 문항 썸네일 기본 DPI 96 적용 완료 (커밋 `da381b4`)**: `thumbnail_service.get_question_thumbnail` 기본 dpi 144→96. 호출부 전부 기본값 의존이라 자동 반영. 최종 추출 PDF는 별도 벡터 크롭 경로(`pdf_service.py`)라 품질 영향 없음 — 순수 UI 미리보기 해상도만 낮아짐.

**P03-08 요청 타임아웃 미들웨어 완료 (커밋 `da381b4`)**: `main.py`에 `TimeoutMiddleware`(30초, `asyncio.wait_for`) 신설. 엔드포인트 개별 sync→async 전환 대신 미들웨어로 일괄 적용(위험도 낮음). **등록 순서 주의**: `add_middleware`는 나중에 등록한 게 바깥쪽이 되므로, `TimeoutMiddleware`를 `CORSMiddleware`보다 먼저 등록해 CORS가 바깥을 감싸게 함 — 그래야 타임아웃 504 응답에도 CORS 헤더가 붙어 프론트가 CORS 에러가 아닌 진짜 504로 인식. 한계: 클라이언트 대기만 취소되고 threadpool의 실제 작업 스레드는 강제 종료되지 않음(자연 종료까지 계속 실행) — 그래도 클라이언트 무한 대기는 확실히 방지됨. 격리 테스트(0.3초 타임아웃 + 1초 슬립)로 504 확인, 실제 앱에서 정상 요청·CORS 헤더 영향 없음 확인.

**결론**: 이 시점 REQ-P03은 **P03-03(페이지네이션)만 사용자 결정으로 보류**, 나머지 전부 완료/기각 처리. → P03-03은 2026-07-25에 완료(§0-5).

### 0-3. 2026-07-22 REQ-P02 완료 — 클라 성능 (10개 항목 전체)

사용자 결정으로 **Quick win(02,05,03) → Polish(04,06,07,08,09) → 가장 크고 복잡한 P02-01(뷰어 가상화)을 마지막에** 순서로 진행. 전 항목 실제 브라우저(dev 서버 + headless Chrome/CDP) 검증 후 커밋.

- **P02-02 (커밋 `49c677b`)**: 분석 목록 `JobCard`의 `getPages` 호출 제거, 썸네일 URL `/api/jobs/{id}/pages/0/thumbnail` 직접 조립(결정적 URL이라 목록 API 불필요). `onError`로 `thumbFailed` 추가해 기존 아이콘 폴백 유지.
- **P02-05 (같은 커밋)**: `work.jsx` 재감지 폴링이 로컬 `setInterval` 변수라 언마운트 시 미정리되던 것을 `refreshPollRef` + cleanup useEffect로 수정(`editor/index.jsx` export 폴링은 이미 같은 패턴 적용돼 있었음 — 확인만).
- **P02-03 (커밋 `931b594`)**: `client.js`의 `apiFetch`에 GET 전용 dedup. 동일 URL in-flight면 Promise 공유 + `Response.clone()`으로 각자 독립 `res.json()` 가능하게 함. Node로 직접 검증(동시 3회 → 실제 요청 1회).
- **P02-04 (커밋 `e9d9df2`)**: `QuestionListPanel`→`QuestionItem`, `QuestionAnalysisPanel`→`QuestionCard`로 항목 추출 + `React.memo`. 편집 상태(`isEditing`/`editingValue`)를 비교자에 포함해 인라인 편집 중인 카드만 리렌더.
- **P02-06 (커밋 `66bd6bc`)**: `editor/index.jsx`의 `getWorkbook`+`listCovers`를 `Promise.all`로 병렬화(개별 `.catch()`로 에러 격리 유지).
- **P02-07 (커밋 `303ac50`)**: `WorkbookPreview`에 `WorkbookPage`+`usePageVisible`(IntersectionObserver, rootMargin 300px) 가상화 추가. `loading="lazy"`는 최초 구현부터 이미 있었음. 실측: 40문항/20페이지 중 이미지 렌더 셀 5개뿐(가상화 확인).
- **P02-08 (커밋 `9678721`)**: `QuestionAnalysisPanel`의 `allChecked`를 `useMemo`로 래핑(편집 중 매 keystroke마다 전체 `.every()` 재순회 방지).
- **P02-09 (커밋 `4772e00`)**: `@mui/lab`·`@mui/x-data-grid` 전수 확인 결과 **둘 다 실제 라우트에서 도달 불가능한 죽은 코드**(계정 섹션, DataGrid 페이지네이션 헬퍼)에서만 사용 중이라 확인 후 제거. 연쇄 죽은 코드(`AccountsProvider`, `data/account/*`, `TablePagination.tsx` 오버라이드 등) 포함 22개 파일 삭제. `npm install`/`tsc`/`npm run build` 통과.
- **P02-01 (커밋 `7f4c7ed`)**: `PdfPreviewPanel.jsx`에 IntersectionObserver 기반 뷰어 가상화(rootMargin 1000px). react-window 대신 직접 구현 선택(F07 오버레이 좌표 계약 유지가 더 쉬움). **버그 발견·수정**: `scrollToPage` 점프 시 대상 페이지의 "이전" 페이지까지 강제 렌더하면 그 페이지가 아직 0px인 상태로 누적 높이를 계산해 스크롤이 한 페이지 짧게 계산됨(실측: 150페이지 이동 시 149에 안착) → 이전 페이지는 강제 렌더 대상에서 제외하고 대상+다음 페이지만 렌더 큐에 추가하도록 수정해 해결. CDP로 실제 206페이지 문서 검증: 초기 캔버스 2~4개(전체 206개 대비), 페이지 점프(75/100/150) 정확히 도착, 자연 스크롤 점진 렌더링(4→16개) 확인. 생성 이력 페이지의 단순 사용처(ref 없음)도 정상.

**결론**: REQ-P02(클라 성능) **10개 항목 전체 적용 완료**. 서버(P03)·클라(P02) 양쪽 성능 작업 모두 마무리, 이 시점 남은 건 P03-03(페이지네이션)뿐이었고 이는 2026-07-25에 완료(§0-5).

**남은 작업**: (이 시점 기준) REQ-P03의 P03-03만 보류 → 2026-07-25 완료(§0-5). **성능 작업 전체 종료.**

### 0-4. 2026-07-22 테마 리디자인 + 브랜드 로고 적용 (REQ 번호 미부여)

성능 작업(P03 ↔ P02) 사이에 끼어 진행된 디자인 작업 2건. 예정된작업.md에 없던 즉흥 작업이라 REQ 번호를 부여하지 않았다.

**테마 리디자인 (커밋 `5722c61`)** — 템플릿 기본값 톤을 프로젝트 톤으로 교체:
- **Inter 폰트 기본 전환**: `index.html`에 Google Fonts preconnect 추가 + `config.ts` 폰트 우선순위 변경
- **팔레트/그림자**: `theme/palette/colors.ts`의 grey·blue 톤 조정, `palette/index.ts`의 divider·text 톤 조정, `shadows.ts` 24단계를 더 은은하게 재정의
- **타이포그래피**: 헤딩 `fontWeight` 700→500, `lineHeight` 1.5→1.2로 통일, 사이즈 재조정
- **컴포넌트 오버라이드 신설**: `MuiCard`/`MuiCardContent`/`MuiCardHeader` 3종 추가(`theme/components/`), `theme.ts`에 등록
- **레이아웃**: 사이드바 배경 `grey.950` 다크 전환 + `NavItem` 색상/패딩 조정, AppBar에 사이드바 접기/펼치기 토글 버튼 추가, 분석·편집 페이지 상단 바 좌우 패딩 미세조정

**브랜드 로고/파비콘 적용 (커밋 `326eb74`)** — 템플릿(aurora) placeholder SVG+텍스트 로고를 실제 브랜드 이미지 **"깊은생각"** 으로 교체:
- `frontend/public/`에 `favicon.ico`, `icon-192.png`(정사각), `logo-wordmark.png`(가로 워드마크) 추가 + `index.html`에 favicon/apple-touch-icon 링크
- `Logo.tsx` 재작성: `showName=true`면 워드마크, `false`면 정사각 아이콘 렌더 (163줄 → 15줄 수준으로 축소)
- **투명 배경 PNG라 다크 사이드바에도 그대로 얹힘** → 직전 커밋에서 넣었던 `inverse` prop이 불필요해져 `Logo.tsx`·`SidenavDrawerContent.tsx` 양쪽에서 제거

### 0-5. 2026-07-25 REQ-P03-03 완료 — 목록 API 페이지네이션 (P03 전체 완료)

보류였던 마지막 성능 항목. 사용자 결정: **무한 스크롤 + 검색 서버 이관 + jobs·workbooks 둘 다**.

**결정 배경 — 검색을 서버로 옮겨야 했던 이유**: 분석 목록·편집 파일 목록이 전체를 받아 클라에서 이름/유형을 필터링하고 있었다. 서버 페이지네이션만 넣으면 검색이 "현재 불러온 페이지 안"에서만 동작하는 **기능 회귀**가 된다. 그래서 `name`·`types` 쿼리 파라미터를 신설하고 프론트는 300ms 디바운스로 넘긴다.

- **응답 형태 변경** (`browse.py`): `{source_jobs, export_jobs}` → `{items, total, skip, limit}` + `job_type` 쿼리. 기존 형태는 SOURCE/EXPORT를 한 번에 내려 각각 페이징이 불가능했다. **`export_jobs`는 프론트에서 아무도 소비하지 않던 것**을 확인하고 진행. ⚠️ `job_type`은 enum 값이라 **대문자**(`SOURCE`/`EXPORT`) — 소문자는 422(초기 구현에서 실제로 밟음).
- **`WorkbookSummary` 신설** (`schemas.py`, `workbook.py`): 문제집 **목록** 응답에서 `selections` 제외. 목록 화면은 안 쓰는데 문항 수십~수백 건이 통째로 실려 있었다. 실측 — 목록 20건 3.9KB vs 단건 상세 1건 5.7KB(selections 40개). 편집 복원용 selections는 단건 조회에서 그대로 제공.
- **R2 목록 조회 병렬화** (`s3_service._get_json_many`, `ThreadPoolExecutor(12)`): **이번 작업의 진짜 성능 이득**. 페이지네이션을 넣어도 정렬(uploaded_at/created_at 내림차순)하려면 전체 status JSON을 읽어야 하고, 그게 키 1건당 R2 GET 1회다. **실측 16건 순차 1.311s → 병렬 0.314s(4.2배)**, 키당 왕복 ~82ms라 100건 누적 시 순차면 ~8초.
- **프론트 무한 스크롤**: 공용 훅 `hooks/usePaginatedList.js`(IntersectionObserver, rootMargin 200px, 요청 ID로 stale 응답 폐기) + `hooks/useDebouncedValue.js` 신설. 3개 화면(`pages/analysis/index.jsx`, `components/FileListPanel.jsx`, `pages/history/index.jsx`)에 적용. `FileListPanel`의 `refreshTrigger`는 **값이 실제로 바뀐 경우에만** 재조회 — 안 그러면 검색어 변경 시 훅 재로드와 겹쳐 중복 요청.
- **검증**: 합성 데이터(SOURCE 47 + EXPORT 13 + 문제집 35)를 로컬 스토리지에 만들어 headless Chrome/CDP로 확인. 분석 목록 20→40→47 후 요청 중단, 편집 파일 목록 동일 + 유형 검색 '과학' 9건, 생성 이력 20→35, 디바운스 5글자 입력 → 요청 1회. 실제 R2 데이터로도 스모크 테스트(jobs ~0.25s, workbooks ~0.19s).

**결론**: **REQ-P03 전체 완료**(P03-06만 정확도 회귀로 기각). 성능 작업(P02+P03) 전부 종료.

### 1. 작업 목록 & 계획 번호

| # | 영역 | 작업 | 계획번호 | 유형 | 상태 |
|---|------|------|----------|------|------|
| 1 | 문항 분석 | PDF 뷰어 툴바 버그: 이전/다음 버튼 무동작 + 툴바가 스크롤 영역에 포함됨 | REQ-B05 | 버그 | ✅ 완료 |
| 2 | 문항 분석 | 문항 목록 벌크(다중) 삭제 안됨 | REQ-B06 | 버그 | ✅ 완료 |
| 3 | 문항 분석 | 페이지 미리보기를 PDF 뷰어로 전환 (생성 이력 REQ-F06 방식 재사용) | REQ-F07 | 개선 | ✅ 완료 |
| 4 | 문항 분석 | 오탐 의심 문항 체크박스 비활성 → 삭제 불가 해소 | REQ-B07 | 버그 | ✅ 완료 |
| 5 | 문제집 편집 | 문항 선택 목록 스크롤 문제 (REQ-B04와 동일 원인) | REQ-B08 | 버그 | ✅ 완료 |
| 6 | 문제집 편집 | 문항 라벨 포맷 변경 (`{번호}.{문제집} p{페이지}` → `+ {문항 이름}`) | REQ-C07 | 보완 | ✅ 완료 |
| 7 | 문제집 편집 | 다운로드 PDF에서 문항 라벨 `...` 축약 방지 | REQ-B09 | 버그 | ✅ 완료 |
| 8 | 문제집 편집 | 우측 미리보기 스크롤 방향 좌우 → 상하 | REQ-F08 | 개선 | ✅ 완료 |
| 9 | 표지 관리 | 목록형 1패널 + 업로드 모달로 재설계 (기존 REQ-D05 방향 상충) | REQ-D06 | 디자인 | ✅ 완료 |
| 10 | 클라(FE) | 클라 성능: 뷰어 가상화, getPages 낭비 제거, dedup, 리스트 memo 등 | REQ-P02 | 성능 | ✅ 완료 (10개 항목 전체) |
| 11 | 서버(BE) | 서버 성능: 썸네일 6~10초 병목(전체 PDF 재read) + 캐시·페이지네이션·비동기 | REQ-P03 | 성능 | ✅ 완료 (전체) |

> **번호 부여 메모**
> - 문항 분석 툴바 이슈(예정된작업 2건)는 REQ-F06 PDF 뷰어의 결함이므로 버그 스펙 **REQ-B05** 하나로 묶는다.
> - #9는 예정된작업에 `REQ-D05`로 적혀 있으나, 기존 D05 spec(2패널 수평)과 방향이 상충(1패널+모달)한다. D05 재작성 대신 **REQ-D06** 신규 부여를 권장(D05는 폐기/대체 표기).
> - #11은 예정된작업에 "REQ-P02 항목 추가"로 적혀 있으나 원인 규명·처리 규모가 커 **REQ-P03**으로 분리하는 것을 권장(P02에 포함 유지도 가능).

### 2. 작업별 사전 논의 사항 (작업계획서 작성 전)

- **REQ-B05 (뷰어 툴바)**: 문항 분석과 생성 이력이 `PdfPreviewPanel`을 공유하는지/분기하는지 → 수정 범위 확정. 이전/다음 버튼이 `scrollIntoView`를 트리거하지 못하는 원인(currentPage state 미반영). 툴바를 스크롤 컨테이너 밖으로 분리하는 방식(`position: sticky` vs 별도 flex 행).
- **REQ-B06 (벌크 삭제)**: 자동+수동 문항 혼합 선택 허용 여부. 단건 DELETE 반복 호출 vs 벌크 삭제 엔드포인트 신설(현 `browse.py`는 단건만). 삭제 후 경계 캐시 무효화·재조회 방식. 오탐 문항 포함 처리(REQ-B07 연계).
- **REQ-F07 (페이지 미리보기 PDF 뷰어)**: 소스 `original.pdf` URL 확보 경로(파일 서빙 엔드포인트). 문항 선택·드래그 오버레이 좌표계를 썸네일 기반 → PDF 렌더 좌표계로 변환하는 방법. 기존 `FilePagePanel`/`PageBrowser` 대체 범위. REQ-P02 뷰어 가상화와 겹치므로 **함께 설계** 필요.
- **REQ-B07 (오탐 체크박스)**: `is_false_positive` 문항의 UX 정책 — 선택은 되되 추출 제외인지, 완전 일반 취급인지. 체크박스 활성화 조건 완화. REQ-B06 벌크 삭제와의 상호작용.
- **REQ-B08 (편집 스크롤)**: REQ-B04에서 정립한 `flex:1; min-height:0` 높이 체인을 문제집 편집 문항 선택 목록에 적용. 대상 컴포넌트/클래스 식별(`QuestionPicker`, `pages/editor/index.jsx`).
- **REQ-C07 (라벨 포맷)**: 라벨 문자열 조립 위치 — 프론트 캔버스(`WorkbookPreview`)와 백엔드 PDF 생성(`pdf_service`) 양쪽 동기화. "데이터 보안" 의도 재확인(문제집 이름 노출 우려 vs 문항 이름 추가 목적). 라벨 길이 증가에 따른 셀 내 배치·폰트 영향(REQ-B09와 직결).
- **REQ-B09 (라벨 축약)**: `...` 축약 발생 위치(`pdf_service` PDF 생성 시 truncate 로직) 확인. 라벨이 길 때 줄바꿈 허용 vs 폰트 축소 vs 셀 영역 확대 정책. REQ-C07과 **동시 진행 권장**.
- **REQ-F08 (미리보기 스크롤 방향)**: 대상은 문제집 편집 우측 `WorkbookPreview` 캔버스 컨테이너. `overflow-x → overflow-y` 전환 시 페이지·셀 배치 흐름과 다중 페이지 세로 나열 방식 확정.
- **REQ-D06 (표지 목록형)**: 기존 REQ-D05(2패널)와 상충 — D05 폐기/대체 결정. 업로드 모달 UX(트리거 버튼, 모달 내 필드). `[+표지 업로드][표지1][표지2]…` 한 줄 그리드. 기준 삼을 "목록 페이지" 디자인 식별(`FileListPanel` 등).
- **REQ-P02 (클라 성능)**: 2026-07-22 재구성 후 **Frontend 전용**. P02-01~10(뷰어 가상화, getPages 낭비 제거, dedup, 리스트 memo, 폴링 클린업, 초기화 병렬, WorkbookPreview, 파생 useMemo, MUI 번들, StrictMode 착시 문서화). 뷰어 가상화(P02-01)는 F07 오버레이 좌표 계약 유지 필요. **2026-07-22 완료(§0-3)**: 10개 항목 전체 적용, P02-01에서 스크롤 점프 버그 발견·수정.
- **REQ-P03 (서버 성능)**: 2026-07-22 재구성 후 **Backend 전용**(구 P02 백엔드 7개 이관 + 썸네일 병목). **원인 규명 완료**: 6~10초 = 캐시 미스 시 전체 PDF 재다운로드(R2 왕복) + 전체 문서 파싱이 썸네일 1장당 반복. P03-01(재read 제거+프리워밍)·P03-02(페이지 메타 캐시)가 핵심. P02-02와 함께 적용해야 목록 로딩 근본 개선. **2026-07-22 완료(§0-2)**: P03-01/02/04/05/07/08 적용, P03-06은 정확도 회귀로 기각·원복. **2026-07-25 완료(§0-5)**: 마지막 보류였던 P03-03(페이지네이션 + 서버 검색 이관 + 무한 스크롤) 적용으로 P03 전체 종료.

### 3. 작업 순서 (의존 관계 기반)

```
[Phase 1] ✅ 완료 — 독립 소규모 버그 (선착수, 의존성 없음)
  REQ-B08 ✅ (편집 스크롤 — B04 패턴 재사용, 파일 목록 스크롤 포함)
  REQ-F08 ✅ (미리보기 스크롤 방향)

[Phase 2] ✅ 완료 — 문항 삭제 UX 묶음
  REQ-B07 ✅ (오탐 체크박스 활성)  →  REQ-B06 ✅ (벌크 삭제)
  ※ 오탐 문항을 선택 가능하게 만든 뒤 벌크 삭제를 얹어야 정합

[Phase 3] ✅ 완료 — 라벨 묶음 (동시 진행)
  REQ-C07 ✅ (라벨 포맷)  +  REQ-B09 ✅ (한글 미렌더 수정 — 실제 원인은 폰트 폴백)
  ※ 라벨 길이 증가와 폰트 이슈가 한 셀 안에서 충돌하므로 함께 설계

[Phase 4] ✅ 완료 — PDF 뷰어 묶음 (REQ-F06 기반)
  REQ-B05 ✅ (뷰어 툴바 안정화)  →  REQ-F07 ✅ (문항 분석에 뷰어 적용)
  ※ 좌표변환은 pt=cssPx/scale 단일 공식으로 해결. 뷰어 가상화는 P02로 이월(사용자 결정)

[Phase 5] ✅ 완료 — 표지 디자인
  REQ-D06 ✅ (목록형 1패널 + 모달, D05 superseded 처리 / 분석 목록도 래핑 그리드로 통일)

[Phase 6] ✅ 완료 — 성능 (2026-07-22 재구성: P02=클라 / P03=서버)
  REQ-P03 (서버) ✅ 완료(전체):
    ✅ P03-01 프로파일링 + 전 페이지 프리워밍 (R2 다운로드 ~99% 병목 확정 → ThreadPoolExecutor(12)로 프리워밍)
    ✅ P03-02 페이지 메타 캐시 (list_pages 2.75s→0.17s)
    ✅ P03-04 추출 작업 ProcessPoolExecutor 분리
    ✅ P03-05 재검토 결과 이미 해결돼 있어 조치 불필요
    ❌ P03-06 adaptive 조건부 실행 — 실제 검증 중 문항 15개 누락 발견 → 기각·원복
    ✅ P03-07 썸네일 DPI 96 기본값
    ✅ P03-08 요청 타임아웃 미들웨어(30초)
    ✅ P03-03 페이지네이션 (2026-07-25) — 응답 형태 변경 + name/types 서버 검색 이관 + 무한 스크롤, R2 목록 조회 병렬화 4.2배
  REQ-P02 (클라) ✅ 완료(10개 항목 전체, §0-3):
    ✅ P02-02 getPages 제거  ✅ P02-05 폴링 클린업  ✅ P02-03 dedup
    ✅ P02-04 리스트/카드 memo  ✅ P02-06 초기화 병렬  ✅ P02-07 WorkbookPreview 가상화
    ✅ P02-08 파생 상태 useMemo  ✅ P02-09 미사용 MUI 패키지 제거
    ✅ P02-01 뷰어 가상화 (스크롤 점프 버그 발견·수정 — 대상 이전 페이지 강제 렌더 시 스크롤 위치 오차)
  ※ P02-01(뷰어 가상화)은 F07 오버레이 좌표 계약(pt=cssPx/scale, .pdf-page-wrapper relative) 유지 확인됨
```

> **P02/P03 재구성 (2026-07-22)**: 구 P02(클라+서버 혼재)를 **P02=Frontend / P03=Backend**로 분리. 백엔드 7개 항목(구 P02-02·03·04·08·09·12·14)을 P03로 이관하고 P02는 P02-01~10 순차 재번호. 클라 성능 분석 발견(StrictMode 이중요청=dev 착시, 목록 카드 getPages 낭비, list_pages/thumbnail 전체 PDF 재read 병목) 반영.

**의존 요약**: `REQ-B04(완료) → B08`, `REQ-F06(완료) → B05 → F07`, `B07 → B06`, `C07 ↔ B09`, `P02-02 ↔ P03-01(목록 로딩)`, `P02-01(뷰어 가상화) ↔ F07(오버레이 좌표)`.

## 상시 이슈

- 인증/인가 미구현 (CORS 전체 허용 상태)
- 테스트 코드 없음
- 페이지별 문항 API 개별 호출 성능 문제 → REQ-P01/REQ-P02에서 다룸

## ADR (Architecture Decision Records)

- **ADR-0001**: ECS Fargate 선택 (Lambda 대비 실행시간 제한 없음, 컨테이너 표준화)
- **ADR-0002**: 문항 ID 복합키 ({job_id}:{page_num}:{question_num}, 수동은 UUID)
- **ADR-0003**: 배경색 오탐 후처리 (픽셀 분석으로 전체 페이지 문항 감지)
