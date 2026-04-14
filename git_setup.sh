#!/bin/bash
# pdf-extractor GitHub 첫 푸시 스크립트
# 실행 방법: bash git_setup.sh
set -e

REPO_NAME="pdf-extractor"
GITHUB_USER="kimyeji97"

echo "▶ 1. 기존 .git 초기화 (lock 파일 정리 포함)"
rm -rf .git
git init
git branch -m main

echo "▶ 2. git 사용자 설정"
git config user.name "$GITHUB_USER"
git config user.email "b22fkhnsys@privaterelay.appleid.com"

echo "▶ 3. 파일 스테이징 (.gitignore 규칙 적용)"
git add .

echo "▶ 4. 커밋"
git commit -m "feat: PDF 문항 추출 서비스 초기 구현

- FastAPI 백엔드: 업로드/추출/상태 조회 API
- React 프론트엔드: 드래그앤드롭 업로드 → 문항 입력 → 다운로드 플로우
- pdfplumber 텍스트 추출 + Tesseract OCR fallback (무료, AWS Textract 대체)
- pymupdf 페이지 추출 및 새 PDF 생성
- 스토리지 추상화: local(개발) / S3(프로덕션) 환경변수 한 줄 전환
- 상태 관리: DB 없이 파일시스템 또는 S3 JSON으로 처리"

echo ""
echo "▶ 5. GitHub repo 생성 (gh CLI 필요)"
echo "   gh CLI 없으면 아래 중 하나를 선택하세요:"
echo ""
echo "   [방법 A] gh CLI 사용"
echo "   gh repo create $REPO_NAME --private --source=. --remote=origin --push"
echo ""
echo "   [방법 B] GitHub 웹에서 직접 생성"
echo "   1. https://github.com/new 접속"
echo "   2. Repository name: $REPO_NAME"
echo "   3. Private 선택 → Create repository"
echo "   4. 아래 명령 실행:"
echo "      git remote add origin https://github.com/$GITHUB_USER/$REPO_NAME.git"
echo "      git push -u origin main"
echo ""

# gh CLI 있으면 자동 실행
if command -v gh &> /dev/null; then
    echo "▶ gh CLI 감지됨. 자동으로 repo 생성 및 푸시합니다."
    gh repo create "$REPO_NAME" --private --source=. --remote=origin --push
    echo ""
    echo "✅ 완료! https://github.com/$GITHUB_USER/$REPO_NAME"
else
    echo "⚠️  gh CLI가 없습니다. 위 [방법 B] 명령을 수동으로 실행해주세요."
fi
