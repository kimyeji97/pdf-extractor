/**
 * 파일+페이지 통합 선택 패널 (REQ-D03, REQ-D04)
 *
 * 하나의 패널 안에서 두 가지 모드를 전환한다:
 *
 *   [파일 선택 모드] (초기)
 *     - 업로드된 PDF 파일 목록
 *     - [🔄 재감지] 버튼 (파일 선택 시 활성화)
 *     - 파일 클릭 → 페이지 선택 모드로 전환
 *
 *   [페이지 선택 모드] (파일 선택 후)
 *     - ← 뒤로가기  파일명 표시
 *     - 페이지 목록 (썸네일 없이 감지된 문항 수만 표시)
 *     - [🔄 재감지] 버튼 (파일 단위)
 *     - 페이지 클릭 → 부모에게 (jobId, pageNum, pageInfo) 전달
 *
 * Props:
 *   onPageSelect(jobId, pageNum, pageInfo)  — 페이지 선택 콜백
 *   onJobChange(jobId, filename)            — 파일 변경 콜백 (페이지/문항 초기화용)
 *   refreshTrigger                          — 파일 목록 새로고침 신호
 *   selectedPageNum                         — 현재 선택된 페이지 (하이라이트)
 */
import { useState, useEffect, useCallback } from "react";
import { listJobs, getPages, refreshJobQuestions, getJobInfo } from "../api/client";

export default function FilePagePanel({
  onPageSelect,
  onJobChange,
  refreshTrigger = 0,
  selectedPageNum = null,
}) {
  // ── 모드 ──────────────────────────────────────────────
  const [mode, setMode]           = useState("file");   // "file" | "page"
  const [jobId, setJobId]         = useState(null);
  const [jobFilename, setJobFilename] = useState("");

  // ── 파일 목록 ─────────────────────────────────────────
  const [jobs, setJobs]         = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError]     = useState("");

  // ── 페이지 목록 ───────────────────────────────────────
  const [pages, setPages]           = useState([]);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [pagesError, setPagesError]     = useState("");

  // ── 재감지 ────────────────────────────────────────────
  const [refreshing, setRefreshing]   = useState(false);
  const [refreshError, setRefreshError] = useState("");

  // ── 파일 목록 로드 ────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    setJobsError("");
    try {
      const data = await listJobs();
      setJobs(data.source_jobs || []);
    } catch (e) {
      setJobsError(e.message);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs, refreshTrigger]);

  // ── 페이지 목록 로드 ──────────────────────────────────
  const fetchPages = useCallback(async (jid) => {
    if (!jid) return;
    setPagesLoading(true);
    setPagesError("");
    try {
      const data = await getPages(jid);
      setPages(data.pages || []);
    } catch (e) {
      setPagesError(e.message);
    } finally {
      setPagesLoading(false);
    }
  }, []);

  // ── 파일 선택 ─────────────────────────────────────────
  const handleJobClick = (job) => {
    setJobId(job.job_id);
    setJobFilename(job.filename || job.job_id);
    setPages([]);
    setRefreshError("");
    setMode("page");
    onJobChange?.(job.job_id, job.filename);
    fetchPages(job.job_id);
  };

  // ── 뒤로가기 ─────────────────────────────────────────
  const handleBack = () => {
    setMode("file");
    setJobId(null);
    setJobFilename("");
    setPages([]);
    onJobChange?.(null, null);
    onPageSelect?.(null, null, null);
  };

  // ── 재감지 ────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    if (!jobId || refreshing) return;
    setRefreshing(true);
    setRefreshError("");
    try {
      await refreshJobQuestions(jobId);
      // 완료 폴링
      const poll = setInterval(async () => {
        try {
          const info = await getJobInfo(jobId);
          const st = info.boundaries_status;
          if (st === "DONE" || st === "FAILED") {
            clearInterval(poll);
            setRefreshing(false);
            if (st === "FAILED") setRefreshError("재감지에 실패했습니다.");
            else fetchPages(jobId);  // 페이지별 문항 수 갱신
          }
        } catch { /* 폴링 오류 무시 */ }
      }, 2000);
    } catch (e) {
      setRefreshError(e.message || "재감지 요청 실패");
      setRefreshing(false);
    }
  }, [jobId, refreshing, fetchPages]);

  // ── 페이지 선택 ───────────────────────────────────────
  const handlePageClick = (page) => {
    onPageSelect?.(jobId, page.page_num, page);
  };

  // ── 렌더: 파일 선택 모드 ─────────────────────────────
  if (mode === "file") {
    return (
      <div className="fpp-container">
        {jobsError && <p className="fpp-error">{jobsError}</p>}
        {jobsLoading && <p className="fpp-hint">로딩 중...</p>}

        <div className="fpp-file-list">
          {jobs.length === 0 && !jobsLoading && (
            <p className="fpp-hint">업로드된 파일이 없습니다.</p>
          )}
          {jobs.map((job) => (
            <div
              key={job.job_id}
              className="fpp-file-item"
              onClick={() => handleJobClick(job)}
            >
              <span className="fpp-file-icon">📄</span>
              <div className="fpp-file-info">
                <span className="fpp-file-name">{job.filename || job.job_id}</span>
                {job.total_question_count != null && (
                  <span className="fpp-file-count">{job.total_question_count}문항 감지됨</span>
                )}
              </div>
              <span className="fpp-file-arrow">›</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── 렌더: 페이지 선택 모드 ────────────────────────────
  return (
    <div className="fpp-container">
      {/* 헤더: 뒤로가기 + 파일명 + 재감지 */}
      <div className="fpp-page-header">
        <button className="fpp-back-btn" onClick={handleBack} title="파일 선택으로 돌아가기">
          ← 뒤로
        </button>
        <span className="fpp-page-filename" title={jobFilename}>{jobFilename}</span>
        <button
          className={`fpp-refresh-btn${refreshing ? " fpp-refresh-btn--active" : ""}`}
          onClick={handleRefresh}
          disabled={refreshing}
          title="파일 전체 재감지"
        >
          {refreshing ? "⏳" : "🔄"}
        </button>
      </div>

      {refreshError && <p className="fpp-error">{refreshError}</p>}
      {refreshing   && <p className="fpp-hint">재감지 중... 잠시 기다려 주세요.</p>}

      {pagesError && <p className="fpp-error">{pagesError}</p>}
      {pagesLoading && <p className="fpp-hint">페이지 목록 로딩 중...</p>}

      {/* 페이지 목록 — 썸네일 없이 문항 수만 표시 */}
      <div className="fpp-page-list">
        {pages.map((page) => {
          const isSelected = selectedPageNum === page.page_num;
          return (
            <div
              key={page.page_num}
              className={`fpp-page-item${isSelected ? " fpp-page-item--selected" : ""}`}
              onClick={() => handlePageClick(page)}
            >
              <span className="fpp-page-num">{page.page_num + 1}페이지</span>
              <span className="fpp-page-qcount">
                {page.question_count == null ? "—" : `${page.question_count}문항`}
              </span>
              {isSelected && <span className="fpp-page-check">✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
