"""
REQ-P06 Phase 6 — 감지 프로세스 분리 검증 계약

검증 계약: docs/plans/PLAN-P06-api-latency-during-analysis.md `## 검증 계약`
케이스: P06-23 ~ P06-26 (P06-27·28은 수동 실측)

분석 중 API가 같은 프로세스의 감지 스레드와 GIL을 다퉈 느려졌다(피크 ① `questions_all` p90 1.41s,
`/health` 0.09 → 0.33s). `detect_question_boundaries` 호출만 `analysis_slots.detect_pool`
(ProcessPoolExecutor, 크기 = MAX_CONCURRENT)로 보내고, 상태·경계 캐시·알림 쓰기는 부모에 남긴다 —
`s3_service` 메모리 캐시는 같은 프로세스의 저장만 안다.

무대: conftest 의 자동 픽스처 `inline_detect_pool` 이 풀을 인라인 대역으로 바꾸고 (fn, args) 를
기록한다. 진짜 풀은 `inline_detect_pool.original` — P06-25·26만 이걸 쓴다.
라우터는 넘기는 시점에 **자기 모듈의** `detect_question_boundaries` 를 넘겨야 한다(`stub_detection`이
그 이름을 갈아 끼운다).
"""
from pathlib import Path

import fitz

from app.models.schemas import BoundariesStatus


def _submitted(pool):
    """풀에 넘어간 (함수, 인자) — 인자는 PDF 경로 하나여야 한다."""
    return [(fn, len(args), isinstance(args[0], str) and args[0].endswith(".pdf")) for fn, args in pool.calls]


def test_P06_23_업로드_감지는_풀에_감지_함수와_PDF_경로만_넘기고_부모가_결과를_쓴다(
    make_job, stub_detection, fake_pdf, inline_detect_pool
):
    """근거: PLAN § 제약 — "자식은 `pdf_path → 경계 목록` 계산만 하고 결과를 부모에 돌려준다" """
    from app.routers import upload as upload_router
    from app.services import storage

    make_job("job-p06-23")
    stub_detection(count=3)

    upload_router._trigger_boundary_detection("job-p06-23")

    job = storage.get_status("job-p06-23")
    assert (
        _submitted(inline_detect_pool),
        job.boundaries_status,
        len(storage.get_boundaries_cache("job-p06-23")),
    ) == ([(upload_router.detect_question_boundaries, 1, True)], BoundariesStatus.DONE, 3)


def test_P06_24_재감지도_풀에_감지_함수와_PDF_경로만_넘기고_부모가_결과를_쓴다(
    make_job, stub_detection, fake_pdf, inline_detect_pool
):
    """근거: PLAN § 결정 — "업로드·재감지 두 경로 모두" """
    from app.routers import browse as browse_router
    from app.services import storage

    make_job("job-p06-24")
    stub_detection(count=2)

    browse_router._run_refresh_detection("job-p06-24")

    job = storage.get_status("job-p06-24")
    assert (
        _submitted(inline_detect_pool),
        job.boundaries_status,
        len(storage.get_boundaries_cache("job-p06-24")),
    ) == ([(browse_router.detect_question_boundaries, 1, True)], BoundariesStatus.DONE, 2)


def test_P06_25_감지_풀은_프로세스_풀이고_크기는_분석_동시_한도(inline_detect_pool):
    """근거: PLAN § 결정 — "크기 = 분석 동시 한도 5" """
    from concurrent.futures import ProcessPoolExecutor

    from app.services import analysis_slots

    real = inline_detect_pool.original

    assert (isinstance(real, ProcessPoolExecutor), getattr(real, "_max_workers", None)) == (
        True, analysis_slots.MAX_CONCURRENT,
    )


def _numbered_pdf(tmp_path) -> str:
    """2쪽 · 쪽마다 13pt `N.` 3문항 + 본문."""
    doc = fitz.open()
    n = 1
    for _ in range(2):
        page = doc.new_page(width=595, height=842)
        for y in (150, 380, 610):
            page.insert_text((50, y), f"{n}.", fontsize=13)
            for dy in (20, 40, 60):
                page.insert_text((75, y + dy), "Find the value of x in the equation below.", fontsize=11)
            n += 1
    path = Path(tmp_path) / "numbered.pdf"
    doc.save(str(path))
    return str(path)


def test_P06_26_진짜_자식_프로세스_감지_결과가_직접_호출과_같다(tmp_path, inline_detect_pool):
    """근거: PLAN § 작업 단계 — "감지 결과가 분리 전과 같다" """
    from app.utils.question_parser import detect_question_boundaries

    pdf_path = _numbered_pdf(tmp_path)
    direct = detect_question_boundaries(pdf_path)

    in_child = inline_detect_pool.original.submit(detect_question_boundaries, pdf_path).result(timeout=120)

    assert in_child == direct
