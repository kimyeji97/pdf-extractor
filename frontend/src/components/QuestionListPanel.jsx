/**
 * 문항 목록 패널 (REQ-16, REQ-P01)
 *
 * 선택된 PDF 파일의 모든 페이지에서 감지된 문항을 일괄 조회 API 1회로 가져와
 * 체크박스 목록으로 보여준다.
 *
 * 페이지 필터: 텍스트 입력으로 구간(3-10) 또는 개별(1,3,5) 지정.
 * 썸네일: 로딩 시간 단축을 위해 표시하지 않는다.
 *
 * REQ-D07 Phase 3-5에서 순수 CSS(`qlist-*`)를 MUI + 테마 토큰으로 전환했다.
 * 편집 화면에 마지막으로 남아 있던 하드코딩 색(22개)이 여기 있었고, 그게 남아 있는 한
 * 다크 모드(REQ-D08)에서 이 패널만 흰 배경으로 튄다. 전환과 함께 App.css의
 * `qlist-*` 블록 122줄을 제거했으므로 **클래스명으로 되돌리지 말 것** —
 * CLAUDE.md 계약 #4("qlist-*는 살아있는 코드")는 이 커밋으로 수명을 다했다.
 *
 * ━━━ 보존 계약 ━━━
 * - 스크롤 체인: container(flex 컬럼, minHeight:0) → body(flex:1, minHeight:0, overflowY:auto).
 *   한 군데만 빠져도 목록이 페이지 전체로 늘어나며 내부 스크롤이 죽는다(계약 #1).
 * - `QuestionItem`의 `React.memo` 비교자(계약 #7). 600+ 문항에서 체크 하나에 전체가
 *   리렌더되는 것을 막는다(REQ-P02-04). 비교 대상 prop을 늘리면 반드시 비교자도 같이 고칠 것.
 */
import { useEffect, useState, useMemo, memo } from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import { Icon } from "@iconify/react";

import { getAllQuestions } from "../api/client";
import { tintBg, tintFg } from "theme/tint";

// 체크박스 하나만 토글해도 전체 목록이 리렌더되는 것을 막기 위해 항목을
// 별도 컴포넌트로 분리하고 memo 처리한다 (REQ-P02-04). 대량 문항(600+)에서
// isSelected·question_id가 바뀌지 않은 항목은 리렌더를 건너뛴다.
const QuestionItem = memo(
  function QuestionItem({ q, pageNum, isSelected, onToggle }) {
    const displayTitle = q.title || (q.is_manual ? "(수동 문항)" : `문항 ${q.question_num}`);
    return (
      <Box
        component="label"
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          px: 0.75,
          py: 0.25,
          borderRadius: 1,
          cursor: "pointer",
          flexShrink: 0,
          transition: "background-color 0.1s",
          // `*.lighter`/`*.dark`는 두 모드가 공유한다 → tint 헬퍼로 모드별 대응 (REQ-D08)
          ...(isSelected ? tintFg("primary")(theme) : { color: "text.primary" }),
          bgcolor: isSelected ? tintBg("primary")(theme) : "transparent",
          "&:hover": { bgcolor: isSelected ? tintBg("primary")(theme) : "action.hover" },
        })}
      >
        <Checkbox
          size="small"
          checked={isSelected}
          onChange={() => onToggle?.({ ...q, _pageNum: pageNum })}
          sx={{ p: 0.25, flexShrink: 0 }}
        />
        <Typography
          variant="caption"
          noWrap
          title={displayTitle}
          sx={{ flex: 1, minWidth: 0, color: "inherit" }}
        >
          {displayTitle}
        </Typography>
        {q.is_manual && (
          <Chip
            label="수동"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: 10, height: 16, flexShrink: 0 }}
          />
        )}
      </Box>
    );
  },
  (prev, next) => prev.isSelected === next.isSelected && prev.q.question_id === next.q.question_id,
);

/**
 * 페이지 입력 파싱 (1-based → 0-based Set)
 * 지원 형식: "3-10" (구간), "1,3,5" (개별), "1-5,8,10-12" (혼합)
 */
