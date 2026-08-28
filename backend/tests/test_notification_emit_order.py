"""
REQ-P05 Phase 1 — 감지 완료 알림의 **발행 시점** 검증 계약

검증 계약: docs/plans/PLAN-P05-notification-latency.md `## 검증 계약`
케이스: P05-01 ~ P05-06

지키는 것은 **"완료 통지가 썸네일 프리워밍을 기다리지 않는다"**이다. 프리워밍은 실패해도
온디맨드로 폴백되는 최적화인데, 지금은 그것이 끝나야 알림이 나가 "클릭→벨 뱃지"가 9~12s다.

순서 단언은 **호출 순서 로그**로 한다(2026-08-28 결정) — `emit_detection` 과
`prewarm_all_thumbnails` 를 대역으로 바꿔 각자 자기 이름을 리스트에 남기고, 그 리스트를 본다.
경과 시간으로 재지 않는다(느린 CI 에서 플래키).

⚠️ 라우터들이 `from ... import` 로 이름을 자기 모듈에 바인딩하므로 **원본 모듈이 아니라
   각 라우터 모듈의 이름**을 갈아야 한다(`stub_detection` 픽스처와 같은 이유).
"""
import pytest

from app.models.schemas import BoundariesStatus


@pytest.fixture
def call_order(monkeypatch):
    """
    `emit_detection` · `prewarm_all_thumbnails` 호출 순서를 기록한다.

    반환된 리스트에 `"emit"` · `"prewarm"` 이 불린 순서대로 쌓인다.
    `raise_on` 에 이름을 주면 그 대역이 예외를 던진다(프리워밍 실패 재현용).
    """

    def _install(raise_on: str | None = None):
        from app.routers import browse as browse_router
        from app.routers import upload as upload_router

        order: list[str] = []

        def _emit(job, *a, **kw):
            order.append("emit")

        def _prewarm(*a, **kw):
            order.append("prewarm")
            if raise_on == "prewarm":
                raise RuntimeError("프리워밍 실패(테스트)")

        for router in (browse_router, upload_router):
            ns = getattr(router, "notification_service", None)
            if ns is not None:
                monkeypatch.setattr(ns, "emit_detection", _emit)
            ps = getattr(router, "prewarm_service", None)
            if ps is not None:
                monkeypatch.setattr(ps, "prewarm_all_thumbnails", _prewarm)

        return order

    return _install


# ── 순서 — 알림이 프리워밍보다 먼저 ────────────────────────

def test_P05_01_재감지_알림이_프리워밍보다_먼저(
    make_job, stub_detection, fake_pdf, call_order
):
    """근거: PLAN § 작업 단계 Phase 1 — "알림을 프리워밍 **앞**으로" """
    from app.routers.browse import _run_refresh_detection

    make_job("job-refresh")
    stub_detection(count=2)
    order = call_order()

    _run_refresh_detection("job-refresh")

    assert order == ["emit", "prewarm"]


def test_P05_02_최초감지_알림이_프리워밍보다_먼저(
    make_job, stub_detection, fake_pdf, call_order
):
    """근거: PLAN § 작업 단계 Phase 1 — "두 경로 동일" """
    from app.routers.upload import _trigger_boundary_detection

    make_job("job-upload")
    stub_detection(count=3)
    order = call_order()

    _trigger_boundary_detection("job-upload")

    assert order == ["emit", "prewarm"]


# ── 중복 발행 — 정확히 1회 ────────────────────────────────

def test_P05_03_재감지_성공시_알림은_정확히_1건(
    make_job, stub_detection, fake_pdf, notif_files
):
    """근거: PLAN § 제약·함정 — "성공 시 2회** 발행된다" """
    from app.routers.browse import _run_refresh_detection

    make_job("job-refresh")
    stub_detection(count=2)

    _run_refresh_detection("job-refresh")

    assert len(notif_files()) == 1


def test_P05_04_최초감지_성공시_알림은_정확히_1건(
    make_job, stub_detection, fake_pdf, notif_files
):
    """근거: PLAN § 작업 단계 Phase 1 — "**중복 발행 0**" """
    from app.routers.upload import _trigger_boundary_detection

    make_job("job-upload")
    stub_detection(count=3)

    _trigger_boundary_detection("job-upload")

    assert len(notif_files()) == 1


# ── 예외 — 프리워밍·감지가 실패해도 알림은 나간다 ─────────

def test_P05_05_프리워밍이_실패해도_알림은_나간다(
    make_job, stub_detection, fake_pdf, notif_files, monkeypatch
):
    """근거: PLAN § 작업 단계 Phase 1 — "프리워밍 실패가 알림을 막지 않음" """
    from app.routers import browse as browse_router
    from app.routers.browse import _run_refresh_detection

    make_job("job-refresh")
    stub_detection(count=2)  # ⚠️ 이 픽스처가 prewarm 을 무해한 대역으로 갈아끼운다 —

    def _boom(*a, **kw):  #      그러니 실패 대역은 반드시 그 **뒤에** 덮어야 한다
        raise RuntimeError("프리워밍 실패(테스트)")

    monkeypatch.setattr(browse_router.prewarm_service, "prewarm_all_thumbnails", _boom)

    _run_refresh_detection("job-refresh")

    assert len(notif_files()) == 1


def test_P05_06_감지_실패시에도_알림은_1건(
    make_job, stub_detection, fake_pdf, notif_files
):
    """근거: PLAN § 작업 단계 Phase 1 — "실패 시에도 1회 발행" """
    from app.routers.browse import _run_refresh_detection
    from app.services import storage

    make_job("job-refresh")
    stub_detection(raises=RuntimeError("감지 실패(테스트)"))

    _run_refresh_detection("job-refresh")

    files = notif_files()
    assert len(files) == 1
    assert storage.get_status("job-refresh").boundaries_status == BoundariesStatus.FAILED
