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
import Tooltip from "@mui/material/Tooltip";
import { Icon } from "@iconify/react";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

import PdfPreviewPanel from "components/PdfPreviewPanel";
import PageHeader from "components/PageHeader";
import { WorkCanvas, CardRow, PanelCard, PanelCardHeader } from "components/WorkCanvas";
import BookCard from "components/BookCard";
import usePaginatedList from "hooks/usePaginatedList";
import { useNotificationRefresh } from "hooks/useNotificationRefresh";
import { getWorkbooks, getStatus, deleteWorkbook } from "api/client";

function fmtDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}


const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/api$/, "");

const actionSx = { bgcolor: "background.paper", opacity: 0.92, "&:hover": { opacity: 1 } };

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

  // 생성이 끝나면 새로고침 없이 이력에 나타난다 (REQ-F09 Phase 4).
  useNotificationRefresh(fetchWorkbooks, { kind: 'export' }); // 문제집 생성 완료에만 반응 (REQ-C09)

  // ── 삭제 (문제집 + 결과 PDF, REQ-C08) ─────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [deleteError, setDeleteError]   = useState("");

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteWorkbook(deleteTarget.workbook_id);
      // 삭제한 문제집을 미리보기 중이었다면 뷰어도 비운다
      if (selectedWb?.workbook_id === deleteTarget.workbook_id) {
        setSelectedWb(null);
        setPdfUrl(null);
      }
      setDeleteTarget(null);
      await fetchWorkbooks();
    } catch (e) {
      setDeleteError(e.message || "삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

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
    /* REQ-D07 2안 — 맞붙은 2패널을 캔버스 위 카드 2장으로. */
    <WorkCanvas>
      <PageHeader
        title="생성 이력"
        crumbs={[{ label: "홈", to: "/" }, { label: "생성 이력" }]}
        actions={
          <Tooltip title="새로고침">
            <IconButton size="small" onClick={fetchWorkbooks} disabled={loading}>
              {loading ? <CircularProgress size={16} /> : <Icon icon="material-symbols:refresh-rounded" style={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>
        }
      />

      <CardRow>
      {/* ── 목록 패널 (책 카드 그리드, REQ-D07 Phase 3-3) ─── */}
      <PanelCard sx={{ width: 420, flexShrink: 0 }}>
        <PanelCardHeader>
          <Icon icon="material-symbols:history-rounded" style={{ fontSize: 18, flexShrink: 0 }} />
          <Typography variant="subtitle2" fontWeight={700}>생성된 문제집</Typography>
        </PanelCardHeader>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
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

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignContent: "flex-start" }}>
            {workbooks.map((wb, idx) => (
              <BookCard
                key={wb.workbook_id ?? idx}
                // 표지는 생성된 결과 PDF의 첫 페이지 (EXPORT job도 썸네일을 내주도록 백엔드 보완)
                coverUrl={wb.result_job_id ? `${API_ROOT}/api/jobs/${wb.result_job_id}/pages/0/thumbnail` : undefined}
                title={wb.name || wb.filename || `문제집 #${idx + 1}`}
                subtitle={fmtDate(wb.created_at)}
                tags={[wb.layout || "-"]}
                badge={{ label: `${wb.question_count ?? "?"}문항`, color: "primary" }}
                questionCount={wb.question_count ?? null}
                colorKey={wb.workbook_id}
                selected={selectedWb?.workbook_id === wb.workbook_id}
                onClick={() => handleSelectWb(wb)}
                actions={
                  <>
                    <Tooltip title="PDF 재다운로드">
                      <span>
                        <IconButton
                          size="small"
                          disabled={!wb.result_job_id || downloadingId === wb.workbook_id}
                          onClick={(e) => { e.stopPropagation(); handleDownload(wb); }}
                          sx={actionSx}
                        >
                          {downloadingId === wb.workbook_id
                            ? <CircularProgress size={14} />
                            : <Icon icon="material-symbols:download-rounded" style={{ fontSize: 16 }} />}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="편집으로 불러오기">
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); navigate("/editor", { state: { initialWorkbookId: wb.workbook_id } }); }}
                        sx={actionSx}
                      >
                        <Icon icon="material-symbols:edit-outline-rounded" style={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="삭제">
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(wb); }}
                        sx={{ ...actionSx, color: "error.main" }}
                      >
                        <Icon icon="material-symbols:delete-outline-rounded" style={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </>
                }
              />
            ))}
          </Box>

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
      </PanelCard>

      <Box sx={{ width: 16, flexShrink: 0 }} />

      {/* ── 미리보기 패널 ──────────────────────────── */}
      <PanelCard sx={{ flex: 1, minWidth: 0 }}>
        {selectedWb ? (
          <>
            <PanelCardHeader>
              <Icon icon="material-symbols:picture-as-pdf-outline-rounded" style={{ fontSize: 18, flexShrink: 0 }} />
              <Typography variant="subtitle2" fontWeight={700} noWrap>
                {selectedWb.name || selectedWb.filename || "문제집 미리보기"}
              </Typography>
              <Chip label={selectedWb.layout} size="small" variant="outlined" />
              <Chip label={`${selectedWb.question_count}문항`} size="small" variant="outlined" />
            </PanelCardHeader>
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
      </PanelCard>
      </CardRow>

      {/* ── 삭제 확인 다이얼로그 (REQ-C08) ──────────────── */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>문제집을 삭제할까요?</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: "12px !important" }}>
          {deleteError && <Alert severity="error" sx={{ py: 0 }}>{deleteError}</Alert>}
          <Typography variant="body2" fontWeight={700}>
            {deleteTarget?.name || deleteTarget?.filename}
          </Typography>
          <Alert severity="warning" sx={{ py: 0.5 }}>
            생성된 <b>PDF까지 함께 삭제</b>되며 되돌릴 수 없습니다. 원본 문제집은 그대로 남습니다.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} color="inherit">
            취소
          </Button>
          <Button
            variant="contained" color="error"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {deleting ? "삭제 중..." : "삭제"}
          </Button>
        </DialogActions>
      </Dialog>
    </WorkCanvas>
  );
}
