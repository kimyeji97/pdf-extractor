# PDF 문항 추출기

기출문제 PDF에서 원하는 문항만 골라 새 PDF로 추출하는 서비스입니다.

## 기능

- PDF 업로드 (드래그앤드롭, 최대 10MB)
- 페이지별 문항 자동 감지 (시각적 브라우징 UX)
- 텍스트형 PDF: pdfplumber로 문항 경계 감지
- 이미지형 PDF(스캔본): Tesseract OCR fallback 자동 적용
- 문항 선택 → 레이아웃 지정 → PDF 생성 및 다운로드

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 19, Vite, TypeScript, MUI |
| Backend | Python 3.11, FastAPI |
| PDF 처리 | pdfplumber, pymupdf |
| OCR fallback | Tesseract (kor+eng) |
| Storage | Cloudflare R2 (S3 호환) |
| 인프라 | AWS ECS Fargate + Cloudflare Tunnel |

## 서비스 URL (dev)

| 환경 | URL |
|------|-----|
| 프론트엔드 | https://dailystudy-workbook-dev.yejicraft-cf.com |
| 백엔드 API | https://dailystudy-workbook-api-dev.yejicraft-cf.com |
| API 문서 | https://dailystudy-workbook-api-dev.yejicraft-cf.com/docs |

## 빠른 시작 (로컬 개발)

→ [QUICKSTART.md](QUICKSTART.md)

## 배포

→ [docs/infra/plan-infra-backend.md](docs/infra/plan-infra-backend.md) — 백엔드 수동 배포
→ [docs/infra/plan-infra-frontend.md](docs/infra/plan-infra-frontend.md) — 프론트엔드 배포
→ [docs/infra/spec-infra.md](docs/infra/spec-infra.md) — 인프라 전체 명세

## 프로젝트 구조

```
pdf-extractor/
├── backend/
│   ├── app/
│   │   ├── core/config.py              # 환경변수 설정
│   │   ├── models/schemas.py           # Pydantic 요청/응답 모델
│   │   ├── routers/
│   │   │   ├── upload.py               # POST /api/upload
│   │   │   ├── extract.py              # POST /api/extract-v2
│   │   │   ├── browse.py               # 파일/페이지/문항 조회
│   │   │   └── workbook.py             # 문제집 CRUD
│   │   ├── services/
│   │   │   ├── storage.py              # 스토리지 팩토리 (local/s3 토글)
│   │   │   ├── s3_service.py           # Cloudflare R2 (S3 호환)
│   │   │   ├── pdf_service.py          # PDF 추출 파이프라인
│   │   │   └── thumbnail_service.py    # 페이지/문항 썸네일 생성
│   │   └── utils/
│   │       ├── question_parser.py      # 문항 경계 감지
│   │       └── layout_spec.py          # 그리드 레이아웃 상수
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── views/                      # 메뉴별 뷰 컴포넌트
│       ├── components/                 # 공통 UI 컴포넌트
│       └── api/client.js               # API 호출
└── docs/
    ├── infra/                          # 인프라 명세 및 배포 가이드
    └── feature/                        # 기능 개발 명세 (SDD)
```

## API 주요 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/health` | 헬스체크 |
| `POST` | `/api/upload` | presigned URL 발급 |
| `GET` | `/api/jobs` | 업로드된 파일 목록 |
| `GET` | `/api/jobs/{id}/pages/{n}/questions` | 페이지 문항 목록 |
| `POST` | `/api/extract-v2` | 문항 선택 → PDF 생성 |
| `GET` | `/api/workbooks` | 문제집 이력 목록 |

Swagger UI: https://dailystudy-workbook-api-dev.yejicraft-cf.com/docs
