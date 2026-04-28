/**
 * 문제집 Canvas 미리보기 (REQ-17, REQ-18, REQ-C05, REQ-C06)
 *
 * Props:
 *   selections   — basket 배열 (각 아이템에 workbookName, pageNum, thumbnailUrl 등 포함)
 *   layout       — "세로 2단" | "가로 2단" | "4단" | "6단"
 *   previewWidth — 미리보기 영역 너비 (px), 기본 340
 */
import {
  A4_WIDTH_PT, A4_HEIGHT_PT,
  MARGIN_PT, GAP_PT,
  DIVIDER_COLOR, DIVIDER_WIDTH_PT,
  LABEL_HEIGHT_PT,
  LAYOUT_SPEC, DEFAULT_LAYOUT,
  calcCellRect, topLeftFit, questionsPerPage,
} from "../utils/workbookLayout";

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/api$/, "");

export default function WorkbookPreview({ selections = [], layout = DEFAULT_LAYOUT, previewWidth = 340 }) {
  if (selections.length === 0) {
    return <div className="wbp-empty">문항을 선택하면 미리보기가 표시됩니다.</div>;
  }

  const scale        = previewWidth / A4_WIDTH_PT;
  const pageHeightPx = A4_HEIGHT_PT * scale;
  const labelHpx     = LABEL_HEIGHT_PT * scale;

  const qpp       = questionsPerPage(layout);
  const pageCount = Math.ceil(selections.length / qpp);
  const pages     = Array.from({ length: pageCount }, (_, pi) =>
    selections.slice(pi * qpp, pi * qpp + qpp)
  );

  const spec = LAYOUT_SPEC[layout] || LAYOUT_SPEC[DEFAULT_LAYOUT];
  const { cols } = spec;
  const cellW = (A4_WIDTH_PT - 2 * MARGIN_PT - (cols - 1) * GAP_PT) / cols;
  const dividerXs = cols > 1
    ? Array.from({ length: cols - 1 }, (_, ci) => {
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
            const globalIdx = pi * qpp + idx;
            const row = Math.floor(idx / cols);
            const col = idx % cols;
            const { cellX, cellY, cellW: cw, cellH } = calcCellRect(layout, row, col);

            const cellXpx  = cellX * scale;
            const cellYpx  = cellY * scale;
            const cellWpx  = cw * scale;
            const cellHpx  = cellH * scale;
            const imgYpx   = cellYpx + labelHpx;
            const imgHpx   = cellHpx - labelHpx;

            // 출처 레이블 텍스트: "Q번호 · 문제집이름 · p.페이지"
            const labelParts = [`Q${globalIdx + 1}`];
            if (item.workbookName) labelParts.push(item.workbookName);
            if (item.pageNum != null) labelParts.push(`p.${item.pageNum + 1}`);
            const labelText = labelParts.join(" · ");

            if (!item.thumbnailUrl) {
              return (
                <div key={item.questionId}>
                  {/* 레이블 영역 */}
                  <div
                    style={{
                      position:   "absolute",
                      left:       cellXpx,
                      top:        cellYpx,
                      width:      cellWpx,
                      height:     labelHpx,
                      background: "#f3f4f6",
                      display:    "flex",
                      alignItems: "center",
                      paddingLeft: 3,
                      overflow:   "hidden",
                      whiteSpace: "nowrap",
                      fontSize:   Math.max(6, 7 * scale),
                      color:      "#64748b",
                      boxSizing:  "border-box",
                    }}
                  >
                    {labelText}
                  </div>
                  <div
                    className="wbp-cell-empty"
                    style={{ left: cellXpx, top: imgYpx, width: cellWpx, height: imgHpx }}
                  >
                    ✏️
                  </div>
                </div>
              );
            }

            return (
              <div key={item.questionId}>
                {/* 출처 레이블 */}
                <div
                  style={{
                    position:   "absolute",
                    left:       cellXpx,
                    top:        cellYpx,
                    width:      cellWpx,
                    height:     labelHpx,
                    background: "#f3f4f6",
                    display:    "flex",
                    alignItems: "center",
                    paddingLeft: 3,
                    overflow:   "hidden",
                    whiteSpace: "nowrap",
                    fontSize:   Math.max(6, 7 * scale),
                    color:      "#475569",
                    boxSizing:  "border-box",
                  }}
                >
                  {labelText}
                </div>

                {/* 문항 이미지 */}
                <img
                  src={`${API_ROOT}${item.thumbnailUrl}`}
                  alt={item.displayTitle || `문항 ${item.questionNum}`}
                  className="wbp-cell-img"
                  style={{
                    position:       "absolute",
                    left:           cellXpx,
                    top:            imgYpx,
                    width:          cellWpx,
                    height:         imgHpx,
                    objectFit:      "contain",
                    objectPosition: "left top",
                  }}
                  loading="lazy"
                />
              </div>
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
