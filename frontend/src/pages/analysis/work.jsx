/**
 * 문항 분석 - 작업 페이지 (/analysis/:jobId)
 *
 * 파일 선택 페이지(/)에서 파일을 고른 뒤 진입.
 * 페이지 목록 · 페이지 미리보기(PDF 뷰어, REQ-F07) · 문항 목록  3패널 구성.
 * 뒤로 가기 → 파일 선택 페이지로 복귀 (사이드바 메뉴 유지).
 *
 * REQ-F07: 미리보기를 페이지 썸네일 → PdfPreviewPanel(react-pdf)로 전환.
 *   - 페이지 클릭 ↔ 뷰어 스크롤 양방향 동기화 (뷰어 스크롤 → 문항 목록 자동 전환, 250ms 디바운스)
 *   - 수동 문항 드래그 오버레이는 renderPageOverlay로 각 페이지 위에 렌더
 *   - 좌표 변환: PDF pt = CSS px / scale (react-pdf가 pt×scale로 렌더하므로)
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import { Icon } from "@iconify/react";

import PageHeader from "components/PageHeader";
import QuestionAnalysisPanel from "components/QuestionAnalysisPanel";
import PdfPreviewPanel from "components/PdfPreviewPanel";
import { WorkCanvas, CardRow, PanelCard, PanelCardHeader, CardResizeHandle } from "components/WorkCanvas";
import { getPages, refreshJobQuestions, addManualQuestion, getAllQuestions } from "api/client";
import { useJobCompletion } from "hooks/useJobCompletion";
import { useAnalysisEntryGuard } from "hooks/useAnalysisEntryGuard";
import { isRefreshBlocked } from "utils/jobStatus";
import { columnsForWidth } from "utils/questionGrid";
import { tintBg } from "theme/tint";

const clamp = (v, min, max) => Math.max(min, Math.min(v, max));

/** 리사이즈 가능한 패널의 [최소, 최대] 폭. */
const PANEL_BOUNDS = { section1: [150, 400], section3: [200, 800] };

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

  // ── 원본 PDF URL (REQ-F07) ────────────────────────────
  const [pdfUrl, setPdfUrl]               = useState(null);
  const [pdfUrlLoading, setPdfUrlLoading] = useState(true);

  // ── 선택 상태 ─────────────────────────────────────────
  const [selectedPage, setSelectedPage]         = useState(null);
  const [selectedPageInfo, setSelectedPageInfo] = useState(null);
  const [panelRefreshTrigger, setPanelRefreshTrigger] = useState(0);

  // ── 패널 너비 ─────────────────────────────────────────
  // section1(페이지 목록)·section3(문항 목록)이 리사이즈 대상, section2(미리보기)는 남는 공간을 채움.
  // 2안 카드 재구성(2026-07-29) 전에는 section1이 200px 고정이었다. 카드 사이 여백에 핸들을
  // 두게 되면서 양쪽 경계가 모두 잡을 수 있는 자리가 됐고, 한쪽만 안 되면 오히려 어색하다.
  // 최소값은 패널별로 다르다 — 페이지 목록은 "12페이지 · 6문항" 한 줄이 들어가면 충분하다.
  // (PANEL_BOUNDS는 모듈 스코프 상수 — 리사이즈 이펙트가 []로 한 번만 붙기 때문에
  //  컴포넌트 안에 두면 첫 렌더의 객체를 계속 붙들게 된다.)
  const [panelWidths, setPanelWidths] = useState({ section1: 200, section3: 420 });
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

  // ── 진입 가드 + 원본 PDF URL (REQ-F11 Phase 1) ────────
  //
  // 감지 중이면 이 화면을 열지 않는다 — 목록의 클릭 차단만으로는 URL 직접 입력과
  // 뒤로가기가 그대로 열려 있었다.
  //
  // ⚠️ 원본 PDF URL도 이 훅이 받아 온 응답에서 꺼낸다. 화면이 따로 getJobInfo 를 부르면
  //    같은 응답을 두 번 받는다(raw fetch 라 dedup 되지 않는다). 계획서 § 제약 참조.
  const { blocked, reason, jobInfo, loading: guardLoading, confirm } = useAnalysisEntryGuard(jobId);

  // 대기 중(PENDING)이면 재감지가 이미 걸려 있다 — 버튼만 막는다 (REQ-F11 Phase 2).
  // 목록과 같은 판정 함수를 쓴다.
  const refreshQueued = isRefreshBlocked(jobInfo);

  useEffect(() => {
    setPdfUrlLoading(guardLoading);
    if (guardLoading) return;
    setPdfUrl(jobInfo?.original_pdf_url || null);
  }, [guardLoading, jobInfo]);

  // ── 재감지 ────────────────────────────────────────────
  //
  // 완료 감시는 전역 알림 피드가 한다 (REQ-F09 Phase 3). 종전에는 이 화면이 2초마다
  // getJobInfo 로 boundaries_status 를 캐물었고, 화면을 떠나면 그 감시가 죽었다.
  useJobCompletion(refreshing ? jobId : null, {
    onDone: () => {
      setRefreshing(false);
      fetchPages(jobId);
    },
    // 실패 문구의 출처는 서버 알림 하나다 (REQ-C09) — 화면이 자체 문자열을 들면
    // 같은 사건에 벨 팝오버와 배너가 다른 문장을 보여준다.
    onError: (n) => {
      setRefreshing(false);
      setRefreshError(n?.message || "재감지에 실패했습니다.");
    },
  });

  const handleRefresh = useCallback(async () => {
    if (!jobId || refreshing) return;
    setRefreshing(true);
    setRefreshError("");
    try {
      await refreshJobQuestions(jobId);
    } catch (e) {
      setRefreshError(e.message || "재감지 요청 실패");
      setRefreshing(false);
    }
  }, [jobId, refreshing]);

  // ── 수동 추가 취소/초기화 ─────────────────────────────
  const handleCancelManual = useCallback(() => {
    setPendingRegion(null);
    setDragBox(null);
    dragStateRef.current = null;
    setManualTitle("");
    setManualTitleError("");
  }, []);

  const toggleDrawMode = () => { setDrawMode((v) => !v); handleCancelManual(); };

  // ── 페이지 선택 (페이지 목록 클릭 → 뷰어 스크롤) ──────
  const handlePageClick = useCallback((page) => {
    setSelectedPage(page.page_num);
    setSelectedPageInfo(page);
    setPanelRefreshTrigger((t) => t + 1);
    handleCancelManual();
    viewerRef.current?.scrollToPage(page.page_num + 1);
  }, [handleCancelManual]);

  // ── 뷰어 스크롤 → 페이지·문항 목록 동기화 (250ms 디바운스) ──
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
      const [min, max] = PANEL_BOUNDS[panel];
      const newWidth = Math.max(min, Math.min(max, startWidth + (e.clientX - startX) * dir));
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
            // 항상 흰 PDF 지면 위에 그려지므로 다크에서도 밝은 색조를 유지한다 (REQ-D08 §3)
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
            // 위와 동일 — 흰 지면 위 오버레이 (REQ-D08 §3)
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
    /* REQ-D07 2안 — 맞붙은 3패널을 회색 캔버스 위 카드 3장으로 재구성.
       리사이즈 핸들은 카드 사이 여백으로 옮겨 유지한다(2026-07-29 결정). */
    <WorkCanvas>

      {/* 진입 차단 모달 (REQ-F11). 감지 중과 조회 실패는 같은 경로로 막히지만
          원인이 달라 문구를 구분한다 — 실패에 "재감지 중"이라고 쓰면 사용자는
          기다리면 끝난다고 믿는다. */}
      <Dialog open={blocked} onClose={confirm}>
        <DialogTitle>
          {reason === "processing" ? "문항을 감지하는 중입니다" : "파일 상태를 확인할 수 없습니다"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {reason === "processing"
              ? "감지가 끝나면 목록에서 다시 열 수 있습니다."
              : "잠시 후 목록에서 다시 시도해 주세요."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={confirm} variant="contained" autoFocus>확인</Button>
        </DialogActions>
      </Dialog>


      {/* ── 페이지 헤더 + 브레드크럼 ─────────────────── */}
      <PageHeader
        title={workbookName || filename}
        crumbs={[
          { label: "홈", to: "/" },
          { label: "분석", to: "/" },
          { label: workbookName || filename },
        ]}
        actions={
          <>
            {selectedPage !== null && (
              <Chip label={`${selectedPage + 1}페이지`} size="small" variant="outlined" color="primary" />
            )}
            <Button
              size="small" variant="outlined" color="inherit"
              onClick={() => navigate(-1)}
              startIcon={<Icon icon="material-symbols:arrow-back-rounded" style={{ fontSize: 16 }} />}
              sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
            >
              파일 선택
            </Button>
          </>
        }
      />

      {/* ── 카드 3장 ─────────────────────────────────── */}
      <CardRow>

        {/* 페이지 목록 */}
        <PanelCard
          sx={{
            width: panelWidths.section1, flexShrink: 0,
            position: "relative",
            ...(drawMode && { pointerEvents: "none" }),
          }}
        >
          {drawMode && (
            /* 수동 추가 중에는 좌우 패널을 딤 처리해 클릭을 막는다.
               다크 모드(REQ-D08) 대비로 배경색은 토큰에서 가져온다. */
            <Box sx={{ position: "absolute", inset: 0, bgcolor: "background.paper", opacity: 0.6, zIndex: 10, pointerEvents: "all" }} />
          )}
          <PanelCardHeader>
            <Icon icon="material-symbols:auto-stories-outline-rounded" style={{ fontSize: 18, flexShrink: 0 }} />
            <Typography variant="subtitle2" fontWeight={700} noWrap>페이지</Typography>
            {pages.length > 0 && (
              <Chip label={pages.length} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
            )}
            <Box sx={{ flex: 1 }} />
            {/* 대기 중이면 재감지가 이미 걸려 있다 — 다시 걸지 못하게 막고 그 사실을 보여준다
                (REQ-F11 Phase 2). 진입은 허용한다: 아직 시작되지 않아 기존 문항이 유효하다. */}
            {refreshQueued && (
              <Typography variant="caption" sx={{ color: "text.disabled", mr: 0.5 }}>
                재감지 대기 중
              </Typography>
            )}
            <Tooltip title={refreshQueued ? "재감지가 대기 중입니다" : "전체 재감지"}>
              <span>
                <IconButton
                  size="small"
                  onClick={handleRefresh}
                  disabled={refreshing || refreshQueued}
                >
                  {refreshing ? <CircularProgress size={14} /> : <Icon icon="material-symbols:refresh-rounded" style={{ fontSize: 16 }} />}
                </IconButton>
              </span>
            </Tooltip>
          </PanelCardHeader>

          {refreshError && <Alert severity="error" sx={{ mx: 1, mt: 0.5, py: 0, fontSize: 11 }}>{refreshError}</Alert>}
          {pagesError   && <Alert severity="error" sx={{ mx: 1, mt: 0.5, py: 0, fontSize: 11 }}>{pagesError}</Alert>}

          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 0.75 }}>
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
                    px: 1.25, py: 0.875, mb: 0.25, borderRadius: 1,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.5,
                    // 오탐 의심 문항이 있는 페이지는 좌측 띠 + 옅은 배경으로 표시
                    borderLeft: 3,
                    borderLeftColor: fpCount > 0 ? "warning.main" : "transparent",
                    // 색조는 tintBg로 — `*.lighter`는 두 모드가 공유해 다크에서 파스텔이 된다 (REQ-D08)
                    bgcolor: isSelected
                      ? tintBg("primary")
                      : fpCount > 0 ? tintBg("warning") : "transparent",
                    transition: "background-color 0.15s",
                    "&:hover": {
                      bgcolor: isSelected
                        ? tintBg("primary")
                        : fpCount > 0 ? tintBg("warning") : "action.hover",
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
        </PanelCard>

        {/* 페이지 미리보기 — PDF 뷰어 (REQ-F07, 남는 공간 채움).
            카드 사이 여백은 CardResizeHandle이 만든다 — CardRow에 gap을 걸면 간격이 두 배가 된다. */}
        <CardResizeHandle onMouseDown={(e) => startResize("section1", 1, e)} />

        <PanelCard sx={{ flex: 1, minWidth: 200, position: "relative" }}>
          <PanelCardHeader>
            <Icon icon="material-symbols:image-outline-rounded" style={{ fontSize: 18, flexShrink: 0 }} />
            <Typography variant="subtitle2" fontWeight={700} noWrap>페이지 미리보기</Typography>
            <Box sx={{ flex: 1 }} />
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
          </PanelCardHeader>

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
        </PanelCard>

        <CardResizeHandle onMouseDown={(e) => startResize("section3", -1, e)} />

        {/* 문항 목록 (리사이즈 대상, 200~800px) */}
        <PanelCard
          sx={{
            width: panelWidths.section3, flexShrink: 0,
            position: "relative",
            ...(drawMode && { pointerEvents: "none" }),
          }}
        >
          {drawMode && (
            /* 수동 추가 중에는 좌우 패널을 딤 처리해 클릭을 막는다.
               다크 모드(REQ-D08) 대비로 배경색은 토큰에서 가져온다. */
            <Box sx={{ position: "absolute", inset: 0, bgcolor: "background.paper", opacity: 0.6, zIndex: 10, pointerEvents: "all" }} />
          )}
          {selectedPage !== null && jobId ? (
            <QuestionAnalysisPanel
              key={`${jobId}-${selectedPage}`}
              jobId={jobId}
              pageNum={selectedPage}
              pageInfo={selectedPageInfo}
              refreshTrigger={panelRefreshTrigger}
              /* REQ-D10: 열 수는 패널 너비 상태값에서 계산한다 — 상태값이 곧 실제 폭이다
                 (section3은 고정폭, 창이 좁아지면 줄어드는 쪽은 section2). */
              columns={columnsForWidth(panelWidths.section3)}
            />
          ) : (
            <>
              <PanelCardHeader>
                <Icon icon="material-symbols:list-alt-outline-rounded" style={{ fontSize: 18, flexShrink: 0 }} />
                <Typography variant="subtitle2" fontWeight={700} noWrap>문항 목록</Typography>
              </PanelCardHeader>
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "text.disabled", gap: 1.5 }}>
                <Icon icon="material-symbols:list-alt-outline-rounded" style={{ fontSize: 48 }} />
                <Typography variant="body2" textAlign="center" color="text.secondary">
                  페이지를 선택하면<br />문항 목록이 표시됩니다.
                </Typography>
              </Box>
            </>
          )}
        </PanelCard>
      </CardRow>
    </WorkCanvas>
  );
}
