"""
인증 라우터 — 회원가입·로그인·토큰 갱신 (REQ-27 Phase 1)

Endpoints:
  POST /api/auth/signup   — 이메일+비밀번호 회원가입
  POST /api/auth/login    — 로그인, access+refresh 토큰 발급
  POST /api/auth/refresh  — refresh_token으로 갱신 (rolling — 새 refresh_token도 함께 발급)
  POST /api/auth/logout   — access 쿠키 삭제 (REQ-B15)

login·refresh는 access token을 본문과 함께 HttpOnly 쿠키로도 내려준다(REQ-B15 — `<img>`용).
"""
import jwt
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field

from app.services import auth_service

router = APIRouter()


class SignupRequest(BaseModel):
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1)


@router.post("/auth/signup", status_code=201)
def signup(body: SignupRequest):
    """이메일+비밀번호로 가입한다. 이미 가입된 이메일이면 409."""
    if auth_service.get_user_by_email(body.email) is not None:
        raise HTTPException(status_code=409, detail="이미 가입된 이메일입니다.")

    user = auth_service.create_user(body.email, body.password)
    return {"user_id": user["user_id"], "email": user["email"], "role": user["role"], "status": user["status"]}


@router.post("/auth/login")
def login(body: LoginRequest, response: Response):
    """이메일+비밀번호로 로그인해 access/refresh 토큰을 발급한다."""
    user = auth_service.get_user_by_email(body.email)
    if user is None or not auth_service.verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    # REQ-C12 — active만 로그인. 비밀번호가 맞을 때만 상태를 알린다.
    # pending만 막으면 콘솔에서 승인 대기를 [차단]하는 순간 로그인이 열린다(리뷰 회차 0)
    status = auth_service.user_status(user)
    if status == "pending":
        raise HTTPException(status_code=403, detail="가입 승인 대기 중입니다. 관리자 승인 후 이용할 수 있습니다.")
    if status != "active":
        raise HTTPException(status_code=403, detail="이용이 제한된 계정입니다. 관리자에게 문의해 주세요.")

    tokens = auth_service.create_token_pair(user["user_id"])
    auth_service.set_access_cookie(response, tokens["access_token"])
    return tokens


@router.post("/auth/refresh")
def refresh(body: RefreshRequest, response: Response):
    """refresh_token으로 새 토큰 쌍을 발급한다 (rolling)."""
    try:
        payload = auth_service.decode_refresh_token(body.refresh_token)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="유효하지 않은 refresh 토큰입니다.")

    tokens = auth_service.create_token_pair(payload["sub"])
    auth_service.set_access_cookie(response, tokens["access_token"])
    return tokens


@router.post("/auth/logout", status_code=204)
def logout():
    """access 쿠키를 지운다. 토큰 자체는 무상태라 무효화하지 않는다(ADR-0005)."""
    response = Response(status_code=204)
    auth_service.clear_access_cookie(response)
    return response
