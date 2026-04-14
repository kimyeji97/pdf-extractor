#!/bin/bash
# EC2 (Ubuntu 22.04) 에서 Tesseract + Python 의존성 설치
# Docker 없이 직접 실행할 때 사용

set -e

# 1. 시스템 패키지
sudo apt-get update
sudo apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-kor \
    tesseract-ocr-eng \
    python3-pip

# 2. 설치 확인
echo "Tesseract 버전: $(tesseract --version | head -1)"
echo "지원 언어: $(tesseract --list-langs)"

# 3. Python 패키지
pip install -r requirements.txt

echo "설치 완료"
