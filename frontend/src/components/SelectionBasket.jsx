import { useState } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

/**
 * 화면 하단 고정 바스켓 패널.
 * 선택한 문항 목록을 표시하고 PDF 내보내기 버튼을 제공한다.
 *
 * @param {{
 *   basket: Array<{questionId: string, jobId: string, pageNum: number, questionNum: number, thumbnailUrl: string}>,
 *   onRemove: (questionId: string) => void,
 *   onExport: () => void,
 *   exporting: boolean
 * }} props
 */
export default function SelectionBasket({ basket, onRemove, onExport, exporting }) {
  const [expanded, setExpanded] = useState(false);
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
          {basket.map((item) => (
            <div key={item.questionId} style={styles.chip}>
              <img
                src={`${thumbnailBase}${item.thumbnailUrl}`}
                alt={`문항 ${item.questionNum}`}
                style={styles.chipThumb}
              />
              <span style={styles.chipLabel}>
                문항 {item.questionNum}
                <span style={styles.chipSub}> · {item.pageNum + 1}p</span>
              </span>
              <button
                style={styles.removeBtn}
                onClick={() => onRemove(item.questionId)}
                title="제거"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
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
    padding: "8px 18px",
    fontSize: 14,
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
  chipThumb: {
    width: 36,
    height: 24,
    objectFit: "contain",
    borderRadius: 3,
    background: "#fff",
    border: "1px solid #e0e0e0",
  },
  chipLabel: {
    color: "#333",
  },
  chipSub: {
    color: "#999",
    fontSize: 11,
  },
  removeBtn: {
    background: "none",
    border: "none",
    color: "#999",
    cursor: "pointer",
    fontSize: 16,
    lineHeight: 1,
    padding: "0 2px",
    fontWeight: "bold",
  },
};
