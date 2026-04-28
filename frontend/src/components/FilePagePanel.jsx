/**
 * 파일+페이지 통합 선택 패널 (REQ-D03, REQ-D04)
 *
 * 파일 선택 모드: FileListPanel과 동일한 디자인 (감지상태 배지, 문항 수, 업로드 시간)
 * 페이지 선택 모드: 페이지 목록 + 재감지 버튼
 */
import { useState, useEffect, useCallback } from "react";
import { listJobs, getPages, refreshJobQuestions, getJobInfo } from "../api/client";

function relativeTime(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const sec  = Math.floor(diff / 1000);
  if (sec < 60)  return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60)  return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  return `${Math.floor(hour / 24)}일 전`;
}

function BoundariesBadge({ boundariesStatus, totalQuestionCount }) {
  const map = {
    PENDING:    { text: "감지 대기",       color: "#b0b8c8" },
    PROCESSING: { text: "감지 중...",      color: "#e6a817" },
    DONE:       { text: `${totalQuestionCount ?? 0}문항`, color: "#4a90e2" },
    FAILED:     { text: "감지 실패",       color: "#c0392b" },
  };
  const entry = map[boundariesStatus];
  if (!entry) return null;
  return (
    <span className="fpp-badge" style={{ background: entry.color }}>
      {entry.text}
    </span>
  );
}

export default function FilePagePanel({
  onPageSelect,
  onJobChange,
  refreshTrigger = 0,
  selectedPageNum = null,
}) {
  const [mode, setMode]           = useState("file");
  const [jobId, setJobId]         = useState(null);
  const [jobFilename, setJobFilename] = useState("");

  const [jobs, setJobs]               = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError]     = useState("");

  const [pages, setPages]               = useState([]);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [pagesError, setPagesError]     = useState("");

  const [refreshing, setRefreshing]     = useState(false);
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

  const handleJobClick = (job) => {
    setJobId(job.job_id);
    setJobFilename(job.filename || job.job_id);
    setPages([]);
    setRefreshError("");
    setMode("page");
    onJobChange?.(job.job_id, job.filename);
    fetchPages(job.job_id);
  };

  const handleBack = () => {
    setMode("file");
    setJobId(null);
    setJobFilename("");
    setPages([]);
    onJobChange?.(null, null);
    onPageSelect?.(null, null, null);
  };

  const handleRefresh = useCallback(async () => {
    if (!jobId || refreshing) return;
    setRefreshing(true);
    setRefreshError("");
    try {
      await refreshJobQuestions(jobId);
      const poll = setInterval(async () => {
        try {
          const info = await getJobInfo(jobId);
          const st = info.boundaries_status;
          if (st === "DONE" || st === "FAILED") {
            clearInterval(poll);
            setRefreshing(false);
            if (st === "FAILED") setRefreshError("재감지에 실패했습니다.");
            else fetchPages(jobId);
          }
        } catch { /* 폴링 오류 무시 */ }
      }, 2000);
    } catch (e) {
      setRefreshError(e.message || "재감지 요청 실패");
      setRefreshing(false);
    }
  }, [jobId, refreshing, fetchPages]);

  const handlePageClick = (page) => {
    onPageSelect?.(jobId, page.page_num, page);
  };

  // ── 파일 선택 모드 ────────────────────────────────────
  if (mode === "file") {
    return (
      <div className="fpp-container">
        {jobsError && <p className="fpp-error">{jobsError}</p>}

        <div className="fpp-file-list">
          {jobsLoading && (
            <div className="fpp-hint">로딩 중...</div>
          )}
          {!jobsLoading && jobs.length === 0 && (
            <div className="fpp-hint">업로드된 파일이 없습니다.</div>
          )}

          {jobs.map((job) => (
            <div
              key={job.job_id}
              className="fpp-file-item"
              onClick={() => handleJobClick(job)}
            >
              <span className="fpp-file-icon">📄</span>
              <div className="fpp-file-info">
                <span className="fpp-file-name" title={job.filename || job.job_id}>
                  {job.filename || job.job_id}
                </span>
                <div className="fpp-file-meta">
                  <BoundariesBadge
                    boundariesStatus={job.boundaries_status}
                    totalQuestionCount={job.total_question_count}
                  />
                  {job.uploaded_at && (
                    <span className="fpp-file-time">{relativeTime(job.uploaded_at)}</span>
                  )}
                </div>
              </div>
              <span className="fpp-file-arrow">›</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── 페이지 선택 모드 ──────────────────────────────────
  return (
    <div className="fpp-container">
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
      {pagesError   && <p className="fpp-error">{pagesError}</p>}
      {pagesLoading && <p className="fpp-hint">페이지 목록 로딩 중...</p>}

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
              <div className="fpp-page-right">
                {page.question_count != null && (
                  <span className="fpp-badge fpp-badge--page" style={{ background: "#4a90e2" }}>
                    {page.question_count}문항
                  </span>
                )}
                {isSelected && <span className="fpp-page-check">✓</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
