import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Icon } from "@iconify/react";

const MAX_SIZE_MB = 10;

export default function UploadForm({ onFileSelected, selectedFile, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("PDF 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`파일 크기는 ${MAX_SIZE_MB}MB 이하여야 합니다.`);
      return;
    }
    setError("");
    onFileSelected(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); if (!disabled) setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (!disabled) handleFile(e.dataTransfer.files[0]);
  };

  const active = dragging && !disabled;

  return (
    <Box>
      <Box
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          border: "2px dashed",
          borderColor: active ? "primary.main" : selectedFile ? "success.main" : "divider",
          borderRadius: 2,
          py: 4, px: 2,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 1,
          cursor: disabled ? "not-allowed" : "pointer",
          bgcolor: active ? "primary.lighter" : selectedFile ? "success.lighter" : "background.paper",
          transition: "all 0.2s",
          userSelect: "none",
          "&:hover": disabled ? {} : {
            borderColor: "primary.main",
            bgcolor: "primary.lighter",
          },
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          disabled={disabled}
          onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ""; }}
        />

        {selectedFile ? (
          <>
            <Icon
              icon="material-symbols:check-circle-outline-rounded"
              style={{ fontSize: 44, color: "var(--mui-palette-success-main, #2e7d32)" }}
            />
            <Typography variant="body2" fontWeight={600} textAlign="center">
              {selectedFile.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
            </Typography>
            {!disabled && (
              <Button
                size="small" variant="outlined" color="inherit"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                sx={{ mt: 0.5, fontSize: 12, borderRadius: 5 }}
              >
                파일 변경
              </Button>
            )}
          </>
        ) : (
          <>
            <Icon
              icon="material-symbols:cloud-upload-outline-rounded"
              style={{
                fontSize: 48,
                color: active ? "var(--mui-palette-primary-main, #7c6ef5)" : "#a5a8f3",
              }}
            />
            <Typography variant="body1" fontWeight={500} textAlign="center" sx={{ mt: 0.5 }}>
              파일을 드래그하거나 선택하세요
            </Typography>
            <Typography variant="caption" color="text.secondary">
              PDF · 최대 {MAX_SIZE_MB}MB
            </Typography>
            <Button
              size="medium"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              disabled={disabled}
              sx={{
                mt: 1,
                px: 4, borderRadius: 5,
                bgcolor: "#7986cb",
                color: "#fff",
                fontWeight: 600,
                "&:hover": { bgcolor: "#5c6bc0" },
              }}
            >
              browse
            </Button>
          </>
        )}
      </Box>

      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.75, display: "block" }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
