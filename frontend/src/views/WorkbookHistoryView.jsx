/**
 * 생성된 문제집 이력 뷰 (REQ-21~22)
 *
 * 기능:
 *   - GET /api/workbooks — 이력 목록 조회 + 새로고침
 *   - 재다운로드 (REQ-22): GET /api/status/{result_job_id} → download_url
 *   - 편집으로 불러오기 (REQ-20): onLoadForEdit(workbook_id) 콜백 호출
 *     → App.jsx가 문제집 생성 탭으로 전환 + initialWorkbookId 전달
 *
 * Props:
 *   onLoadForEdit(workbookId) — "편집으로 불러오기" 클릭 시 호출
 */
import { useState, useEffect, useCallback } from "react";
import { getWorkbooks, getStatus } from "../api/client";

// 날짜 포맷: ISO → 로컬 문자열
function fmtDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      year:   "numeric",
      month:  "2-digit",
      day:    "2-digit",
      hour:   "2-digit",
      minute: "2-digit",
    });
  } catch { return iso; }
}

export default function WorkbookHistoryView({ onLoadForEdit }) {
  const [workbooks, setWorkbooks]     = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  // 재다운로드 중인 workbook_id 추적
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchWorkbooks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getWorkbooks();
      // 최신순 정렬
      const sorted = [...(data || [])].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setWorkbooks(sorted);
    } catch (e) {
      setError(e.message || "목록 조회 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorkbooks(); }, [fetchWorkbooks]);

  // ── 재다운로드 (REQ-22) ─────────────────────────────
  const handleDownload = async (wb) => {
    if (!wb.result_job_id) return;
    setDownloadingId(wb.workbook_id);
    try {
      const data = await getStatus(wb.result_job_id);
      if (data.download_url) {
        const a = document.createElement("a");
        a.href = data.download_url;
        a.download = `workbook_${wb.workbook_id?.slice(0, 8) ?? "file"}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert("다운로드 URL을 가져올 수 없습니다. PDF가 아직 생성 중이거나 만료되었을 수 있습니다.");
      }
    } catch (e) {
      alert("다운로드 실패: " + e.message);
    } finally {
      setDownloadingId(null);
    }
  };

  // ── 편집으로 불러오기 (REQ-20) ──────────────────────
  const handleLoadForEdit = (wb) => {
    onLoadForEdit?.(wb.workbook_id);
  };

  return (
    <div className="wbh-container view-layout">
      <div className="wbh-header">
        <span className="wbh-title">생성된 문제집 이력</span>
        <button
          className="wbh-refresh-btn"
          onClick={fetchWorkbooks}
          disabled={loading}
        >
          {loading ? "로딩 중..." : "🔄 새로고침"}
        </button>
      </div>

      <div className="wbh-body">
        {loading && workbooks.length === 0 && (
          <div className="wbh-loading">목록을 불러오는 중...</div>
        )}
        {error && (
          <div className="wbh-error">{error}</div>
        )}
        {!loading && !error && workbooks.length === 0 && (
          <div className="wbh-empty">
            아직 생성된 문제집이 없습니다.<br />
            <span style={{ fontSize: 12, color: "#cbd5e1" }}>
              문제집 생성 탭에서 PDF를 생성하면 여기에 기록됩니다.
            </span>
          </div>
        )}

        <div className="wbh-list">
          {workbooks.map((wb, idx) => (
            <div key={wb.workbook_id ?? idx} className="wbh-item">
              <div className="wbh-item-info">
                <div className="wbh-item-name">
                  {wb.name || `문제집 #${idx + 1}`}
                </div>
                <div className="wbh-item-meta">
                  {fmtDate(wb.created_at)} · 레이아웃: {wb.layout || "-"} · {wb.question_count ?? "?"}문항
                </div>
              </div>

              <div className="wbh-item-actions">
                {/* 재다운로드 */}
                {wb.result_job_id ? (
                  <button
                    className="wbh-btn wbh-btn--primary"
                    onClick={() => handleDownload(wb)}
                    disabled={downloadingId === wb.workbook_id}
                    title="PDF 재다운로드"
                  >
                    {downloadingId === wb.workbook_id ? "⏳" : "⬇ 다운로드"}
                  </button>
                ) : (
                  <button className="wbh-btn" disabled title="PDF를 찾을 수 없습니다">
                    다운로드 불가
                  </button>
                )}

                {/* 편집으로 불러오기 */}
                <button
                  className="wbh-btn"
                  onClick={() => handleLoadForEdit(wb)}
                  title="문제집 생성 탭에서 이 문제집의 설정으로 편집"
                >
                  편집으로 불러오기
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
