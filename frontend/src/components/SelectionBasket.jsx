import { useState } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

/**
 * 화면 하단 고정 바스켓 패널.
 * - 선택한 문항 목록 칩 표시 + 클릭으로 썸네일 확대 미리보기
 * - PDF 내보내기 버튼
 */
export default function SelectionBasket({ basket, onRemove, onExport, exporting }) {
  const [expanded, setExpanded] = useState(false);
  const [previewItem, setPreviewItem] = useState(null); // 확대 미리보기 대상
  const [hoveredId, setHoveredId] = useState(null);     // 호버 중인 칩 ID
  const thumbnailBase = BASE_URL.replace(/\/api$/, "");

  // 빈 상태: 최소화 탭만 표시
  if (basket.length === 0) {
    return (
      <div style={styles.emptyTab}>
        담은 문항 없음
      </div>
    );
  }

  return (
    <>
      {/* ── 미리보기 모달 오버레이 ── */}
      {previewItem && (
        <div
          style={styles.previewOverlay}
          onClick={() => setPreviewItem(null)}
          title="클릭하여 닫기"
        >
          <div style={styles.previewModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.previewHeader}>
              <span style={styles.previewTitle}>
                {previewItem.isManual
                  ? (previewItem.label || "수동 선택")
                  : `문항 ${previewItem.questionNum}`}
                <span style={{ color: "#aaa", marginLeft: 6, fontSize: 12 }}>
                  · {previewItem.pageNum + 1}p
                </span>
              </span>
              <button
                style={styles.previewCloseBtn}
                onClick={() => setPreviewItem(null)}
              >
                ×
              </button>
            </div>
            {previewItem.isManual ? (
              <div style={styles.previewManual}>
                <div style={styles.previewManualIcon}>✏️</div>
                <p style={styles.previewManualText}>
                  수동 지정 영역<br />
                  <span style={{ fontSize: 11, color: "#aaa" }}>
                    PDF 내보내기 시 실제 영역이 추출됩니다
                  </span>
                </p>
              </div>
            ) : (
              <img
                src={`${thumbnailBase}${previewItem.thumbnailUrl}`}
                alt={`문항 ${previewItem.questionNum} 미리보기`}
                style={styles.previewImg}
              />
            )}
          </div>
        </div>
      )}

      {/* ── 바스켓 패널 ── */}
      <div style={styles.panel}>
        {/* 헤더: 토글 + 내보내기 버튼 */}
        <div style={styles.header}>
          <button
            style={styles.toggleBtn}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "▼" : "▲"} 선택한 문항 {basket.length}개
          </button>
          <button
            style={{
              ...styles.exportBtn,
              ...(exporting ? styles.exportBtnDisabled : {}),
            }}
            disabled={exporting}
            onClick={onExport}
          >
            {exporting ? "처리 중..." : "PDF 다운로드"}
          </button>
        </div>

        {/* 확장 시 문항 칩 목록 */}
        {expanded && (
          <div style={styles.chipList}>
            {basket.map((item) => {
              const isHovered = hoveredId === item.questionId;
              return (
                <div
                  key={item.questionId}
                  style={styles.chip}
                  onMouseEnter={() => setHoveredId(item.questionId)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* 썸네일 클릭 → 미리보기 확대 */}
                  <div
                    style={styles.chipThumbWrap}
                    onClick={() => setPreviewItem(item)}
                    title="클릭하여 확대 미리보기"
                  >
                    {item.isManual ? (
                      <div style={styles.chipThumbManual}>✏️</div>
                    ) : (
                      <img
                        src={`${thumbnailBase}${item.thumbnailUrl}`}
                        alt={`문항 ${item.questionNum}`}
                        style={{
                          ...styles.chipThumb,
                          opacity: isHovered ? 0.75 : 1,
                        }}
                      />
                    )}
                    {/* 호버 시 확대 아이콘 표시 */}
                    <div style={{
                      ...styles.zoomHint,
                      opacity: isHovered ? 1 : 0,
                      background: isHovered ? "rgba(0,0,0,0.35)" : "transparent",
                    }}>
                      🔍
                    </div>
                  </div>

                  <span
                    style={{ ...styles.chipLabel, cursor: "pointer" }}
                    onClick={() => setPreviewItem(item)}
                  >
                    {item.isManual
                      ? (item.label || "수동 선택")
                      : `문항 ${item.questionNum}`}
                    <span style={styles.chipSub}> · {item.pageNum + 1}p</span>
                  </span>

                  <button
                    style={{
                      ...styles.removeBtn,
                      color: isHovered ? "#c0392b" : "#ccc",
                    }}
                    onClick={() => onRemove(item.questionId)}
                    title="바스켓에서 제거"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  panel: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "#fff",
    borderTop: "2px solid #4a90e2",
    boxShadow: "0 -2px 12px rgba(0,0,0,0.1)",
    zIndex: 100,
    padding: "8px 16px",
  },
  emptyTab: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#f0f0f0",
    borderRadius: "6px 6px 0 0",
    padding: "6px 16px",
    fontSize: 12,
    color: "#aaa",
    zIndex: 100,
    pointerEvents: "none",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  toggleBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    padding: "4px 0",
  },
  exportBtn: {
    background: "#4a90e2",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "7px 16px",
    fontSize: 13,
    fontWeight: "600",
    cursor: "pointer",
  },
  exportBtnDisabled: {
    background: "#aaa",
    cursor: "not-allowed",
  },
  chipList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    maxHeight: 160,
    overflowY: "auto",
  },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#f4f8ff",
    border: "1px solid #c8daf7",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: 13,
  },
  chipThumbWrap: {
    position: "relative",
    cursor: "pointer",
    flexShrink: 0,
  },
  chipThumb: {
    width: 40,
    height: 26,
    objectFit: "contain",
    borderRadius: 3,
    background: "#fff",
    border: "1px solid #e0e0e0",
    display: "block",
    transition: "opacity 0.15s",
  },
  chipThumbManual: {
    width: 40,
    height: 26,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 3,
    background: "#f0f6ff",
    border: "1px solid #c8daf7",
    fontSize: 14,
    cursor: "pointer",
  },
  zoomHint: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.0)",
    borderRadius: 3,
    fontSize: 12,
    opacity: 0,
    transition: "opacity 0.15s, background 0.15s",
    // 호버 시 CSS로 처리하기 어려우므로 JS로 처리 (onMouseEnter/Leave)
  },
  chipLabel: {
    color: "#333",
    cursor: "pointer",
    fontSize: 12,
  },
  chipSub: {
    color: "#999",
    fontSize: 11,
  },
  removeBtn: {
    background: "none",
    border: "none",
    color: "#ccc",
    cursor: "pointer",
    fontSize: 16,
    lineHeight: 1,
    padding: "0 2px",
    fontWeight: "bold",
    flexShrink: 0,
  },

  // ── 미리보기 모달 ──
  previewOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  previewModal: {
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
    maxWidth: "80vw",
    maxHeight: "80vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minWidth: 200,
  },
  previewHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: "1px solid #eee",
    gap: 12,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#333",
  },
  previewCloseBtn: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: "#aaa",
    lineHeight: 1,
    padding: "0 4px",
    fontWeight: "bold",
  },
  previewImg: {
    display: "block",
    maxWidth: "100%",
    maxHeight: "70vh",
    objectFit: "contain",
    background: "#f8f8f8",
  },
  previewManual: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  previewManualIcon: {
    fontSize: 48,
  },
  previewManualText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 1.6,
  },
};
