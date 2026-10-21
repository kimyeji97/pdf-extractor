"""
분석 결과 공유 관리 (REQ-28 Phase 2) — 소유자 전용.

상대는 이메일로 지정한다(PLAN-28 § 결정 "공유 대상 지정"). 없는 이메일이면 404 로 알린다 —
가입 여부가 드러나는 건 소수 팀이라 감수했다.
"""
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel

from app.models.schemas import JobType
from app.services import auth_service, share_service, storage

router = APIRouter()

ShareRole = Literal["owner", "editor", "viewer"]  # owner 로 주면 공동 소유자(PLAN-28 Phase 6)


class ShareCreate(BaseModel):
    email: str
    role: ShareRole = "editor"  # 기본은 편집자(PLAN-28 § 결정)


class ShareUpdate(BaseModel):
    role: ShareRole


class ShareItem(BaseModel):
    user_id: str
    email: str
    role: str


class ShareListResponse(BaseModel):
    owner: Optional[ShareItem] = None  # 업로더 — 인덱스 밖이라 해제·변경 대상이 아니다
    shares: list[ShareItem]


def _owned_job(job_id: str, current_user: dict):
    job = storage.get_status(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job을 찾을 수 없습니다.")
    share_service.ensure_role(current_user, job, share_service.OWNER)
    return job


def _not_self(user_id: str, current_user: dict) -> None:
    """자기 역할 변경·해제는 막는다 — 공동 소유자가 실수로 자기를 내리면 되돌릴 사람이 없다(PLAN-28 § 결정 "본인 권한")."""
    if user_id == current_user.get("user_id"):
        raise HTTPException(status_code=400, detail="본인의 권한은 바꿀 수 없습니다.")


def _item(user_id: str, role: str) -> ShareItem:
    user = storage.get_user(user_id) or {}
    return ShareItem(user_id=user_id, email=user.get("email", ""), role=role)


@router.get("/jobs/{job_id}/shares", response_model=ShareListResponse)
def list_shares(job_id: str, current_user: dict = Depends(auth_service.get_current_user)):
    job = _owned_job(job_id, current_user)
    owner = _item(job.owner_id, share_service.OWNER) if job.owner_id else None
    return ShareListResponse(owner=owner, shares=[_item(e["user_id"], e["role"]) for e in share_service.shares_of(job_id)])


@router.post("/jobs/{job_id}/shares", response_model=ShareItem, status_code=201)
def add_share(job_id: str, body: ShareCreate, current_user: dict = Depends(auth_service.get_current_user)):
    job = _owned_job(job_id, current_user)
    if job.job_type != JobType.SOURCE:
        raise HTTPException(status_code=400, detail="분석 결과만 공유할 수 있습니다.")  # 문제집 공유는 범위 밖(PLAN-28)
    target = auth_service.get_user_by_email(body.email.strip())
    if target is None:
        raise HTTPException(status_code=404, detail="가입된 계정이 없는 이메일입니다.")
    if target["user_id"] == job.owner_id:
        raise HTTPException(status_code=400, detail="소유자에게는 공유할 수 없습니다.")
    share_service.put_share(job_id, target["user_id"], body.role)
    return _item(target["user_id"], body.role)


@router.patch("/jobs/{job_id}/shares/{user_id}", response_model=ShareItem)
def update_share(
    job_id: str, user_id: str, body: ShareUpdate, current_user: dict = Depends(auth_service.get_current_user)
):
    _owned_job(job_id, current_user)
    _not_self(user_id, current_user)
    if not any(e["user_id"] == user_id for e in share_service.shares_of(job_id)):
        raise HTTPException(status_code=404, detail="공유 항목이 없습니다.")
    share_service.put_share(job_id, user_id, body.role)
    return _item(user_id, body.role)


@router.delete("/jobs/{job_id}/shares/{user_id}", status_code=204)
def delete_share(job_id: str, user_id: str, current_user: dict = Depends(auth_service.get_current_user)):
    _owned_job(job_id, current_user)
    _not_self(user_id, current_user)
    if not share_service.remove_share(job_id, user_id):
        raise HTTPException(status_code=404, detail="공유 항목이 없습니다.")
    return Response(status_code=204)
