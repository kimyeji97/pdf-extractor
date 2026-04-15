import { useState, useRef } from "react";
import UploadForm from "./components/UploadForm";
import QuestionInput from "./components/QuestionInput";
import StatusPoller from "./components/StatusPoller";
import FileListPanel from "./components/FileListPanel";
import PageBrowser from "./components/PageBrowser";
import QuestionPicker from "./components/QuestionPicker";
import SelectionBasket from "./components/SelectionBasket";
import { requestUploadUrl, uploadPdf, startExtract, startExtractV2, getStatus } from "./api/client";
import "./App.css";

/**
 * 전체 유저 플로우
 *   file-list → uploading → page-browse → question-pick → (basket에서 PDF 다운로드)
 *   기존 v1 플로우: file-list → ... → ready → processing → done / error
 */
const STEPS = {
  FILE_LIST:     "file-list",     // 앱 진입 기본 화면
  UPLOADING:     "uploading",     // S3 업로드 중
  PAGE_BROWSE:   "page-browse",   // 페이지 썸네일 브라우징
  QUESTION_PICK: "question-pick", // 페이지 내 문항 선택
  READY:         "ready",         // (v1) 페이지 선택 완료, 추출 대기
  PROCESSING:    "processing",    // (v1) 추출 작업 진행 중
  DONE:          "done",
  ERROR:         "error",
};

