"""
각주 관리 라우터 (REQ-29)

각주(이름 + 텍스트)를 등록·조회·삭제한다. 표지 CRUD(`cover.py`)와 같은 모양이되,
이미지가 아니라 텍스트를 저장한다.
업로드된 각주는 문제집 생성 시 표지를 제외한 모든 문항 페이지 하단에 삽입된다.

Endpoints:
  POST   /api/footnotes       — 각주 등록
  GET    /api/footnotes       — 각주 목록 조회
  DELETE /api/footnotes/{id}  — 각주 삭제
"""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services import storage

router = APIRouter()


class FootnoteCreate(BaseModel):
    name: str = Field(..., min_length=1, description="각주 이름")
    text: str = Field(..., min_length=1, description="각주 텍스트")


@router.post("/footnotes", status_code=201)
def create_footnote(body: FootnoteCreate):
    """각주를 등록한다."""
    footnote_id = str(uuid.uuid4())

    meta = {
        "footnote_id": footnote_id,
        "name": body.name.strip(),
        "text": body.text.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    storage.save_footnote(footnote_id, meta)

    return meta


@router.get("/footnotes")
def list_footnotes():
    """등록된 각주 목록을 반환한다."""
    return {"footnotes": storage.list_footnotes()}


@router.delete("/footnotes/{footnote_id}")
def delete_footnote(footnote_id: str):
    """각주를 삭제한다."""
    if storage.get_footnote_meta(footnote_id) is None:
        raise HTTPException(status_code=404, detail="각주를 찾을 수 없습니다.")
    storage.delete_footnote(footnote_id)
    return {"message": "삭제되었습니다."}
