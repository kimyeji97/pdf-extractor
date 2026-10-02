/**
 * 문항 분석 패널 (REQ-11~15, D01~D03)
 *
 * v3.3:
 *   - drawMode (수동 추가 드래그) 기능은 부모(pages/analysis/work.jsx 미리보기)가 담당
 *   - 이 컴포넌트는 헤더 + 문항 카드 목록만 담당
 *
 * REQ-D07 Phase 3-4: 순수 CSS(qap-*) + 생 DOM → MUI + 테마 토큰.
 *   카드/헤더 어휘는 Phase 3-1~3-3(BookCard·목록 패널)과 맞춘다.
 *
 * Props:
 *   jobId, pageNum, pageInfo  — 현재 페이지 식별
 *   refreshTrigger            — 부모가 재감지/수동추가 완료 시 증가시키는 카운터
 *   columns                   — 카드 그리드 열 수 (REQ-D10). 부모가 패널 너비로 계산해 넘긴다
 *                               (`utils/questionGrid`). 이 패널은 너비를 재지 않는다
 */
import { useEffect, useState, useCallback, useRef, useMemo, memo } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Tooltip from "@mui/material/Tooltip";
import { Icon } from "@iconify/react";

import { tintBg, tintSx } from "theme/tint";

import {
  getPageQuestions,
  updateQuestionTitle,
  updateManualQuestionTitle,
  bulkDeleteQuestions,
} from "../api/client";
import { INFO_CHIP, MARK_COLOR } from "utils/badges";
import { QUESTION_PREFIX, questionDisplayName, questionNameRest } from "utils/questionName";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const API_ROOT = BASE_URL.replace(/\/api$/, "");

function CardImg({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);
  return (
    <Box sx={{ position: "relative", minHeight: loaded && !error ? 0 : 80, bgcolor: "background.neutral" }}>
      {!loaded && !error && (
        /* shimmer는 App.css의 .img-skeleton을 공용으로 쓴다 (BookCard와 동일) */
        <Box className="img-skeleton" sx={{ position: "absolute", inset: 0, borderRadius: 0 }} />
      )}
      {error && (
        <Box
          sx={{
            py: 2.5, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 0.5,
            color: "text.disabled",
          }}
        >
          <Icon icon="material-symbols:broken-image-outline-rounded" style={{ fontSize: 22 }} />
          <Typography variant="caption">이미지를 불러올 수 없습니다</Typography>
        </Box>
      )}
      <Box
        component="img"
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => { setError(true); setLoaded(false); }}
        sx={{
          display: loaded && !error ? "block" : "none",
          width: "100%", height: "auto", verticalAlign: "middle",
        }}
      />
    </Box>
  );
}

// 체크박스 하나만 토글해도 전체 카드 목록이 리렌더되는 것을 막기 위해
/** 이름 수정 입력란의 처음 값 — 접두어 뒤에 보이는 그대로. 이름 없는 수동 문항은 빈칸 (REQ-C10) */
const editStartValue = (q) => (q.is_manual && !q.title ? "" : questionNameRest(q));

