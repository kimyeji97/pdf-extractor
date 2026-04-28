/**
 * 문항 분석 패널 (REQ-11~15, D01~D03)
 *
 * 변경 이력 (v3.1):
 *   REQ-D01: 문항 이미지 대형화 + 타이틀/배지를 이미지 상단으로 이동
 *   REQ-D02: 바스켓 담기/빼기 버튼 제거
 *   REQ-D03: 재감지 버튼 제거 (FilePagePanel로 이전)
 *
 * 기능:
 *   - 문항 카드 체크박스 선택 → 툴바 [삭제] 활성화 (REQ-14)
 *   - 타이틀 더블클릭 → 인라인 input 전환 → Enter/blur 저장 (REQ-12)
 *   - 수동 배지: is_manual=true 카드 (파란 "수동" 배지) (REQ-13)
 *   - 오탐지 하이라이트: is_false_positive=true 카드 (빨간 테두리 + "오탐지 의심") (REQ-15)
 *   - 삭제 후 Undo 토스트 4초 (REQ-14)
 *   - 드래그 드로우 모드: 페이지 이미지 위 마우스 드래그 → 수동 문항 추가 인라인 폼 (REQ-13)
 *
 * Props:
 *   jobId, pageNum, pageInfo  — 현재 페이지 식별
 *   refreshTrigger            — 부모(FilePagePanel)가 재감지 완료 시 증가시키는 카운터
 */
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  getPageQuestions,
  updateQuestionTitle,
  updateManualQuestionTitle,
  deleteQuestion,
  deleteManualQuestion,
  addManualQuestion,
} from "../api/client";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const API_ROOT = BASE_URL.replace(/\/api$/, "");

