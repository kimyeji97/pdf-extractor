#!/bin/bash
# 운영 콘솔 — 이용 현황(서버 부하·가입자·분석·생성) 조회 + admin 부여/회수. 브라우저로 http://127.0.0.1:8765
# 사용: ./scripts/ops/admin-console.sh [prod|dev|local] [포트]   (기본 prod 8765)
# 필요: AWS 자격증명(Secrets Manager·ECS·CloudWatch 읽기). ⚠️ prod 는 실데이터 — role 변경은 즉시 반영된다.
set -euo pipefail
cd "$(dirname "$0")/../../backend"
exec venv/bin/python ../scripts/ops/admin_console.py "${1:-prod}" "${2:-8765}"
