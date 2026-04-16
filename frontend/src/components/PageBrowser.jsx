import { useEffect, useState, useCallback } from "react";
import { getPages } from "../api/client";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

/**
 * @param {{
 *   jobId: string,
 *   onPageSelect: (pageNum: number) => void,
 *   onBack: () => void
 * }} props
 */
export default function PageBrowser({ jobId, onPageSelect, onBack }) {
  const [pages, setPages] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPage, setSelectedPage] = useState(null);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPages(jobId);
      setPages(data.pages);
      setPageCount(data.page_count);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleSelect = (pageNum) => {
    setSelectedPage(pageNum);
    onPageSelect(pageNum);
  };

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>
          ← 파일 목록으로
        </button>
        {pageCount > 0 && (
          <span style={styles.pageCount}>전체 {pageCount}페이지</span>
        )}
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {/* 썸네일 그리드 */}
      <div style={styles.grid}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={styles.skeleton} />
            ))
          : pages.map((page) => (
              <div
                key={page.page_num}
                style={{
                  ...styles.card,
                  ...(selectedPage === page.page_num ? styles.cardSelected : {}),
                }}
                onClick={() => handleSelect(page.page_num)}
              >
                <div style={styles.imgWrapper}>
                  <img
                    src={`${BASE_URL.replace(/\/api$/, "")}${page.thumbnail_url}`}
                    alt={`페이지 ${page.page_num + 1}`}
                    style={styles.img}
                    loading="lazy"
                  />
                  {selectedPage === page.page_num && (
                    <div style={styles.checkMark}>✓</div>
                  )}
                </div>
                <span style={styles.pageLabel}>페이지 {page.page_num + 1}</span>
                <span style={styles.questionCountLabel}>
                  {page.question_count == null ? "—" : `${page.question_count}문항`}
                </span>
              </div>
            ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#4a90e2",
    cursor: "pointer",
    fontSize: 14,
    padding: "4px 0",
  },
  pageCount: {
    fontSize: 13,
    color: "#888",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    borderRadius: 6,
    padding: 6,
    border: "2px solid transparent",
    transition: "border-color 0.15s",
  },
  cardSelected: {
    borderColor: "#4a90e2",
    background: "rgba(74,144,226,0.06)",
  },
  imgWrapper: {
    position: "relative",
    width: "100%",
    paddingTop: "141%", // A4 비율 (1:√2)
    background: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  img: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  checkMark: {
    position: "absolute",
    top: 6,
    right: 6,
    background: "#4a90e2",
    color: "#fff",
    borderRadius: "50%",
    width: 22,
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: "bold",
  },
  pageLabel: {
    fontSize: 12,
    color: "#666",
  },
  questionCountLabel: {
    fontSize: 11,
    color: "#999",
  },
  skeleton: {
    borderRadius: 6,
    background: "linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 50%, #e8e8e8 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.2s infinite",
    aspectRatio: "1 / 1.41",
    width: "100%",
  },
  error: {
    color: "#c0392b",
    fontSize: 13,
  },
};
