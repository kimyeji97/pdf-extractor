"""
REQ-F09 Phase 1 — 알림 **쓰기 훅** 검증 계약

검증 계약: docs/plans/PLAN-F09-completion-notification.md `## 검증 계약`
케이스: F09-01 · F09-02 · F09-03 · F09-08 · F09-15

F09-06 · F09-07 · F09-16(조회 경로의 지연 감지는 알리지 않는다)은 2026-09-29 폐기됐다 —
REQ-B19가 조회 경로의 감지 자체를 없애 전제가 사라졌다. "조회는 감지하지 않는다"는
`test_lookup_no_sync_detection.py`(B19-01·03)가 지킨다.
"""
import pytest

from app.models.schemas import BoundariesStatus, JobStatus, JobType


# ── 정상 — 완료 시 알림이 쓰인다 ──────────────────────────

def test_F09_01_최초_감지_완료시_알림_1건(
    make_job, stub_detection, fake_pdf, notif_files
):
    """근거: PLAN § 작업 단계 — "알림 파일이 **정확히 1건씩** 생기고" """
    from app.routers.upload import _trigger_boundary_detection

    make_job("job-upload")
    stub_detection(count=3)

    _trigger_boundary_detection("job-upload")

    assert len(notif_files()) == 1


def test_F09_02_재감지_완료시_알림_1건(
    make_job, stub_detection, fake_pdf, notif_files
):
    """근거: PLAN § 작업 단계 — "알림 파일이 **정확히 1건씩** 생기고" """
    from app.routers.browse import _run_refresh_detection

    make_job("job-refresh")
    stub_detection(count=2)

    _run_refresh_detection("job-refresh")

    assert len(notif_files()) == 1


def test_F09_03_문제집_생성_성공시_알림_1건(
    make_job, inline_extract_pool, notif_files, monkeypatch
):
    """근거: PLAN § 작업 단계 — "생성 쪽은 `extract.py:208`(`_save_workbook_meta` 옆) 1곳"

    ⚠️ 구현 시 주의 — "옆"이지 "안"이 아니다. `_save_workbook_meta()` 호출은
    `if workbook_name:` 블록 **안에** 있는데, 알림을 그 안에 넣으면 **구 프론트에서
    생성한 문제집은 영원히 알림이 안 온다.** 저장 주체를 가르는 것이 `workbook_name`
    이라는 B10 결정(계약 #23)은 **메타 저장에만** 적용된다.
    """
    from app.routers import extract as extract_router
    from app.services import storage

    make_job("job-export", job_type=JobType.EXPORT)
    monkeypatch.setattr(
        extract_router.pdf_service, "extract_questions_v2", lambda *a, **kw: 5
    )
    monkeypatch.setattr(extract_router, "_save_workbook_meta", lambda *a, **kw: None)

    extract_router._process_extraction_v2(
        selections=[],
        export_job_id="job-export",
        layout="2단",
        workbook_name="테스트 문제집",
    )

    assert storage.get_status("job-export").status == JobStatus.DONE
    assert len(notif_files()) == 1


# ── 회귀 — 동시 완료 ─────────────────────────────────────

def test_F09_08_동시_완료_2건이_모두_보존된다(make_job, notif_files):
    """근거: PLAN § 제약·함정 — "하나가 조용히 사라진다."

    단일 `feed.json` 에 append 하는 구현이면 read-modify-write 가 겹쳐 한쪽이 사라진다.
    알림당 파일이면 키가 겹치지 않아 이 문제가 없다 — 그 구조를 고정한다.
    """
    import threading

    from app.services import storage

    barrier = threading.Barrier(2)
    errors: list[BaseException] = []

    def _emit(job_id: str):
        try:
            barrier.wait(timeout=5)
            storage.save_notification(
                {
                    "job_id": job_id,
                    "kind": "detection",
                    "severity": "success",
                }
            )
        except BaseException as exc:  # noqa: BLE001
            errors.append(exc)

    threads = [threading.Thread(target=_emit, args=(f"job-{i}",)) for i in range(2)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=5)

    assert errors == []
    assert len(notif_files()) == 2


# ── 실패 알림 (2026-08-06 확정) ────────────────────────────

@pytest.mark.parametrize("경로", ["최초감지", "재감지"])
def test_F09_15_감지_실패시_error_알림_1건(
    경로, make_job, stub_detection, fake_pdf, notif_files, read_notif
):
    """근거: PLAN § 결정 2026-08-06 — "**쓴다 — `severity` 필드로 구분**" """
    from app.routers.browse import _run_refresh_detection
    from app.routers.upload import _trigger_boundary_detection
    from app.services import storage

    make_job("job-fail")
    stub_detection(raises=RuntimeError("감지 실패 재현"))

    if 경로 == "최초감지":
        _trigger_boundary_detection("job-fail")
    else:
        _run_refresh_detection("job-fail")

    assert storage.get_status("job-fail").boundaries_status == BoundariesStatus.FAILED

    files = notif_files()
    assert len(files) == 1
    assert read_notif(files[0])["severity"] == "error"
