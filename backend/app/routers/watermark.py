"""
워터마크 관리 라우터 (REQ-29)

워터마크 이미지를 업로드·조회·삭제한다. 표지 CRUD(`cover.py`)와 완전히 동일한
업로드 방식(허용 형식·용량 제한 포함)이다.
업로드된 워터마크는 문제집 생성 시 표지를 제외한 모든 문항 페이지 중앙에 반투명하게
삽입된다.

Endpoints:
  POST   /api/watermarks          — 워터마크 이미지 업로드
  GET    /api/watermarks          — 워터마크 목록 조회
  GET    /api/watermarks/{id}     — 워터마크 이미지 반환 (img src 용)
  DELETE /api/watermarks/{id}     — 워터마크 삭제
"""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import Response

from app.services import storage

router = APIRouter()

_ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png"}
_MAX_SIZE = 10 * 1024 * 1024   # 10 MB — 표지와 동일 제한


@router.post("/watermarks", status_code=201)
async def upload_watermark(
    file: UploadFile = File(...),
    name: str = Form(""),
):
    """워터마크 이미지를 업로드한다."""
    if file.content_type not in _ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="JPEG 또는 PNG 이미지만 업로드할 수 있습니다.")

    data = await file.read()
    if len(data) > _MAX_SIZE:
        raise HTTPException(status_code=400, detail="파일 크기는 10MB 이하여야 합니다.")

    watermark_id = str(uuid.uuid4())
    ext = "png" if file.content_type == "image/png" else "jpg"

    meta = {
        "watermark_id": watermark_id,
        "name": name.strip() or (file.filename or "워터마크"),
        "ext": ext,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    storage.save_watermark(watermark_id, meta, data, ext)

    return {
        "watermark_id": watermark_id,
        "name": meta["name"],
        "thumbnail_url": f"/api/watermarks/{watermark_id}/image",
        "created_at": meta["created_at"],
    }


@router.get("/watermarks")
def list_watermarks():
    """업로드된 워터마크 목록을 반환한다."""
    watermarks = storage.list_watermarks()
    return {
        "watermarks": [
            {
                **w,
                "thumbnail_url": f"/api/watermarks/{w['watermark_id']}/image",
            }
            for w in watermarks
        ]
    }


@router.get("/watermarks/{watermark_id}/image")
def get_watermark_image(watermark_id: str):
    """워터마크 이미지를 반환한다 (img src 직접 사용 가능)."""
    result = storage.get_watermark_image(watermark_id)
    if result is None:
        raise HTTPException(status_code=404, detail="워터마크를 찾을 수 없습니다.")
    image_bytes, content_type = result
    return Response(content=image_bytes, media_type=content_type)


@router.delete("/watermarks/{watermark_id}")
def delete_watermark(watermark_id: str):
    """워터마크를 삭제한다."""
    if storage.get_watermark_meta(watermark_id) is None:
        raise HTTPException(status_code=404, detail="워터마크를 찾을 수 없습니다.")
    storage.delete_watermark(watermark_id)
    return {"message": "삭제되었습니다."}