// 카드를 별도 컴포넌트로 분리하고 memo 처리한다 (REQ-P02-04). 편집 중인 카드만
// isEditing/editingValue가 바뀌므로 나머지 카드는 리렌더를 건너뛴다.
const QuestionCard = memo(
  function QuestionCard({
    q, isChecked, isEditing, editingValue,
    onToggleCheck, onStartEdit, onCommitEdit, onCancelEdit, onEditingValueChange,
  }) {
    const displayTitle = questionDisplayName(q);
    const fp = q.is_false_positive;
    return (
      <Paper
        variant="outlined"
        sx={{
          overflow: "hidden",
          // 카드는 grid 아이템이다(REQ-D10). grid 아이템의 기본 min-width:auto가 이미지의
          // min-content 폭으로 셀을 밀어내지 않게 minWidth:0을 건다 — 이미지는 width:100%라
          // 셀 폭을 따른다. (종전 flex 컬럼 시절의 flexShrink:0 — 계약 #5 — 은 축소로 인한
          // 이미지 잘림을 막던 것으로, grid에서는 축소 자체가 없다.)
          minWidth: 0,
          transition: "border-color 0.15s, box-shadow 0.15s",
          ...(fp && { borderColor: "warning.light", bgcolor: tintBg("warning") }),
          ...(isChecked && { borderColor: "primary.main", boxShadow: (t) => `0 0 0 1px ${t.palette.primary.main}` }),
          "&:hover": { borderColor: isChecked ? "primary.main" : "text.disabled" },
        }}
      >
        {/* 상단 행: 체크박스 + 배지 + 타이틀 */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1, py: 0.75 }}>
          <Tooltip
            title={fp ? "오탐지 의심 문항입니다. 이미지를 확인한 뒤 선택하여 삭제할 수 있습니다." : ""}
          >
            <Checkbox
              size="small"
              checked={isChecked}
              onChange={() => onToggleCheck(q.question_id)}
              sx={{ p: 0.25, flexShrink: 0 }}
            />
          </Tooltip>

          {q.is_manual && (
            <Chip label="수동" size="small" color={MARK_COLOR.manual} variant="outlined" sx={{ height: 18, fontSize: 10, flexShrink: 0 }} />
          )}
          {fp && (
            <Chip label="오탐지 의심" size="small" color={MARK_COLOR.falsePositive} sx={{ height: 18, fontSize: 10, flexShrink: 0 }} />
          )}

          {isEditing ? (
            <TextField
              size="small"
              variant="standard"
              fullWidth
              autoFocus
              value={editingValue}
              onChange={(e) => onEditingValueChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter")  onCommitEdit(q);
                if (e.key === "Escape") onCancelEdit();
              }}
              onBlur={() => onCommitEdit(q)}
              slotProps={{
                input: {
                  sx: { fontSize: 12 },
                  // 고정 접두어 — 수정 대상은 그 뒤만 (REQ-C10)
                  startAdornment: <InputAdornment position="start" sx={{ mr: 0.5, "& p": { fontSize: 12 } }}>{QUESTION_PREFIX}</InputAdornment>,
                },
              }}
            />
          ) : (
            <Typography
              variant="caption"
              noWrap
              /* 말줄임된 제목을 호버로 읽을 수 있게 전체 제목을 앞세운다 (REQ-D10).
                 2열(카드 ~192px)에서는 긴 제목이 매번 잘린다 — 종전 문구만으로는 읽을 방법이 없었다. */
              title={fp ? displayTitle : `${displayTitle} · 더블클릭하여 수정`}
              onDoubleClick={() => !fp && onStartEdit(q)}
              sx={{
                flex: 1, minWidth: 0, fontWeight: 600,
                cursor: fp ? "default" : "text",
                borderRadius: 0.5, px: 0.5,
                "&:hover": fp ? undefined : { bgcolor: "action.hover" },
              }}
            >
              {displayTitle}
            </Typography>
          )}
        </Box>

        {/* 문항 이미지 (REQ-D01: 대형 이미지) */}
        <CardImg src={`${API_ROOT}${q.thumbnail_url}`} alt={displayTitle} />

        {fp && (
          <Typography
            variant="caption"
            component="p"
            sx={(theme) => ({ px: 1.25, py: 0.75, lineHeight: 1.4, ...tintSx("warning")(theme) })}
          >
            오탐지일 수 있습니다. 문항 이미지를 확인 후 필요하면 삭제하세요.
          </Typography>
        )}
      </Paper>
    );
  },
  (prev, next) =>
    prev.q.question_id === next.q.question_id &&
    prev.q.title === next.q.title &&
    prev.isChecked === next.isChecked &&
    prev.isEditing === next.isEditing &&
    prev.editingValue === next.editingValue,
);

