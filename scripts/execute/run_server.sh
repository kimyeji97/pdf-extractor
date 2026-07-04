#!/bin/bash
cd ../../backend

# 가상환경 (이미 있으면 재사용, 없으면 새로 생성)
if [ ! -d venv ]; then
  python3 -m venv venv
fi
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성
pip install -r requirements.txt

# 로컬용 .env 복사
cp .env.dev .env

# Tesseract 설치 (OCR fallback용)
# macOS:  brew install tesseract tesseract-lang
# Ubuntu: sudo apt install tesseract-ocr tesseract-ocr-kor tesseract-ocr-eng

# 서버 실행
uvicorn app.main:app --reload