/**
 * 문항 분석 뷰 (REQ-D03, D04)
 *
 * v3.1 전면 재작성:
 *   - 기존 3패널(FileListPanel + PageBrowser + QuestionAnalysisPanel) 구조 폐기
 *   - Section A: FilePagePanel (파일+페이지 통합 선택, 재감지 포함)
 *   - Section B: QuestionAnalysisPanel (대형 이미지, 문항 관리)
 *   - SelectionBasket / 내보내기 기능 완전 제거
 *   - PDF 업로드는 Section A 상단에 유지
 *
 * 레이아웃:
 *   ┌──────────────────────────────────┐
 *   │  [업로드]  [Section A: 파일+페이지] │
 *   │────────────────────────────────── │
 *   │  [Section B: 문항 분석]            │
 *   └──────────────────────────────────┘
 *
 *   실제로는 좌(Section A) + 우(Section B) 2단 분할
 */
import { useState, useCallback } from "react";
import UploadForm from "../components/UploadForm";
import FilePagePanel from "../components/FilePagePanel";
import QuestionAnalysisPanel from "../components/QuestionAnalysisPanel";
import { requestUploadUrl, uploadPdf } from "../api/client";

export default function QuestionAnalysisView() {
  // ── 선택 상태 ────────────────────────────────────────────
  const [jobId, setJobId]       = useState(null);
  const [selectedPage, setSelectedPage]     = useState(null);
  const [selectedPageInfo, setSelectedPageInfo] = useState(null);

  // ── 업로드 ───────────────────────────────────────────────
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState("");

  // FilePagePanel 새로고침 신호 (업로드 완료 시 파일 목록 재로드)
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // QuestionAnalysisPanel 새로고침 신호 (FilePagePanel 재감지 완료 시)
  // FilePagePanel의 재감지 완료 후 페이지 목록이 갱신되면
  // 동일 페이지를 다시 선택한 것으로 처리해 문항 목록도 갱신됨.
  // → selectedPage 자체는 유지, 별도 카운터로 Panel 재로드 트리거
  const [panelRefreshTrigger, setPanelRefreshTrigger] = useState(0);

  // ── 핸들러: 파일 변경 (FilePagePanel → 파일 모드로 돌아갈 때) ──
  const handleJobChange = useCallback((jid, _filename) => {
    setJobId(jid);
    setSelectedPage(null);
    setSelectedPageInfo(null);
  }, []);

  // ── 핸들러: 페이지 선택 ──────────────────────────────────
  const handlePageSelect = useCallback((jid, pageNum, pageInfo) => {
    setJobId(jid);
    setSelectedPage(pageNum);
    setSelectedPageInfo(pageInfo || null);
    // 같은 페이지를 다시 선택해도 Panel이 재로드되도록 트리거 증가
    setPanelRefreshTrigger((t) => t + 1);
  }, []);

  // ── 핸들러: PDF 업로드 ───────────────────────────────────
  const handleFileSelected = async (selectedFile) => {
    setUploading(true);
    setUploadError("");
    try {
      const { job_id, upload_url } = await requestUploadUrl(selectedFile.name);
      await uploadPdf(upload_url, selectedFile);
      // 파일 목록 새로고침 (FilePagePanel)
      setRefreshTrigger((t) => t + 1);
      // 선택 상태 초기화
      setJobId(null);
      setSelectedPage(null);
      setSelectedPageInfo(null);
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="qav-layout">

      {/* ── Section A: 파일+페이지 패널 ─────────────────── */}
      <div className="qav-section-a">
        {/* 업로드 영역 */}
        <div className="qav-upload">
          {uploadError && <p className="qav-upload-error">{uploadError}</p>}
          {uploading   && <p className="qav-upload-info">업로드 중...</p>}
          <UploadForm onFileSelected={handleFileSelected} disabled={uploading} />
        </div>

        {/* 파일+페이지 통합 패널 (REQ-D04) */}
        <FilePagePanel
          onPageSelect={handlePageSelect}
          onJobChange={handleJobChange}
          refreshTrigger={refreshTrigger}
          selectedPageNum={selectedPage}
        />
      </div>

      {/* ── Section B: 문항 분석 패널 ───────────────────── */}
      <div className="qav-section-b">
        {selectedPage !== null && jobId ? (
          <QuestionAnalysisPanel
            key={`${jobId}-${selectedPage}`}
            jobId={jobId}
            pageNum={selectedPage}
            pageInfo={selectedPageInfo}
            refreshTrigger={panelRefreshTrigger}
          />
        ) : (
          <div className="qav-empty-state">
            <div className="qav-empty-icon">📄</div>
            <p>왼쪽 패널에서 파일과 페이지를 선택하면<br />문항 목록이 표시됩니다.</p>
          </div>
        )}
      </div>

    </div>
  );
}
