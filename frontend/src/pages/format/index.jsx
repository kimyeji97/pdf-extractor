/**
 * 템플릿 관리 페이지 (REQ-D06 표지 관리 → REQ-D11 이름 변경 → REQ-29 각주·워터마크 탭 추가)
 *
 * 탭 3개: 표지 · 각주 · 워터마크. 표지·워터마크는 같은 모양(1패널 목록형 + 업로드 모달)이고,
 * 각주만 이미지 대신 이름+텍스트 입력 폼이다(REQ-29 § 결정 "각주 콘텐츠 형태").
 * REQ-30(템플릿 조합)이 이 셋을 묶는 UI를 이 화면 위에 추가할 예정 — 지금은 개별 등록까지만.
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
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Paper from "@mui/material/Paper";
import { Icon } from "@iconify/react";

import PageHeader from "components/PageHeader";
import BookCard, { BOOK_CARD_W } from "components/BookCard";
import {
  listCovers, uploadCover, deleteCover,
  listFootnotes, createFootnote, deleteFootnote,
  listWatermarks, uploadWatermark, deleteWatermark,
} from "api/client";

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/api$/, "");

const COVER_H = 226;   // BookCard 표지 높이와 맞춘다

function UploadCard({ label, onClick }) {
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
        <Typography variant="caption" fontWeight={600}>{label}</Typography>
      </Box>
    </Box>
  );
}

// 표지·워터마크는 실제 이미지라 두께 정보가 없다 — 가장 얇은 1층으로 통일한다
// (분석 목록의 책은 문항 수에 따라 두꺼워지므로 자연히 구분된다)
function ImageAssetCard({ id, name, thumbnailUrl, colorKey, onDelete }) {
  return (
    <BookCard
      coverUrl={`${API_ROOT}${thumbnailUrl}`}
      title={name || "이름 없음"}
      colorKey={colorKey}
      questionCount={null}
      actions={
        <Tooltip title="삭제">
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onDelete(id); }}
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

// 각주는 텍스트뿐이라 이미지 카드 대신 텍스트 카드로 보여준다.
function FootnoteCard({ footnote, onDelete }) {
  return (
    <Paper
      elevation={0}
      sx={{
        width: BOOK_CARD_W, height: COVER_H, flexShrink: 0,
        p: 1.5, display: "flex", flexDirection: "column", gap: 0.5,
        borderRadius: 2, boxShadow: (theme) => theme.customShadows?.card,
        position: "relative",
      }}
    >
      <Tooltip title="삭제">
        <IconButton
          size="small"
          onClick={() => onDelete(footnote.footnote_id)}
          sx={{
            position: "absolute", top: 6, right: 6,
            bgcolor: "background.paper", color: "error.main",
            opacity: 0.92, "&:hover": { opacity: 1 },
          }}
        >
          <Icon icon="material-symbols:delete-outline-rounded" style={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ pr: 3 }}>
        {footnote.name || "이름 없음"}
      </Typography>
      <Typography
        variant="caption" color="text.secondary"
        sx={{
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 6, WebkitBoxOrient: "vertical",
        }}
      >
        {footnote.text}
      </Typography>
    </Paper>
  );
}

export default function FormatPage() {
  const [tab, setTab] = useState(0);   // 0=표지 · 1=각주 · 2=워터마크

  // ── 표지 ──────────────────────────────────────────────
  const [covers, setCovers]         = useState([]);
  const [coversLoading, setCoversLoading] = useState(false);
  const [coversError, setCoversError]     = useState("");
  const [coverUploadOpen, setCoverUploadOpen] = useState(false);
  const [coverUploading, setCoverUploading]   = useState(false);
  const [coverUploadError, setCoverUploadError] = useState("");
  const [coverName, setCoverName]     = useState("");
  const [coverFile, setCoverFile]     = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
  const [coverDragOver, setCoverDragOver]     = useState(false);
  const coverInputRef = useRef(null);

  const fetchCovers = useCallback(async () => {
    setCoversLoading(true); setCoversError("");
    try {
      const data = await listCovers();
      setCovers(data.covers || []);
    } catch (e) { setCoversError(e.message); }
    finally     { setCoversLoading(false); }
  }, []);

  useEffect(() => { fetchCovers(); }, [fetchCovers]);

  useEffect(() => {
    if (!coverFile) { setCoverPreviewUrl(null); return; }
    const url = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const acceptCoverFile = (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setCoverUploadError("JPEG 또는 PNG 이미지만 업로드할 수 있습니다."); return;
    }
    setCoverFile(file); setCoverUploadError("");
  };

  const openCoverUpload = () => {
    setCoverUploadError(""); setCoverName(""); setCoverFile(null); setCoverUploadOpen(true);
  };
  const closeCoverUpload = () => { if (!coverUploading) setCoverUploadOpen(false); };

  const handleCoverUpload = async () => {
    if (!coverFile || coverUploading) return;
    setCoverUploading(true); setCoverUploadError("");
    try {
      await uploadCover(coverFile, coverName);
      setCoverUploadOpen(false);
      await fetchCovers();
    } catch (e) { setCoverUploadError(e.message); }
    finally     { setCoverUploading(false); }
  };

  const handleCoverDelete = async (coverId) => {
    if (!confirm("이 표지를 삭제하시겠습니까?")) return;
    try {
      await deleteCover(coverId);
      setCovers((prev) => prev.filter((c) => c.cover_id !== coverId));
    } catch (e) { alert(e.message); }
  };

  // ── 각주 (REQ-29) ─────────────────────────────────────
  const [footnotes, setFootnotes] = useState([]);
  const [footnotesLoading, setFootnotesLoading] = useState(false);
  const [footnotesError, setFootnotesError]     = useState("");
  const [footnoteDialogOpen, setFootnoteDialogOpen] = useState(false);
  const [footnoteSaving, setFootnoteSaving]     = useState(false);
  const [footnoteSaveError, setFootnoteSaveError] = useState("");
  const [footnoteName, setFootnoteName] = useState("");
  const [footnoteText, setFootnoteText] = useState("");

  const fetchFootnotes = useCallback(async () => {
    setFootnotesLoading(true); setFootnotesError("");
    try {
      const data = await listFootnotes();
      setFootnotes(data.footnotes || []);
    } catch (e) { setFootnotesError(e.message); }
    finally     { setFootnotesLoading(false); }
  }, []);

  useEffect(() => { fetchFootnotes(); }, [fetchFootnotes]);

  const openFootnoteDialog = () => {
    setFootnoteSaveError(""); setFootnoteName(""); setFootnoteText(""); setFootnoteDialogOpen(true);
  };
  const closeFootnoteDialog = () => { if (!footnoteSaving) setFootnoteDialogOpen(false); };

  const handleFootnoteSave = async () => {
    if (!footnoteName.trim() || !footnoteText.trim() || footnoteSaving) return;
    setFootnoteSaving(true); setFootnoteSaveError("");
    try {
      await createFootnote(footnoteName.trim(), footnoteText.trim());
      setFootnoteDialogOpen(false);
      await fetchFootnotes();
    } catch (e) { setFootnoteSaveError(e.message); }
    finally     { setFootnoteSaving(false); }
  };

  const handleFootnoteDelete = async (footnoteId) => {
    if (!confirm("이 각주를 삭제하시겠습니까?")) return;
    try {
      await deleteFootnote(footnoteId);
      setFootnotes((prev) => prev.filter((f) => f.footnote_id !== footnoteId));
    } catch (e) { alert(e.message); }
  };

  // ── 워터마크 (REQ-29) — 표지와 완전히 동일한 업로드 방식 ──
  const [watermarks, setWatermarks] = useState([]);
  const [watermarksLoading, setWatermarksLoading] = useState(false);
  const [watermarksError, setWatermarksError]     = useState("");
  const [watermarkUploadOpen, setWatermarkUploadOpen] = useState(false);
  const [watermarkUploading, setWatermarkUploading]   = useState(false);
  const [watermarkUploadError, setWatermarkUploadError] = useState("");
  const [watermarkName, setWatermarkName]     = useState("");
  const [watermarkFile, setWatermarkFile]     = useState(null);
  const [watermarkPreviewUrl, setWatermarkPreviewUrl] = useState(null);
  const [watermarkDragOver, setWatermarkDragOver]     = useState(false);
  const watermarkInputRef = useRef(null);

  const fetchWatermarks = useCallback(async () => {
    setWatermarksLoading(true); setWatermarksError("");
    try {
      const data = await listWatermarks();
      setWatermarks(data.watermarks || []);
    } catch (e) { setWatermarksError(e.message); }
    finally     { setWatermarksLoading(false); }
  }, []);

  useEffect(() => { fetchWatermarks(); }, [fetchWatermarks]);

  useEffect(() => {
    if (!watermarkFile) { setWatermarkPreviewUrl(null); return; }
    const url = URL.createObjectURL(watermarkFile);
    setWatermarkPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [watermarkFile]);

  const acceptWatermarkFile = (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setWatermarkUploadError("JPEG 또는 PNG 이미지만 업로드할 수 있습니다."); return;
    }
    setWatermarkFile(file); setWatermarkUploadError("");
  };

  const openWatermarkUpload = () => {
    setWatermarkUploadError(""); setWatermarkName(""); setWatermarkFile(null); setWatermarkUploadOpen(true);
  };
  const closeWatermarkUpload = () => { if (!watermarkUploading) setWatermarkUploadOpen(false); };

  const handleWatermarkUpload = async () => {
    if (!watermarkFile || watermarkUploading) return;
    setWatermarkUploading(true); setWatermarkUploadError("");
    try {
      await uploadWatermark(watermarkFile, watermarkName);
      setWatermarkUploadOpen(false);
      await fetchWatermarks();
    } catch (e) { setWatermarkUploadError(e.message); }
    finally     { setWatermarkUploading(false); }
  };

  const handleWatermarkDelete = async (watermarkId) => {
    if (!confirm("이 워터마크를 삭제하시겠습니까?")) return;
    try {
      await deleteWatermark(watermarkId);
      setWatermarks((prev) => prev.filter((w) => w.watermark_id !== watermarkId));
    } catch (e) { alert(e.message); }
  };

  const refreshing = tab === 0 ? coversLoading : tab === 1 ? footnotesLoading : watermarksLoading;
  const refresh = tab === 0 ? fetchCovers : tab === 1 ? fetchFootnotes : fetchWatermarks;

  return (
    <Box sx={{
      display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
      gap: 2, p: 2, bgcolor: "background.default",
    }}>

      {/* ── 페이지 헤더 + 브레드크럼 (REQ-D07 2안) ──────── */}
      <PageHeader
        title="템플릿 관리"
        crumbs={[{ label: "홈", to: "/" }, { label: "템플릿 관리" }]}
        actions={
          <Tooltip title="새로고침">
            <IconButton size="small" onClick={refresh} disabled={refreshing}>
              {refreshing
                ? <CircularProgress size={16} />
                : <Icon icon="material-symbols:refresh-rounded" style={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
        }
      />

      {/* ── 탭 (REQ-29) — 표지·각주·워터마크. REQ-30이 조합 UI를 여기 더할 예정 ── */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ flexShrink: 0, minHeight: 36 }}>
        <Tab label="표지" sx={{ minHeight: 36 }} />
        <Tab label="각주" sx={{ minHeight: 36 }} />
        <Tab label="워터마크" sx={{ minHeight: 36 }} />
      </Tabs>

      {tab === 0 && coversError && (
        <Alert severity="error" sx={{ flexShrink: 0 }} onClose={() => setCoversError("")}>{coversError}</Alert>
      )}
      {tab === 1 && footnotesError && (
        <Alert severity="error" sx={{ flexShrink: 0 }} onClose={() => setFootnotesError("")}>{footnotesError}</Alert>
      )}
      {tab === 2 && watermarksError && (
        <Alert severity="error" sx={{ flexShrink: 0 }} onClose={() => setWatermarksError("")}>{watermarksError}</Alert>
      )}

      {/* ── 메인: 카드 래핑 그리드 (세로 스크롤) ─────────── */}
      <Box sx={{
        flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden",
        display: "flex", flexWrap: "wrap", gap: 2,
        p: 2, borderRadius: 2, alignContent: "flex-start",
        bgcolor: "background.paper",
        boxShadow: (theme) => theme.customShadows?.card,
      }}>
        {tab === 0 && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ width: 1, mb: -0.5 }}>
              문제집 생성 시 첫 페이지로 넣을 표지를 관리합니다.
            </Typography>
            <UploadCard label="표지 업로드" onClick={openCoverUpload} />
            {coversLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", pl: 2 }}><CircularProgress size={24} /></Box>
            ) : (
              covers.map((c) => (
                <ImageAssetCard
                  key={c.cover_id} id={c.cover_id} name={c.name}
                  thumbnailUrl={c.thumbnail_url} colorKey={c.cover_id}
                  onDelete={handleCoverDelete}
                />
              ))
            )}
            {!coversLoading && covers.length === 0 && (
              <Box sx={{ display: "flex", alignItems: "center", pl: 2, color: "text.disabled" }}>
                <Typography variant="body2" color="text.disabled">업로드된 표지가 없습니다.</Typography>
              </Box>
            )}
          </>
        )}

        {tab === 1 && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ width: 1, mb: -0.5 }}>
              문제집 생성 시 표지를 제외한 모든 페이지 하단에 넣을 각주를 관리합니다.
            </Typography>
            <UploadCard label="각주 추가" onClick={openFootnoteDialog} />
            {footnotesLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", pl: 2 }}><CircularProgress size={24} /></Box>
            ) : (
              footnotes.map((f) => (
                <FootnoteCard key={f.footnote_id} footnote={f} onDelete={handleFootnoteDelete} />
              ))
            )}
            {!footnotesLoading && footnotes.length === 0 && (
              <Box sx={{ display: "flex", alignItems: "center", pl: 2, color: "text.disabled" }}>
                <Typography variant="body2" color="text.disabled">등록된 각주가 없습니다.</Typography>
              </Box>
            )}
          </>
        )}

        {tab === 2 && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ width: 1, mb: -0.5 }}>
              문제집 생성 시 표지를 제외한 모든 페이지 중앙에 반투명하게 넣을 워터마크를 관리합니다.
            </Typography>
            <UploadCard label="워터마크 업로드" onClick={openWatermarkUpload} />
            {watermarksLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", pl: 2 }}><CircularProgress size={24} /></Box>
            ) : (
              watermarks.map((w) => (
                <ImageAssetCard
                  key={w.watermark_id} id={w.watermark_id} name={w.name}
                  thumbnailUrl={w.thumbnail_url} colorKey={w.watermark_id}
                  onDelete={handleWatermarkDelete}
                />
              ))
            )}
            {!watermarksLoading && watermarks.length === 0 && (
              <Box sx={{ display: "flex", alignItems: "center", pl: 2, color: "text.disabled" }}>
                <Typography variant="body2" color="text.disabled">업로드된 워터마크가 없습니다.</Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* ── 표지 업로드 모달 ───────────────────────────── */}
      <Dialog open={coverUploadOpen} onClose={closeCoverUpload} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>표지 업로드</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          {coverUploadError && <Alert severity="error" sx={{ py: 0 }}>{coverUploadError}</Alert>}
          <Box
            onClick={() => coverInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setCoverDragOver(true); }}
            onDragLeave={() => setCoverDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setCoverDragOver(false); acceptCoverFile(e.dataTransfer.files?.[0]); }}
            sx={{
              width: "100%", aspectRatio: "3/4", maxHeight: 300,
              border: "2px dashed",
              borderColor: coverDragOver || coverFile ? "primary.main" : "divider",
              borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", overflow: "hidden", bgcolor: coverDragOver ? "action.selected" : "action.hover",
              transition: "border-color 0.2s, background-color 0.2s",
              "&:hover": { borderColor: "primary.main" },
            }}
          >
            {coverPreviewUrl ? (
              <Box component="img" src={coverPreviewUrl} alt="미리보기"
                sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <Box sx={{ textAlign: "center", color: "text.disabled", p: 2 }}>
                <Icon icon="material-symbols:image-outline-rounded" style={{ fontSize: 40 }} />
                <Typography variant="caption" display="block" mt={1}>클릭 또는 드래그하여 선택<br />(JPEG · PNG)</Typography>
              </Box>
            )}
            <input ref={coverInputRef} type="file" accept="image/jpeg,image/jpg,image/png"
              style={{ display: "none" }}
              onChange={(e) => { acceptCoverFile(e.target.files?.[0]); e.target.value = ""; }} />
          </Box>
          {coverFile && (
            <Alert severity="info" sx={{ py: 0.5 }}><Typography variant="caption">{coverFile.name}</Typography></Alert>
          )}
          <TextField
            size="small" fullWidth label="표지 이름 (선택)"
            value={coverName} onChange={(e) => setCoverName(e.target.value)} disabled={coverUploading}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeCoverUpload} disabled={coverUploading} color="inherit">취소</Button>
          <Button
            variant="contained" onClick={handleCoverUpload} disabled={!coverFile || coverUploading}
            startIcon={coverUploading ? <CircularProgress size={14} color="inherit" /> : <Icon icon="material-symbols:cloud-upload-outline-rounded" />}
          >
            {coverUploading ? "업로드 중..." : "업로드"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── 각주 등록 모달 (REQ-29) ─────────────────────── */}
      <Dialog open={footnoteDialogOpen} onClose={closeFootnoteDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>각주 등록</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          {footnoteSaveError && <Alert severity="error" sx={{ py: 0 }}>{footnoteSaveError}</Alert>}
          <TextField
            size="small" fullWidth autoFocus label="각주 이름"
            value={footnoteName} onChange={(e) => setFootnoteName(e.target.value)} disabled={footnoteSaving}
          />
          <TextField
            size="small" fullWidth multiline minRows={3} label="각주 텍스트"
            value={footnoteText} onChange={(e) => setFootnoteText(e.target.value)} disabled={footnoteSaving}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeFootnoteDialog} disabled={footnoteSaving} color="inherit">취소</Button>
          <Button
            variant="contained" onClick={handleFootnoteSave}
            disabled={!footnoteName.trim() || !footnoteText.trim() || footnoteSaving}
            startIcon={footnoteSaving ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {footnoteSaving ? "저장 중..." : "저장"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── 워터마크 업로드 모달 (REQ-29) ────────────────── */}
      <Dialog open={watermarkUploadOpen} onClose={closeWatermarkUpload} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>워터마크 업로드</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          {watermarkUploadError && <Alert severity="error" sx={{ py: 0 }}>{watermarkUploadError}</Alert>}
          <Box
            onClick={() => watermarkInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setWatermarkDragOver(true); }}
            onDragLeave={() => setWatermarkDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setWatermarkDragOver(false); acceptWatermarkFile(e.dataTransfer.files?.[0]); }}
            sx={{
              width: "100%", aspectRatio: "3/4", maxHeight: 300,
              border: "2px dashed",
              borderColor: watermarkDragOver || watermarkFile ? "primary.main" : "divider",
              borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", overflow: "hidden", bgcolor: watermarkDragOver ? "action.selected" : "action.hover",
              transition: "border-color 0.2s, background-color 0.2s",
              "&:hover": { borderColor: "primary.main" },
            }}
          >
            {watermarkPreviewUrl ? (
              <Box component="img" src={watermarkPreviewUrl} alt="미리보기"
                sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <Box sx={{ textAlign: "center", color: "text.disabled", p: 2 }}>
                <Icon icon="material-symbols:image-outline-rounded" style={{ fontSize: 40 }} />
                <Typography variant="caption" display="block" mt={1}>클릭 또는 드래그하여 선택<br />(JPEG · PNG)</Typography>
              </Box>
            )}
            <input ref={watermarkInputRef} type="file" accept="image/jpeg,image/jpg,image/png"
              style={{ display: "none" }}
              onChange={(e) => { acceptWatermarkFile(e.target.files?.[0]); e.target.value = ""; }} />
          </Box>
          {watermarkFile && (
            <Alert severity="info" sx={{ py: 0.5 }}><Typography variant="caption">{watermarkFile.name}</Typography></Alert>
          )}
          <TextField
            size="small" fullWidth label="워터마크 이름 (선택)"
            value={watermarkName} onChange={(e) => setWatermarkName(e.target.value)} disabled={watermarkUploading}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeWatermarkUpload} disabled={watermarkUploading} color="inherit">취소</Button>
          <Button
            variant="contained" onClick={handleWatermarkUpload} disabled={!watermarkFile || watermarkUploading}
            startIcon={watermarkUploading ? <CircularProgress size={14} color="inherit" /> : <Icon icon="material-symbols:cloud-upload-outline-rounded" />}
          >
            {watermarkUploading ? "업로드 중..." : "업로드"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
