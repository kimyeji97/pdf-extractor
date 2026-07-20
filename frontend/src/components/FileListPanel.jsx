import { useEffect, useState, useCallback, useMemo } from "react";
import { listJobs, updateJobMeta } from "../api/client";

const STATUS_LABEL = {
  PENDING:    null,
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
    PENDING:    { text: "문항 감지 대기", bg: "#b0b8c8" },
    PROCESSING: { text: "감지 중...",     bg: "#e6a817" },
    DONE:       { text: `${totalQuestionCount ?? 0}문항`, bg: "#4a90e2" },
    FAILED:     { text: "감지 실패",      bg: "#c0392b" },
  };
  const entry = map[boundariesStatus];
  if (!entry) return null;
  return (
    <span style={{ ...styles.badge, background: entry.bg, marginLeft: 4 }}>
      {entry.text}
    </span>
  );
}

function JobCard({ job, isSelected, onSelect, onMetaUpdated }) {
  const statusLabel = job.status === "PENDING" ? null : (STATUS_LABEL[job.status] || job.status);

  const [editing, setEditing]           = useState(false);
  const [editName, setEditName]         = useState(job.workbook_name || "");
  const [editTypes, setEditTypes]       = useState((job.workbook_types || []).join(", "));
  const [saving, setSaving]             = useState(false);

  const handleEditClick = (e) => {
    e.stopPropagation();
    setEditName(job.workbook_name || "");
    setEditTypes((job.workbook_types || []).join(", "));
    setEditing(true);
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    setSaving(true);
    try {
      const types = editTypes.split(",").map((s) => s.trim()).filter(Boolean);
      await updateJobMeta(job.job_id, {
        workbook_name: editName.trim() || null,
        workbook_types: types.length > 0 ? types : null,
      });
      setEditing(false);
      onMetaUpdated();
    } catch {
      // 저장 실패 시 그대로 유지
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setEditing(false);
  };

  return (
    <li
      style={{
        ...styles.card,
        ...(isSelected ? styles.cardSelected : {}),
      }}
      onClick={() => !editing && onSelect(job.job_id, job.filename, job.workbook_name)}
    >
      {/* 상단: 문제집 이름 (메인) */}
      <div style={styles.cardMain}>
        <span style={styles.workbookName} title={job.workbook_name || job.filename || "unknown.pdf"}>
          {job.workbook_name || job.filename || "unknown.pdf"}
        </span>
        <div style={{ display: "flex", alignItems: "center", flexShrink: 0, gap: 3 }}>
          {statusLabel && (
            <span style={{ ...styles.badge, background: STATUS_COLOR[job.status] || "#888" }}>
              {statusLabel}
            </span>
          )}
          <BoundariesBadge
            boundariesStatus={job.boundaries_status}
            totalQuestionCount={job.total_question_count}
          />
          <button style={styles.editBtn} onClick={handleEditClick} title="이름/유형 편집">
            ✎
          </button>
        </div>
      </div>

      {/* 파일명 + 유형 표시 */}
      {!editing && (
        <div style={styles.metaRow}>
          <span style={styles.metaText} title={job.filename}>{job.filename || "unknown.pdf"}</span>
          {job.workbook_types?.length > 0 && (
            <span style={styles.metaType}> · {job.workbook_types.join(", ")}</span>
          )}
        </div>
      )}

      {/* 업로드 시간 */}
      {!editing && job.uploaded_at && (
        <div style={styles.cardSub}>
          <span style={styles.time}>{relativeTime(job.uploaded_at)}</span>
        </div>
      )}

      {/* 인라인 편집 폼 */}
      {editing && (
        <div style={styles.editForm} onClick={(e) => e.stopPropagation()}>
          <input
            style={styles.editInput}
            placeholder="문제집 이름"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
          />
          <input
            style={styles.editInput}
            placeholder="문제집 유형 (쉼표로 구분)"
            value={editTypes}
            onChange={(e) => setEditTypes(e.target.value)}
          />
          <div style={styles.editActions}>
            <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </button>
            <button style={styles.cancelBtn} onClick={handleCancel} disabled={saving}>
              취소
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

/**
 * @param {{
 *   selectedJobId: string | null,
 *   onSelect: (jobId: string, filename: string, workbookName?: string) => void,
 *   refreshTrigger: number
 * }} props
 */
export default function FileListPanel({ selectedJobId, onSelect, refreshTrigger = 0 }) {
  const [sourceJobs, setSourceJobs] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchType, setSearchType] = useState("");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listJobs();
      setSourceJobs(data.source_jobs ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, refreshTrigger]);

  const filteredJobs = useMemo(() => {
    const nameLower = searchName.trim().toLowerCase();
    const typeLower = searchType.trim().toLowerCase();
    return sourceJobs.filter((job) => {
      if (nameLower) {
        const name = (job.workbook_name || job.filename || "").toLowerCase();
        if (!name.includes(nameLower)) return false;
      }
      if (typeLower) {
        const types = (job.workbook_types || []).join(" ").toLowerCase();
        if (!types.includes(typeLower)) return false;
      }
      return true;
    });
  }, [sourceJobs, searchName, searchType]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.sectionLabel}>📂 업로드된 파일</span>
        <button style={styles.refreshBtn} onClick={fetchJobs} disabled={loading}>
          {loading ? "..." : "↺"}
        </button>
      </div>

      {/* 검색 필터 */}
      <div style={styles.searchBox}>
        <input
          style={styles.searchInput}
          type="text"
          placeholder="문제집 이름 검색"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <input
          style={styles.searchInput}
          type="text"
          placeholder="유형 검색"
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
        />
      </div>

      <div style={styles.scrollArea}>
        {error && <p style={styles.error}>{error}</p>}

        {!loading && filteredJobs.length === 0 ? (
          <p style={styles.empty}>{sourceJobs.length === 0 ? "업로드된 파일 없음" : "검색 결과 없음"}</p>
        ) : (
          <ul style={styles.list}>
            {filteredJobs.map((job) => (
              <JobCard
                key={job.job_id}
                job={job}
                isSelected={selectedJobId === job.job_id}
                onSelect={onSelect}
                onMetaUpdated={fetchJobs}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    flexShrink: 0,
  },
  scrollArea: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
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
  workbookName: {
    fontSize: 12,
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
    color: "#222",
  },
  badge: {
    fontSize: 10,
    color: "#fff",
    borderRadius: 3,
    padding: "2px 5px",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  editBtn: {
    fontSize: 11,
    padding: "1px 5px",
    cursor: "pointer",
    borderRadius: 3,
    border: "1px solid #ddd",
    background: "#f5f5f5",
    color: "#666",
    flexShrink: 0,
    lineHeight: 1.4,
  },
  metaRow: {
    marginTop: 2,
    fontSize: 10,
    color: "#999",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  metaText: {
    fontSize: 10,
    color: "#999",
  },
  metaType: {
    fontSize: 10,
    color: "#aaa",
  },
  searchBox: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginBottom: 8,
    flexShrink: 0,
  },
  searchInput: {
    fontSize: 11,
    padding: "4px 7px",
    border: "1px solid #ddd",
    borderRadius: 4,
    width: "100%",
    boxSizing: "border-box",
    background: "#fafafa",
  },
  cardSub: {
    marginTop: 3,
  },
  time: {
    fontSize: 10,
    color: "#aaa",
  },
  editForm: {
    marginTop: 6,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  editInput: {
    fontSize: 11,
    padding: "4px 6px",
    border: "1px solid #ccc",
    borderRadius: 4,
    width: "100%",
    boxSizing: "border-box",
  },
  editActions: {
    display: "flex",
    gap: 4,
    justifyContent: "flex-end",
  },
  saveBtn: {
    fontSize: 11,
    padding: "3px 10px",
    cursor: "pointer",
    borderRadius: 4,
    border: "none",
    background: "#4a90e2",
    color: "#fff",
  },
  cancelBtn: {
    fontSize: 11,
    padding: "3px 10px",
    cursor: "pointer",
    borderRadius: 4,
    border: "1px solid #ddd",
    background: "#fff",
    color: "#555",
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
