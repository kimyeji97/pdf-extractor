import { useState } from "react";
import UploadForm from "./components/UploadForm";
import QuestionInput from "./components/QuestionInput";
import StatusPoller from "./components/StatusPoller";
import FileListPanel from "./components/FileListPanel";
import { requestUploadUrl, uploadPdf, startExtract } from "./api/client";
import "./App.css";

/**
 * 전체 유저 플로우
 *   file-list → idle → uploading → ready → processing → done / error
 */
const STEPS = {
  FILE_LIST: "file-list",   // 앱 진입 기본 화면
  IDLE: "idle",
  UPLOADING: "uploading",   // S3 업로드 중
  READY: "ready",           // 업로드 완료, 추출 대기
  PROCESSING: "processing", // 추출 작업 진행 중
  DONE: "done",
  ERROR: "error",
};

export default function App() {
  const [step, setStep] = useState(STEPS.FILE_LIST);
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState("");
  const [jobId, setJobId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // ── 파일 목록에서 job 선택 ──────────────────────────
  const handleJobSelect = (selectedJobId) => {
    setJobId(selectedJobId);
    setStep(STEPS.READY);
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
      setStep(STEPS.READY);
    } catch (e) {
      setErrorMsg(e.message);
      setStep(STEPS.ERROR);
    }
  };

  // ── Step 2: 추출 시작 ─────────────────────────────
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
    setStep(STEPS.FILE_LIST);
    setFile(null);
    setQuestions("");
    setJobId(null);
    setErrorMsg("");
  };

  const isProcessing = step === STEPS.UPLOADING || step === STEPS.PROCESSING;

  return (
    <div className="app">
      <header>
        <h1>기출문제 PDF 문항 추출기</h1>
        <p>원하는 문항 번호만 골라 새 PDF로 받아보세요</p>
      </header>

      <main>
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

        {/* 업로드 영역 (file-list 이후 단계) */}
        {step !== STEPS.FILE_LIST && (
          <section>
            <h2>1. PDF 업로드</h2>
            <UploadForm onFileSelected={handleFileSelected} disabled={isProcessing} />
            {step === STEPS.UPLOADING && <p className="info-msg">S3에 업로드 중...</p>}
            {step !== STEPS.UPLOADING && (
              <p className="success-msg">✓ 업로드 완료</p>
            )}
          </section>
        )}

        {/* 문항 번호 입력 */}
        {(step === STEPS.READY || step === STEPS.PROCESSING || step === STEPS.DONE) && (
          <section>
            <h2>2. 문항 번호 입력</h2>
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
            <h2>3. 결과 다운로드</h2>
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
    </div>
  );
}
