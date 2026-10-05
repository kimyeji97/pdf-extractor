#!/bin/bash
set -euo pipefail

# prod 백엔드 배포 — 빌드·푸시부터 서비스 갱신까지 한 번에 (REQ-E02)
# 사용: ./backend-deploy-prod.sh prod-<HEAD 짧은 해시>
#   1. 태그 하나만 빌드·푸시 — `latest`는 건드리지 않는다(계약 #37: dev `:latest`가 prod로 새지 않게)
#   2. 서비스가 쓰는 현재 리비전을 복제해 backend 이미지만 바꾼 새 리비전 등록
#   3. 서비스 갱신 → 안정화 대기 → 이전 리비전 deregister(콘솔 기본값이 옛 리비전을 고르지 않게)
TAG="${1:-}"
REGION=ap-northeast-2
REGISTRY=504233295989.dkr.ecr.ap-northeast-2.amazonaws.com
REPO=$REGISTRY/pdf-extractor-backend
CLUSTER=pdf-extractor-cluster
SERVICE=pdf-extractor-backend-prod-svc

# 실행 위치와 무관하게 스크립트 기준으로 backend/ 를 찾는다
cd "$(dirname "$0")/../../backend"

# ── 거부 — 아무것도 호출하기 전에 ──────────────────────────────
EXPECTED="prod-$(git rev-parse --short HEAD)"
if [ -z "$TAG" ]; then
  echo "사용: $0 $EXPECTED" >&2; exit 1
fi
if [ "$TAG" = "latest" ]; then
  echo "거부: prod는 latest로 배포하지 않는다(계약 #37). 사용: $0 $EXPECTED" >&2; exit 1
fi
if [ "$TAG" != "$EXPECTED" ]; then
  echo "거부: 태그($TAG)가 HEAD와 다르다. 기대값: $EXPECTED" >&2; exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  echo "거부: 커밋 안 된 변경이 있다 — 이미지가 커밋과 달라진다" >&2; git status --short >&2; exit 1
fi

# ── 1. 빌드·푸시 (태그 하나만) ─────────────────────────────────
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY"
docker buildx build \
  --platform linux/amd64 \
  --provenance=false \
  --push \
  -t "$REPO:$TAG" \
  .

# ── 2. 현재 리비전 복제 → 이미지만 교체해 등록 ─────────────────────
CURRENT=$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" --region "$REGION" \
  --query 'services[0].taskDefinition' --output text)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
aws ecs describe-task-definition --task-definition "$CURRENT" --region "$REGION" \
  --query 'taskDefinition' --output json > "$WORK/current.json"
python3 - "$WORK/current.json" "$WORK/new.json" "$REPO:$TAG" <<'PY'
import json, sys
src, dst, image = sys.argv[1:4]
td = json.load(open(src))
# describe 응답에만 있고 register가 받지 않는 필드
for k in ("taskDefinitionArn", "revision", "status", "requiresAttributes", "compatibilities",
          "registeredAt", "registeredBy", "deregisteredAt"):
    td.pop(k, None)
backend = [c for c in td["containerDefinitions"] if c["name"] == "backend"]
if len(backend) != 1:
    sys.exit("backend 컨테이너를 찾지 못했다")
backend[0]["image"] = image
json.dump(td, open(dst, "w"))
PY
NEW=$(aws ecs register-task-definition --cli-input-json "file://$WORK/new.json" --region "$REGION" \
  --query 'taskDefinition.taskDefinitionArn' --output text)
echo "registered: $NEW (image $REPO:$TAG)"

# ── 3. 서비스 갱신 → 안정화 → 이전 리비전 정리 ─────────────────────
aws ecs update-service --cluster "$CLUSTER" --service "$SERVICE" --task-definition "$NEW" \
  --region "$REGION" > /dev/null
echo "waiting for $SERVICE to stabilize..."
aws ecs wait services-stable --cluster "$CLUSTER" --services "$SERVICE" --region "$REGION"
aws ecs deregister-task-definition --task-definition "$CURRENT" --region "$REGION" > /dev/null
echo "deployed: $NEW (deregistered $CURRENT)"
