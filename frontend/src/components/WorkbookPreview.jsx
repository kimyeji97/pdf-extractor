/**
 * 문제집 Canvas 미리보기 (REQ-17, REQ-18, REQ-C05, REQ-C06)
 *
 * Props:
 *   selections   — basket 배열 (각 아이템에 workbookName, pageNum, thumbnailUrl 등 포함)
 *   layout       — "세로 2단" | "가로 2단" | "4단" | "6단"
 *   previewWidth — 미리보기 영역 너비 (px), 기본 340
 */
import { useEffect, useRef, useState } from "react";
import {
  A4_WIDTH_PT, A4_HEIGHT_PT,
  MARGIN_PT, GAP_PT,
  DIVIDER_COLOR, DIVIDER_WIDTH_PT,
  LABEL_HEIGHT_PT,
  LAYOUT_SPEC, DEFAULT_LAYOUT,
  calcCellRect, topLeftFit, questionsPerPage,
  MIN_CELL_SCALE, MAX_CELL_SCALE, CELL_SCALE_STEP, clampCellScale,
} from "../utils/workbookLayout";

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/api$/, "");

/**
 * 지면 색 (REQ-D07 Phase 2)
 *
 * 이 값들은 **UI 색이 아니라 생성될 PDF 지면을 재현한 값**이라 테마 토큰으로 바꾸지 않는다.
 * 라벨 배경은 pdf_service의 draw_rect fill=(0.96,0.96,0.98)과 짝을 이룬다.
 * 다크 모드에서도 종이는 흰색이어야 하므로 그대로 둔다(§8 결정 #5 — 뷰어·미리보기는 밝게 유지).
 */
const PAPER = {
  labelBg:     "#f3f4f6",
  labelText:   "#475569",
  labelTextMuted: "#64748b",
  pageNumber:  "#94a3b8",
};

// 뷰포트 근처(위아래 300px)에 들어온 페이지만 실제 셀·이미지를 렌더링한다 (REQ-P02-07).
// 한 번 보인 페이지는 계속 렌더 유지(다시 스크롤해 지나갈 때 깜빡임 방지).
function usePageVisible(ref) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { rootMargin: "300px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, visible]);
  return visible;
}

function WorkbookPage({
  pi, pageItems, pageCount, qpp, cols, layout, previewWidth, pageHeightPx, labelHpx, scale, dividerXs,
  onScaleChange,
}) {
  const ref = useRef(null);
  const visible = usePageVisible(ref);

  return (
    <div
      ref={ref}
      className="wbp-page"
      style={{ width: previewWidth, height: pageHeightPx, position: "relative" }}
    >
      {!visible ? null : (
        <>
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
            // 항목별 사용자 지정 배율 (미지정 = 1배)
            const cellScale = clampCellScale(item?.scale ?? 1);
            const imgHpx   = cellHpx - labelHpx;

            // 출처 레이블 텍스트: "번호번. 문제집이름. p페이지. 문항이름" (REQ-C07)
            const labelParts = [`${globalIdx + 1}번`];
            if (item.workbookName) labelParts.push(item.workbookName);
            if (item.pageNum != null) labelParts.push(`p${item.pageNum + 1}`);
            if (item.displayTitle) labelParts.push(item.displayTitle);
            const labelText = labelParts.join(". ");

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
                      background: PAPER.labelBg,
                      display:    "flex",
                      alignItems: "center",
                      paddingLeft: 3,
                      overflow:   "hidden",
                      whiteSpace: "nowrap",
                      fontSize:   Math.max(10, 14 * scale),
                      color:      PAPER.labelTextMuted,
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
                    background: PAPER.labelBg,
                    display:    "flex",
                    alignItems: "center",
                    paddingLeft: 3,
                    overflow:   "hidden",
                    whiteSpace: "nowrap",
                    fontSize:   Math.max(10, 14 * scale),
                    color:      PAPER.labelText,
                    boxSizing:  "border-box",
                  }}
                >
                  {labelText}
                </div>

                {/* 문항 이미지 — 셀 크기로 클리핑하고, 안쪽 이미지에만 배율 적용.
                    좌상단 고정이라 확대 시 우/하단이 셀 경계에서 잘린다.
                    PDF 생성(pdf_service)도 동일한 방식으로 원본 clip을 줄여 맞춘다. */}
                <div
                  className="wbp-cell-clip"
                  style={{
                    position: "absolute",
                    left:     cellXpx,
                    top:      imgYpx,
                    width:    cellWpx,
                    height:   imgHpx,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={`${API_ROOT}${item.thumbnailUrl}`}
                    alt={item.displayTitle || `문항 ${item.questionNum}`}
                    className="wbp-cell-img"
                    style={{
                      display:        "block",
                      width:          cellWpx * cellScale,
                      height:         imgHpx * cellScale,
                      objectFit:      "contain",
                      objectPosition: "left top",
                    }}
                    loading="lazy"
                  />
                </div>

                {/* 배율 조절 (2026-07-25) — 셀에 마우스를 올리면 나타남 */}
                {onScaleChange && (
                  <div
                    className="wbp-scale-ctl"
                    style={{
                      position: "absolute",
                      left:     cellXpx,
                      top:      imgYpx,
                      width:    cellWpx,
                      height:   imgHpx,
                    }}
                  >
                    <div className="wbp-scale-btns">
                      {/* 이전 값 기준으로 계산하도록 updater를 넘긴다 —
                          숫자를 넘기면 빠르게 연타할 때 리렌더 전 값(stale)이 쓰여 1회만 반영된다 */}
                      <button
                        type="button" title="축소"
                        onClick={() => onScaleChange(item.questionId, (s) => s - CELL_SCALE_STEP)}
                        disabled={cellScale <= MIN_CELL_SCALE}
                      >−</button>
                      <span title="현재 배율">{Math.round(cellScale * 100)}%</span>
                      <button
                        type="button" title="확대"
                        onClick={() => onScaleChange(item.questionId, (s) => s + CELL_SCALE_STEP)}
                        disabled={cellScale >= MAX_CELL_SCALE}
                      >＋</button>
                      <button
                        type="button" title="배율 초기화"
                        onClick={() => onScaleChange(item.questionId, 1)}
                        disabled={cellScale === 1}
                      >⟲</button>
                    </div>
                  </div>
                )}
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
              color:      PAPER.pageNumber,
              lineHeight: 1,
            }}
          >
            {pi + 1} / {pageCount}
          </div>
        </>
      )}
    </div>
  );
}

export default function WorkbookPreview({
  selections = [], layout = DEFAULT_LAYOUT, previewWidth = 340, onScaleChange,
}) {
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
        <WorkbookPage
          key={`${layout}-${pi}`}
          pi={pi}
          pageItems={pageItems}
          pageCount={pageCount}
          qpp={qpp}
          cols={cols}
          layout={layout}
          previewWidth={previewWidth}
          pageHeightPx={pageHeightPx}
          labelHpx={labelHpx}
          scale={scale}
          dividerXs={dividerXs}
          onScaleChange={onScaleChange}
        />
      ))}
    </>
  );
}
