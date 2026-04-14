FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성
# - tesseract-ocr      : OCR 엔진 본체
# - tesseract-ocr-kor  : 한국어 언어 데이터 (약 10MB)
# - tesseract-ocr-eng  : 영어 (숫자·기호 인식용, 보통 기본 포함이지만 명시)
# - libmupdf-dev       : pymupdf 빌드
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-kor \
    tesseract-ocr-eng \
    libmupdf-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
