"""
REQ-B20 Phase 3 — 문항 식별자에 같은 쪽·같은 번호 안 순번 k (ADR-0006)

검증 계약: docs/plans/PLAN-B20-invisible-number-and-id-collision.md `## 검증 계약`
케이스: B20-06 ~ B20-21

B18 위치 병합 뒤로 한 쪽에 같은 번호가 공존한다(내신마스터 "유형 01" 제목 ↔ "1."). 식별이 (쪽, 번호)였던 곳 —
목록 ID·썸네일·제목 수정·삭제·벌크 삭제·PDF 생성 — 이 둘을 구분해야 한다. k 가 없으면 0(ADR-0006).

무대: 0쪽 같은 단에 번호 1 경계 둘(위 = k0, 아래 = k1). 렌더·PDF 빌드는 대역 — 이 Phase 가 보는 것은
"어느 경계를 골랐나"다. 대역은 받은 좌표를 그대로 돌려줘서 선택된 경계를 y 로 판별한다.
"""
import pytest

from app.models.schemas import BoundariesStatus, SelectionItem

JOB = "job-b20"
TOP = dict(number=1, page_index=0, y_top=100.0, y_bottom=300.0, col=0, col_x0=50.0, col_x1=545.0)
LOW = dict(number=1, page_index=0, y_top=400.0, y_bottom=700.0, col=0, col_x0=50.0, col_x1=545.0)


@pytest.fixture
def dup_job(make_job, isolated_storage):
    """0쪽 번호 1 경계 둘 + 원본 PDF 자리(가짜 바이트)."""
    from app.services import storage

    job = make_job(JOB)
    job.boundaries_status = BoundariesStatus.DONE
    storage.put_status(job)
    storage.save_boundaries_cache(JOB, [dict(TOP), dict(LOW)])
    (isolated_storage / "uploads" / JOB).mkdir(parents=True, exist_ok=True)
    (isolated_storage / "uploads" / JOB / "original.pdf").write_bytes(b"%PDF-1.4 fake")
    return job


@pytest.fixture
def render_spy(monkeypatch):
    """문항 썸네일 렌더 대역 — 받은 y0 를 PNG 대신 돌려준다."""
    from app.routers import browse as browse_router

    def _fn(pdf_bytes, page_index, x0, y0, x1, y1, **kw):
        return f"y0={y0}".encode()

    monkeypatch.setattr(browse_router.thumbnail_service, "get_question_thumbnail", _fn)


def _cache():
    from app.services import storage

    return storage.get_boundaries_cache(JOB)


def _ids(items) -> list[str]:
    return sorted(q["question_id"] for q in items if not q.get("is_manual"))


# ── 목록 ─────────────────────────────────────────────────

def test_B20_06_page_list_ids_differ_by_k(authed_client, dup_job):
    res = authed_client.get(f"/api/jobs/{JOB}/pages/0/questions")
    assert _ids(res.json()["questions"]) == [f"{JOB}:0:1:0", f"{JOB}:0:1:1"]


def test_B20_07_all_list_ids_differ_by_k(authed_client, dup_job):
    res = authed_client.get(f"/api/jobs/{JOB}/questions")
    items = [q for p in res.json()["pages"] for q in p["questions"]]
    assert _ids(items) == [f"{JOB}:0:1:0", f"{JOB}:0:1:1"]


def test_B20_08_thumbnail_url_carries_k(authed_client, dup_job):
    res = authed_client.get(f"/api/jobs/{JOB}/pages/0/questions")
    low = next(q for q in res.json()["questions"] if q["question_id"] == f"{JOB}:0:1:1")
    assert "k=1" in low["thumbnail_url"]


# ── 썸네일 ───────────────────────────────────────────────

def test_B20_09_thumbnail_k1_renders_lower(authed_client, dup_job, render_spy):
    res = authed_client.get(f"/api/jobs/{JOB}/pages/0/questions/1/thumbnail?k=1")
    assert res.content == b"y0=400.0"


def test_B20_10_thumbnail_k1_cache_key_suffix(authed_client, dup_job, render_spy, isolated_storage):
    authed_client.get(f"/api/jobs/{JOB}/pages/0/questions/1/thumbnail?k=1")
    assert (isolated_storage / "thumbnails" / JOB / "q_0_1_1.png").exists()


def test_B20_11_thumbnail_without_k_is_k0_old_key(authed_client, dup_job, render_spy, isolated_storage):
    res = authed_client.get(f"/api/jobs/{JOB}/pages/0/questions/1/thumbnail")
    assert (res.content, (isolated_storage / "thumbnails" / JOB / "q_0_1.png").exists()) == (b"y0=100.0", True)


# ── 제목 수정 · 삭제 ─────────────────────────────────────

