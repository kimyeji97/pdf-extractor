/**
 * 문제집 편집 페이지 (Aurora MUI 레이아웃 적용)
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router";
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

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import { Icon } from "@iconify/react";

import FileListPanel from "components/FileListPanel";
import QuestionListPanel from "components/QuestionListPanel";
import WorkbookPreview from "components/WorkbookPreview";
import {
  startExtractV2,
  getStatus,
  getWorkbook,
  createWorkbookMeta,
  listCovers,
} from "api/client";

const API_ROOT = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"
).replace(/\/api$/, "");
const LAYOUTS = ["세로 2단", "가로 2단", "4단", "6단"];

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

// ── DnD 정렬 아이템 ───────────────────────────────────
function SortableItem({ item, index, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.questionId });
  const label =
    item.displayTitle ||
    (item.isManual ? "(수동 문항)" : `문항 ${item.questionNum}`) +
      ` · ${item.pageNum + 1}p`;

  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 1,
        bgcolor: isDragging ? "action.selected" : "background.paper",
        borderBottom: 1,
        borderColor: "divider",
        opacity: isDragging ? 0.8 : 1,
        boxShadow: isDragging ? 3 : 0,
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{
          cursor: "grab",
          color: "text.disabled",
          fontSize: 18,
          lineHeight: 1,
        }}
      >
        ⠿
      </Box>
      <Typography
        variant="caption"
        sx={{ color: "text.secondary", minWidth: 20, textAlign: "center" }}
      >
        {index + 1}
      </Typography>
      {item.thumbnailUrl ? (
        <Box
          component="img"
          src={`${API_ROOT}${item.thumbnailUrl}`}
          alt={label}
          draggable={false}
          sx={{
            width: 36,
            height: 36,
            objectFit: "cover",
            borderRadius: 0.5,
            border: 1,
            borderColor: "divider",
          }}
        />
      ) : (
        <Box
          sx={{
            width: 36,
            height: 36,
            bgcolor: "action.hover",
            borderRadius: 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}
        >
          ✏️
        </Box>
      )}
      <Typography
        variant="caption"
        sx={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={label}
      >
        {label}
      </Typography>
      <IconButton
        size="small"
        onClick={() => onRemove(item.questionId)}
        sx={{ color: "error.main", p: 0.25 }}
      >
        <Icon icon="material-symbols:close-rounded" style={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
}

export default function EditorPage() {
  const { state } = useLocation();
  const initialWorkbookId = state?.initialWorkbookId ?? null;
  const [jobId, setJobId] = useState(null);
  const [selectedJobFilename, setSelectedJobFilename] = useState(null);
  const [selectedWorkbookName, setSelectedWorkbookName] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [basket, setBasket] = useState([]);
  const [layout, setLayout] = useState("세로 2단");
  const todayStr = new Date().toISOString().slice(0, 10);
  const [filename, setFilename] = useState(`문제집_${todayStr}`);
  const [filenameError, setFilenameError] = useState("");
  const [covers, setCovers] = useState([]);
  const [selectedCoverId, setSelectedCoverId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [generateError, setGenerateError] = useState("");
  const exportPollRef = useRef(null);

  const [panelWidths, setPanelWidths] = useState({
    files: 220,
    qlist: 260,
    basket: 240,
  });
  const resizingRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // REQ-20 복원
  useEffect(() => {
    if (!initialWorkbookId) return;
    (async () => {
      try {
        const meta = await getWorkbook(initialWorkbookId);
        if (meta.layout) setLayout(meta.layout);
        if (meta.selections?.length) {
          setBasket(
            meta.selections.map((s, i) => ({
              questionId: s.manual_id || String(s.question_num ?? i),
              questionNum: s.question_num,
              pageNum: s.page_num,
              jobId: s.job_id,
              thumbnailUrl: null,
              isManual: Boolean(s.manual_id),
              manualId: s.manual_id,
              displayTitle:
                s.label ||
                (s.manual_id ? "(수동 문항)" : `문항 ${s.question_num}`),
            })),
          );
        }
      } catch {}
    })();
  }, [initialWorkbookId]);

  useEffect(() => {
    const onMove = (e) => {
      if (!resizingRef.current) return;
      const { panel, startX, startWidth } = resizingRef.current;
      const nw = Math.max(
        160,
        Math.min(500, startWidth + (e.clientX - startX)),
      );
      setPanelWidths((p) => ({ ...p, [panel]: nw }));
    };
    const onUp = () => {
      resizingRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const startResize = (panel, e) => {
    e.preventDefault();
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    resizingRef.current = {
      panel,
      startX: e.clientX,
      startWidth: panelWidths[panel],
    };
  };

  const handleJobSelect = (jid, fname, wname) => {
    setJobId(jid);
    setSelectedJobFilename(fname || null);
    setSelectedWorkbookName(wname || "");
  };

  const toggleSelection = useCallback(
    (q) => {
      const qId = q.question_id;
      setBasket((prev) => {
        const exists = prev.some((b) => b.questionId === qId);
        if (exists) return prev.filter((b) => b.questionId !== qId);
        return [
          ...prev,
          {
            questionId: qId,
            questionNum: q.question_num,
            pageNum: q._pageNum,
            jobId,
            workbookName: selectedWorkbookName,
            thumbnailUrl: q.thumbnail_url,
            isManual: q.is_manual,
            manualId: q.manual_id,
            displayTitle:
              q.title || (q.is_manual ? "(수동 문항)" : `문항 ${q.question_num}`),
          },
        ];
      });
    },
    [jobId, selectedWorkbookName],
  );

  const removeFromBasket = (qId) =>
    setBasket((prev) => prev.filter((b) => b.questionId !== qId));

  const handleDragEnd = ({ active, over }) => {
    if (over && active.id !== over.id) {
      setBasket((prev) =>
        arrayMove(
          prev,
          prev.findIndex((b) => b.questionId === active.id),
          prev.findIndex((b) => b.questionId === over.id),
        ),
      );
    }
  };

  const INVALID_CHARS = /[/\\:*?"<>|]/;
  const handleGenerate = async () => {
    if (basket.length === 0 || generating) return;
    const trimmed = filename.trim();
    if (!trimmed) {
      setFilenameError("파일명을 입력해주세요.");
      return;
    }
    if (INVALID_CHARS.test(trimmed)) {
      setFilenameError("특수문자는 사용할 수 없습니다.");
      return;
    }
    setFilenameError("");
    setGenerating(true);
    setGenerateStatus("processing");
    setGenerateError("");
    setDownloadUrl(null);
    try {
      const selections = basket.map((b) => ({
        jobId: b.jobId,
        pageNum: b.pageNum,
        questionId: b.questionId,
        questionNum: b.isManual ? undefined : b.questionNum,
        manualId: b.isManual ? b.manualId : undefined,
        label: b.displayTitle,
      }));
      const { job_id: exportJobId } = await startExtractV2(
        selections,
        layout,
        selectedCoverId,
      );
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
              const a = document.createElement("a");
              a.href = data.download_url;
              a.download = "workbook.pdf";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
            try {
              await createWorkbookMeta({
                layout,
                filename: trimmed,
                name: trimmed,
                question_count: basket.length,
                result_job_id: exportJobId,
                selections: basket.map((b) => ({
                  question_id: b.questionId,
                  job_id: b.jobId,
                  page_num: b.pageNum,
                  question_num: b.isManual ? undefined : b.questionNum,
                  manual_id: b.isManual ? b.manualId : undefined,
                  title: b.displayTitle,
                  workbook_name: b.workbookName || undefined,
                })),
              });
            } catch {}
          } else if (data.status === "FAILED") {
            clearInterval(exportPollRef.current);
            exportPollRef.current = null;
            setGenerating(false);
            setGenerateStatus("error");
            setGenerateError("PDF 생성에 실패했습니다.");
          }
        } catch {}
      }, 2000);
    } catch (e) {
      setGenerating(false);
      setGenerateStatus("error");
      setGenerateError(e.message || "요청 실패");
    }
  };

  useEffect(() => {
    listCovers()
      .then((d) => setCovers(d.covers || []))
      .catch(() => {});
  }, []);
  useEffect(
    () => () => {
      if (exportPollRef.current) clearInterval(exportPollRef.current);
    },
    [],
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* 컨텍스트 바 */}
      {selectedJobFilename && (
        <Box
          sx={{
            px: 2.5,
            py: 0.75,
            bgcolor: "primary.lighter",
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          <Icon
            icon="material-symbols:description-outline-rounded"
            style={{ fontSize: 16 }}
          />
          <Typography variant="caption" color="primary.main" fontWeight={600}>
            {selectedJobFilename}
          </Typography>
          {basket.length > 0 && (
            <Chip
              label={`${basket.length}개 선택`}
              size="small"
              color="primary"
            />
          )}
        </Box>
      )}

      <Box sx={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        {/* ① 파일 목록 */}
        <Paper
          elevation={0}
          sx={{
            width: panelWidths.files,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 0,
            borderRight: 1,
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              px: 2.5,
              py: 1.25,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography variant="subtitle2" fontWeight={700}>
              ① 파일 선택
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <FileListPanel
              selectedJobId={jobId}
              onSelect={handleJobSelect}
              refreshTrigger={refreshTrigger}
            />
          </Box>
        </Paper>

        <ResizeHandle onMouseDown={(e) => startResize("files", e)} />

        {/* ② 문항 목록 */}
        <Paper
          elevation={0}
          sx={{
            width: panelWidths.qlist,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 0,
            borderRight: 1,
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.25,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography variant="subtitle2" fontWeight={700}>
              ② 문항 선택
            </Typography>
            {jobId && (
              <Typography variant="caption" color="text.secondary">
                체크하여 추가
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <QuestionListPanel
              jobId={jobId}
              selections={basket}
              onToggle={toggleSelection}
            />
          </Box>
        </Paper>

        <ResizeHandle onMouseDown={(e) => startResize("qlist", e)} />

        {/* ③ 순서 편집 (DnD) */}
        <Paper
          elevation={0}
          sx={{
            width: panelWidths.basket,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 0,
            borderRight: 1,
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.25,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="subtitle2" fontWeight={700}>
              ③ 순서 편집
            </Typography>
            {basket.length > 0 && (
              <Button
                size="small"
                color="error"
                onClick={() => setBasket([])}
                sx={{ fontSize: 11, minWidth: 0 }}
              >
                전체 제거
              </Button>
            )}
          </Box>
          <Box
            sx={{
              px: 2,
              py: 0.75,
              borderBottom: 1,
              borderColor: "divider",
              flexShrink: 0,
            }}
          >
            <Chip
              label={`${basket.length}개 선택됨`}
              size="small"
              variant="outlined"
            />
          </Box>
          <Box sx={{ flex: 1, overflowY: "auto" }}>
            {basket.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center", color: "text.disabled" }}>
                <Icon
                  icon="material-symbols:playlist-add-rounded"
                  style={{ fontSize: 36 }}
                />
                <Typography variant="caption" display="block" mt={1}>
                  ②에서 문항을 체크하면
                  <br />
                  여기에 추가됩니다.
                </Typography>
              </Box>
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
          </Box>
        </Paper>

        <ResizeHandle onMouseDown={(e) => startResize("basket", e)} />

        {/* ④ 미리보기 + 컨트롤 */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 0,
          }}
        >
          {/* 파일명 바 */}
          <Box
            sx={{
              px: 2,
              py: 1,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexShrink: 0,
            }}
          >
            <Icon
              icon="material-symbols:edit-document-outline-rounded"
              style={{
                fontSize: 18,
                color: "var(--aurora-palette-text-secondary)",
              }}
            />
            <TextField
              size="small"
              sx={{ flex: 1 }}
              placeholder="파일명"
              value={filename}
              onChange={(e) => {
                setFilename(e.target.value);
                setFilenameError("");
              }}
              error={!!filenameError}
              helperText={filenameError}
              InputProps={{
                endAdornment: (
                  <Typography variant="caption" color="text.secondary">
                    .pdf
                  </Typography>
                ),
              }}
            />
          </Box>

          {/* 레이아웃 + 생성 버튼 바 */}
          <Box
            sx={{
              px: 2,
              py: 1,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexShrink: 0,
              flexWrap: "wrap",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
            >
              레이아웃
            </Typography>
            <ToggleButtonGroup
              value={layout}
              exclusive
              onChange={(_, v) => v && setLayout(v)}
              size="small"
            >
              {LAYOUTS.map((l) => (
                <ToggleButton
                  key={l}
                  value={l}
                  sx={{ px: 1.5, py: 0.5, fontSize: 12 }}
                >
                  {l}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleGenerate}
              disabled={basket.length === 0 || generating}
              startIcon={
                generating ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <Icon icon="material-symbols:picture-as-pdf-outline-rounded" />
                )
              }
              sx={{ ml: "auto" }}
            >
              {generating ? "생성 중..." : "PDF 생성"}
            </Button>
          </Box>

          {/* 상태 메시지 */}
          {generateStatus === "processing" && (
            <Alert severity="info" sx={{ borderRadius: 0, py: 0.5 }}>
              PDF를 생성하고 있습니다. 잠시만 기다려 주세요...
            </Alert>
          )}
          {generateStatus === "done" && (
            <Alert severity="success" sx={{ borderRadius: 0, py: 0.5 }}>
              PDF 생성 완료!{" "}
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download="workbook.pdf"
                  style={{ color: "inherit", fontWeight: 600 }}
                >
                  다시 다운로드
                </a>
              )}
            </Alert>
          )}
          {generateStatus === "error" && (
            <Alert severity="error" sx={{ borderRadius: 0, py: 0.5 }}>
              {generateError}
            </Alert>
          )}

          {/* 표지 선택 */}
          {covers.length > 0 && (
            <Box
              sx={{
                px: 2,
                py: 1,
                borderBottom: 1,
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flexShrink: 0,
                overflowX: "auto",
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{ flexShrink: 0 }}
              >
                표지
              </Typography>
              <Box
                onClick={() => setSelectedCoverId(null)}
                sx={{
                  cursor: "pointer",
                  px: 1.5,
                  py: 0.5,
                  border: 2,
                  borderColor: !selectedCoverId ? "primary.main" : "divider",
                  borderRadius: 1,
                  fontSize: 12,
                  color: !selectedCoverId ? "primary.main" : "text.secondary",
                  flexShrink: 0,
                }}
              >
                없음
              </Box>
              {covers.map((c) => (
                <Box
                  key={c.cover_id}
                  onClick={() => setSelectedCoverId(c.cover_id)}
                  sx={{
                    cursor: "pointer",
                    border: 2,
                    borderColor:
                      selectedCoverId === c.cover_id
                        ? "primary.main"
                        : "divider",
                    borderRadius: 1,
                    overflow: "hidden",
                    flexShrink: 0,
                    textAlign: "center",
                  }}
                >
                  <Box
                    component="img"
                    src={`${API_ROOT}${c.thumbnail_url}`}
                    alt={c.name}
                    sx={{
                      width: 40,
                      height: 40,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <Typography variant="caption" sx={{ fontSize: 10, px: 0.5 }}>
                    {c.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* A4 미리보기 */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <WorkbookPreview
              selections={basket}
              layout={layout}
              previewWidth={340}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
