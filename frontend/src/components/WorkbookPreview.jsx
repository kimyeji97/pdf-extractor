/**
 * 문제집 Canvas 미리보기 (REQ-17, REQ-18)
 *
 * A4 비율의 div-based 미리보기 페이지들을 렌더링한다.
 * - calcCellRect / containFit 함수로 셀 위치/크기 계산 (layout_spec.py와 동일 수식)
 * - 각 셀에 문항 썸네일 이미지를 절대 위치로 배치
 * - 레이아웃 변경 시 즉시 재계산 (React key 활용)
 *
 * Props:
 *   selections — WorkbookEditorView의 basket 배열
 *   layout     — "2단" | "4단" | "6단"
 *   previewWidth — 미리보기 영역 너비 (px), 기본 340
 */
import { A4_WIDTH_PT, A4_HEIGHT_PT, calcCellRect, containFit, questionsPerPage } from "../utils/workbookLayout";

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/api$/, "");

export default function WorkbookPreview({ selections = [], layout = "2단", previewWidth = 340 }) {
  if (selections.length === 0) {
    return <div className="wbp-empty">문항을 선택하면 미리보기가 표시됩니다.</div>;
  }

  // px 스케일 팩터: A4 pt 좌표 → 미리보기 px
  const scale       = previewWidth / A4_WIDTH_PT;
  const pageHeightPx = A4_HEIGHT_PT * scale;

  const qpp      = questionsPerPage(layout);
  const pageCount = Math.ceil(selections.length / qpp);
  const pages    = Array.from({ length: pageCount }, (_, pi) =>
    selections.slice(pi * qpp, pi * qpp + qpp)
  );

  return (
    <>
      {pages.map((pageItems, pi) => (
        <div
          key={`${layout}-${pi}`}
          className="wbp-page"
          style={{ width: previewWidth, height: pageHeightPx }}
        >
          {pageItems.map((item, idx) => {
            // 레이아웃에서 해당 인덱스의 셀 위치 계산
            const { rows, cols } = getCellPosition(layout, idx);
            const { cellX, cellY, cellW, cellH } = calcCellRect(layout, rows, cols);

            // 썸네일 이미지가 있으면 contain-fit 적용, 없으면 빈 셀
            const hasThumbnail = Boolean(item.thumbnailUrl);

            // pt → px 변환
            const cellXpx = cellX * scale;
            const cellYpx = cellY * scale;
            const cellWpx = cellW * scale;
            const cellHpx = cellH * scale;

            return hasThumbnail ? (
              <img
                key={item.questionId}
                src={`${API_ROOT}${item.thumbnailUrl}`}
                alt={item.displayTitle || `문항 ${item.questionNum}`}
                className="wbp-cell-img"
                style={{
                  left:   cellXpx,
                  top:    cellYpx,
                  width:  cellWpx,
                  height: cellHpx,
                }}
                loading="lazy"
              />
            ) : (
              <div
                key={item.questionId}
                className="wbp-cell-empty"
                style={{
                  left:   cellXpx,
                  top:    cellYpx,
                  width:  cellWpx,
                  height: cellHpx,
                }}
              >
                ✏️
              </div>
            );
          })}

          {/* 페이지 번호 */}
          <div
            style={{
              position: "absolute",
              bottom: 4,
              right: 6,
              fontSize: 9 * scale,
              color: "#94a3b8",
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

/**
 * 인덱스 → (row, col) 변환
 * LAYOUT_SPEC cols 수 기준으로 계산
 */
function getCellPosition(layoutKey, idx) {
  const LAYOUT_SPEC = {
    "2단": { rows: 1, cols: 2 },
    "4단": { rows: 2, cols: 2 },
    "6단": { rows: 3, cols: 3 },
  };
  const spec = LAYOUT_SPEC[layoutKey] || LAYOUT_SPEC["2단"];
  const row  = Math.floor(idx / spec.cols);
  const col  = idx % spec.cols;
  return { rows: row, cols: col };
}
