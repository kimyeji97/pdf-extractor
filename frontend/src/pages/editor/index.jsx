/**
 * 문제집 편집 페이지
 *
 * 파일 선택 · 문항 선택 · 순서 편집 · 미리보기 4패널.
 *
 * REQ-D07 Phase 3-5에서 패널 어휘를 Phase 3-4(문항 분석 작업)와 맞추고
 * **멀티 파일 선택을 화면에 드러냈다**(조건 ②). 선택은 원래부터 파일을 넘나들며
 * 유지됐지만 — `handleJobSelect`가 jobId만 바꾸고 basket을 건드리지 않는다 —
 * 화면에 그 흔적이 없어 기능이 없는 것처럼 보였다. 노출 지점은 세 곳:
 *   1. 컨텍스트 바 요약 (N개 선택 · M개 파일)
 *   2. 파일 목록 카드의 "N개 선택됨" 배지
 *   3. 순서 편집 항목의 출처 색점 + 이름 (SelectionOrderPanel)
 */
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import CircularProgress from "@mui/material/CircularProgress";
import { Icon } from "@iconify/react";

import { clampCellScale } from "utils/workbookLayout";
import PageHeader from "components/PageHeader";
import { WorkCanvas, CardRow, PanelCard, PanelCardHeader, CardResizeHandle } from "components/WorkCanvas";
import FileListPanel from "components/FileListPanel";
import QuestionListPanel from "components/QuestionListPanel";
import SelectionOrderPanel from "components/SelectionOrderPanel";
import WorkbookPreview from "components/WorkbookPreview";
import {
  startExtractV2,
  getStatus,
  getWorkbook,
  listCovers,
} from "api/client";

