import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import InputAdornment from "@mui/material/InputAdornment";
import { Icon } from "@iconify/react";

import UploadForm from "components/UploadForm";
import usePaginatedList from "hooks/usePaginatedList";
import useDebouncedValue from "hooks/useDebouncedValue";
import { listJobs, requestUploadUrl, uploadPdf, updateJobMeta, deleteJob } from "api/client";

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/api$/, "");

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

const CARD_W  = 180;
const CARD_H  = 280;

function UploadCard({ onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        width: CARD_W, height: CARD_H, flexShrink: 0,
        border: "2px dashed", borderColor: "divider", borderRadius: 2,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 1,
        cursor: "pointer", color: "text.disabled",
        transition: "all 0.15s",
        "&:hover": { borderColor: "primary.main", color: "primary.main", bgcolor: "action.hover" },
      }}
    >
      <Icon icon="material-symbols:add-rounded" style={{ fontSize: 36 }} />
      <Typography variant="caption" fontWeight={600}>PDF 업로드</Typography>
    </Box>
  );
}

const THUMB_H = 180;

function isAnalyzing(job) {
  // 문항 분석이 완료/실패되면 job.status와 무관하게 클릭 가능
  if (job.boundaries_status === "DONE" || job.boundaries_status === "FAILED") return false;
  return true;
}

function JobCard({ job, onClick, onEdit, onDelete }) {
  // 썸네일 URL은 결정적(deterministic)이라 /pages 호출 없이 직접 조립한다 (REQ-P02-02).
  // 카드 N개 = 전체 PDF N번 재다운로드+파싱이던 목록 로딩 병목 제거.
  const thumbUrl = `${API_ROOT}/api/jobs/${job.job_id}/pages/0/thumbnail`;
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const hasTypes = job.workbook_types?.length > 0;
  const dimmed   = isAnalyzing(job);

  return (
    <Box
      onClick={() => !dimmed && onClick(job)}
      sx={{
        width: CARD_W, height: CARD_H, flexShrink: 0,
        border: 1, borderColor: "divider", borderRadius: 2,
        display: "flex", flexDirection: "column",
        cursor: dimmed ? "not-allowed" : "pointer",
        bgcolor: "background.paper",
        overflow: "hidden",
        position: "relative",
        transition: "all 0.15s",
        ...(!dimmed && {
          "&:hover": {
            borderColor: "primary.main",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transform: "translateY(-2px)",
          },
        }),
      }}
    >
      {/* 썸네일 영역 */}
      <Box
        sx={{
          height: THUMB_H, flexShrink: 0, position: "relative",
          bgcolor: "action.hover", overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {!thumbLoaded && (
          thumbFailed
            ? <Icon icon="material-symbols:description-outline-rounded" style={{ fontSize: 40, color: "var(--mui-palette-text-disabled)" }} />
            : <Box className="img-skeleton" sx={{ position: "absolute", inset: 0 }} />
        )}
        {!thumbFailed && (
          <Box
            component="img"
            src={thumbUrl}
            onLoad={() => setThumbLoaded(true)}
            onError={() => setThumbFailed(true)}
            sx={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "top center",
              display: thumbLoaded ? "block" : "none",
            }}
          />
        )}

        {/* 상태 배지 (썸네일 위 오버레이) */}
        <Box sx={{ position: "absolute", top: 6, left: 6, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {job.boundaries_status === "DONE" && job.total_question_count != null && (
            <Chip
              label={`${job.total_question_count}문항`}
              size="small" color="primary"
              sx={{ fontSize: 10, height: 18, bgcolor: "primary.main", color: "common.white" }}
            />
          )}
          {job.boundaries_status === "PROCESSING" && (
            <Chip label="분석 중" size="small" color="warning" sx={{ fontSize: 10, height: 18 }} />
          )}
          {job.boundaries_status === "PENDING" && (
            <Chip label="처리 중" size="small" color="warning" sx={{ fontSize: 10, height: 18 }} />
          )}
          {job.boundaries_status === "FAILED" && (
            <Chip label="분석 실패" size="small" color="error" sx={{ fontSize: 10, height: 18 }} />
          )}
        </Box>

        {/* 편집·삭제 — 이름/유형 편집은 문제집 편집 ①에서 옮겨 옴 (2026-07-25) */}
        <Box sx={{ position: "absolute", top: 4, right: 4, display: "flex", gap: 0.5 }}>
          <Tooltip title="이름·유형 편집">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onEdit(job); }}
              sx={{ bgcolor: "background.paper", opacity: 0.92, "&:hover": { opacity: 1 } }}
            >
              <Icon icon="material-symbols:edit-outline-rounded" style={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="삭제">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onDelete(job); }}
              sx={{ bgcolor: "background.paper", color: "error.main", opacity: 0.92, "&:hover": { opacity: 1 } }}
            >
              <Icon icon="material-symbols:delete-outline-rounded" style={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 정보 영역 */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 1.5, minHeight: 0 }}>
        <Typography
          variant="body2" fontWeight={700}
          sx={{ mb: 0.75, wordBreak: "break-word", lineHeight: 1.4 }}
          title={job.workbook_name || job.filename}
        >
          {job.workbook_name || job.filename || "unknown.pdf"}
        </Typography>

        {hasTypes && (
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 0.5 }}>
            {job.workbook_types.slice(0, 3).map((t) => (
              <Chip key={t} label={t} size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
            ))}
          </Box>
        )}

        <Typography variant="caption" color="text.disabled" sx={{ mt: "auto", display: "block" }}>
          {relativeTime(job.uploaded_at)}
        </Typography>
      </Box>

      {/* 딤 오버레이 */}
      {dimmed && (
        <Box sx={{
          position: "absolute", inset: 0,
          bgcolor: "rgba(255,255,255,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <CircularProgress size={24} thickness={4} />
        </Box>
      )}
    </Box>
  );
}

