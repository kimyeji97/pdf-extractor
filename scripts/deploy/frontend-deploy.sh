#!/bin/bash
set -euo pipefail

# 실행 위치와 무관하게 스크립트 기준으로 frontend/ 를 찾는다
cd "$(dirname "$0")/../../frontend"

VITE_API_BASE_URL=https://dailystudy-workbook-api-dev.yejicraft-cf.com/api npm run build && npx wrangler deploy
