/**
 * 문항 분석 페이지 (Aurora MUI 레이아웃 적용)
 * 비즈니스 로직은 기존과 동일, UI만 MUI로 교체
 */
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import { Icon } from "@iconify/react";

import FilePagePanel from "components/FilePagePanel";
import QuestionAnalysisPanel from "components/QuestionAnalysisPanel";
import UploadForm from "components/UploadForm";
import { requestUploadUrl, uploadPdf, addManualQuestion } from "api/client";

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/api$/, "");

// 리사이즈 핸들 스타일
const ResizeHandle = ({ onMouseDown }) => (
  <Box
    onMouseDown={onMouseDown}
    sx={{
      width: 4,
      flexShrink: 0,
      cursor: "col-resize",
      bgcolor: "divider",
      transition: "background-color 0.15s",
      "&:hover": { bgcolor: "primary.main" },
    }}
  />
);

export default function AnalysisPage() {
  // ── 선택 상태 ────────────────────────────────────────
  const [jobId, setJobId]                             = useState(null);
  const [selectedJobFilename, setSelectedJobFilename] = useState(null);
  const [selectedPage, setSelectedPage]               = useState(null);
  const [selectedPageInfo, setSelectedPageInfo]       = useState(null);

  // ── 업로드 ───────────────────────────────────────────
  const [uploading, setUploading]         = useState(false);
  const [uploadError, setUploadError]     = useState("");
  const [uploadWorkbookName, setUploadWorkbookName]   = useState("");
  const [uploadWorkbookTypes, setUploadWorkbookTypes] = useState("");
  const [selectedFile, setSelectedFile]   = useState(null);
  const [refreshTrigger, setRefreshTrigger]           = useState(0);
  const [panelRefreshTrigger, setPanelRefreshTrigger] = useState(0);

  // ── 패널 너비 (리사이즈) ─────────────────────────────
  const [panelWidths, setPanelWidths] = useState({ section1: 240, section2: 320 });
  const resizingRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      if (!resizingRef.current) return;
      const { panel, startX, startWidth } = resizingRef.current;
      const newWidth = Math.max(180, Math.min(480, startWidth + (e.clientX - startX)));
      setPanelWidths((prev) => ({ ...prev, [panel]: newWidth }));
    };
    const onUp = () => {
      resizingRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  const startResize = (panel, e) => {
    e.preventDefault();
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    resizingRef.current = { panel, startX: e.clientX, startWidth: panelWidths[panel] };
  };

  // ── 수동 추가 ─────────────────────────────────────────
  const [drawMode, setDrawMode]               = useState(false);
  const [isDragging, setIsDragging]           = useState(false);
  const [dragStart, setDragStart]             = useState(null);
  const [dragCurrent, setDragCurrent]         = useState(null);
  const [pendingRegionPx, setPendingRegionPx] = useState(null);
  const [pendingRegionPt, setPendingRegionPt] = useState(null);
  const [manualTitle, setManualTitle]         = useState("");
  const [manualTitleError, setManualTitleError] = useState("");
  const [addingManual, setAddingManual]       = useState(false);
  const imgRef     = useRef(null);
  const overlayRef = useRef(null);

  const handleJobChange = useCallback((jid, filename) => {
    setJobId(jid);
    setSelectedPage(null);
    setSelectedPageInfo(null);
    setSelectedJobFilename(filename || null);
    setDrawMode(false);
    setPendingRegionPx(null);
    setPendingRegionPt(null);
    setManualTitle("");
  }, []);

  const handlePageSelect = useCallback((jid, pageNum, pageInfo) => {
    setJobId(jid);
    setSelectedPage(pageNum);
    setSelectedPageInfo(pageInfo || null);
    setPanelRefreshTrigger((t) => t + 1);
    setPendingRegionPx(null);
    setPendingRegionPt(null);
    setManualTitle("");
    setManualTitleError("");
  }, []);

  const handleUploadClick = async () => {
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
      setJobId(null); setSelectedPage(null); setSelectedPageInfo(null);
      setSelectedJobFilename(null);
      setUploadWorkbookName(""); setUploadWorkbookTypes(""); setSelectedFile(null);
    } catch (e) { setUploadError(e.message); }
    finally    { setUploading(false); }
  };

  const toPdfCoords = useCallback((px) => {
    const img = imgRef.current;
    if (!img || !selectedPageInfo) return null;
    const scaleX = selectedPageInfo.width / img.clientWidth;
    const scaleY = selectedPageInfo.height / img.clientHeight;
    return {
      x0: Math.max(0, px.x0 * scaleX), y0: Math.max(0, px.y0 * scaleY),
      x1: Math.min(selectedPageInfo.width, px.x1 * scaleX),
      y1: Math.min(selectedPageInfo.height, px.y1 * scaleY),
    };
  }, [selectedPageInfo]);

  const getPos = (e) => {
    const rect = overlayRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(e.clientY - rect.top, rect.height)),
    };
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setPendingRegionPx(null); setPendingRegionPt(null);
    setManualTitle(""); setManualTitleError("");
    setIsDragging(true);
    const p = getPos(e);
    setDragStart(p); setDragCurrent(p);
  };
  const handleMouseMove = (e) => { if (isDragging) setDragCurrent(getPos(e)); };
  const handleMouseUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    const p = getPos(e);
    const x0 = Math.min(dragStart.x, p.x), y0 = Math.min(dragStart.y, p.y);
    const x1 = Math.max(dragStart.x, p.x), y1 = Math.max(dragStart.y, p.y);
    if (x1 - x0 > 8 && y1 - y0 > 8) {
      const pxRegion = { x0, y0, x1, y1 };
      setPendingRegionPx(pxRegion);
      setPendingRegionPt(toPdfCoords(pxRegion));
    }
    setDragStart(null); setDragCurrent(null);
  };

  const dragBox = useMemo(() => {
    if (!dragStart || !dragCurrent) return null;
    return {
      left: Math.min(dragStart.x, dragCurrent.x), top: Math.min(dragStart.y, dragCurrent.y),
      width: Math.abs(dragCurrent.x - dragStart.x), height: Math.abs(dragCurrent.y - dragStart.y),
    };
  }, [dragStart, dragCurrent]);

  const handleAddManual = async () => {
    if (!manualTitle.trim()) { setManualTitleError("타이틀을 입력해주세요."); return; }
    if (!pendingRegionPt || jobId == null || selectedPage == null) return;
    setAddingManual(true); setManualTitleError("");
    try {
      await addManualQuestion(jobId, selectedPage, { title: manualTitle.trim(), region: pendingRegionPt });
      setPendingRegionPx(null); setPendingRegionPt(null); setManualTitle(""); setDrawMode(false);
      setPanelRefreshTrigger((t) => t + 1);
    } catch (e) { setManualTitleError(e.message || "추가에 실패했습니다."); }
    finally     { setAddingManual(false); }
  };

  const handleCancelManual = () => {
    setPendingRegionPx(null); setPendingRegionPt(null);
    setManualTitle(""); setManualTitleError("");
  };
  const toggleDrawMode = () => { setDrawMode((v) => !v); handleCancelManual(); };

  const pageThumbUrl = selectedPageInfo?.thumbnail_url
    ? `${API_ROOT}${selectedPageInfo.thumbnail_url}` : null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* 컨텍스트 바 */}
      {selectedJobFilename && (
        <Box sx={{ px: 2.5, py: 0.75, bgcolor: "primary.lighter", borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
          <Icon icon="material-symbols:description-outline-rounded" style={{ fontSize: 16, color: "var(--aurora-palette-primary-main)" }} />
          <Typography variant="caption" color="primary.main" fontWeight={600}>{selectedJobFilename}</Typography>
          {selectedPage !== null && (
            <Chip label={`${selectedPage + 1}페이지`} size="small" variant="outlined" color="primary" />
          )}
        </Box>
      )}

      {/* 3패널 */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ① 파일·페이지 */}
        <Paper
          elevation={0}
          sx={{ width: panelWidths.section1, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: 0, borderRight: 1, borderColor: "divider" }}
        >
          <Box sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
            <Typography variant="subtitle2" fontWeight={700}>① 파일·페이지</Typography>
          </Box>

          {/* 업로드 폼 */}
          <Box sx={{ p: 1.5, borderBottom: 1, borderColor: "divider", flexShrink: 0, display: "flex", flexDirection: "column", gap: 1 }}>
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
              onClick={handleUploadClick}
              disabled={!selectedFile || uploading}
              startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <Icon icon="material-symbols:upload-rounded" />}
            >
              {uploading ? "업로드 중..." : "업로드"}
            </Button>
          </Box>

          {/* 파일·페이지 패널 */}
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <FilePagePanel
              onPageSelect={handlePageSelect}
              onJobChange={handleJobChange}
              refreshTrigger={refreshTrigger}
              selectedPageNum={selectedPage}
            />
          </Box>
        </Paper>

        <ResizeHandle onMouseDown={(e) => startResize("section1", e)} />

        {/* ② 페이지 미리보기 */}
        <Paper
          elevation={0}
          sx={{ width: panelWidths.section2, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: 0, borderRight: 1, borderColor: "divider" }}
        >
          <Box sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <Typography variant="subtitle2" fontWeight={700}>② 페이지 미리보기</Typography>
            {pageThumbUrl && (
              <Button
                size="small" variant={drawMode ? "contained" : "outlined"}
                color={drawMode ? "error" : "primary"}
                onClick={toggleDrawMode}
                startIcon={<Icon icon={drawMode ? "material-symbols:close" : "material-symbols:edit-outline-rounded"} />}
                sx={{ minWidth: 0, px: 1.5, fontSize: 12 }}
              >
                {drawMode ? "종료" : "수동 추가"}
              </Button>
            )}
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto", p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
            {pageThumbUrl ? (
              <>
                {drawMode && (
                  <Alert severity="info" sx={{ py: 0, fontSize: 12 }}>
                    이미지 위에서 드래그하여 영역을 지정하세요.
                  </Alert>
                )}

                <Box sx={{ position: "relative", width: "100%", cursor: drawMode ? "crosshair" : "default" }}>
                  <Box
                    component="img"
                    ref={imgRef}
                    src={pageThumbUrl}
                    alt={`${(selectedPage ?? 0) + 1}페이지`}
                    draggable={false}
                    sx={{ width: "100%", display: "block", userSelect: "none" }}
                  />
                  {drawMode && (
                    <Box
                      ref={overlayRef}
                      sx={{ position: "absolute", inset: 0 }}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={() => isDragging && handleMouseUp({ clientX: 0, clientY: 0 })}
                    >
                      {dragBox && (
                        <Box sx={{ position: "absolute", left: dragBox.left, top: dragBox.top, width: dragBox.width, height: dragBox.height, border: "2px dashed", borderColor: "primary.main", bgcolor: "primary.lighter", opacity: 0.6, pointerEvents: "none" }} />
                      )}
                      {pendingRegionPx && !isDragging && (
                        <Box sx={{ position: "absolute", left: pendingRegionPx.x0, top: pendingRegionPx.y0, width: pendingRegionPx.x1 - pendingRegionPx.x0, height: pendingRegionPx.y1 - pendingRegionPx.y0, border: "2px solid", borderColor: "primary.main", bgcolor: "primary.lighter", opacity: 0.5, pointerEvents: "none" }} />
                      )}
                    </Box>
                  )}
                </Box>

                {/* 수동 문항 추가 폼 */}
                {drawMode && pendingRegionPt && (
                  <Paper variant="outlined" sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
                    <TextField
                      size="small" fullWidth autoFocus
                      placeholder="문항 타이틀 (필수)"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      error={!!manualTitleError}
                      helperText={manualTitleError}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")  handleAddManual();
                        if (e.key === "Escape") handleCancelManual();
                      }}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button variant="contained" size="small" onClick={handleAddManual} disabled={addingManual} fullWidth>
                        {addingManual ? "추가 중..." : "추가"}
                      </Button>
                      <Button variant="outlined" size="small" onClick={handleCancelManual} fullWidth>취소</Button>
                    </Stack>
                  </Paper>
                )}
              </>
            ) : (
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "text.disabled", gap: 1.5, py: 6 }}>
                <Icon icon="material-symbols:image-outline-rounded" style={{ fontSize: 48 }} />
                <Typography variant="body2" textAlign="center" color="text.secondary">
                  페이지를 선택하면<br />미리보기가 표시됩니다.
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>

        <ResizeHandle onMouseDown={(e) => startResize("section2", e)} />

        {/* ③ 문항 목록 */}
        <Paper elevation={0} sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: 0 }}>
          {selectedPage !== null && jobId ? (
            <QuestionAnalysisPanel
              key={`${jobId}-${selectedPage}`}
              jobId={jobId}
              pageNum={selectedPage}
              pageInfo={selectedPageInfo}
              refreshTrigger={panelRefreshTrigger}
            />
          ) : (
            <>
              <Box sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
                <Typography variant="subtitle2" fontWeight={700}>③ 문항 목록</Typography>
              </Box>
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "text.disabled", gap: 1.5 }}>
                <Icon icon="material-symbols:list-alt-outline-rounded" style={{ fontSize: 48 }} />
                <Typography variant="body2" textAlign="center" color="text.secondary">
                  페이지를 선택하면<br />문항 목록이 표시됩니다.
                </Typography>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
