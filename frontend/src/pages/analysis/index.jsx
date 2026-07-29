import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
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
import PageHeader from "components/PageHeader";
import StatCards from "components/StatCards";
import BookCard, { BOOK_CARD_W } from "components/BookCard";
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

const COVER_H = 226;   // BookCard 표지 높이와 맞춘다

function UploadCard({ onClick }) {
  return (
    <Box sx={{ width: BOOK_CARD_W, flexShrink: 0 }}>
      <Box
        onClick={onClick}
        sx={{
          height: COVER_H,
          border: "2px dashed", borderColor: "divider",
          borderRadius: "3px 8px 8px 3px",
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
    </Box>
  );
}

function isAnalyzing(job) {
  // 문항 분석이 완료/실패되면 job.status와 무관하게 클릭 가능
  if (job.boundaries_status === "DONE" || job.boundaries_status === "FAILED") return false;
  return true;
}

// 감지 상태 → 표지 위 배지
const BOUNDARY_BADGE = {
  PROCESSING: { label: "분석 중", color: "warning" },
  PENDING:    { label: "처리 중", color: "warning" },
  FAILED:     { label: "분석 실패", color: "error" },
};

function JobCard({ job, onClick, onEdit, onDelete }) {
  // 썸네일 URL은 결정적(deterministic)이라 /pages 호출 없이 직접 조립한다 (REQ-P02-02).
  // 카드 N개 = 전체 PDF N번 재다운로드+파싱이던 목록 로딩 병목 제거.
  const coverUrl = `${API_ROOT}/api/jobs/${job.job_id}/pages/0/thumbnail`;
  const analyzing = isAnalyzing(job);
  const done = job.boundaries_status === "DONE";

  const badge = done && job.total_question_count != null
    ? { label: `${job.total_question_count}문항`, color: "primary" }
    : BOUNDARY_BADGE[job.boundaries_status];

  const actionSx = {
    bgcolor: "background.paper", opacity: 0.92,
    "&:hover": { opacity: 1 },
  };

  return (
    <BookCard
      coverUrl={coverUrl}
      title={job.workbook_name || job.filename || "unknown.pdf"}
      subtitle={relativeTime(job.uploaded_at)}
      tags={job.workbook_types || []}
      badge={badge}
      // 두께는 감지된 문항 수에 연동한다 (감지 전/실패는 가장 얇게)
      questionCount={done ? job.total_question_count : null}
      colorKey={job.job_id}
      disabled={analyzing}
      loading={analyzing}
      onClick={() => onClick(job)}
      actions={
        <>
          <Tooltip title="이름·유형 편집">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onEdit(job); }}
              sx={actionSx}
            >
              <Icon icon="material-symbols:edit-outline-rounded" style={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="삭제">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onDelete(job); }}
              sx={{ ...actionSx, color: "error.main" }}
            >
              <Icon icon="material-symbols:delete-outline-rounded" style={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </>
      }
    />
  );
}

export default function AnalysisFilePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 앱 헤더 검색은 `/?q=…`로 이 화면에 넘어온다(REQ-D07 2안).
  // 여기서 초기값으로 흡수하고 주소는 즉시 비워, 새로고침 때 검색어가 되살아나지 않게 한다.
  const [searchName, setSearchName] = useState(() => searchParams.get("q") || "");
  const [searchType, setSearchType] = useState("");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q === null) return;
    setSearchName(q);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

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

  // 업로드·삭제로 개수가 바뀌면 통계 카드도 다시 받는다.
  const [statsTrigger, setStatsTrigger] = useState(0);
  const bumpStats = useCallback(() => setStatsTrigger((t) => t + 1), []);

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
      bumpStats();
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
      bumpStats();
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
      bumpStats();
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{
      display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
      gap: 2, p: 2, bgcolor: "background.default",
    }}>

      {/* ── 페이지 헤더 + 브레드크럼 (REQ-D07 2안) ────────
          앱 헤더가 검색에 자리를 내줘서 위치 정보는 여기가 책임진다. */}
      {/* 업로드 버튼은 두지 않는다 — 그리드 맨 앞의 업로드 카드와 중복된다.
          아티팩트 2안의 헤더 업로드 버튼은 업로드 카드가 없는 테이블 변형용이었고,
          이 화면은 조건 ①로 카드 그리드를 유지하므로 카드 쪽을 남긴다. */}
      <PageHeader
        title="문항 분석"
        crumbs={[{ label: "홈", to: "/" }, { label: "문항 분석" }]}
      />

      {/* ── 요약 통계 (REQ-D07 2안) ──────────────────────
          별도 홈 라우트가 없어 진입 화면인 이곳에 얹는다. */}
      <StatCards refreshTrigger={statsTrigger} />

      {/* ── 검색 바 ────────────────────────────────────── */}
      <Box sx={{
        px: 2, py: 1.25, borderRadius: 2,
        display: "flex", gap: 1.5, alignItems: "center", flexShrink: 0,
        bgcolor: "background.paper",
        boxShadow: (theme) => theme.customShadows?.card,
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
                {/* 색은 sx로 — `var(--mui-palette-*)`는 이 테마에서 해석되지 않는다(접두사가 `--palette-*`) */}
                <Box component="span" sx={{ color: "text.disabled", display: "flex" }}>
                  <Icon icon="material-symbols:search-rounded" style={{ fontSize: 16 }} />
                </Box>
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
                <Box component="span" sx={{ color: "text.disabled", display: "flex" }}>
                  <Icon icon="material-symbols:label-outline-rounded" style={{ fontSize: 16 }} />
                </Box>
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

      {error && <Alert severity="error" sx={{ flexShrink: 0 }}>{error}</Alert>}

      {/* ── 메인: 카드 래핑 그리드 (세로 스크롤) ───────────
          조건 ①로 **테이블 전환은 하지 않는다** — 아티팩트 2안의 테이블+툴바는
          의도적으로 채택하지 않았고, 책 카드(B안)가 이 화면의 확정안이다. */}
      <Box sx={{
        flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden",
        display: "flex", flexWrap: "wrap", gap: 2,
        p: 2, borderRadius: 2, alignContent: "flex-start",
        bgcolor: "background.paper",
        boxShadow: (theme) => theme.customShadows?.card,
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
