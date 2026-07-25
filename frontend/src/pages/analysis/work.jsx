/**
 * 문항 분석 - 작업 페이지 (/analysis/:jobId)
 *
 * 파일 선택 페이지(/)에서 파일을 고른 뒤 진입.
 * ① 페이지 목록  ② 페이지 미리보기(PDF 뷰어, REQ-F07)  ③ 문항 목록  3패널 구성.
 * 뒤로 가기 → 파일 선택 페이지로 복귀 (사이드바 메뉴 유지).
 *
 * REQ-F07: ② 미리보기를 페이지 썸네일 → PdfPreviewPanel(react-pdf)로 전환.
 *   - ① 페이지 클릭 ↔ 뷰어 스크롤 양방향 동기화 (뷰어 스크롤 → ③ 자동 전환, 250ms 디바운스)
 *   - 수동 문항 드래그 오버레이는 renderPageOverlay로 각 페이지 위에 렌더
 *   - 좌표 변환: PDF pt = CSS px / scale (react-pdf가 pt×scale로 렌더하므로)
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import { Icon } from "@iconify/react";

import QuestionAnalysisPanel from "components/QuestionAnalysisPanel";
import PdfPreviewPanel from "components/PdfPreviewPanel";
import { getPages, refreshJobQuestions, getJobInfo, addManualQuestion, getAllQuestions } from "api/client";

const clamp = (v, min, max) => Math.max(min, Math.min(v, max));

const ResizeHandle = ({ onMouseDown }) => (
  <Box
    onMouseDown={onMouseDown}
    sx={{
      width: 4, flexShrink: 0, cursor: "col-resize", bgcolor: "divider",
      transition: "background-color 0.15s",
      "&:hover": { bgcolor: "primary.main" },
    }}
  />
);

export default function AnalysisWorkPage() {
  const { jobId } = useParams();
  const { state } = useLocation();
  const navigate  = useNavigate();

  const filename    = state?.filename    || jobId;
  const workbookName = state?.workbookName || "";

  // ── 페이지 목록 ───────────────────────────────────────
  const [pages, setPages]               = useState([]);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [pagesError, setPagesError]     = useState("");
  const [refreshing, setRefreshing]     = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const pagesRef = useRef(pages);
  useEffect(() => { pagesRef.current = pages; }, [pages]);
  const refreshPollRef = useRef(null);
  useEffect(() => () => {
    if (refreshPollRef.current) clearInterval(refreshPollRef.current);
  }, []);

  // ── 원본 PDF URL (REQ-F07) ────────────────────────────
  const [pdfUrl, setPdfUrl]               = useState(null);
  const [pdfUrlLoading, setPdfUrlLoading] = useState(true);

  // ── 선택 상태 ─────────────────────────────────────────
  const [selectedPage, setSelectedPage]         = useState(null);
  const [selectedPageInfo, setSelectedPageInfo] = useState(null);
  const [panelRefreshTrigger, setPanelRefreshTrigger] = useState(0);

  // ── 패널 너비 ─────────────────────────────────────────
  // section1(페이지 목록)은 고정, section3(문항 목록)만 리사이즈 (200~800px, 기본 420px)
  // section2(미리보기)는 남는 공간을 채움
  const SECTION1_WIDTH = 200;
  const [panelWidths, setPanelWidths] = useState({ section3: 420 });
  const resizingRef = useRef(null);

  // ── 수동 추가 (드래그 → PDF pt 영역) ──────────────────
  const [drawMode, setDrawMode]             = useState(false);
  const [dragBox, setDragBox]               = useState(null);   // {pageIdx, left, top, width, height} — CSS px
  const [pendingRegion, setPendingRegion]   = useState(null);   // {pageIdx, pt:{x0,y0,x1,y1}} — PDF pt
  const [manualTitle, setManualTitle]           = useState("");
  const [manualTitleError, setManualTitleError] = useState("");
  const [addingManual, setAddingManual]         = useState(false);
  const dragStateRef = useRef(null);                            // {pageIdx, el, startX, startY, scale}
  const viewerRef    = useRef(null);

  // ── 페이지 로드 ───────────────────────────────────────
  const fetchPages = useCallback(async (jid) => {
    if (!jid) return;
    setPagesLoading(true);
    setPagesError("");
    try {
      const data = await getPages(jid);
      setPages(data.pages || []);
    } catch (e) {
      setPagesError(e.message);
    } finally {
      setPagesLoading(false);
    }
  }, []);

  useEffect(() => { fetchPages(jobId); }, [jobId, fetchPages]);

  // ── 페이지별 문항 통계 (수동 포함 개수 + 오탐 수) ──────
  //
  // getPages의 question_count는 job.questions_per_page에서 오는데, 이 값은
  // 자동 감지 경계로만 만들어져 수동 추가 문항이 빠진다. 오탐 여부도 페이지
  // 목록에는 없다. 전체 문항 일괄 API(REQ-P01)가 둘 다 갖고 있으므로
  // 여기서 한 번 받아 페이지별로 집계한다.
  // ③ QuestionListPanel도 같은 API를 쓰지만 apiFetch GET dedup(P02-03)이
  // 동시 호출을 하나로 합쳐 준다.
  const [pageStats, setPageStats] = useState({});

  useEffect(() => {
    if (!jobId) { setPageStats({}); return; }
    let alive = true;
    getAllQuestions(jobId)
      .then((data) => {
        if (!alive) return;
        const stats = {};
        for (const p of data.pages || []) {
          const qs = p.questions || [];
          stats[p.page_num] = {
            total: qs.length,
            falsePositive: qs.filter((q) => q.is_false_positive).length,
          };
        }
        setPageStats(stats);
      })
      .catch(() => { if (alive) setPageStats({}); });   // 실패 시 기존 question_count로 폴백
    return () => { alive = false; };
  }, [jobId, panelRefreshTrigger]);

  // ── 원본 PDF URL 조회 ─────────────────────────────────
  useEffect(() => {
    let alive = true;
    setPdfUrlLoading(true);
    setPdfUrl(null);
    getJobInfo(jobId)
      .then((info) => { if (alive) setPdfUrl(info.original_pdf_url || null); })
      .catch(() => { if (alive) setPdfUrl(null); })
      .finally(() => { if (alive) setPdfUrlLoading(false); });
    return () => { alive = false; };
  }, [jobId]);

  // ── 재감지 ────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    if (!jobId || refreshing) return;
    setRefreshing(true);
    setRefreshError("");
    try {
      await refreshJobQuestions(jobId);
      refreshPollRef.current = setInterval(async () => {
        try {
          const info = await getJobInfo(jobId);
          const st   = info.boundaries_status;
          if (st === "DONE" || st === "FAILED") {
            clearInterval(refreshPollRef.current);
            refreshPollRef.current = null;
            setRefreshing(false);
            if (st === "FAILED") setRefreshError("재감지에 실패했습니다.");
            else fetchPages(jobId);
          }
        } catch { /* 폴링 오류 무시 */ }
      }, 2000);
    } catch (e) {
      setRefreshError(e.message || "재감지 요청 실패");
      setRefreshing(false);
    }
  }, [jobId, refreshing, fetchPages]);

  // ── 수동 추가 취소/초기화 ─────────────────────────────
  const handleCancelManual = useCallback(() => {
    setPendingRegion(null);
    setDragBox(null);
    dragStateRef.current = null;
    setManualTitle("");
    setManualTitleError("");
  }, []);

  const toggleDrawMode = () => { setDrawMode((v) => !v); handleCancelManual(); };

  // ── 페이지 선택 (① 목록 클릭 → 뷰어 스크롤) ──────────
  const handlePageClick = useCallback((page) => {
    setSelectedPage(page.page_num);
    setSelectedPageInfo(page);
    setPanelRefreshTrigger((t) => t + 1);
    handleCancelManual();
    viewerRef.current?.scrollToPage(page.page_num + 1);
  }, [handleCancelManual]);

  // ── 뷰어 스크롤 → ①·③ 자동 동기화 (250ms 디바운스) ──
  const pageChangeTimer = useRef(null);
  const handleViewerPageChange = useCallback((pageNum1) => {
    clearTimeout(pageChangeTimer.current);
    pageChangeTimer.current = setTimeout(() => {
      const idx = pageNum1 - 1;
      setSelectedPage((prev) => (prev === idx ? prev : idx));
      setSelectedPageInfo(pagesRef.current.find((p) => p.page_num === idx) || null);
    }, 250);
  }, []);
  useEffect(() => () => clearTimeout(pageChangeTimer.current), []);

  // ── 패널 리사이즈 ─────────────────────────────────────
  useEffect(() => {
    const onMove = (e) => {
      if (!resizingRef.current) return;
      const { panel, startX, startWidth, dir } = resizingRef.current;
      // 드래그 시작 시점의 너비(startWidth)를 기준으로 마우스 이동량만큼 상대 증감
      const newWidth = Math.max(200, Math.min(800, startWidth + (e.clientX - startX) * dir));
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

  const startResize = (panel, dir, e) => {
    e.preventDefault();
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    resizingRef.current = { panel, dir, startX: e.clientX, startWidth: panelWidths[panel] };
  };

  // ── 수동 문항 드래그 (PDF 페이지 오버레이 위) ─────────
  const handleOverlayMouseDown = useCallback((e, pageIdx, scale) => {
    e.preventDefault();
    setPendingRegion(null);
    setManualTitle("");
    setManualTitleError("");
    const el   = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 0, rect.width);
    const y = clamp(e.clientY - rect.top, 0, rect.height);
    dragStateRef.current = { pageIdx, el, startX: x, startY: y, scale };
    setDragBox({ pageIdx, left: x, top: y, width: 0, height: 0 });
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      const d = dragStateRef.current;
      if (!d) return;
      const rect = d.el.getBoundingClientRect();
      const x = clamp(e.clientX - rect.left, 0, rect.width);
      const y = clamp(e.clientY - rect.top, 0, rect.height);
      setDragBox({
        pageIdx: d.pageIdx,
        left: Math.min(d.startX, x), top: Math.min(d.startY, y),
        width: Math.abs(x - d.startX), height: Math.abs(y - d.startY),
      });
    };
    const onUp = (e) => {
      const d = dragStateRef.current;
      if (!d) return;
      dragStateRef.current = null;
      const rect = d.el.getBoundingClientRect();
      const x = clamp(e.clientX - rect.left, 0, rect.width);
      const y = clamp(e.clientY - rect.top, 0, rect.height);
      const x0 = Math.min(d.startX, x), y0 = Math.min(d.startY, y);
      const x1 = Math.max(d.startX, x), y1 = Math.max(d.startY, y);
      setDragBox(null);
      if (x1 - x0 > 8 && y1 - y0 > 8) {
        // CSS px → PDF pt (react-pdf는 pt × scale 로 렌더)
        setPendingRegion({
          pageIdx: d.pageIdx,
          pt: { x0: x0 / d.scale, y0: y0 / d.scale, x1: x1 / d.scale, y1: y1 / d.scale },
        });
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  // 각 PDF 페이지 위 오버레이 (드래그 캡처 + 드래그 박스/확정 영역 표시)
  const renderPageOverlay = useCallback((pageNum1, { scale }) => {
    if (!drawMode) return null;
    const pageIdx       = pageNum1 - 1;
    const isDragPage    = dragBox?.pageIdx === pageIdx;
    const isPendingPage = pendingRegion?.pageIdx === pageIdx;
    return (
      <Box
        sx={{ position: "absolute", inset: 0, cursor: "crosshair", zIndex: 2 }}
        onMouseDown={(e) => handleOverlayMouseDown(e, pageIdx, scale)}
      >
        {isDragPage && (
          <Box sx={{
            position: "absolute",
            left: dragBox.left, top: dragBox.top, width: dragBox.width, height: dragBox.height,
            border: "2px dashed", borderColor: "primary.main",
            bgcolor: "primary.lighter", opacity: 0.6, pointerEvents: "none",
          }} />
        )}
        {isPendingPage && !dragBox && (
          <Box sx={{
            position: "absolute",
            left:   pendingRegion.pt.x0 * scale,
            top:    pendingRegion.pt.y0 * scale,
            width:  (pendingRegion.pt.x1 - pendingRegion.pt.x0) * scale,
            height: (pendingRegion.pt.y1 - pendingRegion.pt.y0) * scale,
            border: "2px solid", borderColor: "primary.main",
            bgcolor: "primary.lighter", opacity: 0.5, pointerEvents: "none",
          }} />
        )}
      </Box>
    );
  }, [drawMode, dragBox, pendingRegion, handleOverlayMouseDown]);

  const handleAddManual = async () => {
    if (!manualTitle.trim()) { setManualTitleError("타이틀을 입력해주세요."); return; }
    if (!pendingRegion || jobId == null) return;
    setAddingManual(true); setManualTitleError("");
    try {
      const pageIdx = pendingRegion.pageIdx;
      await addManualQuestion(jobId, pageIdx, { title: manualTitle.trim(), region: pendingRegion.pt });
      handleCancelManual();
      setDrawMode(false);
      if (selectedPage !== pageIdx) {
        setSelectedPage(pageIdx);
        setSelectedPageInfo(pagesRef.current.find((p) => p.page_num === pageIdx) || null);
      }
      setPanelRefreshTrigger((t) => t + 1);
    } catch (e) { setManualTitleError(e.message || "추가에 실패했습니다."); }
    finally     { setAddingManual(false); }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>

      {/* ── 컨텍스트 바 ─────────────────────────────── */}
      <Box sx={{ px: 2.5, py: 0.75, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0, bgcolor: "background.paper" }}>
        <Button
          size="small" variant="text" color="inherit"
          onClick={() => navigate(-1)}
          startIcon={<Icon icon="material-symbols:arrow-back-rounded" style={{ fontSize: 16 }} />}
          sx={{ fontSize: 12, minWidth: 0, px: 1, flexShrink: 0, whiteSpace: "nowrap" }}
        >
          파일 선택
        </Button>
        <Box sx={{ width: 1, height: 16, bgcolor: "divider" }} />
        <Icon icon="material-symbols:description-outline-rounded" style={{ fontSize: 15, flexShrink: 0 }} />
        <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: 240 }} title={filename}>
          {workbookName || filename}
        </Typography>
        {selectedPage !== null && (
          <Chip label={`${selectedPage + 1}페이지`} size="small" variant="outlined" color="primary" />
        )}
      </Box>

      {/* ── 3패널 ───────────────────────────────────── */}
      <Box sx={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* ① 페이지 목록 */}
        <Paper
          elevation={0}
          sx={{
            width: SECTION1_WIDTH, flexShrink: 0,
            display: "flex", flexDirection: "column", overflow: "hidden",
            borderRadius: 0, borderRight: 1, borderColor: "divider",
            position: "relative",
            ...(drawMode && { pointerEvents: "none" }),
          }}
        >
          {drawMode && (
            <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(255,255,255,0.55)", zIndex: 10, pointerEvents: "all" }} />
          )}
          <Box sx={{ px: 2.5, py: 1.25, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <Typography variant="subtitle2" fontWeight={700}>① 페이지</Typography>
            <Tooltip title="전체 재감지">
              <IconButton size="small" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? <CircularProgress size={14} /> : <Icon icon="material-symbols:refresh-rounded" style={{ fontSize: 16 }} />}
              </IconButton>
            </Tooltip>
          </Box>

          {refreshError && <Alert severity="error" sx={{ mx: 1, mt: 0.5, py: 0, fontSize: 11 }}>{refreshError}</Alert>}
          {pagesError   && <Alert severity="error" sx={{ mx: 1, mt: 0.5, py: 0, fontSize: 11 }}>{pagesError}</Alert>}

          <Box sx={{ flex: 1, overflowY: "auto" }}>
            {pagesLoading && (
              <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                <CircularProgress size={20} />
              </Box>
            )}
            {!pagesLoading && pages.length === 0 && (
              <Box sx={{ p: 2, textAlign: "center", color: "text.disabled" }}>
                <Typography variant="caption">페이지 없음</Typography>
              </Box>
            )}
            {pages.map((page) => {
              const isSelected = selectedPage === page.page_num;
              const stat = pageStats[page.page_num];
              // 통계를 못 받았을 때만 목록 API의 개수(자동 감지분)로 폴백
              const questionCount = stat ? stat.total : page.question_count;
              const fpCount = stat?.falsePositive ?? 0;
              return (
                <Box
                  key={page.page_num}
                  onClick={() => handlePageClick(page)}
                  sx={{
                    px: 2, py: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.5,
                    borderBottom: 1, borderColor: "divider",
                    // 오탐 의심 문항이 있는 페이지는 좌측 띠 + 옅은 배경으로 표시
                    borderLeft: 3,
                    borderLeftColor: fpCount > 0 ? "warning.main" : "transparent",
                    bgcolor: isSelected
                      ? "primary.lighter"
                      : fpCount > 0 ? "warning.lighter" : "transparent",
                    "&:hover": {
                      bgcolor: isSelected
                        ? "primary.lighter"
                        : fpCount > 0 ? "warning.lighter" : "action.hover",
                    },
                  }}
                >
                  <Typography variant="caption" fontWeight={isSelected ? 700 : 400} color={isSelected ? "primary.main" : "text.primary"}>
                    {page.page_num + 1}페이지
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {fpCount > 0 && (
                      <Tooltip title={`오탐 의심 ${fpCount}건`}>
                        <Chip
                          label={`오탐 ${fpCount}`}
                          size="small" color="warning" variant="filled"
                          sx={{ fontSize: 10, height: 18 }}
                        />
                      </Tooltip>
                    )}
                    {questionCount != null && (
                      <Chip label={`${questionCount}문항`} size="small" variant="outlined" color={isSelected ? "primary" : "default"} sx={{ fontSize: 10, height: 18 }} />
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Paper>

        {/* ② 페이지 미리보기 — PDF 뷰어 (REQ-F07, 남는 공간 채움) */}
        <Paper
          elevation={0}
          sx={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: 0, borderRight: 1, borderColor: "divider", position: "relative" }}
        >
          <Box sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <Typography variant="subtitle2" fontWeight={700}>② 페이지 미리보기</Typography>
            {pdfUrl && (
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

          {drawMode && (
            <Alert severity="info" sx={{ py: 0, fontSize: 12, borderRadius: 0, flexShrink: 0 }}>
              페이지 위에서 드래그하여 영역을 지정하세요.
            </Alert>
          )}

          {pdfUrlLoading ? (
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : pdfUrl ? (
            /* PdfPreviewPanel 계약: flex 컬럼 부모 + minHeight:0 (REQ-B05) */
            <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <PdfPreviewPanel
                ref={viewerRef}
                pdfUrl={pdfUrl}
                onPageChange={handleViewerPageChange}
                renderPageOverlay={renderPageOverlay}
              />
            </Box>
          ) : (
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "text.disabled", gap: 1.5 }}>
              <Icon icon="material-symbols:picture-as-pdf-outline-rounded" style={{ fontSize: 48 }} />
              <Typography variant="body2" textAlign="center" color="text.secondary">
                원본 PDF를 불러올 수 없습니다.
              </Typography>
            </Box>
          )}

          {/* 수동 문항 타이틀 입력 카드 (드래그 확정 시, 패널 하단 플로팅) */}
          {drawMode && pendingRegion && (
            <Paper elevation={4} sx={{ position: "absolute", left: 16, right: 16, bottom: 16, zIndex: 20, p: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
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
        </Paper>

        <ResizeHandle onMouseDown={(e) => startResize("section3", -1, e)} />

        {/* ③ 문항 목록 (리사이즈 대상, 200~800px) */}
        <Paper
          elevation={0}
          sx={{
            width: panelWidths.section3, flexShrink: 0,
            display: "flex", flexDirection: "column", overflow: "hidden",
            borderRadius: 0, borderLeft: 1, borderColor: "divider",
            position: "relative",
            ...(drawMode && { pointerEvents: "none" }),
          }}
        >
          {drawMode && (
            <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(255,255,255,0.55)", zIndex: 10, pointerEvents: "all" }} />
          )}
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
