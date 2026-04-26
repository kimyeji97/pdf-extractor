import { useEffect, useState, useCallback } from "react";
import { getPages } from "../api/client";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

/**
 * @param {{
 *   jobId: string,
 *   onPageSelect: (pageNum: number, pageInfo: object) => void,
 *   selectedPageNum: number | null  // App에서 관리하는 현재 선택 페이지 (하이라이트용)
 * }} props
 */
export default function PageBrowser({ jobId, onPageSelect, selectedPageNum }) {
  const [pages, setPages]         = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

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
    const pageInfo = pages.find((p) => p.page_num === pageNum) || null;
    onPageSelect(pageNum, pageInfo);
  };

  return (
    <div style={styles.container}>
      {/* 페이지 수 표시 */}
      {pageCount > 0 && (
        <p style={styles.countLabel}>전체 {pageCount}페이지</p>
      )}

      {error && <p style={styles.error}>{error}</p>}

      {/* 썸네일 그리드 */}
      <div style={styles.grid}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={styles.skeleton} />
            ))
          : pages.map((page) => {
              const isSelected = selectedPageNum === page.page_num;
              return (
                <div
                  key={page.page_num}
                  style={{
                    ...styles.card,
                    ...(isSelected ? styles.cardSelected : {}),
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
                    {isSelected && <div style={styles.checkMark}>✓</div>}
                  </div>
                  <span style={styles.pageLabel}>페이지 {page.page_num + 1}</span>
                  <span style={styles.questionCountLabel}>
                    {page.question_count == null ? "—" : `${page.question_count}문항`}
                  </span>
                </div>
              );
            })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
  },
  countLabel: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 10,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    cursor: "pointer",
    borderRadius: 6,
    padding: 6,
    border: "2px solid transparent",
    transition: "border-color 0.15s, background 0.15s",
  },
  cardSelected: {
    borderColor: "#4a90e2",
    background: "rgba(74,144,226,0.06)",
  },
  imgWrapper: {
    position: "relative",
    width: "100%",
    paddingTop: "141%",   /* A4 비율 (1:√2) */
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
    top: 5,
    right: 5,
    background: "#4a90e2",
    color: "#fff",
    borderRadius: "50%",
    width: 20,
    height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: "bold",
  },
  pageLabel: {
    fontSize: 11,
    color: "#555",
  },
  questionCountLabel: {
    fontSize: 10,
    color: "#aaa",
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
    fontSize: 12,
  },
};
