/**
 * 문제집 레이아웃 상수 및 Canvas 렌더링 유틸리티 (REQ-18)
 *
 * ━━━ Canvas ↔ PDF 일치 보장 ━━━
 * 이 파일의 상수와 containFit/calcCellRect 수식은
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

// ── 레이아웃 정의 ────────────────────────────────────────
export const LAYOUT_SPEC = {
  "2단": { rows: 1, cols: 2 },
  "4단": { rows: 2, cols: 2 },
  "6단": { rows: 3, cols: 3 },
};

export const DEFAULT_LAYOUT = "2단";


/**
 * 지정 레이아웃의 (row, col) 셀 좌표를 반환한다.
 *
 * layout_spec.py#calc_cell_rect() 와 동일한 수식.
 *
 * @param {string} layoutKey - "2단" | "4단" | "6단"
 * @param {number} row       - 0-based 행 인덱스
 * @param {number} col       - 0-based 열 인덱스
 * @returns {{ cellX: number, cellY: number, cellW: number, cellH: number }} pt 단위
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
 * Contain(letterbox) 피팅: 원본 종횡비를 유지하면서 셀 안에 맞춘다.
 *
 * layout_spec.py#contain_fit() 와 동일한 수식.
 * Canvas와 PDF 양쪽에서 이 함수를 사용하므로 미리보기 ↔ 실제 출력이 일치한다.
 *
 * @param {number} srcW  - 원본 너비 (pt)
 * @param {number} srcH  - 원본 높이 (pt)
 * @param {number} cellX - 셀 x 시작 (pt)
 * @param {number} cellY - 셀 y 시작 (pt)
 * @param {number} cellW - 셀 너비 (pt)
 * @param {number} cellH - 셀 높이 (pt)
 * @returns {{ dstX: number, dstY: number, dstW: number, dstH: number }} pt 단위
 */
export function containFit(srcW, srcH, cellX, cellY, cellW, cellH) {
  if (srcW <= 0 || srcH <= 0) {
    return { dstX: cellX, dstY: cellY, dstW: cellW, dstH: cellH };
  }

  const srcRatio  = srcW / srcH;
  const cellRatio = cellW / cellH;

  let dstX, dstY, dstW, dstH;

  if (srcRatio > cellRatio) {
    // 가로 기준: 너비를 셀 너비에 맞추고, 높이는 비율로 계산
    const scale = cellW / srcW;
    dstW = cellW;
    dstH = srcH * scale;
    dstX = cellX;
    dstY = cellY + (cellH - dstH) / 2;  // 세로 중앙 정렬
  } else {
    // 세로 기준: 높이를 셀 높이에 맞추고, 너비는 비율로 계산
    const scale = cellH / srcH;
    dstW = srcW * scale;
    dstH = cellH;
    dstX = cellX + (cellW - dstW) / 2;  // 가로 중앙 정렬
    dstY = cellY;
  }

  return { dstX, dstY, dstW, dstH };
}


/**
 * 레이아웃별 페이지당 문항 수
 * @param {string} layoutKey
 * @returns {number}
 */
export function questionsPerPage(layoutKey) {
  const spec = LAYOUT_SPEC[layoutKey] || LAYOUT_SPEC[DEFAULT_LAYOUT];
  return spec.rows * spec.cols;
}