const API_ROOT = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"
).replace(/\/api$/, "");
const LAYOUTS = ["세로 2단", "가로 2단", "4단", "6단"];

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

  // REQ-20 복원 + 표지 목록 로드 — 서로 독립적이라 병렬 호출 (REQ-P02-06)
  useEffect(() => {
    Promise.all([
      initialWorkbookId ? getWorkbook(initialWorkbookId).catch(() => null) : Promise.resolve(null),
      listCovers().catch(() => null),
    ]).then(([meta, coverData]) => {
      if (meta) {
        if (meta.layout) setLayout(meta.layout);
        if (meta.selections?.length) {
          setBasket(
            meta.selections.map((s, i) => ({
              // question_id는 "{job_id}:{page}:{num}" 복합키(ADR-0002).
              // 예전 저장분이라 없으면 같은 규칙으로 조립한다 —
              // 파일별로 문항 번호가 겹치므로 번호만 쓰면 멀티 파일 문제집에서 키가 충돌한다.
              questionId:
                s.question_id ||
                (s.manual_id
                  ? `${s.job_id}:${s.page_num}:manual:${s.manual_id}`
                  : `${s.job_id}:${s.page_num}:${s.question_num ?? i}`),
              questionNum: s.question_num,
              pageNum: s.page_num,
              jobId: s.job_id,
              workbookName: s.workbook_name || "",
              sourceFilename: s.source_filename || "",
              // 썸네일 URL은 결정적이라 저장할 필요 없이 여기서 조립한다.
              // (저장된 selections에는 썸네일 필드가 없어 예전에는 null로 두었고,
              //  그 탓에 생성 이력 → 편집 복원 시 이미지가 전부 비어 있었다)
              thumbnailUrl: s.manual_id
                ? `/api/jobs/${s.job_id}/pages/${s.page_num}/questions/manual/${s.manual_id}/thumbnail`
                : `/api/jobs/${s.job_id}/pages/${s.page_num}/questions/${s.question_num}/thumbnail`,
              isManual: Boolean(s.manual_id),
              manualId: s.manual_id,
              scale: s.scale ?? 1,
              displayTitle:
                s.label ||
                (s.manual_id ? "(수동 문항)" : `문항 ${s.question_num}`),
            })),
          );
        }
      }
      setCovers(coverData?.covers || []);
    });
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
            sourceFilename: selectedJobFilename || "",
            thumbnailUrl: q.thumbnail_url,
            isManual: q.is_manual,
            manualId: q.manual_id,
            displayTitle:
              q.title || (q.is_manual ? "(수동 문항)" : `문항 ${q.question_num}`),
          },
        ];
      });
    },
    [jobId, selectedWorkbookName, selectedJobFilename],
  );

  // 미리보기 셀에서 문항별 배율 조절 (좌상단 고정) — PDF 생성에도 그대로 전달된다.
  // next는 숫자 또는 (이전값) => 새값 형태의 updater. 연타 시 stale 값을 쓰지 않도록
  // 항상 setBasket 콜백 안에서 이전 배율을 읽어 계산한다.
  const handleScaleChange = useCallback((qId, next) => {
    setBasket((prev) =>
      prev.map((b) => {
        if (b.questionId !== qId) return b;
        const cur = b.scale ?? 1;
        return { ...b, scale: clampCellScale(typeof next === "function" ? next(cur) : next) };
      }),
    );
  }, []);

  const removeFromBasket = useCallback(
    (qId) => setBasket((prev) => prev.filter((b) => b.questionId !== qId)),
    [],
  );
  const clearBasket = useCallback(() => setBasket([]), []);

  // 멀티 파일 선택 노출(조건 ②) — 파일 목록 배지와 컨텍스트 바 요약이 함께 쓴다.
  // 개수 판정은 이름이 아니라 jobId로 한다(이름이 비어 있는 예전 저장분이 있다).
  const selectedCounts = useMemo(() => {
    const counts = {};
    for (const b of basket) counts[b.jobId] = (counts[b.jobId] || 0) + 1;
    return counts;
  }, [basket]);
  const sourceFileCount = Object.keys(selectedCounts).length;

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
      // 문제집 메타 저장에 필요한 정보를 **생성 요청에 함께 실어 보낸다** (REQ-B10).
      // 종전에는 아래 폴링의 DONE 분기에서 createWorkbookMeta 로 저장했는데, 그 폴링이
      // 화면 수명에 묶여 있어 생성 중 화면을 떠나면 PDF만 남고 이력에서 사라졌다.
      // 이제 저장 주체는 백엔드다 — 여기서 다시 저장하면 이력에 2건이 뜬다. (계약 #22)
      const selections = basket.map((b) => ({
        jobId: b.jobId,
        pageNum: b.pageNum,
        questionId: b.questionId,
        questionNum: b.isManual ? undefined : b.questionNum,
        manualId: b.isManual ? b.manualId : undefined,
        label: b.displayTitle,
        scale: b.scale ?? 1,
        workbookName: b.workbookName || undefined,
        sourceFilename: b.sourceFilename || undefined,
      }));
      const { job_id: exportJobId } = await startExtractV2(
        selections,
        layout,
        selectedCoverId,
        trimmed,
      );
      exportPollRef.current = setInterval(async () => {
        try {
          const data = await getStatus(exportJobId);
          if (data.status === "DONE") {
            clearInterval(exportPollRef.current);
            exportPollRef.current = null;
            setGenerating(false);
            setGenerateStatus("done");
            // 자동 다운로드는 **이 화면에 머문 경우에만** 일어난다 (REQ-B10 결정).
            // 떠난 사용자에게 브라우저 다운로드를 강제할 수단이 없으므로, 이탈했으면
            // 생성 이력에서 받아 간다. 이 분기에는 영속 부수효과를 두지 않는다 (계약 #22).
            if (data.download_url) {
              setDownloadUrl(data.download_url);
              const a = document.createElement("a");
              a.href = data.download_url;
              a.download = "workbook.pdf";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
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

  useEffect(
    () => () => {
      if (exportPollRef.current) clearInterval(exportPollRef.current);
    },
    [],
  );

  return (
    /* REQ-D07 2안 — 맞붙은 4열을 회색 캔버스 위 카드 4장으로 재구성.
       단계형(한 번에 한 단계)으로는 가지 않는다: 선택 → 정렬 → 결과가 동시에 보이는 것이
       이 화면의 핵심이고, 조건이 "유저 플로우를 깨지 않는 선"이었다(2026-07-29 결정). */
    <WorkCanvas>
      {/* 페이지 헤더 — 종전 컨텍스트 바를 흡수했다.
          현재 파일은 브레드크럼 꼬리로, 선택 요약과 생성 버튼은 우측 액션으로 옮겼다. */}
      <PageHeader
        title="문제집 편집"
        crumbs={[
          { label: "홈", to: "/" },
          { label: "문제집 편집", to: "/editor" },
          ...(selectedJobFilename
            ? [{ label: selectedWorkbookName || selectedJobFilename }]
            : []),
        ]}
        actions={
          <>
            {basket.length > 0 && (
              <Chip
                label={
                  sourceFileCount > 1
                    ? `${basket.length}개 선택 · ${sourceFileCount}개 파일`
                    : `${basket.length}개 선택`
                }
                size="small"
                color="primary"
              />
            )}
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
            >
              {generating ? "생성 중..." : "PDF 생성"}
            </Button>
          </>
        }
      />

      <CardRow>
        {/* 파일 선택 */}
        <PanelCard sx={{ width: panelWidths.files, flexShrink: 0 }}>
          <PanelCardHeader>
            <Icon
              icon="material-symbols:folder-open-outline-rounded"
              style={{ fontSize: 18, flexShrink: 0 }}
            />
            <Typography variant="subtitle2" fontWeight={700} noWrap>
              파일 선택
            </Typography>
            {sourceFileCount > 1 && (
              <Chip
                label={`${sourceFileCount}개 파일`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: 10, height: 18 }}
              />
            )}
          </PanelCardHeader>
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              px: 1.5,
              pt: 1,
            }}
          >
            <FileListPanel
              selectedJobId={jobId}
              onSelect={handleJobSelect}
              refreshTrigger={refreshTrigger}
              selectedCounts={selectedCounts}
            />
          </Box>
        </PanelCard>

        <CardResizeHandle onMouseDown={(e) => startResize("files", e)} />

        {/* 문항 선택 */}
        <PanelCard sx={{ width: panelWidths.qlist, flexShrink: 0 }}>
          <PanelCardHeader>
            <Icon
              icon="material-symbols:checklist-rounded"
              style={{ fontSize: 18, flexShrink: 0 }}
            />
            <Typography variant="subtitle2" fontWeight={700} noWrap>
              문항 선택
            </Typography>
            {jobId && selectedCounts[jobId] > 0 && (
              <Chip
                label={`${selectedCounts[jobId]}개`}
                size="small"
                color="primary"
                sx={{ fontSize: 10, height: 18 }}
              />
            )}
          </PanelCardHeader>
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
        </PanelCard>

        <CardResizeHandle onMouseDown={(e) => startResize("qlist", e)} />

        {/* 순서 편집 (DnD) — 멀티 파일 출처 표시 포함 */}
        <PanelCard sx={{ width: panelWidths.basket, flexShrink: 0 }}>
          <SelectionOrderPanel
            items={basket}
            onReorder={setBasket}
            onRemove={removeFromBasket}
            onClear={clearBasket}
          />
        </PanelCard>

        <CardResizeHandle onMouseDown={(e) => startResize("basket", e)} />

        {/* 미리보기 + 컨트롤 */}
        <PanelCard sx={{ flex: 1, minWidth: 0 }}>
          {/* 패널 헤더 겸 파일명 바.
              아이콘 색은 상속(currentColor)에 맡긴다 — 여기 있던
              `var(--aurora-palette-text-secondary)`는 Phase 1에서 Aurora 테마를
              걷어내며 사라진 변수라 이미 아무 색도 먹지 않고 있었다. */}
          <PanelCardHeader sx={{ py: 1, gap: 1.5 }}>
            <Icon
              icon="material-symbols:edit-document-outline-rounded"
              style={{ fontSize: 18, flexShrink: 0 }}
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
          </PanelCardHeader>

          {/* 레이아웃 바 — PDF 생성 버튼은 2안 페이지 헤더로 옮겼다 */}
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
              minHeight: 0,
              overflowY: "auto",
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              bgcolor: "background.neutral",
            }}
          >
            <WorkbookPreview
              selections={basket}
              layout={layout}
              previewWidth={340}
              onScaleChange={handleScaleChange}
            />
          </Box>
        </PanelCard>
      </CardRow>
    </WorkCanvas>
  );
}
