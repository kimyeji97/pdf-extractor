"""
REQ-B22 Phase 1 — extract-v2 가 경계 캐시 미스 때 감지하지 않는다

검증 계약: docs/plans/PLAN-B22-missing-boundaries-cache.md `## 검증 계약`
케이스: B22-01 ~ B22-03

extract-v2 Step 2 는 캐시가 없는 job 을 만나면 `detect_question_boundaries` 를 돌리고 캐시를 저장했다 — B17 동시 분석 한도 밖이다.
결정: 감지하지 않고 그 job 은 빈 경계로 두어 Step 3 의 "경계를 못 찾은 선택은 건너뜀" 경로를 탄다.

무대는 B20(`test_question_id_ordinal.py`)과 같다 — `_build_grid_pdf` 대역이 받은 영역의 y0 를 적는다.
캐시 있는 job 을 같이 골라 생성 자체는 성공하게 한다(전부 건너뛰면 어떻게 되는지는 이 REQ 가 정하지 않았다).
"""
import pytest

from app.models.schemas import BoundariesStatus, SelectionItem

CACHED = "job-b22-cached"
MISSING = "job-b22-missing"
BOUNDARY = dict(number=1, page_index=0, y_top=100.0, y_bottom=300.0, col=0, col_x0=50.0, col_x1=545.0)


@pytest.fixture
def two_jobs(make_job, isolated_storage):
    """캐시 있는 job 하나 + 캐시 없는 job 하나. 원본 PDF 자리는 가짜 바이트."""
    from app.services import storage

    for job_id in (CACHED, MISSING):
        job = make_job(job_id)
        job.boundaries_status = BoundariesStatus.DONE
        storage.put_status(job)
        (isolated_storage / "uploads" / job_id).mkdir(parents=True, exist_ok=True)
        (isolated_storage / "uploads" / job_id / "original.pdf").write_bytes(b"%PDF-1.4 fake")
    storage.save_boundaries_cache(CACHED, [dict(BOUNDARY)])


@pytest.fixture
def grid_spy(monkeypatch):
    """`_build_grid_pdf` 대역 — 받은 영역의 y0 를 적고 빈 파일을 만든다."""
    from app.services import pdf_service

    seen: list[float] = []

    def _fn(regions, out_path, layout, *a, **kw):
        seen.extend(r.y0 for r in regions)
        open(out_path, "wb").write(b"%PDF-1.4 fake")

    monkeypatch.setattr(pdf_service, "_build_grid_pdf", _fn)
    return seen


@pytest.fixture
def detect_spy(monkeypatch):
    """감지 대역 — 불린 경로만 적고 빈 경계를 돌려준다(가짜 PDF 를 실제로 열지 않도록)."""
    from app.services import pdf_service

    calls: list[str] = []

    def _fn(pdf_path, *a, **kw):
        calls.append(pdf_path)
        return []

    monkeypatch.setattr(pdf_service, "detect_question_boundaries", _fn)
    return calls


def _generate(tmp_path):
    from app.services import pdf_service

    sels = [
        SelectionItem(job_id=CACHED, page_num=0, question_num=1),
        SelectionItem(job_id=MISSING, page_num=0, question_num=1),
    ]
    pdf_service.extract_questions_v2(sels, "export-b22", str(tmp_path))


def test_B22_01_cache_miss_does_not_detect(two_jobs, grid_spy, detect_spy, tmp_path):
    _generate(tmp_path)
    assert detect_spy == []


def test_B22_02_cache_miss_does_not_save_cache(two_jobs, grid_spy, detect_spy, tmp_path):
    from app.services import storage

    _generate(tmp_path)
    assert storage.get_boundaries_cache(MISSING) is None


def test_B22_03_cached_selection_still_in_pdf(two_jobs, grid_spy, detect_spy, tmp_path):
    _generate(tmp_path)
    assert grid_spy == [BOUNDARY["y_top"]]
