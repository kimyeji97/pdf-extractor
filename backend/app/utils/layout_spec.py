"""
문제집 레이아웃 상수 및 계산 유틸리티 (REQ-18, Canvas ↔ PDF 일치)

━━━ Canvas ↔ PDF 일치 보장 ━━━
이 파일의 상수(A4_WIDTH_PT, MARGIN_PT 등)와 contain_fit/calc_cell_rect 수식은
frontend/src/utils/workbookLayout.js 와 완전히 동일해야 한다.
값 변경 시 JS 파일도 반드시 함께 수정해야 Canvas 미리보기와 실제 PDF 출력이 일치한다.

━━━ 지원 레이아웃 ━━━
  2단: 1행×2열 → 페이지당 2문항
  4단: 2행×2열 → 페이지당 4문항
  6단: 3행×3열 → 페이지당 9문항
"""

# ── A4 규격 (pt 단위) ────────────────────────────────────────
# 1 pt = 1/72 inch. A4 = 210×297mm → 595×842pt (ISO 216 기준).
A4_WIDTH_PT  = 595
A4_HEIGHT_PT = 842

# ── 그리드 여백/간격 ────────────────────────────────────────
# MARGIN_PT: 페이지 상하좌우 마진. 셀 영역의 바깥 여백.
# GAP_PT   : 인접한 셀 사이의 간격.
MARGIN_PT = 20
GAP_PT    = 5

# ── 레이아웃 정의 ─────────────────────────────────────────────
# rows × cols 그리드. 각 레이아웃 이름은 UI/API에서 그대로 사용한다.
LAYOUTS: dict[str, dict] = {
    "2단": {"rows": 1, "cols": 2},
    "4단": {"rows": 2, "cols": 2},
    "6단": {"rows": 3, "cols": 3},
}

# 기본 레이아웃 (ExtractV2Request.layout 미지정 시 사용)
DEFAULT_LAYOUT = "2단"


def calc_cell_rect(layout_key: str, row: int, col: int) -> tuple[float, float, float, float]:
    """
    지정 레이아웃의 (row, col) 셀 좌표를 반환한다.

    셀 크기 공식:
      cell_w = (A4_WIDTH  - 2×MARGIN - (cols-1)×GAP) / cols
      cell_h = (A4_HEIGHT - 2×MARGIN - (rows-1)×GAP) / rows

    셀 시작점:
      cell_x = MARGIN + col × (cell_w + GAP)
      cell_y = MARGIN + row × (cell_h + GAP)

    Canvas와 동일한 수식을 사용하여 Layout 오차 없이 일치한다.

    Returns:
        (cell_x, cell_y, cell_w, cell_h) — pt 단위
    """
    spec = LAYOUTS.get(layout_key, LAYOUTS[DEFAULT_LAYOUT])
    rows = spec["rows"]
    cols = spec["cols"]

    cell_w = (A4_WIDTH_PT  - 2 * MARGIN_PT - (cols - 1) * GAP_PT) / cols
    cell_h = (A4_HEIGHT_PT - 2 * MARGIN_PT - (rows - 1) * GAP_PT) / rows

    cell_x = MARGIN_PT + col * (cell_w + GAP_PT)
    cell_y = MARGIN_PT + row * (cell_h + GAP_PT)

    return (cell_x, cell_y, cell_w, cell_h)


def contain_fit(
    src_w: float, src_h: float,
    cell_x: float, cell_y: float,
    cell_w: float, cell_h: float,
) -> tuple[float, float, float, float]:
    """
    Contain(letterbox) 피팅: 원본 종횡비를 유지하면서 셀 안에 맞춘다.

    ━━━ Canvas ↔ PDF 일치의 핵심 ━━━
    이 함수의 수식은 frontend/src/utils/workbookLayout.js#containFit() 와 동일하다.
    양쪽이 같은 수식을 쓰므로 Canvas 미리보기 = 실제 PDF 출력이 보장된다.

    동작:
      - src_ratio > cell_ratio: 가로 기준으로 맞추고, 세로는 중앙 정렬
      - src_ratio ≤ cell_ratio: 세로 기준으로 맞추고, 가로는 중앙 정렬
      → 빈 여백(letterbox)이 생기지만 왜곡은 없음

    Args:
        src_w, src_h: 원본 문항 영역 크기 (pt)
        cell_x, cell_y, cell_w, cell_h: 셀 좌표 및 크기 (pt)

    Returns:
        (dst_x, dst_y, dst_w, dst_h) — 셀 내 실제 배치 좌표 (pt)
    """
    if src_w <= 0 or src_h <= 0:
        # 크기 0 이하는 비정상 데이터 — 셀 전체를 그대로 사용
        return (cell_x, cell_y, cell_w, cell_h)

    src_ratio  = src_w / src_h
    cell_ratio = cell_w / cell_h

    if src_ratio > cell_ratio:
        # 가로 기준: 너비를 셀 너비에 맞추고, 높이는 비율로 계산
        scale = cell_w / src_w
        dst_w = cell_w
        dst_h = src_h * scale
        dst_x = cell_x
        dst_y = cell_y + (cell_h - dst_h) / 2   # 세로 중앙 정렬
    else:
        # 세로 기준: 높이를 셀 높이에 맞추고, 너비는 비율로 계산
        scale = cell_h / src_h
        dst_w = src_w * scale
        dst_h = cell_h
        dst_x = cell_x + (cell_w - dst_w) / 2   # 가로 중앙 정렬
        dst_y = cell_y

    return (dst_x, dst_y, dst_w, dst_h)


def questions_per_page(layout_key: str) -> int:
    """레이아웃별 한 페이지에 배치되는 문항 수 반환."""
    spec = LAYOUTS.get(layout_key, LAYOUTS[DEFAULT_LAYOUT])
    return spec["rows"] * spec["cols"]
