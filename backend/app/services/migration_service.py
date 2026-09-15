"""
기존 데이터 소유권 이관 (REQ-27 Phase 2)

로그인 이전에 쌓인 job·문제집·표지·각주·워터마크·템플릿 전부를 관리자(본인) 계정
소유로 일괄 이관한다(계획서 § 결정 "기존 데이터 이관 범위" — 6종 전부).

계획서는 "마이그레이션 스크립트 1회 실행"이라고만 명시했고 콜러블 시그니처는 정하지
않았다 — 검증 계약(PLAN-27 § 검증 계약 "Phase 2")이 아래로 고정한다:
    backfill_owner_id(admin_user_id: str) -> dict

이미 owner_id가 있는 레코드는 건드리지 않는다 — 재실행해도 안전해야 한다(운영에서
재실행 가능성을 배제할 수 없다).
"""
from app.services import storage


def backfill_owner_id(admin_user_id: str) -> dict:
    """owner_id가 없는 레코드를 6종 전부에서 admin_user_id 소유로 채운다.

    반환값은 엔티티별 갱신 건수 — CLI 래퍼가 실행 결과를 사람이 읽을 수 있게 출력할 때 쓴다.
    """
    return {
        "jobs": _backfill_jobs(admin_user_id),
        "workbooks": _backfill_workbooks(admin_user_id),
        "covers": _backfill_covers(admin_user_id),
        "footnotes": _backfill_footnotes(admin_user_id),
        "watermarks": _backfill_watermarks(admin_user_id),
        "templates": _backfill_templates(admin_user_id),
    }


def _backfill_jobs(admin_user_id: str) -> int:
    updated = 0
    for job in storage.list_jobs():
        if job.owner_id is None:
            job.owner_id = admin_user_id
            storage.put_status(job)
            updated += 1
    return updated


def _backfill_workbooks(admin_user_id: str) -> int:
    updated = 0
    for workbook in storage.list_workbooks():
        if workbook.get("owner_id") is None:
            workbook["owner_id"] = admin_user_id
            storage.save_workbook(workbook["workbook_id"], workbook)
            updated += 1
    return updated


def _backfill_covers(admin_user_id: str) -> int:
    updated = 0
    for cover in storage.list_covers():
        if cover.get("owner_id") is not None:
            continue
        image = storage.get_cover_image(cover["cover_id"])
        if image is None:
            continue
        image_bytes, _content_type = image
        cover["owner_id"] = admin_user_id
        storage.save_cover(cover["cover_id"], cover, image_bytes, cover.get("ext", "jpg"))
        updated += 1
    return updated


def _backfill_footnotes(admin_user_id: str) -> int:
    updated = 0
    for footnote in storage.list_footnotes():
        if footnote.get("owner_id") is None:
            footnote["owner_id"] = admin_user_id
            storage.save_footnote(footnote["footnote_id"], footnote)
            updated += 1
    return updated


def _backfill_watermarks(admin_user_id: str) -> int:
    updated = 0
    for watermark in storage.list_watermarks():
        if watermark.get("owner_id") is not None:
            continue
        image = storage.get_watermark_image(watermark["watermark_id"])
        if image is None:
            continue
        image_bytes, _content_type = image
        watermark["owner_id"] = admin_user_id
        storage.save_watermark(
            watermark["watermark_id"], watermark, image_bytes, watermark.get("ext", "jpg")
        )
        updated += 1
    return updated


def _backfill_templates(admin_user_id: str) -> int:
    updated = 0
    for template in storage.list_templates():
        if template.get("owner_id") is None:
            template["owner_id"] = admin_user_id
            storage.save_template(template["template_id"], template)
            updated += 1
    return updated
