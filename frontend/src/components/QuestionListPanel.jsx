/**
 * 문항 목록 패널 (REQ-16, REQ-P01)
 *
 * 선택된 PDF 파일의 모든 페이지에서 감지된 문항을 일괄 조회 API 1회로 가져와
 * 체크박스 목록으로 보여준다.
 *
 * 페이지 필터: 텍스트 입력으로 구간(3-10) 또는 개별(1,3,5) 지정.
 * 썸네일: 로딩 시간 단축을 위해 표시하지 않는다.
 */
import { useEffect, useState, useMemo } from "react";
import { getAllQuestions } from "../api/client";

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
      <div className="qlist-loading">
        왼쪽 파일 목록에서<br />PDF를 선택하세요
      </div>
    );
  }

  return (
    <div className="qlist-container">
      {/* 페이지 필터 — 텍스트 입력 */}
      <div className="qlist-filter-wrap">
        <div className="qlist-filter-input-row">
          <input
            className="qlist-page-input"
            type="text"
            placeholder={totalPages > 0 ? `페이지 입력 (1-${totalPages}) — 예: 1-5,8,10` : "페이지 입력 — 예: 1-5,8,10"}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={handlePageInputKeyDown}
          />
          {filterPages.size > 0 && (
            <button
              className="qlist-clear-filter"
              onClick={handleClearFilter}
              title="필터 초기화"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="qlist-body">
        {loading && <div className="qlist-loading">문항 목록 로딩 중...</div>}
        {error   && <div className="qlist-loading" style={{ color: "#dc2626" }}>{error}</div>}

        {!loading && !error && filteredGroups.length === 0 && (
          <div className="qlist-empty">감지된 문항이 없습니다.</div>
        )}

        {filteredGroups.map((group) => (
          <div key={group.pageNum} className="qlist-page-group">
            <div className="qlist-page-label">{group.pageNum + 1}페이지</div>

            {group.questions.map((q) => {
              const displayTitle = q.title || (q.is_manual ? "(수동 문항)" : `문항 ${q.question_num}`);
              const isSelected   = selectedIds.has(q.question_id);

              return (
                <label
                  key={q.question_id}
                  className={`qlist-item${isSelected ? " qlist-item--checked" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle?.({ ...q, _pageNum: group.pageNum })}
                  />
                  <span className="qlist-item-label">{displayTitle}</span>
                  {q.is_manual && <span className="qlist-badge-manual">수동</span>}
                </label>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
