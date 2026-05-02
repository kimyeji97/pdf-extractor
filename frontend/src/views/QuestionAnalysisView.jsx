/**
 * 문항 분석 뷰 (REQ-D03, D04)
 *
 * v3.3 레이아웃:
 *   Section 1 (좌): ① 파일·페이지 선택 (업로드 포함, 리사이즈 가능)
 *   Section 2 (중): ② 페이지 미리보기 + 수동 추가 드래그 (리사이즈 가능)
 *   Section 3 (우): ③ 문항 목록 (QuestionAnalysisPanel)
 */
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import UploadForm from "../components/UploadForm";
import FilePagePanel from "../components/FilePagePanel";
import QuestionAnalysisPanel from "../components/QuestionAnalysisPanel";
import { requestUploadUrl, uploadPdf, addManualQuestion } from "../api/client";

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/api$/, "");

export default function QuestionAnalysisView() {
  // ── 선택 상태 ────────────────────────────────────────────
  const [jobId, setJobId]                             = useState(null);
  const [selectedJobFilename, setSelectedJobFilename] = useState(null);
  const [selectedPage, setSelectedPage]               = useState(null);
  const [selectedPageInfo, setSelectedPageInfo]       = useState(null);

  // ── 업로드 ───────────────────────────────────────────────
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadWorkbookName, setUploadWorkbookName] = useState("");
  const [uploadWorkbookTypes, setUploadWorkbookTypes] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [refreshTrigger, setRefreshTrigger]           = useState(0);
  const [panelRefreshTrigger, setPanelRefreshTrigger] = useState(0);

  // ── 패널 너비 (리사이즈) ─────────────────────────────────
  const [panelWidths, setPanelWidths] = useState({ section1: 220, section2: 300 });
  const resizingRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizingRef.current) return;
      const { panel, startX, startWidth } = resizingRef.current;
      const newWidth = Math.max(160, Math.min(480, startWidth + (e.clientX - startX)));
      setPanelWidths((prev) => ({ ...prev, [panel]: newWidth }));
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

  const startResize = (panel, e) => {
    e.preventDefault();
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    resizingRef.current = { panel, startX: e.clientX, startWidth: panelWidths[panel] };
  };

  // ── 수동 추가 (드래그·드롭) 상태 ─────────────────────────
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

  // ── 핸들러: 파일 변경 ────────────────────────────────────
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

  // ── 핸들러: 페이지 선택 ──────────────────────────────────
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

  // ── 핸들러: 파일 선택 (즉시 업로드 X) ──────────────────────
  const handleFileSelected = (file) => {
    setSelectedFile(file);
    setUploadError("");
  };

  // ── 핸들러: 업로드 버튼 클릭 ────────────────────────────
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
      setJobId(null);
      setSelectedPage(null);
      setSelectedPageInfo(null);
      setSelectedJobFilename(null);
      setUploadWorkbookName("");
      setUploadWorkbookTypes("");
      setSelectedFile(null);
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  };

  // ── 드로우: 좌표 변환 (px → PDF pt) ─────────────────────
  const toPdfCoords = useCallback(
    (px) => {
      const img = imgRef.current;
      if (!img || !selectedPageInfo) return null;
      const scaleX = selectedPageInfo.width  / img.clientWidth;
      const scaleY = selectedPageInfo.height / img.clientHeight;
      return {
        x0: Math.max(0, px.x0 * scaleX),
        y0: Math.max(0, px.y0 * scaleY),
        x1: Math.min(selectedPageInfo.width,  px.x1 * scaleX),
        y1: Math.min(selectedPageInfo.height, px.y1 * scaleY),
      };
    },
    [selectedPageInfo]
  );

  const getPos = (e) => {
    const rect = overlayRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(e.clientY - rect.top,  rect.height)),
    };
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setPendingRegionPx(null);
    setPendingRegionPt(null);
    setManualTitle("");
    setManualTitleError("");
    setIsDragging(true);
    const p = getPos(e);
    setDragStart(p);
    setDragCurrent(p);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setDragCurrent(getPos(e));
  };

  const handleMouseUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    const p = getPos(e);
    const x0 = Math.min(dragStart.x, p.x);
    const y0 = Math.min(dragStart.y, p.y);
    const x1 = Math.max(dragStart.x, p.x);
    const y1 = Math.max(dragStart.y, p.y);
    if (x1 - x0 > 8 && y1 - y0 > 8) {
      const pxRegion = { x0, y0, x1, y1 };
      setPendingRegionPx(pxRegion);
      setPendingRegionPt(toPdfCoords(pxRegion));
    }
    setDragStart(null);
    setDragCurrent(null);
  };

  const dragBox = useMemo(() => {
    if (!dragStart || !dragCurrent) return null;
    return {
      left:   Math.min(dragStart.x, dragCurrent.x),
      top:    Math.min(dragStart.y, dragCurrent.y),
      width:  Math.abs(dragCurrent.x - dragStart.x),
      height: Math.abs(dragCurrent.y - dragStart.y),
    };
  }, [dragStart, dragCurrent]);

  // ── 수동 문항 추가 제출 ──────────────────────────────────
  const handleAddManual = async () => {
    if (!manualTitle.trim()) {
      setManualTitleError("타이틀을 입력해주세요.");
      return;
    }
    if (!pendingRegionPt || jobId == null || selectedPage == null) return;
    setAddingManual(true);
    setManualTitleError("");
    try {
      await addManualQuestion(jobId, selectedPage, {
        title: manualTitle.trim(),
        region: pendingRegionPt,
      });
      setPendingRegionPx(null);
      setPendingRegionPt(null);
      setManualTitle("");
      setDrawMode(false);
      // Panel 문항 목록 새로고침
      setPanelRefreshTrigger((t) => t + 1);
    } catch (e) {
      setManualTitleError(e.message || "추가에 실패했습니다.");
    } finally {
      setAddingManual(false);
    }
  };

  const handleCancelManual = () => {
    setPendingRegionPx(null);
    setPendingRegionPt(null);
    setManualTitle("");
    setManualTitleError("");
  };

  const toggleDrawMode = () => {
    setDrawMode((v) => !v);
    handleCancelManual();
  };

  const pageThumbUrl = selectedPageInfo?.thumbnail_url
    ? `${API_ROOT}${selectedPageInfo.thumbnail_url}`
    : null;

  return (
    <div className="qav-layout view-layout">

      {/* 컨텍스트 바 */}
      {selectedJobFilename && (
        <div className="view-context-bar">
          선택된 파일: <strong>{selectedJobFilename}</strong>
          {selectedPage !== null && (
            <span style={{ marginLeft: 12, color: "#64748b" }}>
              {selectedPage + 1}페이지
            </span>
          )}
        </div>
      )}

      <div className="qav-panels">

        {/* ① 파일·페이지 선택 */}
        <div
          className="panel qav-section-1"
          style={{ width: panelWidths.section1, minWidth: 160, flexShrink: 0 }}
        >
          <div className="panel-header">
            <span className="panel-title">① 파일·페이지</span>
          </div>
          <div className="panel-body" style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div className="qav-upload">
              {uploadError && <p className="qav-upload-error">{uploadError}</p>}
              {uploading   && <p className="qav-upload-info">업로드 중...</p>}
              <div className="qav-upload-meta">
                <input
                  className="qav-meta-input"
                  type="text"
                  placeholder="문제집 이름 (선택)"
                  value={uploadWorkbookName}
                  onChange={(e) => setUploadWorkbookName(e.target.value)}
                  disabled={uploading}
                />
                <input
                  className="qav-meta-input"
                  type="text"
                  placeholder="문제집 유형 (쉼표로 구분)"
                  value={uploadWorkbookTypes}
                  onChange={(e) => setUploadWorkbookTypes(e.target.value)}
                  disabled={uploading}
                />
              </div>
              <UploadForm
                onFileSelected={handleFileSelected}
                selectedFile={selectedFile}
                disabled={uploading}
              />
              <button
                className="qav-upload-btn"
                onClick={handleUploadClick}
                disabled={!selectedFile || uploading}
              >
                {uploading ? "업로드 중..." : "업로드"}
              </button>
            </div>
            <FilePagePanel
              onPageSelect={handlePageSelect}
              onJobChange={handleJobChange}
              refreshTrigger={refreshTrigger}
              selectedPageNum={selectedPage}
            />
          </div>
        </div>

        <div className="resize-handle" onMouseDown={(e) => startResize("section1", e)} />

        {/* ② 페이지 미리보기 + 수동 추가 */}
        <div
          className="panel qav-section-2"
          style={{ width: panelWidths.section2, minWidth: 160, flexShrink: 0 }}
        >
          <div className="panel-header">
            <span className="panel-title">② 페이지 미리보기</span>
            {pageThumbUrl && (
              <button
                className={`qap-btn qap-btn--small${drawMode ? " qap-btn--active" : ""}`}
                onClick={toggleDrawMode}
              >
                {drawMode ? "✕ 종료" : "✏️ 수동 추가"}
              </button>
            )}
          </div>

          <div className="qav-preview-body">
            {pageThumbUrl ? (
              <>
                {drawMode && (
                  <p className="qap-draw-hint">이미지 위에서 드래그하여 영역을 지정하세요.</p>
                )}

                <div
                  className={`qap-page-img-wrap${drawMode ? " qap-page-img-wrap--draw" : ""}`}
                  style={{ width: "100%" }}
                >
                  <img
                    ref={imgRef}
                    src={pageThumbUrl}
                    alt={`${(selectedPage ?? 0) + 1}페이지 미리보기`}
                    className="qav-preview-img"
                    draggable={false}
                  />
                  {drawMode && (
                    <div
                      ref={overlayRef}
                      className="qap-overlay"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={() => isDragging && handleMouseUp({ clientX: 0, clientY: 0 })}
                    >
                      {dragBox && (
                        <div
                          style={{
                            position: "absolute",
                            left: dragBox.left, top: dragBox.top,
                            width: dragBox.width, height: dragBox.height,
                            border: "2px dashed #2563eb",
                            background: "rgba(37,99,235,0.1)",
                            pointerEvents: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      )}
                      {pendingRegionPx && !isDragging && (
                        <div
                          style={{
                            position: "absolute",
                            left: pendingRegionPx.x0, top: pendingRegionPx.y0,
                            width:  pendingRegionPx.x1 - pendingRegionPx.x0,
                            height: pendingRegionPx.y1 - pendingRegionPx.y0,
                            border: "2px solid #2563eb",
                            background: "rgba(37,99,235,0.08)",
                            pointerEvents: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* 수동 문항 추가 폼 */}
                {drawMode && pendingRegionPt && (
                  <div className="qap-manual-form qav-manual-form">
                    <input
                      type="text"
                      className="qap-manual-input"
                      placeholder="문항 타이틀 입력 (필수)"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")  handleAddManual();
                        if (e.key === "Escape") handleCancelManual();
                      }}
                      autoFocus
                    />
                    <div className="qav-manual-form-btns">
                      <button
                        className="qap-btn qap-btn--primary"
                        onClick={handleAddManual}
                        disabled={addingManual}
                      >
                        {addingManual ? "추가 중..." : "추가"}
                      </button>
                      <button className="qap-btn" onClick={handleCancelManual}>
                        취소
                      </button>
                    </div>
                    {manualTitleError && (
                      <span className="qap-manual-error">{manualTitleError}</span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="qav-empty-state">
                <div className="qav-empty-icon">🖼</div>
                <p>페이지를 선택하면<br />미리보기가 표시됩니다.</p>
              </div>
            )}
          </div>
        </div>

        <div className="resize-handle" onMouseDown={(e) => startResize("section2", e)} />

        {/* ③ 문항 목록 */}
        <div className="panel qav-section-3" style={{ flex: 1, minWidth: 0 }}>
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
              <div className="panel-header">
                <span className="panel-title">③ 문항 목록</span>
              </div>
              <div className="qav-empty-state">
                <div className="qav-empty-icon">📋</div>
                <p>페이지를 선택하면<br />문항 목록이 표시됩니다.</p>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
