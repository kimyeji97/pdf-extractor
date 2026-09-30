"""
REQ-F15 Phase 1 — 감지 알림 제목은 문제집 이름 우선

검증 계약: docs/plans/PLAN-F15-workbook-name-and-filename.md `## 검증 계약`
케이스: F15-01 ~ F15-04

사용자는 파일을 문제집 이름으로 기억하는데 감지 알림은 파일명(`title=job.filename`)이었다. 생성 알림은 이미
`workbook_name or filename`이다 — 같은 규칙으로 맞춘다. 제목은 발행 시점에 저장되므로 새 알림부터다(2026-09-30 결정).

무대: F09 알림 훅 테스트와 같은 픽스처(`make_job`·`stub_detection`·`fake_pdf`·`notif_files`). `make_job`의 파일명은 "sample.pdf".
"""
import json

from app.services import storage

JOB = "job-f15"
NAME = "중3 기출"


def _job(make_job, workbook_name):
    job = make_job(JOB)
    job.workbook_name = workbook_name
    storage.put_status(job)


def _title(notif_files) -> str:
    files = notif_files()
    assert len(files) == 1, "감지 알림은 정확히 1건이어야 제목을 따질 수 있다"
    return json.loads(files[0].read_text())["title"]


def test_F15_01_detection_done_title_is_workbook_name(make_job, stub_detection, fake_pdf, notif_files):
    from app.routers.upload import _trigger_boundary_detection

    _job(make_job, NAME)
    stub_detection(count=2)

    _trigger_boundary_detection(JOB)

    assert _title(notif_files) == NAME


def test_F15_02_without_workbook_name_title_is_filename(make_job, stub_detection, fake_pdf, notif_files):
    from app.routers.upload import _trigger_boundary_detection

    _job(make_job, None)
    stub_detection(count=2)

    _trigger_boundary_detection(JOB)

    assert _title(notif_files) == "sample.pdf"


def test_F15_03_detection_failed_title_is_workbook_name(make_job, stub_detection, fake_pdf, notif_files):
    from app.routers.upload import _trigger_boundary_detection

    _job(make_job, NAME)
    stub_detection(raises=RuntimeError("감지 실패 재현"))

    _trigger_boundary_detection(JOB)

    assert _title(notif_files) == NAME


def test_F15_04_refresh_title_is_workbook_name(make_job, stub_detection, fake_pdf, notif_files):
    from app.routers.browse import _run_refresh_detection

    _job(make_job, NAME)
    stub_detection(count=2)

    _run_refresh_detection(JOB)

    assert _title(notif_files) == NAME