// 화면에 떠 있는 패널들의 "대기 삭제 확정" 함수 (REQ-B26). 재감지는 부모(work.jsx)에서 시작되므로,
// 옛 경계의 (번호, k)로 지목한 지연 삭제가 새 경계에 적용되지 않게 부모가 먼저 이걸 기다린다.
const pendingFlushers = new Set();

/** 대기 중 삭제를 지금 보내고, 진행 중인 것까지 끝나면 끝난다 (재감지 전에 부른다) */
export function flushPendingDeletes() {
  return Promise.all([...pendingFlushers].map((flush) => flush())).then(() => undefined);
}

export default function QuestionAnalysisPanel({
  jobId,
  pageNum,
  pageInfo,
  refreshTrigger = 0,
  columns = 1,
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
  // 서버에 아직 안 보낸 삭제 (REQ-B26) — 토스트가 닫히거나·다시 삭제하거나·쪽을 옮기거나·화면을 떠날 때 보낸다
  const pendingDeleteRef            = useRef(null);
  const inflightDeleteRef           = useRef(Promise.resolve()); // 보낸 삭제가 끝날 때까지 — 목록 읽기는 그 뒤에
  const fetchQuestionsRef           = useRef(null);
  const viewRef                     = useRef({ jobId, pageNum, mounted: true });
  viewRef.current = { ...viewRef.current, jobId, pageNum };

  // ── 문항 목록 로드 ─────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    if (jobId == null || pageNum == null) return;
    setLoading(true);
    setError("");
    setCheckedIds(new Set());
    try {
      // 방금 보낸 삭제보다 먼저 읽으면 지운 문항이 되살아나 보인다 (REQ-B26)
      await inflightDeleteRef.current;
      const data = await getPageQuestions(jobId, pageNum);
      // 아직 안 보낸 삭제로 숨긴 문항은 계속 숨긴다
      const hidden = pendingDeleteRef.current?.ids ?? new Set();
      setQuestions((data.questions || []).filter((q) => !hidden.has(q.question_id)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [jobId, pageNum]);

  fetchQuestionsRef.current = fetchQuestions;

  /**
   * 대기 중 삭제를 서버에 보내고 그 요청이 끝나는 Promise 를 돌려준다(없으면 진행 중인 것).
   * 쪽·job 은 삭제한 시점 값이다(쪽을 옮긴 뒤에도 원래 쪽을 지운다).
   */
  const commitPendingDelete = useCallback(() => {
    const p = pendingDeleteRef.current;
    if (!p) return inflightDeleteRef.current;
    pendingDeleteRef.current = null;
    // 자동/수동을 분리해 벌크 삭제 1회 호출 (단건 동시 호출의 경쟁 상태 회피 — REQ-B06)
    const request = bulkDeleteQuestions(p.jobId, p.pageNum, p.autoRefs, p.manualIds);
    // 목록 읽기가 기다리는 건 요청 자체다 — 실패 처리(아래, 다시 읽기 포함)까지 기다리면 서로를 기다려 멈춘다
    inflightDeleteRef.current = request.then(() => undefined, () => undefined);
    return request.then(
      () => undefined,
      async () => {
        const view = viewRef.current;
        if (!view.mounted) return;
        // 그 쪽을 보고 있을 때만 서버 상태로 다시 읽는다 — 다른 대기 삭제의 숨김은 fetchQuestions 가 유지
        if (view.jobId === p.jobId && view.pageNum === p.pageNum) await fetchQuestionsRef.current?.();
        setError("삭제하지 못했습니다");
      },
    );
  }, []);

  useEffect(() => {
    fetchQuestions();
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setUndoToast(null);
      commitPendingDelete(); // 쪽 이동·다시 읽기·화면 이탈에도 대기 중 삭제가 사라지지 않게
    };
  }, [fetchQuestions, refreshTrigger, commitPendingDelete]);

  // 탭 닫기·새로고침엔 React 정리가 안 돈다 — pagehide 에 보낸다(요청은 keepalive) · 재감지 전 확정 통로 등록
  useEffect(() => {
    viewRef.current.mounted = true;
    const onPageHide = () => { commitPendingDelete(); };
    window.addEventListener("pagehide", onPageHide);
    pendingFlushers.add(commitPendingDelete);
    return () => {
      viewRef.current.mounted = false;
      window.removeEventListener("pagehide", onPageHide);
      pendingFlushers.delete(commitPendingDelete);
    };
  }, [commitPendingDelete]);

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
  // 인라인 타이틀 편집 중 매 keystroke마다 리렌더되는데, questions/checkedIds가
  // 안 바뀌었으면 .every() 전체 순회를 다시 하지 않도록 memo (REQ-P02-08)
  const allChecked = useMemo(
    () => allCheckable.length > 0 && allCheckable.every((q) => checkedIds.has(q.question_id)),
    [allCheckable, checkedIds],
  );

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
    setEditingValue(editStartValue(q));
  };

  const commitEdit = async (q) => {
    const newTitle = editingValue.trim();
    setEditingId(null);
    // 보이는 그대로 저장하면 원문이 사용자 이름으로 굳는다 — 바뀌지 않았으면 저장하지 않는다 (REQ-C10)
    if (!newTitle || newTitle === editStartValue(q)) return;
    try {
      if (q.is_manual) {
        await updateManualQuestionTitle(jobId, pageNum, q.manual_id, newTitle);
      } else {
        await updateQuestionTitle(jobId, pageNum, q.question_num, newTitle, q.k ?? 0);
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
    undoTimerRef.current = setTimeout(() => {
      setUndoToast(null);
      commitPendingDelete();
    }, 4000);
  };

  // 삭제는 화면에서 먼저 숨기고 토스트가 닫힐 때 서버에 보낸다 — [되돌리기]가 삭제 전 상태(오탐 표시 포함)를
  // 그대로 되살리려면 서버에서 지우지 않아야 한다 (REQ-B26, 백엔드 복원 API 없음)
  const handleDeleteSelected = () => {
    const snapshot = questions;
    const deletedItems = snapshot.filter((q) => checkedIds.has(q.question_id));
    if (deletedItems.length === 0) return;

    commitPendingDelete(); // 토스트 중 또 삭제 — 앞 삭제는 바로 확정
    const deletedIds = new Set(deletedItems.map((q) => q.question_id));
    setQuestions((prev) => prev.filter((q) => !deletedIds.has(q.question_id)));
    setCheckedIds(new Set());

    // 같은 쪽에 같은 번호가 공존할 수 있어 (번호, k) 로 지목한다 (ADR-0006)
    const pending = {
      jobId,
      pageNum,
      ids: deletedIds,
      autoRefs: deletedItems.filter((q) => !q.is_manual).map((q) => ({ num: q.question_num, k: q.k ?? 0 })),
      manualIds: deletedItems.filter((q) => q.is_manual).map((q) => q.manual_id),
    };
    pendingDeleteRef.current = pending;

    showUndoToast(`${deletedItems.length}개 문항이 삭제되었습니다.`, () => {
      if (pendingDeleteRef.current !== pending) return;
      pendingDeleteRef.current = null;
      // 원래 순서대로 되살린다 — 그 사이 바뀐 다른 문항(제목 등)은 현재 값을 쓴다
      setQuestions((prev) => {
        const current = new Map(prev.map((q) => [q.question_id, q]));
        return snapshot
          .filter((q) => current.has(q.question_id) || deletedIds.has(q.question_id))
          .map((q) => current.get(q.question_id) ?? q);
      });
    });
  };

  const checkedCount = checkedIds.size;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>

      {/* ── 헤더 ─────────────────────────────────────────── */}
      <Box
        sx={{
          px: 2, py: 1.25, borderBottom: 1, borderColor: "divider", flexShrink: 0,
          display: "flex", alignItems: "center", gap: 1,
        }}
      >
        <Icon icon="material-symbols:list-alt-outline-rounded" style={{ fontSize: 18, flexShrink: 0 }} />
        <Typography variant="subtitle2" fontWeight={700} noWrap>문항 목록</Typography>
        {questions.length > 0 && (
          <Chip label={questions.length} size="small" {...INFO_CHIP} sx={{ height: 18, fontSize: 10 }} />
        )}

        <Box sx={{ flex: 1 }} />

        <Tooltip title="전체 선택/해제">
          <span>
            <Checkbox
              size="small"
              checked={allChecked}
              onChange={toggleAll}
              disabled={allCheckable.length === 0}
              sx={{ p: 0.5 }}
            />
          </span>
        </Tooltip>
        <Button
          size="small"
          variant="outlined"
          color="error"
          onClick={handleDeleteSelected}
          disabled={checkedCount === 0}
          startIcon={<Icon icon="material-symbols:delete-outline-rounded" style={{ fontSize: 16 }} />}
          sx={{ flexShrink: 0, px: 1.25, fontSize: 12, whiteSpace: "nowrap" }}
        >
          삭제 {checkedCount > 0 && `(${checkedCount})`}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ borderRadius: 0, py: 0, fontSize: 12, flexShrink: 0 }}>{error}</Alert>}

      {/* ── 문항 목록 ─────────────────────────────────────── */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 1.5, display: "flex", flexDirection: "column" }}>
        {!loading && questions.length === 0 && (
          <Box
            sx={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 1.5, color: "text.disabled", px: 2,
            }}
          >
            <Icon icon="material-symbols:search-off-rounded" style={{ fontSize: 40 }} />
            <Typography variant="body2" textAlign="center" color="text.secondary">
              감지된 문항이 없습니다.
            </Typography>
            <Typography variant="caption" textAlign="center" color="text.disabled">
              미리보기에서 &quot;수동 추가&quot;로 직접 지정할 수 있습니다.
            </Typography>
          </Box>
        )}

        {/* 카드 그리드 (REQ-D10) — 열 수는 부모가 패널 너비로 계산해 넘긴다. 임계(420) 이하에서는
            1열이라 REQ-D01 대형 이미지가 그대로다. 열 수(정수)만 바뀌므로 드래그 중에도
            QuestionCard(memo)는 리렌더되지 않는다 — 카드에는 열 수를 넘기지 않는다. */}
        {(loading || questions.length > 0) && (
          <Box
            data-columns={columns}
            sx={{
              display: "grid",
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gap: 1.5,
              alignItems: "start",
            }}
          >
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={140} />
              ))}

            {questions.map((q) => (
              <QuestionCard
                key={q.question_id}
                q={q}
                isChecked={checkedIds.has(q.question_id)}
                isEditing={editingId === q.question_id}
                editingValue={editingValue}
                onToggleCheck={toggleCheck}
                onStartEdit={startEdit}
                onCommitEdit={commitEdit}
                onCancelEdit={cancelEdit}
                onEditingValueChange={setEditingValue}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* ── Undo 토스트 (패널 하단 플로팅) ─────────────────── */}
      {undoToast && (
        <Paper
          elevation={8}
          sx={{
            position: "absolute", left: 12, right: 12, bottom: 12, zIndex: 20,
            px: 1.5, py: 1, display: "flex", alignItems: "center", gap: 1,
            bgcolor: "grey.800", color: "common.white",
          }}
        >
          <Typography variant="caption" sx={{ flex: 1 }}>{undoToast.message}</Typography>
          <Button
            size="small"
            variant="text"
            onClick={() => {
              clearTimeout(undoTimerRef.current);
              setUndoToast(null);
              undoToast.onUndo?.();
            }}
            sx={{ color: "primary.light", fontSize: 12, minWidth: 0, px: 1 }}
          >
            되돌리기
          </Button>
        </Paper>
      )}
    </Box>
  );
}
