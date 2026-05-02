/**
 * 문항 목록 패널 (REQ-16)
 *
 * 선택된 PDF 파일의 모든 페이지에서 감지된 문항을 한 번에 조회하여
 * 체크박스 목록으로 보여준다.
 *
 * 페이지 필터: 체크박스로 여러 페이지 동시 선택 가능.
 *             직접 페이지 번호를 입력하여 필터할 수도 있다.
 * 썸네일: 로딩 시간 단축을 위해 표시하지 않는다.
 */
import { useEffect, useState, useMemo } from "react";
import { getPages, getPageQuestions } from "../api/client";

export default function QuestionListPanel({ jobId, selections = [], onToggle }) {
  // grouped: [{ pageNum, questions: [...] }, ...]
  const [groups, setGroups]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  // 선택된 페이지 번호 Set (비어있으면 전체 표시)
  const [selectedPages, setSelectedPages] = useState(new Set());
  // 페이지 번호 직접 입력 필드
  const [pageInput, setPageInput]     = useState("");

  useEffect(() => {
    if (!jobId) { setGroups([]); return; }
    let cancelled = false;
    setLoading(true);
    setError("");
    setGroups([]);
    setSelectedPages(new Set());
    setPageInput("");

    (async () => {
      try {
        const pagesData = await getPages(jobId);
        const pages = pagesData.pages || [];

        const results = await Promise.all(
          pages.map(async (pg) => {
            try {
              const d = await getPageQuestions(jobId, pg.page_num);
              return { pageNum: pg.page_num, questions: d.questions || [] };
            } catch {
              return { pageNum: pg.page_num, questions: [] };
            }
          })
        );

        if (!cancelled) {
          setGroups(results.filter((g) => g.questions.length > 0));
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
    if (selectedPages.size === 0) return groups;
    return groups.filter((g) => selectedPages.has(g.pageNum));
  }, [groups, selectedPages]);

  const togglePageFilter = (pageNum) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) next.delete(pageNum);
      else next.add(pageNum);
      return next;
    });
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key !== "Enter") return;
    const nums = pageInput.split(/[\s,]+/).map(Number).filter((n) => !isNaN(n) && n > 0);
    if (nums.length === 0) return;
    setSelectedPages((prev) => {
      const next = new Set(prev);
      nums.forEach((n) => {
        const pageNum = n - 1; // 1-based → 0-based
        const exists = groups.some((g) => g.pageNum === pageNum);
        if (exists) next.add(pageNum);
      });
      return next;
    });
    setPageInput("");
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
      {/* 페이지 필터 — 체크박스 방식 */}
      <div className="qlist-filter-wrap">
        <div className="qlist-filter-chips">
          {groups.map((g) => {
            const active = selectedPages.has(g.pageNum);
            return (
              <button
                key={g.pageNum}
                className={`qlist-page-chip${active ? " qlist-page-chip--active" : ""}`}
                onClick={() => togglePageFilter(g.pageNum)}
                title={`${g.pageNum + 1}페이지 (${g.questions.length}개)`}
              >
                {g.pageNum + 1}p
              </button>
            );
          })}
        </div>
        <div className="qlist-filter-input-row">
          <input
            className="qlist-page-input"
            type="text"
            placeholder="페이지 번호 입력 후 Enter (예: 3, 5, 7)"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={handlePageInputKeyDown}
          />
          {selectedPages.size > 0 && (
            <button
              className="qlist-clear-filter"
              onClick={() => setSelectedPages(new Set())}
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
