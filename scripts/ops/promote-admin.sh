#!/bin/bash
# 가입한 계정을 admin 으로 승격하고, 주인 없는(owner_id=None) 기존 레코드 6종을 그 계정 소유로 백필한다.
# 사용: ./scripts/ops/promote-admin.sh <email> [env 파일, 기본 backend/.env.dev]
# ⚠️ env 파일이 가리키는 스토리지(dev R2 등)에 직접 쓴다. 재실행해도 안전하다(이미 admin·이미 귀속된 건 그대로).
set -euo pipefail

EMAIL="${1:?사용: $0 <email> [env 파일]}"
cd "$(dirname "$0")/../../backend"
ENV_FILE="${2:-.env.dev}"

set -a; source "$ENV_FILE"; set +a
echo "storage: ${STORAGE_BACKEND:-local} / bucket: ${R2_BUCKET_NAME:-} / prefix: ${R2_ROOT_PREFIX:-}"

EMAIL="$EMAIL" venv/bin/python - <<'EOF'
import os, sys
from app.services import storage
from app.services.migration_service import backfill_owner_id

email = os.environ["EMAIL"]
user = next((u for u in storage.list_users() if u.get("email") == email), None)
if user is None:
    sys.exit(f"사용자 없음: {email} — 먼저 회원가입할 것")

if user.get("role") != "admin":
    user["role"] = "admin"
    storage.save_user(user["user_id"], user)
    print(f"승격: {email} ({user['user_id']}) → admin")
else:
    print(f"이미 admin: {email} ({user['user_id']})")

print("백필(owner_id 채운 건수):", backfill_owner_id(user["user_id"]))
EOF
