# 로컬 개발 빠른 시작 (AWS 없이)

## 1. 백엔드 세팅

```bash
cd backend

# 가상환경
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성
pip install -r requirements.txt

# 로컬용 .env 복사
cp .env.local .env

# Tesseract 설치 (OCR fallback용)
# macOS:  brew install tesseract tesseract-lang
# Ubuntu: sudo apt install tesseract-ocr tesseract-ocr-kor tesseract-ocr-eng
# Windows: https://github.com/UB-Mannheim/tesseract/wiki (kor 언어팩 체크)

# 서버 실행
uvicorn app.main:app --reload
```

## 2. 프론트엔드 세팅

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속

---

## 로컬 모드 동작 방식

```
클라이언트                  FastAPI                  로컬 파일시스템
   │                          │                           │
   │  POST /api/upload        │                           │
   │─────────────────────────>│                           │
   │  { job_id, upload_url }  │  local_storage/           │
   │<─────────────────────────│  └─ status/{job_id}.json  │
   │                          │                           │
   │  POST /api/upload/direct │                           │
   │  (multipart, PDF)        │                           │
   │─────────────────────────>│  uploads/{job_id}/        │
   │                          │  └─ original.pdf ─────────>
   │  POST /api/extract       │                           │
   │─────────────────────────>│                           │
   │                          │  [백그라운드]             │
   │                          │  pdfplumber 경계 감지     │
   │                          │  pymupdf 페이지 추출      │
   │                          │  results/{job_id}/        │
   │                          │  └─ result.pdf ───────────>
   │  GET /api/status/{id}    │                           │
   │─────────────────────────>│                           │
   │  { status: DONE,         │                           │
   │    download_url }        │                           │
   │<─────────────────────────│                           │
   │                          │                           │
   │  GET /api/files/{key}    │                           │
   │─────────────────────────>│<── result.pdf ────────────│
   │  [PDF 다운로드]           │                           │
```

## AWS로 전환할 때

1. `.env` 수정:
   ```
   STORAGE_BACKEND=s3
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   S3_BUCKET_NAME=...
   ```
2. 서버 재시작 — 코드 변경 없음

## 생성된 로컬 파일 위치

```
backend/local_storage/
├── uploads/{job_id}/original.pdf   ← 업로드된 원본
├── results/{job_id}/result.pdf     ← 추출된 결과
└── status/{job_id}.json            ← 작업 상태
```
