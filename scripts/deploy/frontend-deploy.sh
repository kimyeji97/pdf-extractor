#!/bin/bash
set -euo pipefail

# 사용: ./frontend-deploy.sh dev|prod
#   dev  → Worker `twilight-base-302d`(wrangler.jsonc 최상위) · API dailystudy-workbook-api-dev
#   prod → Worker `dailystudy-workbook-prod`(wrangler.jsonc env.prod) · API dailystudy-workbook-api
# ⚠️ API URL은 셸 env로 넘긴다 — `.env.local`이 localhost라 안 덮으면 그게 박힌다 (Vite: 셸 env > .env*)
ENV="${1:-}"
case "$ENV" in
  dev)  API=https://dailystudy-workbook-api-dev.yejicraft-cf.com/api; DEPLOY_ARGS=() ;;
  prod) API=https://dailystudy-workbook-api.yejicraft-cf.com/api;     DEPLOY_ARGS=(--env prod) ;;
  *)    echo "사용: $0 dev|prod" >&2; exit 1 ;;
esac

# 실행 위치와 무관하게 스크립트 기준으로 frontend/ 를 찾는다
cd "$(dirname "$0")/../../frontend"

VITE_API_BASE_URL="$API" npm run build && npx wrangler deploy ${DEPLOY_ARGS[@]+"${DEPLOY_ARGS[@]}"}
