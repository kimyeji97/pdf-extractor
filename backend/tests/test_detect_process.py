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


def _first_submitted(pool):
    """풀에 **첫 번째로** 넘어간 (함수, 인자 수, PDF 경로인가) — 두 번째(프리워밍)는 P06-30·31이 본다."""
    fn, args = pool.calls[0]
    return (fn, len(args), isinstance(args[0], str) and args[0].endswith(".pdf"))


def test_P06_23_업로드_감지는_풀에_먼저_감지_함수와_PDF_경로를_넘기고_부모가_결과를_쓴다(
    make_job, stub_detection, fake_pdf, inline_detect_pool
):
    """근거: PLAN § 제약 — "자식은 감지 계산(`pdf_path → 경계 목록`)과 썸네일 렌더링·저장만 하고, 경계 목록은 부모에 돌려준다" """
    from app.routers import upload as upload_router
    from app.services import storage

    make_job("job-p06-23")
    stub_detection(count=3)

    upload_router._trigger_boundary_detection("job-p06-23")

    job = storage.get_status("job-p06-23")
    assert (
        _first_submitted(inline_detect_pool),
        job.boundaries_status,
        len(storage.get_boundaries_cache("job-p06-23")),
    ) == ((upload_router.detect_question_boundaries, 1, True), BoundariesStatus.DONE, 3)


def test_P06_24_재감지도_풀에_먼저_감지_함수와_PDF_경로를_넘기고_부모가_결과를_쓴다(
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
        _first_submitted(inline_detect_pool),
        job.boundaries_status,
        len(storage.get_boundaries_cache("job-p06-24")),
    ) == ((browse_router.detect_question_boundaries, 1, True), BoundariesStatus.DONE, 2)


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


def test_P06_29_감지_자식_프로세스는_nice_19로_돈다(inline_detect_pool):
    """근거: PLAN § 결정 — "자식 프로세스를 `os.nice(19)`로 띄운다"

    분리 후 감지 5건이 vCPU 2개를 다 써(CPU 57% → 99%) 분석 중 API가 오히려 느려졌다 —
    CPU가 바쁠 때 API가 먼저 받도록 감지 프로세스 우선순위를 가장 낮춘다.
    """
    import os

    nice = inline_detect_pool.original.submit(os.getpriority, os.PRIO_PROCESS, 0).result(timeout=60)

    assert nice == 19


# ── 썸네일 프리워밍도 감지 풀로 (nice 19 뒤에도 /health p90 0.44s — 부모의 렌더링 12스레드) ──

def _fns(pool):
    return [fn for fn, _ in pool.calls]


def test_P06_30_업로드_감지는_프리워밍도_감지_풀로_넘긴다(
    make_job, stub_detection, fake_pdf, inline_detect_pool
):
    """근거: PLAN § 결정 — "`prewarm_all_thumbnails` 호출도 감지 풀(nice 19 자식)에서" """
    from app.routers import upload as upload_router

    make_job("job-p06-30")
    stub_detection(count=2)

    upload_router._trigger_boundary_detection("job-p06-30")

    assert _fns(inline_detect_pool) == [
        upload_router.detect_question_boundaries,
        upload_router.prewarm_service.prewarm_all_thumbnails,
    ]


def test_P06_31_재감지도_프리워밍을_감지_풀로_넘긴다(
    make_job, stub_detection, fake_pdf, inline_detect_pool
):
    """근거: PLAN § 결정 — "`prewarm_all_thumbnails` 호출도 감지 풀(nice 19 자식)에서" """
    from app.routers import browse as browse_router

    make_job("job-p06-31")
    stub_detection(count=2)

    browse_router._run_refresh_detection("job-p06-31")

    assert _fns(inline_detect_pool) == [
        browse_router.detect_question_boundaries,
        browse_router.prewarm_service.prewarm_all_thumbnails,
    ]


def test_P06_32_자식_초기화가_R2_클라이언트를_새로_만든다(inline_detect_pool, monkeypatch):
    """근거: PLAN § 제약 — "자식 시작 시 클라이언트를 새로 만든다"

    Linux 는 fork 라 부모의 boto3 클라이언트(연결 풀)가 자식에 복사된다. 초기화 함수를 이 프로세스에서
    직접 부르되 `os.nice` 는 막는다(테스트 프로세스 우선순위는 되돌릴 수 없다). boto3 는 가짜 —
    conftest 가 R2 계정을 빈 값으로 덮어 진짜 클라이언트는 `Invalid endpoint` 로 죽는다.
    """
    import importlib
    import os
    import sys

    import boto3

    monkeypatch.setattr(os, "nice", lambda n: 0)
    monkeypatch.setattr(boto3, "client", lambda *a, **kw: object())
    if "app.services.s3_service" in sys.modules:
        s3 = importlib.reload(sys.modules["app.services.s3_service"])
    else:
        s3 = importlib.import_module("app.services.s3_service")
    before = s3.r2

    inline_detect_pool.original._initializer()

    assert s3.r2 is not before
