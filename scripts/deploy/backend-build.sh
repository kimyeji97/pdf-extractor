#!/bin/bash
set -euo pipefail

# 실행 위치와 무관하게 스크립트 기준으로 backend/ 를 찾는다
cd "$(dirname "$0")/../../backend"

REPO=504233295989.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-backend
# 버전 태그: [접두사-]커밋해시[-dirty]  예) ./backend-build.sh p06 → p06-05e9e8f
VERSION="${1:+$1-}$(git rev-parse --short HEAD)"
git diff --quiet HEAD || VERSION="$VERSION-dirty"   # 커밋 안 된 변경이 섞였음을 표시

aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 504233295989.dkr.ecr.ap-northeast-2.amazonaws.com
#docker build -t pdf-extractor-backend .
#docker tag pdf-extractor-backend:latest 504233295989.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-backend:latest
#docker push 504233295989.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-backend:latest
docker buildx build \
  --platform linux/amd64 \
  --provenance=false \
  --push \
  -t "$REPO:latest" \
  -t "$REPO:$VERSION" \
  .

echo "pushed: $REPO:latest, $REPO:$VERSION"