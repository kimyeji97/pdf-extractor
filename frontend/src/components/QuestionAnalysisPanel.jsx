/**
 * 문항 분석 패널 (REQ-11~15, D01~D03)
 *
 * v3.3:
 *   - drawMode (수동 추가 드래그) 기능은 부모(pages/analysis/work.jsx ② 미리보기)가 담당
 *   - 이 컴포넌트는 툴바 + 문항 카드 목록만 담당
 *
 * Props:
 *   jobId, pageNum, pageInfo  — 현재 페이지 식별
 *   refreshTrigger            — 부모가 재감지/수동추가 완료 시 증가시키는 카운터
 */
import { useEffect, useState, useCallback, useRef } from "react";
import {
  getPageQuestions,
  updateQuestionTitle,
  updateManualQuestionTitle,
  bulkDeleteQuestions,
} from "../api/client";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const API_ROOT = BASE_URL.replace(/\/api$/, "");

function CardImg({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);
  return (
    <div className="qap-card-img">
      {!loaded && !error && <div className="qap-img-skeleton" />}
      {error && (
        <div className="qap-card-img-error">
          <span style={{ fontSize: 18 }}>🖼</span>
          <span>이미지를 불러올 수 없습니다</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => { setError(true); setLoaded(false); }}
        style={{ display: loaded && !error ? "block" : "none" }}
      />
    </div>
  );
}

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
  const [undoToast, setUndoToast]   = useState(null);
  const undoTimerRef                = useRef(null);

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

  // 전체 선택 대상: 오탐지 의심 문항 포함 (REQ-B06/B07 — 오탐도 벌크 삭제 대상)
  const allCheckable = questions;
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

    // 자동/수동을 분리해 벌크 삭제 1회 호출 (단건 동시 호출의 경쟁 상태 회피)
    const questionNums = deletedItems
      .filter((q) => !q.is_manual)
      .map((q) => q.question_num);
    const manualIds = deletedItems
      .filter((q) => q.is_manual)
      .map((q) => q.manual_id);

    try {
      await bulkDeleteQuestions(jobId, pageNum, questionNums, manualIds);
    } catch {
      // 실패 시 서버 상태로 목록 복원
      await fetchQuestions();
      return;
    }

    showUndoToast(`${deletedItems.length}개 문항이 삭제되었습니다.`, async () => {
      await fetchQuestions();
    });
  };

  const checkedCount = checkedIds.size;

  return (
    <div className="qap-container">

      {/* ── 툴바 ─────────────────────────────────────────── */}
      <div className="qap-toolbar">
        <span className="panel-title" style={{ marginRight: 8 }}>③ 문항 목록</span>

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

      {/* ── 문항 목록 ─────────────────────────────────────── */}
      <div className="qap-list">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="qap-skeleton" />
            ))
          : questions.length === 0 && !loading && (
              <div className="qap-empty">
                <p>감지된 문항이 없습니다.</p>
                <p>② 미리보기에서 "수동 추가"로 직접 지정할 수 있습니다.</p>
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
              {/* 상단 행: 체크박스 + 배지 + 타이틀 */}
              <div className="qap-card-header">
                <input
                  type="checkbox"
                  className="qap-card-check"
                  checked={isChecked}
                  onChange={() => toggleCheck(q.question_id)}
                  title={q.is_false_positive ? "오탐지 의심 문항입니다. 이미지를 확인한 뒤 선택하여 삭제할 수 있습니다." : ""}
                />

                <div className="qap-card-badges">
                  {q.is_manual && <span className="qap-badge qap-badge--manual">수동</span>}
                  {q.is_false_positive && (
                    <span className="qap-badge qap-badge--fp">오탐지 의심</span>
                  )}
                </div>

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

              {/* 문항 이미지 */}
              <CardImg src={`${API_ROOT}${q.thumbnail_url}`} alt={displayTitle} />

              {q.is_false_positive && (
                <p className="qap-fp-note">
                  오탐지일 수 있습니다. 문항 이미지를 확인 후 필요하면 삭제하세요.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

