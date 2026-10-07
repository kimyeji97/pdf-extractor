"""
REQ-D12 Phase 1 — 시스템 이름 변경 (ClipBook)

검증 계약: docs/plans/PLAN-D12-system-rename.md `## 검증 계약` (D12-02, D12-04)
"""
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent.parent / "app"


def test_D12_02_openapi_title_is_clipbook(client):
    res = client.get("/openapi.json")
    assert res.json()["info"]["title"] == "ClipBook API"


def test_D12_04_no_old_name_in_backend_app():
    hits = [str(p) for p in APP_DIR.rglob("*.py") if "PDF Question Extractor" in p.read_text(encoding="utf-8")]
    assert hits == []
