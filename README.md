# PDF 문항 추출기

기출문제 PDF에서 원하는 문항 번호만 골라 새 PDF로 추출하는 서비스입니다.

## 기능

- PDF 업로드 (드래그앤드롭, 최대 10MB)
- 문항 번호 지정 — `1,3,5` 또는 `1-5` 또는 `1,3,7-10` 형식
- 텍스트형 PDF: pdfplumber로 문항 경계 감지
- 이미지형 PDF(스캔본): Tesseract OCR fallback 자동 적용
- 결과 PDF 즉시 다운로드

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18, Vite |
| Backend | Python 3.11, FastAPI |
| PDF 처리 | pdfplumber, pymupdf |
| OCR fallback | Tesseract (kor+eng) |
| Storage | 로컬 파일시스템 (개발) / AWS S3 (프로덕션) |
| 인프라 | AWS EC2 t2.micro |

## 빠른 시작 (로컬 개발)

### 사전 준비

```bash
# Tesseract 설치 (한국어 OCR)
# macOS
brew install tesseract tesseract-lang

# Ubuntu
sudo apt install tesseract-ocr tesseract-ocr-kor tesseract-ocr-eng
```

### 백엔드

```bash
cd backend

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.local .env              # 로컬용 환경변수 적용
uvicorn app.main:app --reload   # http://localhost:8000
```

### 프론트엔드

```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

브라우저에서 http://localhost:5173 접속 후 바로 사용 가능합니다.

## 환경변수

`backend/.env.local`을 복사해 `.env`로 사용합니다.

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `STORAGE_BACKEND` | `local` | `local` 또는 `s3` |
| `LOCAL_STORAGE_DIR` | `./local_storage` | 로컬 모드 파일 저장 경로 |
| `LOCAL_BASE_URL` | `http://localhost:8000` | 로컬 파일 서빙 기준 URL |
| `AWS_REGION` | `ap-northeast-2` | S3 모드에서 사용 |
| `AWS_ACCESS_KEY_ID` | — | S3 모드에서 사용 |
| `AWS_SECRET_ACCESS_KEY` | — | S3 모드에서 사용 |
| `S3_BUCKET_NAME` | — | S3 모드에서 사용 |
| `TESSERACT_LANG` | `kor+eng` | 한국어팩 미설치 시 `eng`로 변경 |

## 로컬 → S3 전환

`.env`에서 한 줄만 바꾸면 됩니다.

```bash
STORAGE_BACKEND=s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
```

코드 변경 없이 스토리지가 전환됩니다.

## 프로젝트 구조

```
pdf-extractor/
├── backend/
│   ├── app/
│   │   ├── core/config.py              # 환경변수 설정
│   │   ├── models/schemas.py           # Pydantic 요청/응답 모델
│   │   ├── routers/
│   │   │   ├── upload.py               # POST /api/upload
│   │   │   └── extract.py              # POST /api/extract, GET /api/status/{job_id}
│   │   ├── services/
│   │   │   ├── storage.py              # 스토리지 팩토리 (local/S3 토글)
│   │   │   ├── local_storage_service.py
│   │   │   ├── s3_service.py
│   │   │   ├── pdf_service.py          # pdfplumber + pymupdf 추출 파이프라인
│   │   │   └── textract_service.py     # Tesseract OCR fallback
│   │   └── utils/question_parser.py    # 문항 번호 파싱 + 경계 감지
│   ├── .env.local                      # 로컬 개발용 환경변수 템플릿
│   ├── .env.example                    # 전체 환경변수 목록
│   ├── Dockerfile
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx                     # 전체 플로우 상태 관리
    │   ├── api/client.js               # API 호출 (local/S3 모드 자동 분기)
    │   └── components/
    │       ├── UploadForm.jsx          # 드래그앤드롭 파일 선택
    │       ├── QuestionInput.jsx       # 번호 입력 및 유효성 검사
    │       └── StatusPoller.jsx        # 2초 간격 상태 폴링 + 다운로드
    └── vite.config.js
```

## API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/upload` | presigned URL 및 job_id 발급 |
| `POST` | `/api/upload/direct` | 파일 직접 업로드 (로컬 모드 전용) |
| `POST` | `/api/extract` | 문항 추출 작업 시작 |
| `GET` | `/api/status/{job_id}` | 작업 상태 조회 (PENDING→PROCESSING→DONE/FAILED) |
| `GET` | `/api/files/{key}` | 결과 파일 다운로드 (로컬 모드 전용) |

Swagger UI: http://localhost:8000/docs

## 상태 관리

DB 없이 파일 기반으로 작업 상태를 관리합니다.

- 로컬: `local_storage/status/{job_id}.json`
- S3: `s3://bucket/status/{job_id}.json`

```
PENDING → PROCESSING → DONE
                     ↘ FAILED
```

## 문항 경계 감지

`backend/app/utils/question_parser.py`의 `_Q_PATTERNS`에 정규식을 추가해 다양한 문항 형식을 지원합니다.

```python
# 기본 지원 패턴
"1. 다음 중..."   # 숫자 + 마침표
"[1] 다음 중..."  # 대괄호
"문1. ..."        # 문 + 숫자
```

샘플 PDF 확보 후 실제 패턴에 맞게 보완하면 인식률이 높아집니다.

## EC2 배포

```bash
cd backend
bash install_ec2.sh   # 시스템 의존성 + pip 패키지 설치
cp .env.example .env  # AWS 자격증명 입력 후
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Docker를 사용할 경우:

```bash
docker build -t pdf-extractor .
docker run -p 8000:8000 --env-file .env pdf-extractor
```
