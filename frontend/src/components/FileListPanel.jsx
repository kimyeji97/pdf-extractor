import { useEffect, useState, useCallback } from "react";
import { listJobs } from "../api/client";

// job.status (추출 작업 상태)
const STATUS_LABEL = {
  PENDING:    "준비됨",    // SOURCE PDF는 항상 PENDING (혼동 방지로 "준비됨"으로 변경)
  PROCESSING: "처리 중",
  DONE:       "완료",
  FAILED:     "실패",
};

// EXPORT job은 PENDING = 실제로 대기 중
const EXPORT_STATUS_LABEL = {
  PENDING:    "대기",
  PROCESSING: "처리 중",
  DONE:       "완료",
  FAILED:     "실패",
};

const STATUS_COLOR = {
  PENDING:    "#b0b8c8",
  PROCESSING: "#e6a817",
  DONE:       "#2e8b57",
  FAILED:     "#c0392b",
};

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
  if (!boundariesStatus) return null;
  const map = {
    PENDING:    { text: "문항 감지 대기",           bg: "#b0b8c8" },
    PROCESSING: { text: "감지 중...",               bg: "#e6a817" },
    DONE:       { text: `${totalQuestionCount ?? 0}문항`, bg: "#4a90e2" },
    FAILED:     { text: "감지 실패",                bg: "#c0392b" },
  };
  const entry = map[boundariesStatus];
  if (!entry) return null;
  return (
    <span style={{ ...styles.badge, background: entry.bg, marginLeft: 4 }}>
      {entry.text}
    </span>
  );
}

function JobCard({ job, isSelected, onSelect, isExport }) {
  const statusLabel = isExport
    ? (EXPORT_STATUS_LABEL[job.status] || job.status)
    : (job.status === "PENDING" ? null : (STATUS_LABEL[job.status] || job.status));
    // SOURCE + PENDING 뱃지는 숨김 (의미 없는 "준비됨" 뱃지 제거)

  return (
    <li
      style={{
        ...styles.card,
        ...(isSelected ? styles.cardSelected : {}),
      }}
      onClick={() => onSelect(job.job_id, job.filename, job.workbook_name)}
    >
      <div style={styles.cardMain}>
        <span style={styles.filename} title={job.filename || "unknown.pdf"}>
          {job.filename || "unknown.pdf"}
        </span>
        <div style={{ display: "flex", alignItems: "center", flexShrink: 0, gap: 3 }}>
          {statusLabel && (
            <span style={{ ...styles.badge, background: STATUS_COLOR[job.status] || "#888" }}>
              {statusLabel}
            </span>
          )}
          {!isExport && (
            <BoundariesBadge
              boundariesStatus={job.boundaries_status}
              totalQuestionCount={job.total_question_count}
            />
          )}
        </div>
      </div>
      {job.uploaded_at && (
        <div style={styles.cardSub}>
          <span style={styles.time}>{relativeTime(job.uploaded_at)}</span>
        </div>
      )}
    </li>
  );
}

/**
 * @param {{
 *   selectedJobId: string | null,
 *   onSelect: (jobId: string, filename: string) => void,
 *   refreshTrigger: number
 * }} props
 */
export default function FileListPanel({ selectedJobId, onSelect, refreshTrigger = 0 }) {
  const [sourceJobs, setSourceJobs] = useState([]);
  const [exportJobs, setExportJobs]  = useState([]);
  const [loading, setLoading]        = useState(false);
  const [error, setError]            = useState("");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listJobs();
      setSourceJobs(data.source_jobs ?? []);
      setExportJobs(data.export_jobs  ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 최초 마운트 + refreshTrigger 변경 시 목록 재조회
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, refreshTrigger]);

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <span style={styles.sectionLabel}>📂 업로드된 파일</span>
        <button style={styles.refreshBtn} onClick={fetchJobs} disabled={loading}>
          {loading ? "..." : "↺"}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {/* 원본 PDF 목록 */}
      {!loading && sourceJobs.length === 0 ? (
        <p style={styles.empty}>업로드된 파일 없음</p>
      ) : (
        <ul style={styles.list}>
          {sourceJobs.map((job) => (
            <JobCard
              key={job.job_id}
              job={job}
              isSelected={selectedJobId === job.job_id}
              onSelect={onSelect}
              isExport={false}
            />
          ))}
        </ul>
      )}

      {/* 생성된 결과 파일 */}
      {exportJobs.length > 0 && (
        <>
          <div style={{ ...styles.sectionLabel, marginTop: 16, marginBottom: 8 }}>
            📄 생성된 파일
          </div>
          <ul style={styles.list}>
            {exportJobs.map((job) => (
              <JobCard
                key={job.job_id}
                job={job}
                isSelected={selectedJobId === job.job_id}
                onSelect={onSelect}
                isExport={true}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#555",
    display: "block",
    paddingBottom: 6,
    borderBottom: "1px solid #eee",
    marginBottom: 8,
    width: "100%",
  },
  refreshBtn: {
    fontSize: 13,
    padding: "2px 8px",
    cursor: "pointer",
    borderRadius: 4,
    border: "1px solid #ddd",
    background: "#fff",
    color: "#555",
    flexShrink: 0,
    marginLeft: 6,
    marginBottom: 6,
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  card: {
    border: "1px solid #e8e8e8",
    borderRadius: 6,
    padding: "7px 9px",
    cursor: "pointer",
    background: "#fff",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  cardSelected: {
    borderColor: "#4a90e2",
    background: "#f0f6ff",
    boxShadow: "0 0 0 2px rgba(74,144,226,0.18)",
  },
  cardMain: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
  },
  filename: {
    fontSize: 12,
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  },
  badge: {
    fontSize: 10,
    color: "#fff",
    borderRadius: 3,
    padding: "2px 5px",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  cardSub: {
    marginTop: 3,
  },
  time: {
    fontSize: 10,
    color: "#aaa",
  },
  empty: {
    color: "#ccc",
    fontSize: 13,
    textAlign: "center",
    padding: "16px 0",
  },
  error: {
    color: "#c0392b",
    fontSize: 12,
  },
};
