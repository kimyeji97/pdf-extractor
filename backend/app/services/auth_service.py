"""
인증 서비스 — 비밀번호 해싱, JWT 발급·검증 (REQ-27 Phase 1)

access 1시간 · refresh 7일, refresh는 rolling(갱신할 때마다 재발급해 만료를 연장한다)
— 계획서 § 결정. 라이브러리 선택(PyJWT + bcrypt)은 ADR-0005(세션 쿠키 대신 JWT) 참조.
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt

from app.core.config import settings
from app.services import storage

ACCESS_TOKEN_EXPIRE_SECONDS = 60 * 60             # 1시간
REFRESH_TOKEN_EXPIRE_SECONDS = 7 * 24 * 60 * 60    # 7일
_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def get_user_by_email(email: str) -> Optional[dict]:
    for user in storage.list_users():
        if user.get("email") == email:
            return user
    return None


def create_user(email: str, password: str) -> dict:
    """가입 — 기본 role은 "user"(계획서 § Phase 1 완료 기준)."""
    user_id = str(uuid.uuid4())
    user = {
        "user_id": user_id,
        "email": email,
        "password_hash": hash_password(password),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    storage.save_user(user_id, user)
    return user


def _create_token(user_id: str, token_type: str, expire_seconds: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=expire_seconds)).timestamp()),
        # 같은 초 안에 재발급되면 iat/exp가 같아져 토큰이 바이트 단위로 동일해진다 —
        # "재발급"이 실제로는 아무것도 안 바꾸는 셈이라 rolling의 의미가 없어진다.
        # jti로 매 발급마다 유일성을 강제한다.
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=_ALGORITHM)


def create_token_pair(user_id: str) -> dict:
    return {
        "access_token": _create_token(user_id, "access", ACCESS_TOKEN_EXPIRE_SECONDS),
        "refresh_token": _create_token(user_id, "refresh", REFRESH_TOKEN_EXPIRE_SECONDS),
        "token_type": "bearer",
    }


def decode_refresh_token(token: str) -> dict:
    """유효하지 않으면 jwt.PyJWTError 계열을 던진다 — 라우터가 401로 변환한다."""
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[_ALGORITHM])
    if payload.get("type") != "refresh":
        raise jwt.InvalidTokenError("refresh 토큰이 아닙니다.")
    return payload
