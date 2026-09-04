/**
 * 표지 관리 페이지 (REQ-D06 — REQ-D05 2패널을 대체)
 *
 * 1패널 목록형 (문항 분석 목록 페이지와 디자인 통일):
 *   [+ 표지 업로드] [표지1] [표지2] ...  래핑 그리드
 *   업로드 카드 클릭 → 업로드 모달(드롭존 + 이름 + 업로드)
 */
import { useState, useEffect, useCallback, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import { Icon } from "@iconify/react";

import PageHeader from "components/PageHeader";
import BookCard, { BOOK_CARD_W } from "components/BookCard";
import { listCovers, uploadCover, deleteCover } from "api/client";

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/api$/, "");

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
        <Typography variant="caption" fontWeight={600}>표지 업로드</Typography>
      </Box>
    </Box>
  );
}

// 표지는 실제 책 표지 이미지라 두께 정보가 없다 — 가장 얇은 1층으로 통일한다
// (분석 목록의 책은 문항 수에 따라 두꺼워지므로 자연히 구분된다)
function CoverCard({ cover, onDelete }) {
  return (
    <BookCard
      coverUrl={`${API_ROOT}${cover.thumbnail_url}`}
      title={cover.name || "이름 없음"}
      colorKey={cover.cover_id}
      questionCount={null}
      actions={
        <Tooltip title="삭제">
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onDelete(cover.cover_id); }}
            sx={{
              bgcolor: "background.paper", color: "error.main",
              opacity: 0.92, "&:hover": { opacity: 1 },
            }}
          >
            <Icon icon="material-symbols:delete-outline-rounded" style={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      }
    />
  );
}

export default function FormatPage() {
  const [covers, setCovers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // ── 업로드 모달 상태 ──────────────────────────────────
  const [uploadOpen, setUploadOpen]     = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [uploadError, setUploadError]   = useState("");
  const [coverName, setCoverName]       = useState("");
  const [previewFile, setPreviewFile]   = useState(null);
  const [previewUrl, setPreviewUrl]     = useState(null);
  const [dragOver, setDragOver]         = useState(false);
  const inputRef = useRef(null);

  const fetchCovers = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await listCovers();
      setCovers(data.covers || []);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  }, []);

  useEffect(() => { fetchCovers(); }, [fetchCovers]);

  // 미리보기 objectURL 생성/해제
  useEffect(() => {
    if (!previewFile) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(previewFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewFile]);

  const acceptFile = (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setUploadError("JPEG 또는 PNG 이미지만 업로드할 수 있습니다."); return;
    }
    setPreviewFile(file); setUploadError("");
  };

  const openUpload = () => {
    setUploadError(""); setCoverName(""); setPreviewFile(null); setUploadOpen(true);
  };
  const closeUpload = () => { if (!uploading) setUploadOpen(false); };

  const handleUpload = async () => {
    if (!previewFile || uploading) return;
    setUploading(true); setUploadError("");
    try {
      await uploadCover(previewFile, coverName);
      setUploadOpen(false);
      await fetchCovers();
    } catch (e) { setUploadError(e.message); }
    finally     { setUploading(false); }
  };

  const handleDelete = async (coverId) => {
    if (!confirm("이 표지를 삭제하시겠습니까?")) return;
    try {
      await deleteCover(coverId);
      setCovers((prev) => prev.filter((c) => c.cover_id !== coverId));
    } catch (e) { alert(e.message); }
  };

  return (
    <Box sx={{
      display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
      gap: 2, p: 2, bgcolor: "background.default",
    }}>

      {/* ── 페이지 헤더 + 브레드크럼 (REQ-D07 2안) ────────
          앱 헤더가 검색에 자리를 내주면서 화면 이름은 다시 여기가 책임진다. */}
      <PageHeader
        title="템플릿 관리"
        crumbs={[{ label: "홈", to: "/" }, { label: "템플릿 관리" }]}
        actions={
          <Tooltip title="새로고침">
            <IconButton size="small" onClick={fetchCovers} disabled={loading}>
              {loading
                ? <CircularProgress size={16} />
                : <Icon icon="material-symbols:refresh-rounded" style={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
        }
      />

      {error && (
        <Alert severity="error" sx={{ flexShrink: 0 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* ── 메인: 카드 래핑 그리드 (세로 스크롤) ─────────── */}
      <Box sx={{
        flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden",
        display: "flex", flexWrap: "wrap", gap: 2,
        p: 2, borderRadius: 2, alignContent: "flex-start",
        bgcolor: "background.paper",
        boxShadow: (theme) => theme.customShadows?.card,
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ width: 1, mb: -0.5 }}>
          문제집 생성 시 첫 페이지로 넣을 표지를 관리합니다.
        </Typography>
        {/* 업로드 카드: 항상 맨 앞 고정 */}
        <UploadCard onClick={openUpload} />

        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", pl: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          covers.map((c) => (
            <CoverCard key={c.cover_id} cover={c} onDelete={handleDelete} />
          ))
        )}

        {!loading && covers.length === 0 && (
          <Box sx={{ display: "flex", alignItems: "center", pl: 2, color: "text.disabled" }}>
            <Typography variant="body2" color="text.disabled">
              업로드된 표지가 없습니다.
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── 업로드 모달 ────────────────────────────────── */}
      <Dialog open={uploadOpen} onClose={closeUpload} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>표지 업로드</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          {uploadError && <Alert severity="error" sx={{ py: 0 }}>{uploadError}</Alert>}

          {/* 드롭존 */}
          <Box
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); acceptFile(e.dataTransfer.files?.[0]); }}
            sx={{
              width: "100%", aspectRatio: "3/4", maxHeight: 300,
              border: "2px dashed",
              borderColor: dragOver || previewFile ? "primary.main" : "divider",
              borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", overflow: "hidden", bgcolor: dragOver ? "action.selected" : "action.hover",
              transition: "border-color 0.2s, background-color 0.2s",
              "&:hover": { borderColor: "primary.main" },
            }}
          >
            {previewUrl ? (
              <Box component="img" src={previewUrl} alt="미리보기"
                sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <Box sx={{ textAlign: "center", color: "text.disabled", p: 2 }}>
                <Icon icon="material-symbols:image-outline-rounded" style={{ fontSize: 40 }} />
                <Typography variant="caption" display="block" mt={1}>
                  클릭 또는 드래그하여 선택<br />(JPEG · PNG)
                </Typography>
              </Box>
            )}
            <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png"
              style={{ display: "none" }}
              onChange={(e) => { acceptFile(e.target.files?.[0]); e.target.value = ""; }} />
          </Box>

          {previewFile && (
            <Alert severity="info" sx={{ py: 0.5 }}>
              <Typography variant="caption">{previewFile.name}</Typography>
            </Alert>
          )}

          <TextField
            size="small" fullWidth
            label="표지 이름 (선택)"
            value={coverName}
            onChange={(e) => setCoverName(e.target.value)}
            disabled={uploading}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeUpload} disabled={uploading} color="inherit">취소</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!previewFile || uploading}
            startIcon={uploading
              ? <CircularProgress size={14} color="inherit" />
              : <Icon icon="material-symbols:cloud-upload-outline-rounded" />}
          >
            {uploading ? "업로드 중..." : "업로드"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
