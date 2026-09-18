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

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response

from app.routers.template import guard_asset_delete
from app.services import auth_service
from app.services import storage

router = APIRouter()

_ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png"}
_MAX_SIZE = 10 * 1024 * 1024   # 10 MB — 표지와 동일 제한


@router.post("/watermarks", status_code=201)
async def upload_watermark(
    file: UploadFile = File(...),
    name: str = Form(""),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """워터마크 이미지를 업로드한다. 업로드한 사용자 본인 소유로 귀속된다(REQ-27 Phase 2)."""
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
        "owner_id": current_user["user_id"],
    }

    storage.save_watermark(watermark_id, meta, data, ext)

    return {
        "watermark_id": watermark_id,
        "name": meta["name"],
        "thumbnail_url": f"/api/watermarks/{watermark_id}/image",
        "created_at": meta["created_at"],
    }


@router.get("/watermarks")
def list_watermarks(current_user: dict = Depends(auth_service.get_current_user)):
    """업로드된 워터마크 목록을 반환한다. `user`는 본인 소유만, `admin`은 전체(REQ-27 Phase 2)."""
    watermarks = storage.list_watermarks()
    if current_user["role"] != "admin":
        watermarks = [w for w in watermarks if w.get("owner_id") == current_user["user_id"]]
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
def get_watermark_image(
    watermark_id: str, current_user: dict = Depends(auth_service.get_current_user)
):
    """워터마크 이미지를 반환한다 (img src 직접 사용 가능)."""
    meta = storage.get_watermark_meta(watermark_id)
    if meta is None:
        raise HTTPException(status_code=404, detail="워터마크를 찾을 수 없습니다.")
    auth_service.ensure_owner_or_admin(current_user, meta.get("owner_id"))

    result = storage.get_watermark_image(watermark_id)
    if result is None:
        raise HTTPException(status_code=404, detail="워터마크를 찾을 수 없습니다.")
    image_bytes, content_type = result
    return Response(content=image_bytes, media_type=content_type)


@router.delete("/watermarks/{watermark_id}")
def delete_watermark(
    watermark_id: str,
    force: bool = False,
    current_user: dict = Depends(auth_service.get_current_user),
):
    """워터마크를 삭제한다."""
    meta = storage.get_watermark_meta(watermark_id)
    if meta is None:
        raise HTTPException(status_code=404, detail="워터마크를 찾을 수 없습니다.")
    auth_service.ensure_owner_or_admin(current_user, meta.get("owner_id"))
    guard_asset_delete("watermark_id", watermark_id, force, "워터마크")
    storage.delete_watermark(watermark_id)
    return {"message": "삭제되었습니다."}
