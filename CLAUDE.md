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

### 0. 진행 현황 (2026-07-22 업데이트)

**완료 (9건)** — B05~F08은 커밋 `9601355`(코드)/`8ef1f05`(스펙), F07·D06은 별도 커밋:

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

**남은 작업**: REQ-P02(성능·뷰어 가상화 — F07에서 이월), REQ-P03(썸네일 응답).

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
| 10 | 전체 | 속도·품질 성능 개선 (뷰어 가상화, 캐시, 페이지네이션, 비동기 등) | REQ-P02 | 성능 | ⬜ 예정 |
| 11 | 전체 | 썸네일 요청 응답 6~10초 → 1초 이하 단축 | REQ-P03 | 성능 | ⬜ 예정 |

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
- **REQ-P02 (성능)**: 상세 spec 존재 → HIGH부터 착수 순서 확정. 뷰어 가상화가 REQ-F07과 겹침 → 통합 설계.
- **REQ-P03 (썸네일 응답)**: 6~10초 원인 프로파일링 우선(PyMuPDF 렌더 DPI? 캐시 미스? 스토리지 왕복 지연?) → 원인별 대책 수립. 모든 통신 1초 이하 목표.

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

[Phase 6] ⬜ 예정 — 성능 (규모 큼, 병행/상시)
  REQ-P03 (썸네일 응답 프로파일링 우선)  →  REQ-P02 (HIGH→MEDIUM→LOW)
  ※ P02 뷰어 가상화는 Phase 4(F07)와 합류
```

**의존 요약**: `REQ-B04(완료) → B08`, `REQ-F06(완료) → B05 → F07`, `B07 → B06`, `C07 ↔ B09`, `P03 → P02(뷰어 가상화) ↔ F07`.

## 상시 이슈

- 인증/인가 미구현 (CORS 전체 허용 상태)
- 테스트 코드 없음
- 페이지별 문항 API 개별 호출 성능 문제 → REQ-P01/REQ-P02에서 다룸

## ADR (Architecture Decision Records)

- **ADR-0001**: ECS Fargate 선택 (Lambda 대비 실행시간 제한 없음, 컨테이너 표준화)
- **ADR-0002**: 문항 ID 복합키 ({job_id}:{page_num}:{question_num}, 수동은 UUID)
- **ADR-0003**: 배경색 오탐 후처리 (픽셀 분석으로 전체 페이지 문항 감지)
