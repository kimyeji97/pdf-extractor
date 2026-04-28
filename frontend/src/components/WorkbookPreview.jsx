/**
 * 문제집 Canvas 미리보기 (REQ-17, REQ-18, REQ-C05, REQ-C06)
 *
 * A4 비율의 div-based 미리보기 페이지들을 렌더링한다.
 * - calcCellRect / topLeftFit 함수로 셀 위치/크기 계산 (layout_spec.py와 동일 수식)
 * - 각 셀에 문항 썸네일 이미지를 절대 위치로 배치 (좌측 상단 고정, REQ-C06)
 * - cols > 1 인 레이아웃에 세로 구분선 오버레이 (REQ-C05)
 * - 레이아웃 변경 시 즉시 재계산 (React key 활용)
 *
 * Props:
 *   selections   — WorkbookEditorView의 basket 배열
 *   layout       — "세로 2단" | "가로 2단" | "4단" | "6단"
 *   previewWidth — 미리보기 영역 너비 (px), 기본 340
 */
import {
  A4_WIDTH_PT, A4_HEIGHT_PT,
  MARGIN_PT, GAP_PT,
  DIVIDER_COLOR, DIVIDER_WIDTH_PT,
  LAYOUT_SPEC, DEFAULT_LAYOUT,
  calcCellRect, topLeftFit, questionsPerPage,
} from "../utils/workbookLayout";

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/api$/, "");

export default function WorkbookPreview({ selections = [], layout = DEFAULT_LAYOUT, previewWidth = 340 }) {
  if (selections.length === 0) {
    return <div className="wbp-empty">문항을 선택하면 미리보기가 표시됩니다.</div>;
  }

  // px 스케일 팩터: A4 pt 좌표 → 미리보기 px
  const scale        = previewWidth / A4_WIDTH_PT;
  const pageHeightPx = A4_HEIGHT_PT * scale;

  const qpp       = questionsPerPage(layout);
  const pageCount = Math.ceil(selections.length / qpp);
  const pages     = Array.from({ length: pageCount }, (_, pi) =>
    selections.slice(pi * qpp, pi * qpp + qpp)
  );

  // 구분선 x 좌표 목록 (열 사이마다 1개)
  const spec = LAYOUT_SPEC[layout] || LAYOUT_SPEC[DEFAULT_LAYOUT];
  const { cols } = spec;
  const cellW = (A4_WIDTH_PT - 2 * MARGIN_PT - (cols - 1) * GAP_PT) / cols;
  const dividerXs = cols > 1
    ? Array.from({ length: cols - 1 }, (_, ci) => {
        // 열 ci 와 ci+1 사이 중간 (GAP 한가운데)
        const rightEdge = MARGIN_PT + (ci + 1) * (cellW + GAP_PT) - GAP_PT;
        return (rightEdge + GAP_PT / 2) * scale;
      })
    : [];

  return (
    <>
      {pages.map((pageItems, pi) => (
        <div
          key={`${layout}-${pi}`}
          className="wbp-page"
          style={{ width: previewWidth, height: pageHeightPx, position: "relative" }}
        >
          {/* 세로 구분선 (REQ-C05) */}
          {dividerXs.map((x, di) => (
            <div
              key={`div-${di}`}
              style={{
                position:  "absolute",
                left:      x,
                top:       MARGIN_PT * scale,
                width:     DIVIDER_WIDTH_PT * scale,
                height:    (A4_HEIGHT_PT - 2 * MARGIN_PT) * scale,
                background: DIVIDER_COLOR,
                pointerEvents: "none",
              }}
            />
          ))}

          {/* 문항 셀 */}
          {pageItems.map((item, idx) => {
            const row = Math.floor(idx / cols);
            const col = idx % cols;
            const { cellX, cellY, cellW: cw, cellH } = calcCellRect(layout, row, col);

            const cellXpx = cellX * scale;
            const cellYpx = cellY * scale;
            const cellWpx = cw * scale;
            const cellHpx = cellH * scale;

            if (!item.thumbnailUrl) {
              return (
                <div
                  key={item.questionId}
                  className="wbp-cell-empty"
                  style={{ left: cellXpx, top: cellYpx, width: cellWpx, height: cellHpx }}
                >
                  ✏️
                </div>
              );
            }

            // 좌측 상단 고정 피팅 (REQ-C06) — 썸네일 원본 비율 미지수이므로 셀 꽉 채움
            // (실제 PDF와 동일하게 topLeftFit을 적용하지만 srcW/srcH를 모르므로 셀 전체 사용)
            return (
              <img
                key={item.questionId}
                src={`${API_ROOT}${item.thumbnailUrl}`}
                alt={item.displayTitle || `문항 ${item.questionNum}`}
                className="wbp-cell-img"
                style={{
                  position:   "absolute",
                  left:       cellXpx,
                  top:        cellYpx,
                  width:      cellWpx,
                  height:     cellHpx,
                  objectFit:  "contain",
                  objectPosition: "left top",   // 좌측 상단 고정
                }}
                loading="lazy"
              />
            );
          })}

          {/* 페이지 번호 */}
          <div
            style={{
              position:   "absolute",
              bottom:     4,
              right:      6,
              fontSize:   9 * scale,
              color:      "#94a3b8",
              lineHeight: 1,
            }}
          >
            {pi + 1} / {pageCount}
          </div>
        </div>
      ))}
    </>
  );
}
