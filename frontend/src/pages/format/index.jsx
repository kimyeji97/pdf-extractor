/**
 * 표지 관리 페이지 (Aurora MUI 레이아웃 적용)
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
import CardActions from "@mui/material/CardActions";
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
      setError("");
    } catch (e) { alert(e.message); }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>

      {/* 업로드 섹션 */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={700} mb={0.5}>표지 이미지 업로드</Typography>
        <Typography variant="body2" color="text.secondary" mb={2.5}>
          JPEG 또는 PNG 이미지를 업로드하세요. 문제집 생성 시 첫 페이지(표지)로 사용됩니다.
        </Typography>

        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* 드롭존 */}
          <Box
            onClick={() => inputRef.current?.click()}
            sx={{
              width: 180, height: 240, border: "2px dashed", borderColor: previewFile ? "primary.main" : "divider",
              borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", overflow: "hidden", flexShrink: 0, bgcolor: "action.hover",
              transition: "border-color 0.2s",
              "&:hover": { borderColor: "primary.main" },
            }}
          >
            {previewUrl ? (
              <Box component="img" src={previewUrl} alt="미리보기" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Box sx={{ textAlign: "center", color: "text.disabled", p: 2 }}>
                <Icon icon="material-symbols:image-outline-rounded" style={{ fontSize: 40 }} />
                <Typography variant="caption" display="block" mt={1}>이미지 클릭 선택<br />(JPEG · PNG)</Typography>
              </Box>
            )}
            <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png" style={{ display: "none" }} onChange={handleFileChange} />
          </Box>

          {/* 메타 입력 + 버튼 */}
          <Box sx={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 1.5 }}>
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
              startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <Icon icon="material-symbols:cloud-upload-outline-rounded" />}
            >
              {uploading ? "업로드 중..." : "업로드"}
            </Button>
            {previewFile && (
              <Button variant="outlined" color="error" size="small" onClick={() => { setPreviewFile(null); setPreviewUrl(null); }}>
                선택 취소
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* 저장된 표지 목록 */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>저장된 표지</Typography>
        <Tooltip title="새로고침">
          <IconButton size="small" onClick={fetchCovers} disabled={loading}>
            {loading ? <CircularProgress size={18} /> : <Icon icon="material-symbols:refresh-rounded" style={{ fontSize: 22 }} />}
          </IconButton>
        </Tooltip>
      </Box>

      {!loading && covers.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: "center", color: "text.disabled" }}>
          <Icon icon="material-symbols:image-not-supported-outline-rounded" style={{ fontSize: 48 }} />
          <Typography variant="body2" mt={1.5} color="text.secondary">업로드된 표지가 없습니다.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {covers.map((c) => (
            <Grid item xs={6} sm={4} md={3} key={c.cover_id}>
              <Card variant="outlined" sx={{ position: "relative", "&:hover .delete-btn": { opacity: 1 } }}>
                <CardMedia
                  component="img"
                  height={160}
                  image={`${API_ROOT}${c.thumbnail_url}`}
                  alt={c.name}
                  sx={{ objectFit: "cover" }}
                />
                <CardContent sx={{ py: 1, px: 1.5, "&:last-child": { pb: 1 } }}>
                  <Typography variant="caption" noWrap title={c.name} display="block">{c.name || "이름 없음"}</Typography>
                </CardContent>
                <IconButton
                  className="delete-btn"
                  size="small"
                  onClick={() => handleDelete(c.cover_id)}
                  sx={{
                    position: "absolute", top: 6, right: 6,
                    bgcolor: "error.main", color: "white",
                    opacity: 0, transition: "opacity 0.2s",
                    "&:hover": { bgcolor: "error.dark" },
                    width: 24, height: 24,
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
  );
}
