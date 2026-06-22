import { useState, useMemo, useCallback, useEffect } from "react";
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
import { listJobs, requestUploadUrl, uploadPdf, getPages } from "api/client";

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

function JobCard({ job, onClick }) {
  const [thumbUrl, setThumbUrl]       = useState(null);
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const hasTypes = job.workbook_types?.length > 0;
  const dimmed   = isAnalyzing(job);

  useEffect(() => {
    setThumbLoaded(false);
    getPages(job.job_id)
      .then((data) => {
        const url = data.pages?.[0]?.thumbnail_url;
        if (url) setThumbUrl(`${API_ROOT}${url}`);
      })
      .catch(() => {});
  }, [job.job_id]);

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
        {(!thumbUrl || !thumbLoaded) && (
          thumbUrl
            ? <Box className="img-skeleton" sx={{ position: "absolute", inset: 0 }} />
            : <Icon icon="material-symbols:description-outline-rounded" style={{ fontSize: 40, color: "#ccc" }} />
        )}
        {thumbUrl && (
          <Box
            component="img"
            src={thumbUrl}
            onLoad={() => setThumbLoaded(true)}
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
              sx={{ fontSize: 10, height: 18, bgcolor: "primary.main", color: "#fff" }}
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

  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchType, setSearchType] = useState("");

  // 업로드 다이얼로그
  const [uploadOpen, setUploadOpen]                   = useState(false);
  const [uploading, setUploading]                     = useState(false);
  const [uploadError, setUploadError]                 = useState("");
  const [uploadWorkbookName, setUploadWorkbookName]   = useState("");
  const [uploadWorkbookTypes, setUploadWorkbookTypes] = useState("");
  const [selectedFile, setSelectedFile]               = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listJobs();
      setJobs(data.source_jobs ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const filteredJobs = useMemo(() => {
    const nameLower = searchName.trim().toLowerCase();
    const typeLower = searchType.trim().toLowerCase();
    return jobs.filter((job) => {
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
  }, [jobs, searchName, searchType]);

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
                <Icon icon="material-symbols:search-rounded" style={{ fontSize: 16, color: "#aaa" }} />
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
                <Icon icon="material-symbols:label-outline-rounded" style={{ fontSize: 16, color: "#aaa" }} />
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
        <Alert severity="error" sx={{ mx: 2.5, mt: 1.5 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* ── 메인: 카드 목록 (가로 스크롤) ────────────────── */}
      <Box sx={{
        flex: 1, overflowX: "auto", overflowY: "hidden",
        display: "flex", flexDirection: "row", gap: 2,
        p: 2.5, alignItems: "flex-start",
      }}>
        {/* 업로드 카드: 항상 맨 좌측 고정 */}
        <UploadCard onClick={openUpload} />

        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", pl: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          filteredJobs.map((job) => (
            <JobCard key={job.job_id} job={job} onClick={handleCardClick} />
          ))
        )}

        {!loading && filteredJobs.length === 0 && (
          <Box sx={{ display: "flex", alignItems: "center", pl: 2, color: "text.disabled" }}>
            <Typography variant="body2" color="text.disabled">
              {jobs.length === 0 ? "업로드된 파일이 없습니다." : "검색 결과가 없습니다."}
            </Typography>
          </Box>
        )}
      </Box>

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
