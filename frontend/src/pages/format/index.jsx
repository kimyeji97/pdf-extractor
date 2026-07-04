/**
 * 표지 관리 페이지 (REQ-D05)
 *
 * 2패널 수평 레이아웃 (문항 분석 뷰와 디자인 통일):
 *   좌: ① 표지 업로드 (리사이즈 가능)
 *   우: ② 저장된 표지 목록
 */
import { useState, useEffect, useCallback, useRef } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import { Icon } from "@iconify/react";

import { listCovers, uploadCover, deleteCover } from "api/client";

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/api$/, "");

export default function FormatPage() {
  const [covers, setCovers]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [error, setError]             = useState("");
  const [coverName, setCoverName]     = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl]   = useState(null);
  const inputRef = useRef(null);

  // ── 패널 너비 (리사이즈) ────────────────────────────────
  const [panelWidth, setPanelWidth] = useState(300);
  const resizingRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizingRef.current) return;
      const { startX, startWidth } = resizingRef.current;
      setPanelWidth(Math.max(220, Math.min(480, startWidth + (e.clientX - startX))));
    };
    const handleMouseUp = () => {
      resizingRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startResize = (e) => {
    e.preventDefault();
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    resizingRef.current = { startX: e.clientX, startWidth: panelWidth };
  };

  const fetchCovers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCovers();
      setCovers(data.covers || []);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  }, []);

  useEffect(() => { fetchCovers(); }, [fetchCovers]);

  useEffect(() => {
    if (!previewFile) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(previewFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewFile]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      alert("JPEG 또는 PNG 이미지만 업로드할 수 있습니다."); return;
    }
    setPreviewFile(file); setError(""); e.target.value = "";
  };

  const handleUpload = async () => {
    if (!previewFile || uploading) return;
    setUploading(true); setError("");
    try {
      await uploadCover(previewFile, coverName);
      setPreviewFile(null); setPreviewUrl(null); setCoverName(""); fetchCovers();
    } catch (e) { setError(e.message); }
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
    <Box sx={{ display: "flex", height: "100%", overflow: "hidden" }}>

      {/* ── ① 업로드 패널 ────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          width: panelWidth, flexShrink: 0,
          display: "flex", flexDirection: "column", overflow: "hidden",
          borderRadius: 0, borderRight: 1, borderColor: "divider",
        }}
      >
        <Box sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="subtitle2" fontWeight={700}>① 표지 업로드</Typography>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            JPEG 또는 PNG 이미지를 업로드하세요.<br />
            문제집 생성 시 첫 페이지(표지)로 사용됩니다.
          </Typography>

          {/* 드롭존 */}
          <Box
            onClick={() => inputRef.current?.click()}
            sx={{
              width: "100%", aspectRatio: "3/4", maxHeight: 300,
              border: "2px dashed", borderColor: previewFile ? "primary.main" : "divider",
              borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", overflow: "hidden", bgcolor: "action.hover",
              transition: "border-color 0.2s",
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
                  이미지 클릭 선택<br />(JPEG · PNG)
                </Typography>
              </Box>
            )}
            <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png"
              style={{ display: "none" }} onChange={handleFileChange} />
          </Box>

          {previewFile && (
            <Alert severity="info" sx={{ py: 0.5 }}>
              <Typography variant="caption">{previewFile.name}</Typography>
            </Alert>
          )}

          <TextField
            size="small" fullWidth
            placeholder="표지 이름 (선택)"
            value={coverName}
            onChange={(e) => setCoverName(e.target.value)}
            disabled={uploading}
          />

          {error && <Alert severity="error" sx={{ py: 0.5 }}>{error}</Alert>}

          <Button
            variant="contained" fullWidth
            onClick={handleUpload}
            disabled={!previewFile || uploading}
            startIcon={uploading
              ? <CircularProgress size={16} color="inherit" />
              : <Icon icon="material-symbols:cloud-upload-outline-rounded" />}
          >
            {uploading ? "업로드 중..." : "업로드"}
          </Button>

          {previewFile && (
            <Button variant="outlined" color="error" size="small"
              onClick={() => { setPreviewFile(null); setPreviewUrl(null); }}>
              선택 취소
            </Button>
          )}
        </Box>
      </Paper>

      {/* 리사이즈 핸들 */}
      <Box
        onMouseDown={startResize}
        sx={{
          width: 4, flexShrink: 0, cursor: "col-resize", bgcolor: "divider",
          "&:hover": { bgcolor: "primary.light" }, transition: "background-color 0.15s",
        }}
      />

      {/* ── ② 저장된 표지 목록 ────────────────────────── */}
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Box sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle2" fontWeight={700}>② 저장된 표지</Typography>
          <Tooltip title="새로고침">
            <IconButton size="small" onClick={fetchCovers} disabled={loading}>
              {loading
                ? <CircularProgress size={16} />
                : <Icon icon="material-symbols:refresh-rounded" style={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
          {!loading && covers.length === 0 ? (
            <Box sx={{ pt: 8, textAlign: "center", color: "text.disabled" }}>
              <Icon icon="material-symbols:image-not-supported-outline-rounded" style={{ fontSize: 48 }} />
              <Typography variant="body2" mt={1.5} color="text.secondary">
                업로드된 표지가 없습니다.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={1.5}>
              {covers.map((c) => (
                <Grid item xs={6} sm={4} md={3} key={c.cover_id}>
                  <Card variant="outlined"
                    sx={{ position: "relative", "&:hover .delete-btn": { opacity: 1 } }}>
                    <CardMedia
                      component="img"
                      height={140}
                      image={`${API_ROOT}${c.thumbnail_url}`}
                      alt={c.name}
                      sx={{ objectFit: "cover" }}
                    />
                    <CardContent sx={{ py: 0.75, px: 1.25, "&:last-child": { pb: 0.75 } }}>
                      <Typography variant="caption" noWrap title={c.name} display="block">
                        {c.name || "이름 없음"}
                      </Typography>
                    </CardContent>
                    <IconButton
                      className="delete-btn"
                      size="small"
                      onClick={() => handleDelete(c.cover_id)}
                      sx={{
                        position: "absolute", top: 4, right: 4,
                        bgcolor: "error.main", color: "white",
                        opacity: 0, transition: "opacity 0.2s",
                        "&:hover": { bgcolor: "error.dark" },
                        width: 22, height: 22,
                      }}
                    >
                      <Icon icon="material-symbols:close-rounded" style={{ fontSize: 14 }} />
                    </IconButton>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>

    </Box>
  );
}
