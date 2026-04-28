/**
 * 생성된 문제집 이력 뷰 (REQ-21~22)
 *
 * 기능:
 *   - 목록 조회 + 재다운로드
 *   - 문제집 클릭 → 오른쪽에 WorkbookPreview 미리보기 표시
 *   - 편집으로 불러오기
 */
import { useState, useEffect, useCallback } from "react";
import { getWorkbooks, getStatus } from "../api/client";
import WorkbookPreview from "../components/WorkbookPreview";

function fmtDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

/** WorkbookSelectionItem[] → WorkbookPreview 용 basket 배열로 변환 */
function toPreviewItems(selections) {
  return (selections || []).map((sel, i) => ({
    questionId:   sel.question_id || sel.manual_id || String(sel.question_num ?? i),
    questionNum:  sel.question_num,
    pageNum:      sel.page_num,
    jobId:        sel.job_id,
    workbookName: sel.workbook_name || "",
    isManual:     Boolean(sel.manual_id),
    manualId:     sel.manual_id,
    displayTitle: sel.title,
    thumbnailUrl: sel.manual_id
      ? `/api/jobs/${sel.job_id}/pages/${sel.page_num}/questions/manual/${sel.manual_id}/thumbnail`
      : `/api/jobs/${sel.job_id}/pages/${sel.page_num}/questions/${sel.question_num}/thumbnail`,
  }));
}

export default function WorkbookHistoryView({ onLoadForEdit }) {
  const [workbooks, setWorkbooks]         = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedWb, setSelectedWb]       = useState(null);

  const fetchWorkbooks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getWorkbooks();
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

  const handleDownload = async (wb) => {
    if (!wb.result_job_id) return;
    setDownloadingId(wb.workbook_id);
    try {
      const data = await getStatus(wb.result_job_id);
      if (data.download_url) {
        const a = document.createElement("a");
        a.href = data.download_url;
        a.download = `${wb.filename || wb.name || "workbook"}.pdf`;
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

  const handleLoadForEdit = (wb) => {
    onLoadForEdit?.(wb.workbook_id);
  };

  const previewItems = selectedWb ? toPreviewItems(selectedWb.selections) : [];

  return (
    <div className="wbh-container view-layout" style={{ display: "flex", flexDirection: "row", gap: 0, overflow: "hidden" }}>

      {/* ── 목록 패널 ─────────────────────────────────── */}
      <div style={{ flex: "0 0 360px", minWidth: 260, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid #e2e8f0" }}>
        <div className="wbh-header">
          <span className="wbh-title">생성된 문제집 이력</span>
          <button className="wbh-refresh-btn" onClick={fetchWorkbooks} disabled={loading}>
            {loading ? "로딩 중..." : "🔄 새로고침"}
          </button>
        </div>

        <div className="wbh-body" style={{ flex: 1, overflowY: "auto" }}>
          {loading && workbooks.length === 0 && <div className="wbh-loading">목록을 불러오는 중...</div>}
          {error && <div className="wbh-error">{error}</div>}
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
              <div
                key={wb.workbook_id ?? idx}
                className={`wbh-item${selectedWb?.workbook_id === wb.workbook_id ? " wbh-item--selected" : ""}`}
                onClick={() => setSelectedWb(selectedWb?.workbook_id === wb.workbook_id ? null : wb)}
                style={{ cursor: "pointer" }}
              >
                <div className="wbh-item-info">
                  <div className="wbh-item-name">
                    {wb.name || wb.filename || `문제집 #${idx + 1}`}
                  </div>
                  <div className="wbh-item-meta">
                    {fmtDate(wb.created_at)} · {wb.layout || "-"} · {wb.question_count ?? "?"}문항
                  </div>
                </div>

                <div className="wbh-item-actions" onClick={(e) => e.stopPropagation()}>
                  {wb.result_job_id ? (
                    <button
                      className="wbh-btn wbh-btn--primary"
                      onClick={() => handleDownload(wb)}
                      disabled={downloadingId === wb.workbook_id}
                      title="PDF 재다운로드"
                    >
                      {downloadingId === wb.workbook_id ? "⏳" : "⬇"}
                    </button>
                  ) : (
                    <button className="wbh-btn" disabled>불가</button>
                  )}
                  <button className="wbh-btn" onClick={() => handleLoadForEdit(wb)} title="편집으로 불러오기">
                    편집
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 미리보기 패널 ──────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {selectedWb ? (
          <>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid #e2e8f0", fontSize: 13, fontWeight: 600, color: "#334155" }}>
              {selectedWb.name || selectedWb.filename || "문제집 미리보기"}
              <span style={{ marginLeft: 10, fontWeight: 400, color: "#64748b", fontSize: 12 }}>
                {selectedWb.layout} · {selectedWb.question_count}문항
              </span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
              <WorkbookPreview
                selections={previewItems}
                layout={selectedWb.layout || "세로 2단"}
                previewWidth={320}
              />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 32 }}>📄</div>
            <p style={{ margin: 0, fontSize: 13 }}>목록에서 문제집을 클릭하면 미리보기가 표시됩니다.</p>
          </div>
        )}
      </div>

    </div>
  );
}
