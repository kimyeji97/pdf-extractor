/**
 * 문제집 생성 뷰 (REQ-16~20)
 *
 * 4패널 레이아웃:
 *   ① 파일 목록    — FileListPanel (업로드 포함)
 *   ② 문항 목록    — QuestionListPanel (체크박스로 선택)
 *   ③ 선택 순서 편집 — DnD 정렬 리스트 (wbe-basket)
 *   ④ 미리보기 + 레이아웃 선택 + 생성 버튼
 *
 * 주요 흐름:
 *   - ①에서 파일 선택 → ②에 해당 PDF 문항 로드
 *   - ②에서 체크박스 → ③ basket에 추가/제거
 *   - ③에서 DnD로 순서 편집
 *   - ④에서 레이아웃 선택 후 [PDF 생성] 클릭
 *     → POST /api/extract-v2 → 폴링 → 다운로드 + POST /api/workbooks
 *
 * REQ-20 편집 복원:
 *   initialWorkbookId 가 전달되면 마운트 시
 *   GET /api/workbooks/{id} → selections + layout 복원
 *
 * Props:
 *   initialWorkbookId — "생성된 문제집" 탭에서 "편집으로 불러오기" 시 전달
 */
import { useState, useRef, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import FileListPanel from "../components/FileListPanel";
import UploadForm from "../components/UploadForm";
import QuestionListPanel from "../components/QuestionListPanel";
import WorkbookPreview from "../components/WorkbookPreview";

import {
  requestUploadUrl,
  uploadPdf,
  startExtractV2,
  getStatus,
  getWorkbook,
  createWorkbookMeta,
} from "../api/client";

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/api$/, "");
const LAYOUTS  = ["2단", "4단", "6단"];

// ── DnD 정렬 아이템 ───────────────────────────────────────
function SortableItem({ item, index, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.questionId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const label = item.displayTitle
    || (item.isManual ? "(수동 문항)" : `문항 ${item.questionNum}`)
    + ` · ${item.pageNum + 1}p`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`wbe-sel-item${isDragging ? " wbe-sel-item--dragging" : ""}`}
    >
      {/* 드래그 핸들 */}
      <span
        className="wbe-drag-handle"
        {...attributes}
        {...listeners}
        title="드래그하여 순서 변경"
      >
        ⠿
      </span>

      {/* 순번 */}
      <span className="wbe-sel-num">{index + 1}</span>

      {/* 썸네일 */}
      {item.thumbnailUrl ? (
        <img
          src={`${API_ROOT}${item.thumbnailUrl}`}
          alt={label}
          className="wbe-sel-thumb"
          draggable={false}
        />
      ) : (
        <div className="wbe-sel-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✏️</div>
      )}

      {/* 라벨 */}
      <span className="wbe-sel-label" title={label}>{label}</span>

      {/* 제거 버튼 */}
      <button
        className="wbe-sel-remove"
        onClick={() => onRemove(item.questionId)}
        title="목록에서 제거"
      >
        ×
      </button>
    </div>
  );
}


