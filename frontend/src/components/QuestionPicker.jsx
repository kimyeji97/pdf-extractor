import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { getPageQuestions, refreshJobQuestions, getJobInfo } from "../api/client";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const API_ROOT = BASE_URL.replace(/\/api$/, "");

/**
 * 선택된 페이지에서 감지된 문항을 그리드로 나열하고 바스켓에 선택/해제할 수 있다.
 *
 * 기능:
 *   - 자동 감지 문항: 서버에서 반환된 문항을 그리드로 표시, 클릭으로 바스켓 토글
 *   - 수동 모드: 페이지 전체 썸네일 위에서 드래그로 영역 지정 → 감지 목록에 추가
 *   - 재감지: 서버에 비동기 재감지 요청 후 완료될 때까지 폴링
 */
export default function QuestionPicker({
  jobId,
  pageNum,
  pageInfo,
  basket,
  onAddToBasket,
  onRemoveFromBasket,
}) {
  const [questions, setQuestions] = useState([]);     // 자동 감지 문항
  const [manualQuestions, setManualQuestions] = useState([]); // 수동 지정 문항
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // 재감지 진행 중
  const [error, setError] = useState("");

  // 수동 드래그 모드
  const [drawMode, setDrawMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);
  const imgRef = useRef(null);
  const overlayRef = useRef(null);
  const pollRef = useRef(null);  // 재감지 폴링 interval

  // ── 문항 목록 로드 ────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPageQuestions(jobId, pageNum);
      const qs = data.questions || [];
      setQuestions(qs);
      if (qs.length === 0 && manualQuestions.length === 0) setDrawMode(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, pageNum]);

  useEffect(() => {
    fetchQuestions();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchQuestions]);

  // ── 비동기 재감지 ─────────────────────────────────────
  // 서버에 재감지 요청 → 즉시 PROCESSING 반환 → 폴링으로 완료 감지
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    setError("");

    try {
      await refreshJobQuestions(jobId);
    } catch (e) {
      setError(e.message);
      setRefreshing(false);
      return;
    }

    // 폴링: GET /api/jobs/{jobId} 에서 boundaries_status가 DONE/FAILED 될 때까지
    pollRef.current = setInterval(async () => {
      try {
        const info = await getJobInfo(jobId);
        const status = info.boundaries_status;

        if (status === "DONE") {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setRefreshing(false);
          // 재감지 완료 → 이 페이지 문항 목록 다시 로드
          const data = await getPageQuestions(jobId, pageNum);
          const qs = data.questions || [];
          setQuestions(qs);
          if (qs.length === 0 && manualQuestions.length === 0) setDrawMode(true);
          else setDrawMode(false);
        } else if (status === "FAILED") {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setRefreshing(false);
          setError("재감지에 실패했습니다. 다시 시도해주세요.");
        }
        // PROCESSING이면 계속 폴링
      } catch {
        /* 폴링 오류는 무시하고 재시도 */
      }
    }, 2000); // 2초마다 폴링
  }, [jobId, pageNum, refreshing, manualQuestions.length]);

  // basket에 담긴 question_id Set
  const basketIds = useMemo(
    () => new Set(basket.map((b) => b.questionId)),
    [basket]
  );

  // ── 자동 감지 문항 토글 ───────────────────────────────
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
        isManual: false,
      });
    }
  };

  // ── 수동 문항 토글 ────────────────────────────────────
  const handleManualToggle = (mq) => {
    if (basketIds.has(mq.questionId)) {
      onRemoveFromBasket(mq.questionId);
    } else {
      onAddToBasket({
        questionId: mq.questionId,
        jobId: mq.jobId,
        pageNum: mq.pageNum,
        questionNum: null,
        customRegion: mq.customRegion,
        thumbnailUrl: null,
        label: mq.label,
        isManual: true,
      });
    }
  };

  // ── 수동 문항 삭제 ────────────────────────────────────
  const handleManualDelete = (questionId) => {
    // 바스켓에서도 제거
    onRemoveFromBasket(questionId);
    setManualQuestions(prev => prev.filter(mq => mq.questionId !== questionId));
  };

  // ── 좌표 변환: 오버레이 픽셀 → PDF pt ──────────────────
  const toPdfCoords = useCallback(
    (pixelRegion) => {
      const img = imgRef.current;
      if (!img || !pageInfo) return null;
      const scaleX = pageInfo.width / img.clientWidth;
      const scaleY = pageInfo.height / img.clientHeight;
      return {
        x0: Math.max(0, pixelRegion.x0 * scaleX),
        y0: Math.max(0, pixelRegion.y0 * scaleY),
        x1: Math.min(pageInfo.width, pixelRegion.x1 * scaleX),
        y1: Math.min(pageInfo.height, pixelRegion.y1 * scaleY),
      };
    },
    [pageInfo]
  );

  // ── 드래그 이벤트 ─────────────────────────────────────
  const getPos = (e) => {
    const rect = overlayRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(e.clientY - rect.top, rect.height)),
    };
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const p = getPos(e);
    setDragStart(p);
    setDragCurrent(p);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setDragCurrent(getPos(e));
  };

  const handleMouseUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    const p = getPos(e);

    const x0 = Math.min(dragStart.x, p.x);
    const y0 = Math.min(dragStart.y, p.y);
    const x1 = Math.max(dragStart.x, p.x);
    const y1 = Math.max(dragStart.y, p.y);

    // 너무 작은 드래그는 무시
    if (x1 - x0 > 8 && y1 - y0 > 8) {
      const pdfCoords = toPdfCoords({ x0, y0, x1, y1 });
      if (pdfCoords) {
        const manualIdx = manualQuestions.length + 1;
        const newManualQ = {
          questionId: `${jobId}:${pageNum}:manual:${Date.now()}`,
          jobId,
          pageNum,
          customRegion: pdfCoords,
          label: `수동 ${manualIdx}`,
        };
        // 바스켓이 아닌 수동 목록에 추가
        setManualQuestions(prev => [...prev, newManualQ]);
      }
    }

    setDragStart(null);
    setDragCurrent(null);
  };

  // 현재 드래그 중인 박스
  const dragBox = useMemo(() => {
    if (!dragStart || !dragCurrent) return null;
    return {
      left: Math.min(dragStart.x, dragCurrent.x),
      top: Math.min(dragStart.y, dragCurrent.y),
      width: Math.abs(dragCurrent.x - dragStart.x),
      height: Math.abs(dragCurrent.y - dragStart.y),
    };
  }, [dragStart, dragCurrent]);

  const pageThumbUrl = pageInfo
    ? `${API_ROOT}${pageInfo.thumbnail_url}`
    : null;

  // 전체 문항 수 (자동 + 수동)
  const totalCount = questions.length + manualQuestions.length;

  return (
    <div style={styles.container}>
      {/* 상단 컨트롤 바 */}
      <div style={styles.toolbar}>
        {!loading && !refreshing && totalCount > 0 && (
          <span style={styles.countLabel}>
            {questions.length > 0 && `${questions.length}개 자동 감지`}
            {manualQuestions.length > 0 && ` · ${manualQuestions.length}개 수동`}
            {basketIds.size > 0 && ` · ${basketIds.size}개 선택`}
          </span>
        )}
        <div style={styles.toolbarRight}>
          {/* 재감지 버튼 */}
          <button
            style={{
              ...styles.modeBtn,
              ...(refreshing ? styles.modeBtnDisabled : {}),
            }}
            onClick={handleRefresh}
            disabled={refreshing || loading}
            title="전체 문서 문항 감지를 다시 실행합니다 (비동기)"
          >
            {refreshing ? "⏳ 감지 중..." : "🔄 재감지"}
          </button>
          {/* 수동/자동 모드 토글 */}
          <button
            style={{
              ...styles.modeBtn,
              ...(drawMode ? styles.modeBtnActive : {}),
            }}
            onClick={() => setDrawMode((v) => !v)}
            title={drawMode ? "자동 감지 문항 보기" : "드래그로 영역 직접 선택"}
          >
            {drawMode ? "✕ 수동 종료" : "✏️ 영역 수동 선택"}
          </button>
        </div>
      </div>

      {/* 재감지 진행 중 배너 */}
      {refreshing && (
        <div style={styles.refreshingBanner}>
          ⏳ 전체 PDF를 다시 분석하는 중입니다. 잠시 기다려 주세요...
        </div>
      )}

      {/* ── 수동 드래그 모드 ── */}
      {drawMode && (
        <div style={styles.drawSection}>
          <p style={styles.drawHint}>
            드래그하여 추출할 영역을 지정하세요. 지정한 영역은 아래 목록에 추가됩니다.
          </p>

          {pageThumbUrl ? (
            <div style={styles.pageImgWrap}>
              <img
                ref={imgRef}
                src={pageThumbUrl}
                alt={`${pageNum + 1}페이지 전체`}
                style={styles.pageImg}
                draggable={false}
              />
              {/* 드래그 오버레이 */}
              <div
                ref={overlayRef}
                style={styles.overlay}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {dragBox && (
                  <div
                    style={{
                      position: "absolute",
                      left: dragBox.left,
                      top: dragBox.top,
                      width: dragBox.width,
                      height: dragBox.height,
                      border: "2px dashed #4a90e2",
                      background: "rgba(74,144,226,0.12)",
                      pointerEvents: "none",
                      boxSizing: "border-box",
                    }}
                  />
                )}
              </div>
            </div>
          ) : (
            <p style={styles.error}>페이지 썸네일을 불러올 수 없습니다.</p>
          )}
        </div>
      )}

      {/* ── 문항 그리드 (자동 + 수동 통합) ── */}
      <div style={styles.gridSection}>
        {error && <p style={styles.error}>{error}</p>}

        {!loading && !refreshing && totalCount === 0 && (
          <div style={styles.emptyWrap}>
            <p style={styles.empty}>이 페이지에서 감지된 문항이 없습니다.</p>
            <p style={styles.emptySub}>
              위의 &quot;영역 수동 선택&quot; 버튼으로 추출 영역을 직접 지정할 수 있습니다.
            </p>
          </div>
        )}

        <div style={styles.grid}>
          {/* 자동 감지 문항 */}
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
                    title={`문항 ${q.question_num} — 클릭하여 선택/해제`}
                  >
                    <div style={styles.imgWrapper}>
                      <img
                        src={`${API_ROOT}${q.thumbnail_url}`}
                        alt={`문항 ${q.question_num}`}
                        style={styles.img}
                        loading="lazy"
                      />
                      {isSelected && <div style={styles.checkMark}>✓</div>}
                    </div>
                    <span style={styles.questionLabel}>문항 {q.question_num}</span>
                  </div>
                );
              })}

          {/* 수동 지정 문항 */}
          {manualQuestions.map((mq) => {
            const isSelected = basketIds.has(mq.questionId);
            return (
              <div
                key={mq.questionId}
                style={{
                  ...styles.card,
                  ...styles.cardManual,
                  ...(isSelected ? styles.cardSelected : {}),
                }}
              >
                {/* 카드 클릭 영역 (선택 토글) */}
                <div
                  style={styles.manualCardBody}
                  onClick={() => handleManualToggle(mq)}
                  title="클릭하여 선택/해제"
                >
                  <div style={styles.imgWrapperManual}>
                    <div style={styles.manualIcon}>✏️</div>
                    {isSelected && <div style={styles.checkMark}>✓</div>}
                  </div>
                  <span style={styles.questionLabel}>{mq.label}</span>
                </div>
                {/* 삭제 버튼 */}
                <button
                  style={styles.manualDeleteBtn}
                  onClick={(e) => { e.stopPropagation(); handleManualDelete(mq.questionId); }}
                  title="이 수동 영역 삭제"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { width: "100%" },

  /* 상단 컨트롤 바 */
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 8,
    flexWrap: "wrap",
  },
  toolbarRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginLeft: "auto",
  },
  countLabel: {
    fontSize: 12,
    color: "#888",
    whiteSpace: "nowrap",
  },
  modeBtn: {
    background: "#f4f4f4",
    border: "1px solid #ddd",
    borderRadius: 6,
    padding: "6px 11px",
    fontSize: 12,
    cursor: "pointer",
    color: "#444",
    whiteSpace: "nowrap",
    transition: "background 0.15s, color 0.15s",
  },
  modeBtnActive: {
    background: "#4a90e2",
    color: "#fff",
    border: "1px solid #3a7bd5",
  },
  modeBtnDisabled: {
    background: "#e8e8e8",
    color: "#aaa",
    border: "1px solid #ddd",
    cursor: "not-allowed",
  },
  refreshingBanner: {
    background: "#fff8e1",
    border: "1px solid #ffe082",
    borderRadius: 6,
    padding: "8px 12px",
    fontSize: 13,
    color: "#795548",
    marginBottom: 8,
    textAlign: "center",
  },

  // 수동 드래그 모드
  drawSection: {
    width: "100%",
    marginBottom: 12,
  },
  drawHint: {
    fontSize: 12,
    color: "#555",
    marginBottom: 8,
    padding: "6px 10px",
    background: "#f0f6ff",
    borderRadius: 6,
    borderLeft: "3px solid #4a90e2",
  },
  pageImgWrap: {
    position: "relative",
    width: "100%",
    userSelect: "none",
    borderRadius: 6,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  },
  pageImg: {
    width: "100%",
    display: "block",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    cursor: "crosshair",
  },

  // 문항 그리드 영역
  gridSection: {
    width: "100%",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
    gap: 8,
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
    transition: "border-color 0.15s",
    background: "#fafafa",
  },
  cardManual: {
    position: "relative",
    flexDirection: "row",
    alignItems: "stretch",
    padding: 0,
    overflow: "hidden",
  },
  manualCardBody: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    padding: 6,
    cursor: "pointer",
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
  imgWrapperManual: {
    position: "relative",
    width: "100%",
    paddingTop: "55%",
    background: "#f0f6ff",
    borderRadius: 4,
    overflow: "hidden",
    border: "1px solid #c8daf7",
  },
  manualIcon: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
  },
  img: {
    position: "absolute",
    top: 0, left: 0,
    width: "100%", height: "100%",
    objectFit: "contain",
    background: "#fff",
  },
  checkMark: {
    position: "absolute",
    top: 4, right: 4,
    background: "#4a90e2",
    color: "#fff",
    borderRadius: "50%",
    width: 20, height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: "bold",
  },
  questionLabel: { fontSize: 11, color: "#666", textAlign: "center" },
  manualDeleteBtn: {
    background: "none",
    border: "none",
    color: "#ccc",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: "bold",
    padding: "0 6px",
    alignSelf: "stretch",
    display: "flex",
    alignItems: "center",
    borderLeft: "1px solid #e8e8e8",
    transition: "color 0.15s, background 0.15s",
  },

  emptyWrap: { textAlign: "center", padding: "20px 0" },
  empty: { color: "#888", fontSize: 13, marginBottom: 6 },
  emptySub: { color: "#aaa", fontSize: 12 },

  skeleton: {
    borderRadius: 6,
    background: "linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 50%, #e8e8e8 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.2s infinite",
    aspectRatio: "5 / 3",
    width: "100%",
  },
  error: { color: "#c0392b", fontSize: 13 },
};