export default function AnalysisFilePage() {
  const navigate = useNavigate();

  const [searchName, setSearchName] = useState("");
  const [searchType, setSearchType] = useState("");

  // 업로드 다이얼로그
  const [uploadOpen, setUploadOpen]                   = useState(false);
  const [uploading, setUploading]                     = useState(false);
  const [uploadError, setUploadError]                 = useState("");
  const [uploadWorkbookName, setUploadWorkbookName]   = useState("");
  const [uploadWorkbookTypes, setUploadWorkbookTypes] = useState("");
  const [selectedFile, setSelectedFile]               = useState(null);

  // 검색은 서버가 처리한다 (REQ-P03-03) — 페이지 단위로만 받으므로
  // 클라이언트 필터로는 아직 안 불러온 뒷 페이지를 찾을 수 없기 때문.
  const debouncedName = useDebouncedValue(searchName, 300);
  const debouncedType = useDebouncedValue(searchType, 300);

  const fetchPage = useCallback(
    (skip, limit) => listJobs({ skip, limit, name: debouncedName, types: debouncedType }),
    [debouncedName, debouncedType],
  );

  const {
    items: jobs, total, loading, loadingMore, error, sentinelRef, reload: fetchJobs,
  } = usePaginatedList(fetchPage);

  const hasSearch = Boolean(debouncedName.trim() || debouncedType.trim());

  // ── 이름/유형 편집 (문제집 편집 ①에서 이동) ──────────
  const [editJob, setEditJob]         = useState(null);
  const [editName, setEditName]       = useState("");
  const [editTypes, setEditTypes]     = useState("");
  const [editSaving, setEditSaving]   = useState(false);
  const [editError, setEditError]     = useState("");

  const openEdit = (job) => {
    setEditJob(job);
    setEditName(job.workbook_name || "");
    setEditTypes((job.workbook_types || []).join(", "));
    setEditError("");
  };

  // ── 삭제 (연관 저장물 전체) ────────────────────────────
  const [deleteJobTarget, setDeleteJob]   = useState(null);
  const [deleting, setDeleting]           = useState(false);
  const [deleteError, setDeleteError]     = useState("");

  const handleDelete = async () => {
    if (!deleteJobTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteJob(deleteJobTarget.job_id);
      setDeleteJob(null);
      await fetchJobs();
    } catch (e) {
      setDeleteError(e.message || "삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSave = async () => {
    if (!editJob || editSaving) return;
    setEditSaving(true);
    setEditError("");
    try {
      const types = editTypes.split(",").map((s) => s.trim()).filter(Boolean);
      await updateJobMeta(editJob.job_id, {
        workbook_name: editName.trim() || null,
        workbook_types: types.length > 0 ? types : null,
      });
      setEditJob(null);
      await fetchJobs();
    } catch (e) {
      setEditError(e.message || "저장에 실패했습니다.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleCardClick = (job) => {
    navigate(`/analysis/${job.job_id}`, {
      state: { filename: job.filename, workbookName: job.workbook_name },
    });
  };

  const openUpload = () => {
    setUploadError("");
    setUploadWorkbookName("");
    setUploadWorkbookTypes("");
    setSelectedFile(null);
    setUploadOpen(true);
  };

  const handleUpload = async () => {
    if (!selectedFile || uploading) return;
    setUploading(true);
    setUploadError("");
    try {
      const meta = {};
      if (uploadWorkbookName.trim()) meta.workbook_name = uploadWorkbookName.trim();
      if (uploadWorkbookTypes.trim()) {
        meta.workbook_types = uploadWorkbookTypes.split(",").map((s) => s.trim()).filter(Boolean);
      }
      const { job_id, upload_url } = await requestUploadUrl(selectedFile.name, meta);
      await uploadPdf(upload_url, selectedFile, job_id);
      setUploadOpen(false);
      await fetchJobs();
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── 상단 검색 바 ───────────────────────────────── */}
      <Box sx={{
        px: 2.5, py: 1.25, borderBottom: 1, borderColor: "divider",
        display: "flex", gap: 1.5, alignItems: "center", flexShrink: 0,
        bgcolor: "background.paper",
      }}>
        <TextField
          size="small"
          placeholder="문제집 이름 검색"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon icon="material-symbols:search-rounded" style={{ fontSize: 16, color: "var(--mui-palette-text-disabled)" }} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          size="small"
          placeholder="유형 검색"
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon icon="material-symbols:label-outline-rounded" style={{ fontSize: 16, color: "var(--mui-palette-text-disabled)" }} />
              </InputAdornment>
            ),
          }}
        />
        <Tooltip title="새로고침">
          <IconButton size="small" onClick={fetchJobs} disabled={loading}>
            {loading
              ? <CircularProgress size={16} />
              : <Icon icon="material-symbols:refresh-rounded" style={{ fontSize: 18 }} />
            }
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mx: 2.5, mt: 1.5 }}>
          {error}
        </Alert>
      )}

      {/* ── 메인: 카드 래핑 그리드 (세로 스크롤) ─────────── */}
      <Box sx={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        display: "flex", flexWrap: "wrap", gap: 2,
        p: 2.5, alignContent: "flex-start",
      }}>
        {/* 업로드 카드: 항상 맨 좌측 고정 */}
        <UploadCard onClick={openUpload} />

        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", pl: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          jobs.map((job) => (
            <JobCard
              key={job.job_id}
              job={job}
              onClick={handleCardClick}
              onEdit={openEdit}
              onDelete={setDeleteJob}
            />
          ))
        )}

        {!loading && jobs.length === 0 && (
          <Box sx={{ display: "flex", alignItems: "center", pl: 2, color: "text.disabled" }}>
            <Typography variant="body2" color="text.disabled">
              {hasSearch ? "검색 결과가 없습니다." : "업로드된 파일이 없습니다."}
            </Typography>
          </Box>
        )}

        {/* 무한 스크롤 센티널 (REQ-P03-03) — 보이면 다음 페이지를 이어붙인다 */}
        <Box
          ref={sentinelRef}
          sx={{
            width: "100%", display: "flex", justifyContent: "center",
            alignItems: "center", gap: 1, py: loadingMore ? 2 : 0.5,
          }}
        >
          {loadingMore && (
            <>
              <CircularProgress size={18} />
              <Typography variant="caption" color="text.disabled">
                {jobs.length} / {total}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      {/* ── 삭제 확인 다이얼로그 ───────────────────────── */}
      <Dialog
        open={Boolean(deleteJobTarget)}
        onClose={() => !deleting && setDeleteJob(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>문제집을 삭제할까요?</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: "12px !important" }}>
          {deleteError && <Alert severity="error" sx={{ py: 0 }}>{deleteError}</Alert>}
          <Typography variant="body2" fontWeight={700}>
            {deleteJobTarget?.workbook_name || deleteJobTarget?.filename}
          </Typography>
          <Alert severity="warning" sx={{ py: 0.5 }}>
            원본 PDF·감지된 문항·썸네일이 <b>모두 삭제</b>되며 되돌릴 수 없습니다.
            이 문제집의 문항으로 만든 생성 이력은 남지만, 편집 화면에서 해당 문항 이미지가 보이지 않습니다.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteJob(null)} disabled={deleting} color="inherit">
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

      {/* ── 이름/유형 편집 다이얼로그 ──────────────────── */}
      <Dialog
        open={Boolean(editJob)}
        onClose={() => !editSaving && setEditJob(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>문제집 정보 편집</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          {editError && <Alert severity="error" sx={{ py: 0 }}>{editError}</Alert>}
          <Typography variant="caption" color="text.disabled">
            {editJob?.filename}
          </Typography>
          <TextField
            size="small" fullWidth autoFocus
            label="문제집 이름"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            disabled={editSaving}
          />
          <TextField
            size="small" fullWidth
            label="유형 (쉼표로 구분)"
            placeholder="예: 수학, 도형"
            value={editTypes}
            onChange={(e) => setEditTypes(e.target.value)}
            disabled={editSaving}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditJob(null)} disabled={editSaving} color="inherit">
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            disabled={editSaving}
            startIcon={editSaving ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {editSaving ? "저장 중..." : "저장"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── 업로드 다이얼로그 ──────────────────────────── */}
      <Dialog
        open={uploadOpen}
        onClose={() => !uploading && setUploadOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>PDF 업로드</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          {uploadError && <Alert severity="error" sx={{ py: 0 }}>{uploadError}</Alert>}
          <TextField
            size="small" fullWidth
            label="문제집 이름 (선택)"
            value={uploadWorkbookName}
            onChange={(e) => setUploadWorkbookName(e.target.value)}
            disabled={uploading}
          />
          <TextField
            size="small" fullWidth
            label="유형 (쉼표로 구분)"
            placeholder="예: 수학, 도형"
            value={uploadWorkbookTypes}
            onChange={(e) => setUploadWorkbookTypes(e.target.value)}
            disabled={uploading}
          />
          <UploadForm
            onFileSelected={(f) => { setSelectedFile(f); setUploadError(""); }}
            selectedFile={selectedFile}
            disabled={uploading}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUploadOpen(false)} disabled={uploading} color="inherit">
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            startIcon={
              uploading
                ? <CircularProgress size={14} color="inherit" />
                : <Icon icon="material-symbols:upload-rounded" />
            }
          >
            {uploading ? "업로드 중..." : "업로드 후 분석"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
