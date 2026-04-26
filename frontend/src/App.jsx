import { useState, useRef, useEffect, useCallback } from "react";
import UploadForm from "./components/UploadForm";
import FileListPanel from "./components/FileListPanel";
import PageBrowser from "./components/PageBrowser";
import QuestionPicker from "./components/QuestionPicker";
import SelectionBasket from "./components/SelectionBasket";
import { requestUploadUrl, uploadPdf, startExtractV2, getStatus } from "./api/client";
import "./App.css";

export default function App() {
  // ── 선택 상태 ───────────────────────────────────────
  const [jobId, setJobId]                       = useState(null);
  const [selectedJobFilename, setSelectedJobFilename] = useState(null);
  const [selectedPage, setSelectedPage]         = useState(null);
  const [selectedPageInfo, setSelectedPageInfo] = useState(null);

  // ── 바스켓 / 내보내기 ───────────────────────────────
  const [basket, setBasket]     = useState([]);
  const [exporting, setExporting] = useState(false);
  const exportPollRef             = useRef(null);

  // ── 업로드 ──────────────────────────────────────────
  const [uploading, setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState("");
  // FileListPanel에 새로고침 신호를 보내는 카운터
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ── 패널 너비 (리사이즈) ─────────────────────────────
  const [panelWidths, setPanelWidths] = useState({ files: 270, pages: 290 });
  const resizingRef = useRef(null); // { panel: 'files'|'pages', startX, startWidth }
  const isResizingRef = useRef(false);

  // ── 리사이즈 핸들러 ─────────────────────────────────
  const handleResizeStart = useCallback((panel, e) => {
    e.preventDefault();
    isResizingRef.current = true;
    resizingRef.current = {
      panel,
      startX: e.clientX,
      startWidth: panelWidths[panel],
    };
  }, [panelWidths]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizingRef.current) return;
      const { panel, startX, startWidth } = resizingRef.current;
      const delta = e.clientX - startX;
      const newWidth = Math.max(180, Math.min(560, startWidth + delta));
      setPanelWidths(prev => ({ ...prev, [panel]: newWidth }));
    };
    const handleMouseUp = () => {
      resizingRef.current = null;
      isResizingRef.current = false;
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

  // 리사이즈 중 커서 스타일 전역 적용
  const handleResizeMouseDown = (panel, e) => {
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    handleResizeStart(panel, e);
  };

  // ── 핸들러: 파일 선택 ───────────────────────────────
  const handleJobSelect = (selectedJobId, filename) => {
    setJobId(selectedJobId);
    setSelectedJobFilename(filename || null);
    setSelectedPage(null);
    setSelectedPageInfo(null);
  };

  // ── 핸들러: 페이지 선택 ─────────────────────────────
  const handlePageSelect = (pageNum, pageInfo) => {
    setSelectedPage(pageNum);
    setSelectedPageInfo(pageInfo || null);
  };

  // ── 핸들러: PDF 업로드 ──────────────────────────────
  const handleFileSelected = async (selectedFile) => {
    setUploading(true);
    setUploadError("");
    try {
      const { job_id, upload_url } = await requestUploadUrl(selectedFile.name);
      await uploadPdf(upload_url, selectedFile);
      setJobId(job_id);
      setSelectedJobFilename(selectedFile.name);
      setSelectedPage(null);
      setSelectedPageInfo(null);
      setRefreshTrigger((t) => t + 1);
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  };

  // ── 바스켓 조작 ─────────────────────────────────────
  const addToBasket = (item) => {
    setBasket((prev) =>
      prev.some((b) => b.questionId === item.questionId) ? prev : [...prev, item]
    );
  };

  const removeFromBasket = (questionId) => {
    setBasket((prev) => prev.filter((b) => b.questionId !== questionId));
  };

  // ── PDF 내보내기 (v2) ───────────────────────────────
  const handleExport = async () => {
    if (basket.length === 0 || exporting) return;
    setExporting(true);
    try {
      const { job_id: exportJobId } = await startExtractV2(basket);

      exportPollRef.current = setInterval(async () => {
        try {
          const data = await getStatus(exportJobId);
          if (data.status === "DONE") {
            clearInterval(exportPollRef.current);
            exportPollRef.current = null;
            setExporting(false);
            if (data.download_url) {
              const a = document.createElement("a");
              a.href = data.download_url;
              a.download = "selected_questions.pdf";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
            setRefreshTrigger((t) => t + 1);
          } else if (data.status === "FAILED") {
            clearInterval(exportPollRef.current);
            exportPollRef.current = null;
            setExporting(false);
            alert("내보내기 실패: " + (data.error || "알 수 없는 오류"));
          }
        } catch {
          /* 폴링 오류 무시 후 재시도 */
        }
      }, 2000);
    } catch (e) {
      setExporting(false);
      alert("내보내기 요청 실패: " + e.message);
    }
  };

  // ── 렌더 ────────────────────────────────────────────
  return (
    <div className="app-layout">

      {/* ─── 상단 헤더 ─────────────────────────────── */}
      <header className="app-header">
        <h1>기출문제 PDF 문항 추출기</h1>
        {selectedJobFilename ? (
          <span className="app-header-filename" title={selectedJobFilename}>
            📄 {selectedJobFilename}
          </span>
        ) : (
          <p>파일 선택 → 페이지 선택 → 문항 선택 → PDF 다운로드</p>
        )}
      </header>

      {/* ─── 3패널 영역 ────────────────────────────── */}
      <div className="panels">

        {/* ① 파일 목록 */}
        <div
          className="panel panel-files"
          style={{ width: panelWidths.files, minWidth: 180, flexShrink: 0 }}
        >
          <div className="panel-header">
            <span className="panel-title">① 파일 선택</span>
          </div>
          <div className="panel-body">
            <FileListPanel
              selectedJobId={jobId}
              onSelect={handleJobSelect}
              refreshTrigger={refreshTrigger}
            />
            <div className="upload-section">
              <div className="upload-divider">새 PDF 업로드</div>
              {uploadError && <p className="error-msg">{uploadError}</p>}
              {uploading  && <p className="info-msg">업로드 중...</p>}
              <UploadForm onFileSelected={handleFileSelected} disabled={uploading} />
            </div>
          </div>
        </div>

        {/* 리사이즈 핸들 1 */}
        <div
          className="resize-handle"
          onMouseDown={(e) => handleResizeMouseDown("files", e)}
          title="드래그하여 너비 조절"
        />

        {/* ② 페이지 선택 */}
        <div
          className="panel panel-pages"
          style={{ width: panelWidths.pages, minWidth: 180, flexShrink: 0 }}
        >
          <div className="panel-header">
            <span className="panel-title">② 페이지 선택</span>
            {jobId && <span className="panel-hint">페이지를 클릭하세요</span>}
          </div>
          <div className="panel-body">
            {jobId ? (
              <PageBrowser
                key={jobId}
                jobId={jobId}
                onPageSelect={handlePageSelect}
                selectedPageNum={selectedPage}
              />
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <p>왼쪽 목록에서<br />PDF 파일을 선택하세요</p>
              </div>
            )}
          </div>
        </div>

        {/* 리사이즈 핸들 2 */}
        <div
          className="resize-handle"
          onMouseDown={(e) => handleResizeMouseDown("pages", e)}
          title="드래그하여 너비 조절"
        />

        {/* ③ 문항 선택 */}
        <div className="panel panel-questions" style={{ flex: 1, minWidth: 0 }}>
          <div className="panel-header">
            <span className="panel-title">③ 문항 선택</span>
            {selectedPage !== null && (
              <span className="panel-hint">{selectedPage + 1}페이지 · 문항을 클릭해 바스켓에 추가</span>
            )}
          </div>
          <div className="panel-body">
            {selectedPage !== null ? (
              <QuestionPicker
                key={`${jobId}-${selectedPage}`}
                jobId={jobId}
                pageNum={selectedPage}
                pageInfo={selectedPageInfo}
                basket={basket}
                onAddToBasket={addToBasket}
                onRemoveFromBasket={removeFromBasket}
              />
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <p>페이지를 선택하면<br />문항 목록이 표시됩니다</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ─── 하단 고정 바스켓 ───────────────────────── */}
      <SelectionBasket
        basket={basket}
        onRemove={removeFromBasket}
        onExport={handleExport}
        exporting={exporting}
      />
    </div>
  );
}