function parsePageInput(input) {
  const pages = new Set();
  input.split(",").forEach((token) => {
    const trimmed = token.trim();
    if (!trimmed) return;
    const range = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = parseInt(range[1], 10);
      const end = parseInt(range[2], 10);
      for (let i = start; i <= end; i++) pages.add(i - 1);
    } else {
      const n = parseInt(trimmed, 10);
      if (!isNaN(n) && n > 0) pages.add(n - 1);
    }
  });
  return pages;
}

/** 선택할 파일이 없을 때의 안내 (jobId 미지정) */
function EmptyState({ children }) {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        p: 3,
        color: "text.disabled",
      }}
    >
      <Icon icon="material-symbols:checklist-rounded" style={{ fontSize: 40 }} />
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {children}
      </Typography>
    </Box>
  );
}

export default function QuestionListPanel({ jobId, selections = [], onToggle }) {
  const [groups, setGroups]       = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [pageInput, setPageInput] = useState("");
  const [filterPages, setFilterPages] = useState(new Set());

  useEffect(() => {
    if (!jobId) { setGroups([]); setTotalPages(0); return; }
    let cancelled = false;
    setLoading(true);
    setError("");
    setGroups([]);
    setPageInput("");
    setFilterPages(new Set());

    (async () => {
      try {
        const data = await getAllQuestions(jobId);
        if (!cancelled) {
          const pages = (data.pages || []).filter((g) => g.questions.length > 0);
          setGroups(pages.map((g) => ({ pageNum: g.page_num, questions: g.questions })));
          const maxPage = pages.reduce((max, g) => Math.max(max, g.page_num), 0);
          setTotalPages(maxPage + 1);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [jobId]);

  const selectedIds = useMemo(
    () => new Set(selections.map((s) => s.questionId)),
    [selections]
  );

  const filteredGroups = useMemo(() => {
    if (filterPages.size === 0) return groups;
    return groups.filter((g) => filterPages.has(g.pageNum));
  }, [groups, filterPages]);

  const handlePageInputKeyDown = (e) => {
    if (e.key !== "Enter") return;
    const trimmed = pageInput.trim();
    if (!trimmed) {
      setFilterPages(new Set());
      return;
    }
    const parsed = parsePageInput(trimmed);
    // 존재하는 페이지만 필터
    const valid = new Set();
    parsed.forEach((p) => {
      if (groups.some((g) => g.pageNum === p)) valid.add(p);
    });
    setFilterPages(valid);
  };

  const handleClearFilter = () => {
    setPageInput("");
    setFilterPages(new Set());
  };

  if (!jobId) {
    return (
      <EmptyState>
        왼쪽 파일 목록에서<br />PDF를 선택하세요
      </EmptyState>
    );
  }

  return (
    /* 스크롤 체인의 시작점 — flex 컬럼 + minHeight:0 (계약 #1) */
    <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* 페이지 필터 — 텍스트 입력 */}
      <Box sx={{ px: 1, py: 0.75, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
        <TextField
          size="small"
          fullWidth
          placeholder={totalPages > 0 ? `페이지 (1-${totalPages}) — 예: 1-5,8,10` : "페이지 — 예: 1-5,8,10"}
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          onKeyDown={handlePageInputKeyDown}
          InputProps={{
            endAdornment: filterPages.size > 0 && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearFilter} title="필터 초기화" sx={{ p: 0.25 }}>
                  <Icon icon="material-symbols:close-rounded" style={{ fontSize: 15 }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 1, py: 0.75 }}>
        {loading && (
          <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={20} />
          </Box>
        )}

        {error && <Alert severity="error" sx={{ py: 0, fontSize: 11 }}>{error}</Alert>}

        {!loading && !error && filteredGroups.length === 0 && (
          <Typography variant="caption" color="text.disabled" align="center" sx={{ display: "block", py: 3 }}>
            {filterPages.size > 0 ? "해당 페이지에 문항이 없습니다." : "감지된 문항이 없습니다."}
          </Typography>
        )}

        {filteredGroups.map((group) => (
          <Box key={group.pageNum} sx={{ mb: 1, flexShrink: 0 }}>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ display: "block", pt: 0.5, pb: 0.25, mb: 0.5, borderBottom: 1, borderColor: "divider" }}
            >
              {group.pageNum + 1}페이지
            </Typography>

            {group.questions.map((q) => (
              <QuestionItem
                key={q.question_id}
                q={q}
                pageNum={group.pageNum}
                isSelected={selectedIds.has(q.question_id)}
                onToggle={onToggle}
              />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
