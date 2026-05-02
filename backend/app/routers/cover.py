"""
표지 이미지 관리 라우터

표지 이미지를 업로드·조회·삭제한다.
업로드된 표지는 문제집 생성 시 첫 번째 페이지(표지)로 사용된다.

Endpoints:
  POST   /api/covers          — 표지 이미지 업로드
  GET    /api/covers          — 표지 목록 조회
  GET    /api/covers/{id}     — 표지 이미지 반환 (img src 용)
  DELETE /api/covers/{id}     — 표지 삭제
"""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import Response

from app.services import storage

router = APIRouter()

_ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png"}
_MAX_SIZE = 10 * 1024 * 1024   # 10 MB


@router.post("/covers")
async def upload_cover(
    file: UploadFile = File(...),
    name: str = Form(""),
):
    """표지 이미지를 업로드한다."""
    if file.content_type not in _ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="JPEG 또는 PNG 이미지만 업로드할 수 있습니다.")

    data = await file.read()
    if len(data) > _MAX_SIZE:
        raise HTTPException(status_code=400, detail="파일 크기는 10MB 이하여야 합니다.")

    cover_id = str(uuid.uuid4())
    ext = "png" if file.content_type == "image/png" else "jpg"

    meta = {
        "cover_id": cover_id,
        "name": name.strip() or (file.filename or "표지"),
        "ext": ext,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    storage.save_cover(cover_id, meta, data, ext)

    return {
        "cover_id": cover_id,
        "name": meta["name"],
        "thumbnail_url": f"/api/covers/{cover_id}/image",
        "created_at": meta["created_at"],
    }


@router.get("/covers")
def list_covers():
    """업로드된 표지 목록을 반환한다."""
    covers = storage.list_covers()
    return {
        "covers": [
            {
                **c,
                "thumbnail_url": f"/api/covers/{c['cover_id']}/image",
            }
            for c in covers
        ]
    }


@router.get("/covers/{cover_id}/image")
def get_cover_image(cover_id: str):
    """표지 이미지를 반환한다 (img src 직접 사용 가능)."""
    result = storage.get_cover_image(cover_id)
    if result is None:
        raise HTTPException(status_code=404, detail="표지를 찾을 수 없습니다.")
    image_bytes, content_type = result
    return Response(content=image_bytes, media_type=content_type)


@router.delete("/covers/{cover_id}")
def delete_cover(cover_id: str):
    """표지를 삭제한다."""
    if storage.get_cover_meta(cover_id) is None:
        raise HTTPException(status_code=404, detail="표지를 찾을 수 없습니다.")
    storage.delete_cover(cover_id)
    return {"message": "삭제되었습니다."}
