"""
템플릿 관리 라우터 (REQ-30)

표지·각주·워터마크를 묶은 "템플릿"을 등록·조회·수정·삭제한다.
표지 CRUD(`cover.py`)와 같은 모양이되 **PATCH가 더해진다** — 템플릿은 조합이라
구성 요소만 바뀌는 변경이 정상이기 때문이다(계획서 § 결정 "템플릿 수정").

템플릿은 값을 복사하지 않고 **id 3개만 가리키는 참조**다 → ADR-0004.

Endpoints:
  POST   /api/templates        — 템플릿 등록
  GET    /api/templates        — 템플릿 목록 조회
  PATCH  /api/templates/{id}   — 템플릿 수정 (부분 갱신)
  DELETE /api/templates/{id}   — 템플릿 삭제
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services import pdf_service, storage

router = APIRouter()

# 템플릿이 가리킬 수 있는 자산 슬롯. 참조 검사·강제 삭제가 전부 이 목록을 돈다.
SLOT_FIELDS = ("cover_id", "footnote_id", "watermark_id")


class TemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, description="템플릿 이름")
    cover_id: Optional[str] = Field(default=None, description="표지 cover_id (선택)")
    footnote_id: Optional[str] = Field(default=None, description="각주 footnote_id (선택)")
    watermark_id: Optional[str] = Field(default=None, description="워터마크 watermark_id (선택)")


class TemplateUpdate(BaseModel):
    """부분 갱신. 보내지 **않은** 필드는 그대로 두고, `null`로 보낸 필드는 슬롯을 비운다.

    ⚠️ 그래서 "안 보냄"과 "null"을 구별해야 한다 — `model_dump(exclude_unset=True)`로
    실제로 실려 온 키만 뽑는다. 구별하지 않으면 이름만 바꾸는 PATCH가 슬롯 3개를
    통째로 비워 버린다.
    """
    name: Optional[str] = Field(default=None, min_length=1)
    cover_id: Optional[str] = None
    footnote_id: Optional[str] = None
    watermark_id: Optional[str] = None


def is_empty(meta: dict) -> bool:
    """슬롯 3개가 모두 비었는가.

    빈 템플릿은 "템플릿 없음"과 결과가 같아서 **입력으로는 만들 수 없다**(400).
    다만 A′ 강제 삭제의 결과로 비워지는 것은 허용된다 — 자산 삭제의 부수 효과로
    사용자가 만든 템플릿을 없애지 않는다(계획서 § 결정 "빈 템플릿").
    """
    return not any(meta.get(f) for f in SLOT_FIELDS)


def _render_constants() -> dict:
    """미리보기가 같은 그림을 그리는 데 필요한 렌더 상수 (REQ-F13).

    ⚠️ **값을 여기에 다시 적지 않는다.** 단일 출처는 `pdf_service`이고 이 함수는 나를 뿐이다
    (PLAN-F13 § 결정 "렌더 상수의 단일 출처"). 프론트에 복제하지 않는 이유와 같다 —
    두 곳에 같은 값을 두면 한쪽만 고쳤을 때 조용히 어긋난다.
    """
    return {
        "footnote_font_size":   pdf_service._FOOTNOTE_FONT_SIZE,
        "footnote_margin":      pdf_service._FOOTNOTE_MARGIN,
        "footnote_color":       pdf_service._FOOTNOTE_COLOR,
        "watermark_size_ratio": pdf_service._WATERMARK_SIZE_RATIO,
        "watermark_opacity":    pdf_service._WATERMARK_OPACITY,
    }


def _resolve_slots(meta: dict) -> dict:
    """슬롯 id 를 **표시용 정보**로 푼다 (REQ-F13).

    미리보기는 각주를 그리려면 텍스트가, 워터마크를 그리려면 이미지 URL 이 필요한데
    REQ-30 응답은 id 뿐이었다. 세 목록을 다시 부르는 대신 여기서 싣는다.

    ⚠️ **참조가 끊겨 있어도 죽지 않는다.** A′ 가 막지만 강제 삭제와의 경쟁 상태가 있고,
       미리보기가 거기서 500 을 받으면 화면이 통째로 멈춘다(PLAN-F13 § Phase 1).
       끊긴 슬롯은 비어 있는 것과 같게 `None` 으로 낸다 — 미리보기 입장에선 그릴 것이 없다는
       점에서 동일하고, "무엇을 가리켰었는지"는 `needs_review` 칩이 이미 알린다.

    이미지 URL 은 결정적이다(계약 #15) — 얻으려고 목록 API 를 더 부르지 않는다.
    """
    cover = footnote = watermark = None

    if meta.get("cover_id"):
        cover_meta = storage.get_cover_meta(meta["cover_id"])
        if cover_meta:
            cover = {
                "name": cover_meta.get("name"),
                "image_url": f"/api/covers/{meta['cover_id']}/image",
            }

    if meta.get("footnote_id"):
        footnote_meta = storage.get_footnote_meta(meta["footnote_id"])
        if footnote_meta:
            footnote = {
                "name": footnote_meta.get("name"),
                "text": footnote_meta.get("text"),
            }

    if meta.get("watermark_id"):
        watermark_meta = storage.get_watermark_meta(meta["watermark_id"])
        if watermark_meta:
            watermark = {
                "name": watermark_meta.get("name"),
                "image_url": f"/api/watermarks/{meta['watermark_id']}/image",
            }

    return {"cover": cover, "footnote": footnote, "watermark": watermark}


def _public(meta: dict) -> dict:
    """응답 봉투. `cover.py`의 기존 모양을 따르고, REQ-F13이 표시용 정보·렌더 상수를 더했다.

    id 필드는 **그대로 둔다** — 관리 화면의 수정 폼이 id 로 동작한다.
    """
    return {
        "template_id": meta["template_id"],
        "name": meta["name"],
        "cover_id": meta.get("cover_id"),
        "footnote_id": meta.get("footnote_id"),
        "watermark_id": meta.get("watermark_id"),
        # 파생 판정이 불가능해서 **저장되는** 플래그다 — 강제 삭제가 슬롯을 None으로
        # 만드는데 "원래 안 넣은 것"도 None이라 값만으로는 구별할 수 없다.
        "needs_review": bool(meta.get("needs_review")),
        "created_at": meta.get("created_at"),
        **_resolve_slots(meta),
        "render": _render_constants(),
    }


@router.post("/templates", status_code=201)
def create_template(body: TemplateCreate):
    """템플릿을 등록한다."""
    template_id = str(uuid.uuid4())

    meta = {
        "template_id": template_id,
        "name": body.name.strip(),
        "cover_id": body.cover_id,
        "footnote_id": body.footnote_id,
        "watermark_id": body.watermark_id,
        "needs_review": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if is_empty(meta):
        raise HTTPException(
            status_code=400,
            detail="표지·각주·워터마크 중 최소 하나는 선택해야 합니다.",
        )

    storage.save_template(template_id, meta)
    return _public(meta)


@router.get("/templates")
def list_templates():
    """등록된 템플릿 목록을 반환한다."""
    return {"templates": [_public(t) for t in storage.list_templates()]}


@router.patch("/templates/{template_id}")
def update_template(template_id: str, body: TemplateUpdate):
    """템플릿을 수정한다 (부분 갱신)."""
    meta = storage.get_template_meta(template_id)
    if meta is None:
        raise HTTPException(status_code=404, detail="템플릿을 찾을 수 없습니다.")

    patch = body.model_dump(exclude_unset=True)
    if "name" in patch and patch["name"] is not None:
        patch["name"] = patch["name"].strip()
    meta.update(patch)

    if is_empty(meta):
        raise HTTPException(
            status_code=400,
            detail="표지·각주·워터마크 중 최소 하나는 선택해야 합니다.",
        )

    # 사용자가 구성을 확인했다는 뜻이므로 "확인 필요"를 내린다 (계획서 § 결정).
    meta["needs_review"] = False

    storage.save_template(template_id, meta)
    return _public(meta)


@router.delete("/templates/{template_id}")
def delete_template(template_id: str):
    """템플릿을 삭제한다."""
    if storage.get_template_meta(template_id) is None:
        raise HTTPException(status_code=404, detail="템플릿을 찾을 수 없습니다.")
    storage.delete_template(template_id)
    return {"message": "삭제되었습니다."}


# ── A′ — 자산 삭제 시 참조 검사 (cover/footnote/watermark 라우터가 쓴다) ──

def templates_using(field: str, asset_id: str) -> list[dict]:
    """`field` 슬롯이 `asset_id`를 가리키는 템플릿 전체."""
    return [t for t in storage.list_templates() if t.get(field) == asset_id]


def guard_asset_delete(field: str, asset_id: str, force: bool, label: str) -> None:
    """자산을 지우기 전에 참조를 검사한다.

    기본은 **차단**(409 + 사용 중인 템플릿 이름)이고, `force=True`면 해당 슬롯을 비우고
    진행한다 — cascade 를 사용자가 **알고 고르는** 형태다(계획서 § 결정 "자산 삭제 시").

    ⚠️ 강제 삭제로 마지막 슬롯이 비워져도 **템플릿을 지우지 않는다.** 이름과 나머지
    구성이 남아 있으면 PATCH로 되살릴 수 있고, 자산 삭제의 부수 효과로 사용자가 만든
    템플릿을 없애는 것은 과하다. 대신 `needs_review`를 찍어 화면에서 보이게 한다.
    """
    using = templates_using(field, asset_id)
    if not using:
        return

    if not force:
        names = ", ".join(t.get("name", "") for t in using)
        raise HTTPException(
            status_code=409,
            detail=f"이 {label}을(를) 사용 중인 템플릿이 있습니다: {names}",
        )

    for t in using:
        t[field] = None
        t["needs_review"] = True
        storage.save_template(t["template_id"], t)