export default function App() {
  const [step, setStep] = useState(STEPS.FILE_LIST);
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState("");
  const [jobId, setJobId] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // 바스켓 상태
  const [basket, setBasket] = useState([]);
  const [exporting, setExporting] = useState(false);
  const exportPollRef = useRef(null);

  // ── 파일 목록에서 job 선택 → 페이지 브라우징 ────────
  const handleJobSelect = (selectedJobId) => {
    setJobId(selectedJobId);
    setSelectedPage(null);
    setStep(STEPS.PAGE_BROWSE);
  };

  // ── 페이지 선택 → 문항 선택 ──────────────────────────
  const handlePageSelect = (pageNum) => {
    setSelectedPage(pageNum);
    setStep(STEPS.QUESTION_PICK);
  };

  // ── 페이지 브라우징 → 파일 목록으로 복귀 ────────────
  const handleBackToFileList = () => {
    setStep(STEPS.FILE_LIST);
  };

  // ── 문항 선택 → 페이지 브라우징으로 복귀 ────────────
  const handleBackToPageBrowse = () => {
    setStep(STEPS.PAGE_BROWSE);
  };

  // ── Step 1: 파일 선택 후 S3 업로드 ─────────────────
  const handleFileSelected = async (selectedFile) => {
    setFile(selectedFile);
    setStep(STEPS.UPLOADING);
    setErrorMsg("");

    try {
      const { job_id, upload_url } = await requestUploadUrl(selectedFile.name);
      setJobId(job_id);
      await uploadPdf(upload_url, selectedFile);
      setSelectedPage(null);
      setStep(STEPS.PAGE_BROWSE);
    } catch (e) {
      setErrorMsg(e.message);
      setStep(STEPS.ERROR);
    }
  };

  // ── 바스켓 조작 ───────────────────────────────────
  const addToBasket = (item) => {
    setBasket((prev) =>
      prev.some((b) => b.questionId === item.questionId) ? prev : [...prev, item]
    );
  };

  const removeFromBasket = (questionId) => {
    setBasket((prev) => prev.filter((b) => b.questionId !== questionId));
  };

  // ── PDF 내보내기 (v2) ─────────────────────────────
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
            // 자동 다운로드
            if (data.download_url) {
              const a = document.createElement("a");
              a.href = data.download_url;
              a.download = "selected_questions.pdf";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
          } else if (data.status === "FAILED") {
            clearInterval(exportPollRef.current);
            exportPollRef.current = null;
            setExporting(false);
            alert("내보내기 실패: " + (data.error || "알 수 없는 오류"));
          }
        } catch {
          // 폴링 오류는 무시하고 재시도
        }
      }, 2000);
    } catch (e) {
      setExporting(false);
      alert("내보내기 요청 실패: " + e.message);
    }
  };

  // ── (v1) 추출 시작 ─────────────────────────────────
  const handleExtract = async () => {
    if (!questions.trim()) {
      alert("추출할 문항 번호를 입력하세요.");
      return;
    }
    setErrorMsg("");
    setStep(STEPS.PROCESSING);

    try {
      await startExtract(jobId, questions.trim());
    } catch (e) {
      setErrorMsg(e.message);
      setStep(STEPS.ERROR);
    }
  };

  const handleReset = () => {
    if (exportPollRef.current) {
      clearInterval(exportPollRef.current);
      exportPollRef.current = null;
    }
    setStep(STEPS.FILE_LIST);
    setFile(null);
    setQuestions("");
    setJobId(null);
    setSelectedPage(null);
    setErrorMsg("");
    setBasket([]);
    setExporting(false);
  };

  const isProcessing = step === STEPS.UPLOADING || step === STEPS.PROCESSING;
  const showBasket = basket.length > 0 || step === STEPS.QUESTION_PICK;

  return (
    <div className="app">
      <header>
        <h1>기출문제 PDF 문항 추출기</h1>
        <p>원하는 문항 번호만 골라 새 PDF로 받아보세요</p>
      </header>

      <main style={{ paddingBottom: showBasket ? 72 : 0 }}>
        {/* 파일 목록 */}
        {step === STEPS.FILE_LIST && (
          <section>
            <FileListPanel onSelect={handleJobSelect} />
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 13, color: "#888" }}>또는 새 PDF를 업로드하세요</p>
              <UploadForm onFileSelected={handleFileSelected} disabled={false} />
            </div>
          </section>
        )}

        {/* 업로드 중 */}
        {step === STEPS.UPLOADING && (
          <section>
            <h2>1. PDF 업로드</h2>
            <p className="info-msg">S3에 업로드 중...</p>
          </section>
        )}

        {/* 페이지 브라우징 */}
        {step === STEPS.PAGE_BROWSE && (
          <section>
            <h2>2. 페이지 선택</h2>
            <PageBrowser
              jobId={jobId}
              onPageSelect={handlePageSelect}
              onBack={handleBackToFileList}
            />
          </section>
        )}

        {/* 문항 선택 (신규) */}
        {step === STEPS.QUESTION_PICK && (
          <section>
            <h2>3. 문항 선택</h2>
            {selectedPage !== null && (
              <p style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
                {selectedPage + 1}페이지 · 문항을 클릭해 바스켓에 추가하세요
              </p>
            )}
            <QuestionPicker
              jobId={jobId}
              pageNum={selectedPage}
              basket={basket}
              onAddToBasket={addToBasket}
              onRemoveFromBasket={removeFromBasket}
              onBack={handleBackToPageBrowse}
            />
          </section>
        )}

        {/* (v1) 문항 번호 입력 */}
        {(step === STEPS.READY || step === STEPS.PROCESSING || step === STEPS.DONE) && (
          <section>
            <h2>3. 문항 번호 입력</h2>
            {selectedPage !== null && (
              <p style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
                선택된 페이지: {selectedPage + 1}페이지
              </p>
            )}
            <QuestionInput
              value={questions}
              onChange={setQuestions}
              disabled={step !== STEPS.READY}
            />
            {step === STEPS.READY && (
              <button className="extract-btn" onClick={handleExtract}>
                추출 시작
              </button>
            )}
          </section>
        )}

        {/* 상태 + 다운로드 */}
        {(step === STEPS.PROCESSING || step === STEPS.DONE) && (
          <section>
            <h2>4. 결과 다운로드</h2>
            <StatusPoller jobId={jobId} onDone={() => setStep(STEPS.DONE)} />
          </section>
        )}

        {/* 에러 */}
        {step === STEPS.ERROR && (
          <div className="error-box">
            <p>오류: {errorMsg}</p>
            <button onClick={handleReset}>다시 시작</button>
          </div>
        )}

        {/* 완료 후 재시작 */}
        {step === STEPS.DONE && (
          <button className="reset-btn" onClick={handleReset}>
            새 PDF 추출하기
          </button>
        )}
      </main>

      {/* 하단 고정 바스켓 */}
      {showBasket && (
        <SelectionBasket
          basket={basket}
          onRemove={removeFromBasket}
          onExport={handleExport}
          exporting={exporting}
        />
      )}
    </div>
  );
}