export default function WorkbookEditorView({ initialWorkbookId = null }) {
  // ── 파일 선택 상태 ────────────────────────────────────
  const [jobId, setJobId]                             = useState(null);
  const [selectedJobFilename, setSelectedJobFilename] = useState(null);
  const [uploading, setUploading]                     = useState(false);
  const [uploadError, setUploadError]                 = useState("");
  const [refreshTrigger, setRefreshTrigger]           = useState(0);

  // ── workbook basket (선택 순서) ───────────────────────
  // 아이템 형식: { questionId, questionNum, pageNum, jobId, thumbnailUrl, isManual, manualId, displayTitle }
  const [basket, setBasket] = useState([]);

  // ── 레이아웃 ─────────────────────────────────────────
  const [layout, setLayout] = useState("2단");

  // ── 내보내기 상태 ─────────────────────────────────────
  const [generating, setGenerating]       = useState(false);
  const [generateStatus, setGenerateStatus] = useState(null); // null | 'processing' | 'done' | 'error'
  const [downloadUrl, setDownloadUrl]     = useState(null);
  const [generateError, setGenerateError] = useState("");
  const exportPollRef                     = useRef(null);

  // ── 패널 너비 (리사이즈) ─────────────────────────────
  const [panelWidths, setPanelWidths] = useState({ files: 220, qlist: 260, basket: 240 });
  const resizingRef   = useRef(null);

  // ── DnD sensors ──────────────────────────────────────
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  }));

  // ── REQ-20: initialWorkbookId 복원 ───────────────────
  useEffect(() => {
    if (!initialWorkbookId) return;
    (async () => {
      try {
        const meta = await getWorkbook(initialWorkbookId);
        if (meta.layout) setLayout(meta.layout);
        if (meta.selections?.length) {
          // selections에는 API 형식 필드가 있으므로 UI 형식으로 변환
          const restored = meta.selections.map((s, i) => ({
            questionId:   s.manual_id || String(s.question_num ?? i),
            questionNum:  s.question_num,
            pageNum:      s.page_num,
            jobId:        s.job_id,
            thumbnailUrl: null,  // 복원 시 썸네일 없음 (재로드 불필요)
            isManual:     Boolean(s.manual_id),
            manualId:     s.manual_id,
            displayTitle: s.label || (s.manual_id ? "(수동 문항)" : `문항 ${s.question_num}`),
          }));
          setBasket(restored);
        }
      } catch { /* 복원 실패는 조용히 무시 */ }
    })();
  }, [initialWorkbookId]);

  // ── 리사이즈 핸들러 ──────────────────────────────────
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizingRef.current) return;
      const { panel, startX, startWidth } = resizingRef.current;
      const newWidth = Math.max(160, Math.min(500, startWidth + (e.clientX - startX)));
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

  // ── 핸들러: 파일 선택 ────────────────────────────────
  const handleJobSelect = (selectedJobId, filename) => {
    setJobId(selectedJobId);
    setSelectedJobFilename(filename || null);
  };

  // ── 핸들러: PDF 업로드 ───────────────────────────────
  const handleFileSelected = async (file) => {
    setUploading(true);
    setUploadError("");
    try {
      const { job_id, upload_url } = await requestUploadUrl(file.name);
      await uploadPdf(upload_url, file);
      setJobId(job_id);
      setSelectedJobFilename(file.name);
      setRefreshTrigger((t) => t + 1);
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  };

  // ── basket 조작 ──────────────────────────────────────
  const toggleSelection = useCallback((q) => {
    const qId = q.question_id;
    setBasket((prev) => {
      const exists = prev.some((b) => b.questionId === qId);
      if (exists) return prev.filter((b) => b.questionId !== qId);
      return [
        ...prev,
        {
          questionId:   qId,
          questionNum:  q.question_num,
          pageNum:      q._pageNum,
          jobId:        jobId,
          thumbnailUrl: q.thumbnail_url,
          isManual:     q.is_manual,
          manualId:     q.manual_id,
          displayTitle: q.title || (q.is_manual ? "(수동 문항)" : `문항 ${q.question_num}`) + ` · ${(q._pageNum ?? 0) + 1}p`,
        },
      ];
    });
  }, [jobId]);

  const removeFromBasket = (questionId) => {
    setBasket((prev) => prev.filter((b) => b.questionId !== questionId));
  };

  // ── DnD 완료 ─────────────────────────────────────────
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBasket((prev) => {
        const oldIdx = prev.findIndex((b) => b.questionId === active.id);
        const newIdx = prev.findIndex((b) => b.questionId === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };

  // ── PDF 생성 ─────────────────────────────────────────
  const handleGenerate = async () => {
    if (basket.length === 0 || generating) return;
    setGenerating(true);
    setGenerateStatus("processing");
    setGenerateError("");
    setDownloadUrl(null);

    try {
      const selections = basket.map((b) => ({
        jobId:       b.jobId,
        pageNum:     b.pageNum,
        questionId:  b.questionId,
        questionNum: b.isManual ? undefined : b.questionNum,
        manualId:    b.isManual ? b.manualId : undefined,
        label:       b.displayTitle,
      }));

      const { job_id: exportJobId } = await startExtractV2(selections, layout);

      exportPollRef.current = setInterval(async () => {
        try {
          const data = await getStatus(exportJobId);
          if (data.status === "DONE") {
            clearInterval(exportPollRef.current);
            exportPollRef.current = null;
            setGenerating(false);
            setGenerateStatus("done");
            if (data.download_url) {
              setDownloadUrl(data.download_url);
              // 자동 다운로드 트리거
              const a = document.createElement("a");
              a.href = data.download_url;
              a.download = "workbook.pdf";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
            // 문제집 메타 저장
            try {
              await createWorkbookMeta({
                layout,
                question_count: basket.length,
                result_job_id:  exportJobId,
                selections: basket.map((b) => ({
                  question_id:  b.questionId,
                  job_id:       b.jobId,
                  page_num:     b.pageNum,
                  question_num: b.isManual ? undefined : b.questionNum,
                  manual_id:    b.isManual ? b.manualId : undefined,
                  title:        b.displayTitle,
                })),
              });
            } catch { /* 저장 실패는 조용히 무시 */ }
          } else if (data.status === "FAILED") {
            clearInterval(exportPollRef.current);
            exportPollRef.current = null;
            setGenerating(false);
            setGenerateStatus("error");
            setGenerateError("PDF 생성에 실패했습니다.");
          }
        } catch { /* 폴링 오류 무시 */ }
      }, 2000);
    } catch (e) {
      setGenerating(false);
      setGenerateStatus("error");
      setGenerateError(e.message || "PDF 생성 요청 실패");
    }
  };

  // ── 정리 ─────────────────────────────────────────────
  useEffect(() => () => {
    if (exportPollRef.current) clearInterval(exportPollRef.current);
  }, []);

  return (
    <div className="wbe-layout view-layout">

      {/* 컨텍스트 바 */}
      {selectedJobFilename && (
        <div className="view-context-bar">
          선택된 파일: <strong>{selectedJobFilename}</strong>
          {basket.length > 0 && (
            <span style={{ marginLeft: 12, color: "#2563eb" }}>
              {basket.length}개 선택됨
            </span>
          )}
        </div>
      )}

      <div className="wbe-panels">

        {/* ① 파일 목록 */}
        <div
          className="panel"
          style={{ width: panelWidths.files, minWidth: 160, flexShrink: 0 }}
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
              {uploading   && <p className="info-msg">업로드 중...</p>}
              <UploadForm onFileSelected={handleFileSelected} disabled={uploading} />
            </div>
          </div>
        </div>

        <div className="resize-handle" onMouseDown={(e) => startResize("files", e)} />

        {/* ② 문항 목록 */}
        <div
          className="panel"
          style={{ width: panelWidths.qlist, minWidth: 160, flexShrink: 0 }}
        >
          <div className="panel-header">
            <span className="panel-title">② 문항 선택</span>
            {jobId && <span className="panel-hint">체크하여 추가</span>}
          </div>
          <QuestionListPanel
            jobId={jobId}
            selections={basket}
            onToggle={toggleSelection}
          />
        </div>

        <div className="resize-handle" onMouseDown={(e) => startResize("qlist", e)} />

        {/* ③ 선택 순서 편집 (DnD) */}
        <div
          className="panel"
          style={{ width: panelWidths.basket, minWidth: 160, flexShrink: 0 }}
        >
          <div className="panel-header">
            <span className="panel-title">③ 순서 편집</span>
            {basket.length > 0 && <span className="panel-hint">드래그로 순서 변경</span>}
          </div>
          <div className="wbe-basket" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div className="wbe-basket-header">
              {basket.length}개 선택됨
              {basket.length > 0 && (
                <button
                  style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}
                  onClick={() => setBasket([])}
                >
                  전체 제거
                </button>
              )}
            </div>
            <div className="wbe-basket-body">
              {basket.length === 0 ? (
                <div className="wbe-basket-empty">
                  ②에서 문항을 체크하면<br />여기에 추가됩니다.
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={basket.map((b) => b.questionId)}
                    strategy={verticalListSortingStrategy}
                  >
                    {basket.map((item, idx) => (
                      <SortableItem
                        key={item.questionId}
                        item={item}
                        index={idx}
                        onRemove={removeFromBasket}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>

        <div className="resize-handle" onMouseDown={(e) => startResize("basket", e)} />

        {/* ④ 미리보기 + 레이아웃 + 생성 */}
        <div className="panel wbe-preview-panel" style={{ flex: 1, minWidth: 0 }}>
          {/* 레이아웃 선택 + 생성 버튼 바 */}
          <div className="wbe-layout-bar">
            <span className="wbe-layout-label">레이아웃</span>
            {LAYOUTS.map((l) => (
              <button
                key={l}
                className={`wbe-layout-btn${layout === l ? " wbe-layout-btn--active" : ""}`}
                onClick={() => setLayout(l)}
              >
                {l}
              </button>
            ))}
            <button
              className="wbe-generate-btn"
              onClick={handleGenerate}
              disabled={basket.length === 0 || generating}
            >
              {generating ? "⏳ 생성 중..." : "PDF 생성"}
            </button>
          </div>

          {/* 상태 메시지 */}
          {generateStatus === "processing" && (
            <div className="wbe-status-bar wbe-status-bar--info">
              ⏳ PDF를 생성하고 있습니다. 잠시만 기다려 주세요...
            </div>
          )}
          {generateStatus === "done" && (
            <div className="wbe-status-bar wbe-status-bar--success">
              ✅ PDF 생성 완료!{" "}
              {downloadUrl && (
                <a href={downloadUrl} download="workbook.pdf" style={{ color: "#059669", fontWeight: 600 }}>
                  다시 다운로드
                </a>
              )}
            </div>
          )}
          {generateStatus === "error" && (
            <div className="wbe-status-bar wbe-status-bar--error">
              ❌ {generateError}
            </div>
          )}

          {/* A4 미리보기 */}
          <div className="wbe-preview-body">
            <WorkbookPreview
              selections={basket}
              layout={layout}
              previewWidth={340}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
