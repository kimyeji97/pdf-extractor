/**
 * 문항 분석 - 파일 선택 페이지
 *
 * PDF 업로드 또는 기존 파일 클릭 → /analysis/:jobId 로 이동
 * 선택된 사이드바 메뉴(문항 분석)는 selectionPrefix로 유지됨
 */
import { useState } from "react";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import { Icon } from "@iconify/react";

import UploadForm from "components/UploadForm";
import FileListPanel from "components/FileListPanel";
import { requestUploadUrl, uploadPdf } from "api/client";

export default function AnalysisFilePage() {
  const navigate = useNavigate();

  const [uploading, setUploading]                     = useState(false);
  const [uploadError, setUploadError]                 = useState("");
  const [uploadWorkbookName, setUploadWorkbookName]   = useState("");
  const [uploadWorkbookTypes, setUploadWorkbookTypes] = useState("");
  const [selectedFile, setSelectedFile]               = useState(null);
  const [refreshTrigger, setRefreshTrigger]           = useState(0);

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
      setRefreshTrigger((t) => t + 1);
      setUploadWorkbookName("");
      setUploadWorkbookTypes("");
      setSelectedFile(null);
      navigate(`/analysis/${job_id}`, {
        state: { filename: selectedFile.name, workbookName: uploadWorkbookName.trim() || selectedFile.name },
      });
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (jobId, filename, workbookName) => {
    navigate(`/analysis/${jobId}`, { state: { filename, workbookName } });
  };

  return (
    <Box sx={{ display: "flex", height: "100%", overflow: "hidden" }}>

      {/* ── 업로드 패널 ─────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", borderRadius: 0, borderRight: 1, borderColor: "divider" }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
          <Icon icon="material-symbols:upload-file-outline-rounded" style={{ fontSize: 16 }} />
          <Typography variant="subtitle2" fontWeight={700}>PDF 업로드</Typography>
        </Box>

        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
          {uploadError && <Alert severity="error" sx={{ py: 0, fontSize: 12 }}>{uploadError}</Alert>}
          <TextField
            size="small" fullWidth
            placeholder="문제집 이름 (선택)"
            value={uploadWorkbookName}
            onChange={(e) => setUploadWorkbookName(e.target.value)}
            disabled={uploading}
          />
          <TextField
            size="small" fullWidth
            placeholder="유형 (쉼표로 구분)"
            value={uploadWorkbookTypes}
            onChange={(e) => setUploadWorkbookTypes(e.target.value)}
            disabled={uploading}
          />
          <UploadForm
            onFileSelected={(f) => { setSelectedFile(f); setUploadError(""); }}
            selectedFile={selectedFile}
            disabled={uploading}
          />
          <Button
            variant="contained" fullWidth size="small"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <Icon icon="material-symbols:upload-rounded" />}
          >
            {uploading ? "업로드 중..." : "업로드 후 분석"}
          </Button>
        </Box>

        <Divider />

        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            업로드하면 자동으로 문항 분석 화면으로 이동합니다.
          </Typography>
        </Box>
      </Paper>

      {/* ── 파일 목록 ────────────────────────────────── */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1.5 }}>
          <Icon icon="material-symbols:folder-open-outline-rounded" style={{ fontSize: 18 }} />
          <Typography variant="subtitle2" fontWeight={700}>파일 선택</Typography>
          <Typography variant="caption" color="text.secondary">
            파일을 클릭하면 문항 분석 화면으로 이동합니다.
          </Typography>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
          <FileListPanel
            selectedJobId={null}
            onSelect={handleFileSelect}
            refreshTrigger={refreshTrigger}
          />
        </Box>
      </Box>
    </Box>
  );
}
