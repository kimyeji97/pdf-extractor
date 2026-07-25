/**
 * 생성 이력 페이지 (REQ-F06)
 *
 * 문제집 목록 선택 시 react-pdf 기반 PDF 뷰어로 미리보기.
 * 확대/축소, 페이지 번호 입력 이동, 스크롤 탐색 지원.
 */
import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import { Icon } from "@iconify/react";

import PdfPreviewPanel from "components/PdfPreviewPanel";
import usePaginatedList from "hooks/usePaginatedList";
import { getWorkbooks, getStatus } from "api/client";

function fmtDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}


export default function HistoryPage() {
  const navigate = useNavigate();
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedWb, setSelectedWb]       = useState(null);
  const [pdfUrl, setPdfUrl]               = useState(null);
  const [pdfLoading, setPdfLoading]       = useState(false);

  // 서버가 created_at 내림차순으로 페이지를 반환하므로 클라 재정렬은 불필요 (REQ-P03-03)
  const fetchPage = useCallback((skip, limit) => getWorkbooks({ skip, limit }), []);

  const {
    items: workbooks, total, loading, loadingMore, error, sentinelRef, reload: fetchWorkbooks,
  } = usePaginatedList(fetchPage);

  const handleDownload = async (wb) => {
    if (!wb.result_job_id) return;
    setDownloadingId(wb.workbook_id);
    try {
      const data = await getStatus(wb.result_job_id);
      if (data.download_url) {
        const a = document.createElement("a"); a.href = data.download_url;
        a.download = `${wb.filename || wb.name || "workbook"}.pdf`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      } else { alert("다운로드 URL을 가져올 수 없습니다."); }
    } catch (e) { alert("다운로드 실패: " + e.message); }
    finally     { setDownloadingId(null); }
  };

  const handleSelectWb = async (wb) => {
    if (selectedWb?.workbook_id === wb.workbook_id) {
      setSelectedWb(null); setPdfUrl(null); return;
    }
    setSelectedWb(wb); setPdfUrl(null);
    if (!wb.result_job_id) return;
    setPdfLoading(true);
    try {
      const data = await getStatus(wb.result_job_id);
      if (data.download_url) setPdfUrl(data.download_url);
    } catch { /* PDF URL 로드 실패 시 무시 */ }
    finally { setPdfLoading(false); }
  };

  return (
    <Box sx={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

      {/* ── 목록 패널 ───────────────────────────────── */}
      <Paper elevation={0} sx={{ width: 380, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: 0, borderRight: 1, borderColor: "divider" }}>
        <Box sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle2" fontWeight={700}>생성된 문제집 이력</Typography>
          <Tooltip title="새로고침">
            <IconButton size="small" onClick={fetchWorkbooks} disabled={loading}>
              {loading ? <CircularProgress size={16} /> : <Icon icon="material-symbols:refresh-rounded" style={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {error && <Alert severity="error" sx={{ m: 1.5 }}>{error}</Alert>}
          {!loading && !error && workbooks.length === 0 && (
            <Box sx={{ p: 4, textAlign: "center", color: "text.disabled" }}>
              <Icon icon="material-symbols:history-rounded" style={{ fontSize: 40 }} />
              <Typography variant="body2" mt={1} color="text.secondary">
                아직 생성된 문제집이 없습니다.<br />
                <Typography component="span" variant="caption" color="text.disabled">
                  문제집 편집 탭에서 PDF를 생성하면<br />여기에 기록됩니다.
                </Typography>
              </Typography>
            </Box>
          )}

          <List disablePadding>
            {workbooks.map((wb, idx) => (
              <Box key={wb.workbook_id ?? idx}>
                <ListItemButton
                  selected={selectedWb?.workbook_id === wb.workbook_id}
                  onClick={() => handleSelectWb(wb)}
                  sx={{ px: 2, py: 1.5, alignItems: "flex-start" }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {wb.name || wb.filename || `문제집 #${idx + 1}`}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                        <Chip label={wb.layout || "-"} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                        <Chip label={`${wb.question_count ?? "?"}문항`} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                        <Typography variant="caption" color="text.disabled" sx={{ alignSelf: "center" }}>{fmtDate(wb.created_at)}</Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: "flex", gap: 0.5, ml: 1, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="PDF 재다운로드">
                      <span>
                        <IconButton
                          size="small" color="primary"
                          disabled={!wb.result_job_id || downloadingId === wb.workbook_id}
                          onClick={() => handleDownload(wb)}
                        >
                          {downloadingId === wb.workbook_id
                            ? <CircularProgress size={16} />
                            : <Icon icon="material-symbols:download-rounded" style={{ fontSize: 18 }} />}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="편집으로 불러오기">
                      <IconButton size="small" onClick={() => navigate('/editor', { state: { initialWorkbookId: wb.workbook_id } })}>
                        <Icon icon="material-symbols:edit-outline-rounded" style={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemButton>
                <Divider />
              </Box>
            ))}
          </List>

          {/* 무한 스크롤 센티널 (REQ-P03-03) */}
          <Box
            ref={sentinelRef}
            sx={{ py: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 1, minHeight: 8 }}
          >
            {loadingMore && (
              <>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.disabled">
                  {workbooks.length} / {total}
                </Typography>
              </>
            )}
          </Box>
        </Box>
      </Paper>

      {/* ── 미리보기 패널 ──────────────────────────── */}
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {selectedWb ? (
          <>
            <Box sx={{ px: 2.5, py: 1.25, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {selectedWb.name || selectedWb.filename || "문제집 미리보기"}
              </Typography>
              <Chip label={selectedWb.layout} size="small" variant="outlined" />
              <Chip label={`${selectedWb.question_count}문항`} size="small" variant="outlined" />
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {pdfLoading ? (
                <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CircularProgress size={32} />
                </Box>
              ) : (
                <PdfPreviewPanel pdfUrl={pdfUrl} />
              )}
            </Box>
          </>
        ) : (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "text.disabled", gap: 2 }}>
            <Icon icon="material-symbols:picture-as-pdf-outline-rounded" style={{ fontSize: 56 }} />
            <Typography variant="body2" color="text.secondary">목록에서 문제집을 클릭하면 미리보기가 표시됩니다.</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
