/**
 * 문제집 레이아웃 상수 및 Canvas 렌더링 유틸리티 (REQ-18, REQ-C02~C06)
 *
 * ━━━ Canvas ↔ PDF 일치 보장 ━━━
 * 이 파일의 상수와 topLeftFit/calcCellRect 수식은
 * backend/app/utils/layout_spec.py 와 완전히 동일해야 한다.
 * 값 변경 시 Python 파일도 반드시 함께 수정해야 한다.
 *
 * ━━━ 좌표 단위 ━━━
 * A4 pt 좌표계를 기준으로 계산한 뒤, Canvas 렌더링 시 px 스케일 팩터를 곱한다:
 *   scale = canvasWidthPx / A4_WIDTH_PT
 *   canvasPx = pt * scale
 */

// ── A4 규격 (pt 단위) ────────────────────────────────────
export const A4_WIDTH_PT  = 595;
export const A4_HEIGHT_PT = 842;

// ── 그리드 여백/간격 ─────────────────────────────────────
export const MARGIN_PT = 20;
export const GAP_PT    = 5;

// ── 구분선 (REQ-C05) ─────────────────────────────────────
export const DIVIDER_WIDTH_PT = 0.5;
export const DIVIDER_COLOR    = "#cccccc";

// ── 레이아웃 정의 (REQ-C02, C03, C04) ────────────────────
export const LAYOUT_SPEC = {
  "세로 2단": { rows: 1, cols: 2 },   // 기존 "2단" 명칭 변경
  "가로 2단": { rows: 2, cols: 1 },   // 신규
  "4단":      { rows: 2, cols: 2 },
  "6단":      { rows: 2, cols: 3 },   // 3×3(9) → 2×3(6)
};

export const DEFAULT_LAYOUT = "세로 2단";


/**
 * 지정 레이아웃의 (row, col) 셀 좌표를 반환한다.
 * layout_spec.py#calc_cell_rect() 와 동일한 수식.
 *
 * @param {string} layoutKey
 * @param {number} row  0-based 행 인덱스
 * @param {number} col  0-based 열 인덱스
 * @returns {{ cellX, cellY, cellW, cellH }} pt 단위
 */
export function calcCellRect(layoutKey, row, col) {
  const spec = LAYOUT_SPEC[layoutKey] || LAYOUT_SPEC[DEFAULT_LAYOUT];
  const { rows, cols } = spec;

  const cellW = (A4_WIDTH_PT  - 2 * MARGIN_PT - (cols - 1) * GAP_PT) / cols;
  const cellH = (A4_HEIGHT_PT - 2 * MARGIN_PT - (rows - 1) * GAP_PT) / rows;

  const cellX = MARGIN_PT + col * (cellW + GAP_PT);
  const cellY = MARGIN_PT + row * (cellH + GAP_PT);

  return { cellX, cellY, cellW, cellH };
}


/**
 * 좌측 상단 고정 피팅 (REQ-C06): 종횡비를 유지하며 셀 좌측 상단에 배치.
 * layout_spec.py#top_left_fit() 와 동일한 수식.
 *
 * @param {number} srcW   원본 너비 (pt)
 * @param {number} srcH   원본 높이 (pt)
 * @param {number} cellX  셀 x 시작 (pt)
 * @param {number} cellY  셀 y 시작 (pt)
 * @param {number} cellW  셀 너비 (pt)
 * @param {number} cellH  셀 높이 (pt)
 * @returns {{ dstX, dstY, dstW, dstH }} pt 단위
 */
export function topLeftFit(srcW, srcH, cellX, cellY, cellW, cellH) {
  if (srcW <= 0 || srcH <= 0) {
    return { dstX: cellX, dstY: cellY, dstW: cellW, dstH: cellH };
  }

  const srcRatio  = srcW / srcH;
  const cellRatio = cellW / cellH;

  let dstW, dstH;

  if (srcRatio > cellRatio) {
    // 가로 기준
    const scale = cellW / srcW;
    dstW = cellW;
    dstH = srcH * scale;
  } else {
    // 세로 기준
    const scale = cellH / srcH;
    dstW = srcW * scale;
    dstH = cellH;
  }

  // 좌측 상단 고정
  return { dstX: cellX, dstY: cellY, dstW, dstH };
}

/** 하위 호환 별칭 */
export const containFit = topLeftFit;


/**
 * 레이아웃별 페이지당 문항 수
 * @param {string} layoutKey
 * @returns {number}
 */
export function questionsPerPage(layoutKey) {
  const spec = LAYOUT_SPEC[layoutKey] || LAYOUT_SPEC[DEFAULT_LAYOUT];
  return spec.rows * spec.cols;
}
