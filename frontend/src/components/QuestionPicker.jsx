import { useEffect, useState, useCallback, useMemo } from "react";
import { getPageQuestions } from "../api/client";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

/**
 * 선택된 페이지에서 감지된 문항을 그리드로 나열하고 바스켓에 선택/해제할 수 있다.
 *
 * @param {{
 *   jobId: string,
 *   pageNum: number,
 *   basket: Array<{questionId: string, jobId: string, pageNum: number, questionNum: number, thumbnailUrl: string}>,
 *   onAddToBasket: (item: object) => void,
 *   onRemoveFromBasket: (questionId: string) => void,
 *   onBack: () => void
 * }} props
 */
export default function QuestionPicker({
  jobId,
  pageNum,
  basket,
  onAddToBasket,
  onRemoveFromBasket,
  onBack,
}) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPageQuestions(jobId, pageNum);
      setQuestions(data.questions || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [jobId, pageNum]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // basket에 담긴 question_id Set (O(1) 조회)
  const basketIds = useMemo(
    () => new Set(basket.map((b) => b.questionId)),
    [basket]
  );

  const handleToggle = (q) => {
    const qId = q.question_id;
    if (basketIds.has(qId)) {
      onRemoveFromBasket(qId);
    } else {
      onAddToBasket({
        questionId: qId,
        jobId,
        pageNum,
        questionNum: q.question_num,
        thumbnailUrl: q.thumbnail_url,
      });
    }
  };

  const thumbnailBase = BASE_URL.replace(/\/api$/, "");

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>
          ← 페이지 선택으로
        </button>
        {questions.length > 0 && (
          <span style={styles.countLabel}>
            {questions.length}개 문항 감지됨 · {basketIds.size}개 선택됨
          </span>
        )}
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {!loading && !error && questions.length === 0 && (
        <p style={styles.empty}>이 페이지에서 감지된 문항이 없습니다.</p>
      )}

      {/* 문항 카드 그리드 */}
      <div style={styles.grid}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={styles.skeleton} />
            ))
          : questions.map((q) => {
              const isSelected = basketIds.has(q.question_id);
              return (
                <div
                  key={q.question_id}
                  style={{
                    ...styles.card,
                    ...(isSelected ? styles.cardSelected : {}),
                  }}
                  onClick={() => handleToggle(q)}
                >
                  <div style={styles.imgWrapper}>
                    <img
                      src={`${thumbnailBase}${q.thumbnail_url}`}
                      alt={`문항 ${q.question_num}`}
                      style={styles.img}
                      loading="lazy"
                    />
                    {isSelected && (
                      <div style={styles.checkMark}>✓</div>
                    )}
                  </div>
                  <span style={styles.questionLabel}>문항 {q.question_num}</span>
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
  countLabel: {
    fontSize: 13,
    color: "#888",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
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
    paddingTop: "60%",
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
    objectFit: "contain",
    background: "#fff",
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
  questionLabel: {
    fontSize: 12,
    color: "#666",
  },
  skeleton: {
    borderRadius: 6,
    background: "linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 50%, #e8e8e8 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.2s infinite",
    aspectRatio: "5 / 3",
    width: "100%",
  },
  error: {
    color: "#c0392b",
    fontSize: 13,
  },
  empty: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
    padding: "32px 0",
  },
};