def test_B20_12_patch_title_k1_only_lower(authed_client, dup_job):
    authed_client.patch(f"/api/jobs/{JOB}/pages/0/questions/1?k=1", json={"title": "아래"})
    assert [b.get("title") for b in sorted(_cache(), key=lambda b: b["y_top"])] == [None, "아래"]


def test_B20_13_delete_k1_only_lower(authed_client, dup_job):
    authed_client.delete(f"/api/jobs/{JOB}/pages/0/questions/1?k=1")
    assert [b["y_top"] for b in _cache()] == [100.0]


def test_B20_14_delete_without_k_only_k0(authed_client, dup_job):
    authed_client.delete(f"/api/jobs/{JOB}/pages/0/questions/1")
    assert [b["y_top"] for b in _cache()] == [400.0]


def test_B20_15_bulk_delete_pair_k1_only_lower(authed_client, dup_job):
    authed_client.post(
        f"/api/jobs/{JOB}/pages/0/questions/bulk-delete",
        json={"questions": [{"num": 1, "k": 1}]},
    )
    assert [b["y_top"] for b in _cache()] == [100.0]


def test_B20_16_bulk_delete_old_question_nums_only_k0(authed_client, dup_job):
    authed_client.post(
        f"/api/jobs/{JOB}/pages/0/questions/bulk-delete",
        json={"question_nums": [1]},
    )
    assert [b["y_top"] for b in _cache()] == [400.0]


# ── PDF 생성 ─────────────────────────────────────────────

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


def _generate(tmp_path, question_id: str):
    from app.services import pdf_service

    sel = SelectionItem(job_id=JOB, page_num=0, question_num=1, question_id=question_id)
    pdf_service.extract_questions_v2([sel], "export-b20", str(tmp_path))


def test_B20_17_generate_reads_k_from_question_id(dup_job, grid_spy, tmp_path):
    _generate(tmp_path, f"{JOB}:0:1:1")
    assert grid_spy == [400.0]


def test_B20_18_generate_old_question_id_is_k0(dup_job, grid_spy, tmp_path):
    _generate(tmp_path, f"{JOB}:0:1")
    assert grid_spy == [100.0]


# ── 문제집 상세 — 옛 ID 정규화 ───────────────────────────

@pytest.fixture
def saved_workbook(isolated_storage):
    from datetime import datetime, timezone

    from app.models.schemas import WorkbookMeta, WorkbookSelectionItem
    from app.services import storage

    sels = [
        WorkbookSelectionItem(question_id=f"{JOB}:0:1", job_id=JOB, page_num=0, question_num=1),
        WorkbookSelectionItem(question_id=f"{JOB}:0:2:1", job_id=JOB, page_num=0, question_num=2),
        WorkbookSelectionItem(question_id=f"{JOB}:0:manual:m-1", job_id=JOB, page_num=0, manual_id="m-1"),
    ]
    meta = WorkbookMeta(
        workbook_id="wb-b20", created_at=datetime.now(timezone.utc), layout="2단",
        selections=sels, result_job_id="export-b20", question_count=3,
    )
    storage.save_workbook("wb-b20", meta.model_dump(mode="json"))
    return "wb-b20"


def _wb_ids(authed_client, wid) -> list[str]:
    return [s["question_id"] for s in authed_client.get(f"/api/workbooks/{wid}").json()["selections"]]


def test_B20_19_workbook_old_id_normalized_to_k0(authed_client, saved_workbook):
    assert _wb_ids(authed_client, saved_workbook)[0] == f"{JOB}:0:1:0"


def test_B20_20_workbook_new_and_manual_ids_unchanged(authed_client, saved_workbook):
    assert _wb_ids(authed_client, saved_workbook)[1:] == [f"{JOB}:0:2:1", f"{JOB}:0:manual:m-1"]


# ── k 순서 = (단, y) ─────────────────────────────────────

def test_B20_21_k_order_is_column_then_y(authed_client, make_job):
    """왼쪽 단 아래(y=500)가 오른쪽 단 위(y=100)보다 먼저 — k0 는 왼쪽 단."""
    from app.services import storage

    job = make_job(JOB)
    job.boundaries_status = BoundariesStatus.DONE
    storage.put_status(job)
    storage.save_boundaries_cache(JOB, [
        dict(number=1, page_index=0, y_top=100.0, y_bottom=300.0, col=1, col_x0=300.0, col_x1=545.0),
        dict(number=1, page_index=0, y_top=500.0, y_bottom=700.0, col=0, col_x0=50.0, col_x1=290.0),
    ])
    res = authed_client.get(f"/api/jobs/{JOB}/pages/0/questions")
    k0 = next(q for q in res.json()["questions"] if q["question_id"] == f"{JOB}:0:1:0")
    assert k0["bbox"]["y0"] == 500.0
