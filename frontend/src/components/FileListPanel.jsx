import { useEffect, useState, useCallback } from "react";
import { listJobs } from "../api/client";

const STATUS_LABEL = {
  PENDING: "대기",
  PROCESSING: "처리 중",
  DONE: "완료",
  FAILED: "실패",
};

const STATUS_COLOR = {
  PENDING: "#888",
  PROCESSING: "#e6a817",
  DONE: "#2e8b57",
  FAILED: "#c0392b",
};

function relativeTime(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  return `${Math.floor(hour / 24)}일 전`;
}

/**
 * @param {{ onSelect: (jobId: string) => void }} props
 */
export default function FileListPanel({ onSelect }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listJobs();
      setJobs(data.jobs);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSelect = (jobId) => {
    setSelectedId(jobId);
    onSelect(jobId);
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>업로드된 파일</span>
        <button style={styles.refreshBtn} onClick={fetchJobs} disabled={loading}>
          {loading ? "로딩 중..." : "새로고침"}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {!loading && jobs.length === 0 && (
        <p style={styles.empty}>업로드된 파일 없음</p>
      )}

      <ul style={styles.list}>
        {jobs.map((job) => (
          <li
            key={job.job_id}
            style={{
              ...styles.card,
              ...(selectedId === job.job_id ? styles.cardSelected : {}),
            }}
            onClick={() => handleSelect(job.job_id)}
          >
            <div style={styles.cardMain}>
              <span style={styles.filename}>{job.filename || "unknown.pdf"}</span>
              <span
                style={{
                  ...styles.badge,
                  background: STATUS_COLOR[job.status] || "#888",
                }}
              >
                {STATUS_LABEL[job.status] || job.status}
              </span>
            </div>
            <div style={styles.cardSub}>
              {job.uploaded_at && (
                <span style={styles.time}>{relativeTime(job.uploaded_at)}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  panel: {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "16px",
    maxWidth: 480,
    background: "#fafafa",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontWeight: 600,
    fontSize: 16,
  },
  refreshBtn: {
    fontSize: 13,
    padding: "4px 10px",
    cursor: "pointer",
    borderRadius: 4,
    border: "1px solid #ccc",
    background: "#fff",
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  card: {
    border: "1px solid #e0e0e0",
    borderRadius: 6,
    padding: "10px 14px",
    cursor: "pointer",
    background: "#fff",
    transition: "border-color 0.15s",
  },
  cardSelected: {
    borderColor: "#4a90e2",
    boxShadow: "0 0 0 2px rgba(74,144,226,0.25)",
  },
  cardMain: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filename: {
    fontSize: 14,
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 280,
  },
  badge: {
    fontSize: 11,
    color: "#fff",
    borderRadius: 4,
    padding: "2px 7px",
    flexShrink: 0,
  },
  cardSub: {
    marginTop: 4,
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
  empty: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    padding: "20px 0",
  },
  error: {
    color: "#c0392b",
    fontSize: 13,
  },
};