export default function QuestionAnalysisPanel({
  jobId,
  pageNum,
  pageInfo,
  refreshTrigger = 0,
}) {
  // ── 문항 목록 ───────────────────────────────────────────
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  // ── 선택 체크박스 상태 ──────────────────────────────────
  const [checkedIds, setCheckedIds] = useState(new Set());

  // ── 인라인 타이틀 편집 ──────────────────────────────────
  const [editingId, setEditingId]       = useState(null);
  const [editingValue, setEditingValue] = useState("");

  // ── 삭제 Undo 토스트 ────────────────────────────────────
  const [undoToast, setUndoToast] = useState(null);
  const undoTimerRef              = useRef(null);

  // ── 드로우 모드 (수동 문항 추가) ────────────────────────
  const [drawMode, setDrawMode]         = useState(false);
  const [isDragging, setIsDragging]     = useState(false);
  const [dragStart, setDragStart]       = useState(null);
  const [dragCurrent, setDragCurrent]   = useState(null);
  const [pendingRegionPx, setPendingRegionPx] = useState(null);
  const [pendingRegionPt, setPendingRegionPt] = useState(null);
  const [manualTitle, setManualTitle]         = useState("");
  const [manualTitleError, setManualTitleError] = useState("");
  const [addingManual, setAddingManual]         = useState(false);
  const imgRef     = useRef(null);
  const overlayRef = useRef(null);

  // ── 문항 목록 로드 ─────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    if (jobId == null || pageNum == null) return;
    setLoading(true);
    setError("");
    setCheckedIds(new Set());
    try {
      const data = await getPageQuestions(jobId, pageNum);
      setQuestions(data.questions || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [jobId, pageNum]);

  // jobId/pageNum 변경 또는 외부 refreshTrigger 변경 시 재로드
  useEffect(() => {
    fetchQuestions();
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, [fetchQuestions, refreshTrigger]);

  // ── 체크박스 토글 ──────────────────────────────────────
  const toggleCheck = (id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allCheckable = questions.filter((q) => !q.is_false_positive);
  const allChecked   =
    allCheckable.length > 0 && allCheckable.every((q) => checkedIds.has(q.question_id));

  const toggleAll = () => {
    if (allChecked) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(allCheckable.map((q) => q.question_id)));
    }
  };

  // ── 인라인 타이틀 편집 (REQ-12) ───────────────────────
  const startEdit = (q) => {
    setEditingId(q.question_id);
    setEditingValue(q.title ?? (q.is_manual ? q.title : `문항 ${q.question_num}`));
  };

  const commitEdit = async (q) => {
    const newTitle = editingValue.trim();
    setEditingId(null);
    if (!newTitle || newTitle === (q.title ?? "")) return;
    try {
      if (q.is_manual) {
        await updateManualQuestionTitle(jobId, pageNum, q.manual_id, newTitle);
      } else {
        await updateQuestionTitle(jobId, pageNum, q.question_num, newTitle);
      }
      setQuestions((prev) =>
        prev.map((item) =>
          item.question_id === q.question_id ? { ...item, title: newTitle } : item
        )
      );
    } catch { /* 저장 실패 시 조용히 무시 */ }
  };

  const cancelEdit = () => setEditingId(null);

  // ── 삭제 + Undo 토스트 (REQ-14) ───────────────────────
  const showUndoToast = (message, onUndo) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoToast({ message, onUndo });
    undoTimerRef.current = setTimeout(() => setUndoToast(null), 4000);
  };

  const handleDeleteSelected = async () => {
    const toDelete = questions.filter((q) => checkedIds.has(q.question_id));
    if (toDelete.length === 0) return;

    const deletedItems = [...toDelete];
    setQuestions((prev) => prev.filter((q) => !checkedIds.has(q.question_id)));
    setCheckedIds(new Set());

    const calls = deletedItems.map((q) =>
      q.is_manual
        ? deleteManualQuestion(jobId, pageNum, q.manual_id).catch(() => null)
        : deleteQuestion(jobId, pageNum, q.question_num).catch(() => null)
    );
    await Promise.all(calls);

    showUndoToast(`${deletedItems.length}개 문항이 삭제되었습니다.`, async () => {
      await fetchQuestions();
    });
  };

  // ── 드로우 모드: 좌표 변환 ────────────────────────────
  const toPdfCoords = useCallback(
    (px) => {
      const img = imgRef.current;
      if (!img || !pageInfo) return null;
      const scaleX = pageInfo.width  / img.clientWidth;
      const scaleY = pageInfo.height / img.clientHeight;
      return {
        x0: Math.max(0, px.x0 * scaleX),
        y0: Math.max(0, px.y0 * scaleY),
        x1: Math.min(pageInfo.width,  px.x1 * scaleX),
        y1: Math.min(pageInfo.height, px.y1 * scaleY),
      };
    },
    [pageInfo]
  );

  const getPos = (e) => {
    const rect = overlayRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(e.clientY - rect.top,  rect.height)),
    };
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setPendingRegionPx(null);
    setPendingRegionPt(null);
    setManualTitle("");
    setManualTitleError("");
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
    if (x1 - x0 > 8 && y1 - y0 > 8) {
      const pxRegion = { x0, y0, x1, y1 };
      setPendingRegionPx(pxRegion);
      setPendingRegionPt(toPdfCoords(pxRegion));
    }
    setDragStart(null);
    setDragCurrent(null);
  };

  const dragBox = useMemo(() => {
    if (!dragStart || !dragCurrent) return null;
    return {
      left:   Math.min(dragStart.x, dragCurrent.x),
      top:    Math.min(dragStart.y, dragCurrent.y),
      width:  Math.abs(dragCurrent.x - dragStart.x),
      height: Math.abs(dragCurrent.y - dragStart.y),
    };
  }, [dragStart, dragCurrent]);

  // ── 수동 문항 추가 제출 (REQ-13) ──────────────────────
  const handleAddManual = async () => {
    if (!manualTitle.trim()) {
      setManualTitleError("타이틀을 입력해주세요.");
      return;
    }
    if (!pendingRegionPt) return;
    setAddingManual(true);
    setManualTitleError("");
    try {
      await addManualQuestion(jobId, pageNum, {
        title: manualTitle.trim(),
        region: pendingRegionPt,
      });
      setPendingRegionPx(null);
      setPendingRegionPt(null);
      setManualTitle("");
      setDrawMode(false);
      fetchQuestions();
    } catch (e) {
      setManualTitleError(e.message || "추가에 실패했습니다.");
    } finally {
      setAddingManual(false);
    }
  };

  const handleCancelManual = () => {
    setPendingRegionPx(null);
    setPendingRegionPt(null);
    setManualTitle("");
    setManualTitleError("");
  };

  const pageThumbUrl = pageInfo
    ? `${API_ROOT}${pageInfo.thumbnail_url}`
    : null;

  const checkedCount = checkedIds.size;

  return (
    <div className="qap-container">

      {/* ── 툴바 ─────────────────────────────────────────── */}
      <div className="qap-toolbar">
        <label className="qap-check-all" title="전체 선택/해제">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={toggleAll}
            disabled={allCheckable.length === 0}
          />
        </label>

        <button
          className={`qap-btn qap-btn--danger${checkedCount === 0 ? " qap-btn--disabled" : ""}`}
          onClick={handleDeleteSelected}
          disabled={checkedCount === 0}
        >
          삭제 ({checkedCount}개)
        </button>

        <div className="qap-toolbar-right">
          <button
            className={`qap-btn${drawMode ? " qap-btn--active" : ""}`}
            onClick={() => {
              setDrawMode((v) => !v);
              handleCancelManual();
            }}
          >
            {drawMode ? "✕ 수동 종료" : "✏️ 수동 추가"}
          </button>
        </div>
      </div>

      {/* ── Undo 토스트 ───────────────────────────────────── */}
      {undoToast && (
        <div className="qap-toast">
          <span>{undoToast.message}</span>
          <button
            className="qap-toast-undo"
            onClick={() => {
              clearTimeout(undoTimerRef.current);
              setUndoToast(null);
              undoToast.onUndo?.();
            }}
          >
            되돌리기
          </button>
        </div>
      )}

      {error && <div className="qap-banner qap-banner--error">{error}</div>}

      {/* ── 드로우 모드: 페이지 이미지 + 드래그 + 인라인 폼 ── */}
      {drawMode && (
        <div className="qap-draw-section">
          <p className="qap-draw-hint">드래그하여 문항 영역을 지정하세요.</p>
          {pageThumbUrl ? (
            <div className="qap-page-img-wrap">
              <img
                ref={imgRef}
                src={pageThumbUrl}
                alt="페이지 전체"
                className="qap-page-img"
                draggable={false}
              />
              <div
                ref={overlayRef}
                className="qap-overlay"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => isDragging && handleMouseUp({ clientX: 0, clientY: 0 })}
              >
                {dragBox && (
                  <div
                    style={{
                      position: "absolute",
                      left: dragBox.left, top: dragBox.top,
                      width: dragBox.width, height: dragBox.height,
                      border: "2px dashed #2563eb",
                      background: "rgba(37,99,235,0.1)",
                      pointerEvents: "none",
                      boxSizing: "border-box",
                    }}
                  />
                )}
                {pendingRegionPx && !isDragging && (
                  <div
                    style={{
                      position: "absolute",
                      left: pendingRegionPx.x0, top: pendingRegionPx.y0,
                      width:  pendingRegionPx.x1 - pendingRegionPx.x0,
                      height: pendingRegionPx.y1 - pendingRegionPx.y0,
                      border: "2px solid #2563eb",
                      background: "rgba(37,99,235,0.08)",
                      pointerEvents: "none",
                      boxSizing: "border-box",
                    }}
                  />
                )}
              </div>
            </div>
          ) : (
            <p className="qap-error">페이지 썸네일을 불러올 수 없습니다.</p>
          )}

          {pendingRegionPt && (
            <div className="qap-manual-form">
              <input
                type="text"
                className="qap-manual-input"
                placeholder="문항 타이틀 입력 (필수)"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")  handleAddManual();
                  if (e.key === "Escape") handleCancelManual();
                }}
                autoFocus
              />
              <button
                className="qap-btn qap-btn--primary"
                onClick={handleAddManual}
                disabled={addingManual}
              >
                {addingManual ? "추가 중..." : "추가"}
              </button>
              <button className="qap-btn" onClick={handleCancelManual}>
                취소
              </button>
              {manualTitleError && (
                <span className="qap-manual-error">{manualTitleError}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 문항 목록 (REQ-D01: 타이틀 상단 + 대형 이미지) ── */}
      <div className="qap-list">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="qap-skeleton" />
            ))
          : questions.length === 0 && !loading && (
              <div className="qap-empty">
                <p>이 페이지에서 감지된 문항이 없습니다.</p>
                <p>위의 "수동 추가" 버튼으로 직접 영역을 지정할 수 있습니다.</p>
              </div>
            )}

        {questions.map((q) => {
          const displayTitle = q.title || (q.is_manual ? "(수동 문항)" : `문항 ${q.question_num}`);
          const isChecked    = checkedIds.has(q.question_id);

          return (
            <div
              key={q.question_id}
              className={[
                "qap-card",
                q.is_false_positive ? "qap-card--fp" : "",
                isChecked            ? "qap-card--checked" : "",
              ].join(" ")}
            >
              {/* ─ 상단 행: 체크박스 + 배지 + 타이틀 ─ */}
              <div className="qap-card-header">
                <input
                  type="checkbox"
                  className="qap-card-check"
                  checked={isChecked}
                  onChange={() => !q.is_false_positive && toggleCheck(q.question_id)}
                  disabled={q.is_false_positive}
                  title={q.is_false_positive ? "오탐지 의심 문항은 직접 확인 후 삭제하세요." : ""}
                />

                <div className="qap-card-badges">
                  {q.is_manual && <span className="qap-badge qap-badge--manual">수동</span>}
                  {q.is_false_positive && (
                    <span className="qap-badge qap-badge--fp">오탐지 의심</span>
                  )}
                </div>

                {/* 더블클릭 인라인 타이틀 편집 (REQ-12) */}
                {editingId === q.question_id ? (
                  <input
                    type="text"
                    className="qap-title-input"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")  commitEdit(q);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    onBlur={() => commitEdit(q)}
                    autoFocus
                  />
                ) : (
                  <span
                    className="qap-card-title"
                    title="더블클릭하여 타이틀 수정"
                    onDoubleClick={() => !q.is_false_positive && startEdit(q)}
                  >
                    {displayTitle}
                  </span>
                )}
              </div>

              {/* ─ 대형 이미지 (REQ-D01) ─ */}
              <div className="qap-card-img">
                <img
                  src={`${API_ROOT}${q.thumbnail_url}`}
                  alt={displayTitle}
                  loading="lazy"
                />
              </div>

              {q.is_false_positive && (
                <p className="qap-fp-note">
                  이 문항은 페이지 전체 크기와 경계가 일치합니다. 오탐지일 수 있습니다.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
