/**
 * 문항 목록 패널 (REQ-16)
 *
 * 선택된 PDF 파일의 모든 페이지에서 감지된 문항을 한 번에 조회하여
 * 체크박스 목록으로 보여준다.
 *
 * 동작 방식:
 *   1. GET /api/jobs/{jobId}/pages — 전체 페이지 목록 조회
 *   2. 각 페이지별 GET /api/jobs/{jobId}/pages/{n}/questions — 병렬 조회
 *   3. 페이지 그룹별로 렌더링, 각 문항에 체크박스 제공
 *
 * Props:
 *   jobId         — 대상 job
 *   selections    — 현재 workbook에 추가된 아이템 배열 (question_id 로 매핑)
 *   onToggle(q)   — 체크박스 클릭 시 호출 (추가/제거 결정은 부모가 담당)
 */
import { useEffect, useState } from "react";
import { getPages, getPageQuestions } from "../api/client";

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/api$/, "");

export default function QuestionListPanel({ jobId, selections = [], onToggle }) {
  // grouped: [{ pageNum, questions: [...] }, ...]
  const [groups, setGroups]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  // 페이지 필터: null = 전체
  const [filterPage, setFilterPage] = useState(null);

  useEffect(() => {
    if (!jobId) { setGroups([]); return; }
    let cancelled = false;
    setLoading(true);
    setError("");
    setGroups([]);
    setFilterPage(null);

    (async () => {
      try {
        const pagesData = await getPages(jobId);
        const pages = pagesData.pages || [];

        // 모든 페이지 문항 병렬 조회
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
          // 문항이 하나라도 있는 페이지만 표시
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

  // selections에서 question_id Set 생성 (빠른 조회용)
  const selectedIds = new Set(selections.map((s) => s.questionId));

  const filteredGroups = filterPage === null
    ? groups
    : groups.filter((g) => g.pageNum === filterPage);

  if (!jobId) {
    return (
      <div className="qlist-loading">
        왼쪽 파일 목록에서<br />PDF를 선택하세요
      </div>
    );
  }

  return (
    <div className="qlist-container">
      {/* 페이지 필터 */}
      <div className="qlist-filter">
        <select
          value={filterPage ?? ""}
          onChange={(e) => setFilterPage(e.target.value === "" ? null : Number(e.target.value))}
        >
          <option value="">전체 페이지</option>
          {groups.map((g) => (
            <option key={g.pageNum} value={g.pageNum}>
              {g.pageNum + 1}페이지 ({g.questions.length}개)
            </option>
          ))}
        </select>
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
                  <img
                    src={`${API_ROOT}${q.thumbnail_url}`}
                    alt={displayTitle}
                    className="qlist-item-thumb"
                    loading="lazy"
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
