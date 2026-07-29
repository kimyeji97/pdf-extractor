import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Icon } from "@iconify/react";

import { tintBg } from "theme/tint";

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
          // `*.lighter`는 두 모드가 공유해 다크에서 파스텔로 남는다 → tintBg (REQ-D08)
          bgcolor: active ? tintBg("primary") : selectedFile ? tintBg("success") : "background.paper",
          transition: "all 0.2s",
          userSelect: "none",
          "&:hover": disabled ? {} : {
            borderColor: "primary.main",
            bgcolor: tintBg("primary"),
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
            {/* 색은 Box의 sx로 주고 아이콘은 currentColor를 상속받는다.
                `var(--mui-palette-*)`를 직접 쓰면 안 된다 — 이 테마의 CSS 변수 접두사는
                `--palette-*`라 해석에 실패하고 **에러 없이 상속색으로 떨어진다**(2026-07-29 실측). */}
            <Box component="span" sx={{ color: "success.main", display: "flex" }}>
              <Icon
                icon="material-symbols:check-circle-outline-rounded"
                style={{ fontSize: 44 }}
              />
            </Box>
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
            <Box
              component="span"
              sx={{ color: active ? "primary.main" : "primary.light", display: "flex" }}
            >
              <Icon icon="material-symbols:cloud-upload-outline-rounded" style={{ fontSize: 48 }} />
            </Box>
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
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontWeight: 600,
                "&:hover": { bgcolor: "primary.dark" },
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
