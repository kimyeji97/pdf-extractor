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

import paths from "routes/paths";
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
  listTemplates,
} from "api/client";
import { tintSx } from "theme/tint";
import { useJobCompletion } from "hooks/useJobCompletion";

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
  // REQ-30: 표지·각주·워터마크를 **따로** 고르던 칩 3줄을 템플릿 1줄로 대체했다.
  // 서버의 `cover_id`·`footnote_id`·`watermark_id` 필드는 구 프론트 호환으로 남아 있지만
  // 이 화면은 더 이상 보내지 않는다(계획서 § 결정 "생성 화면 선택 UI").
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [generateError, setGenerateError] = useState("");
  const [exportJobId, setExportJobId] = useState(null);

  // 생성 완료 감시는 전역 알림 피드가 한다 (REQ-F09 Phase 3). 종전에는 이 화면이 2초마다
  // getStatus 를 캐물었고, 화면을 떠나면 감시가 죽었다.
  //
  // ⚠️ 조회가 0이 되지는 않는다 — 알림 항목에는 download_url 이 없어서(job_id·created_at·
  //    severity·kind·title·message 뿐) 완료를 안 뒤 **한 번** getStatus 로 받아 온다.
  //    폴링 N회가 완료 시점 1회로 줄어드는 것이지 사라지는 게 아니다 (2026-08-07 결정).
  //
  // ⚠️ 자동 다운로드가 이 훅 안에 있는 것이 곧 B10 불변식이다 — 훅은 화면이 살아 있을 때만
  //    콜백을 부르므로, 떠난 사용자에게 다운로드가 튀어나오지 않는다. 전역으로 올리지 말 것.
  useJobCompletion(exportJobId, {
    onDone: async () => {
      setExportJobId(null);
      setGenerating(false);
      setGenerateStatus("done");
      try {
        const data = await getStatus(exportJobId);
        if (data.download_url) {
          setDownloadUrl(data.download_url);
          const a = document.createElement("a");
          a.href = data.download_url;
          a.download = "workbook.pdf";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } catch {
        // 다운로드 URL 취득 실패는 생성 실패가 아니다 — 결과물은 생성 이력에 있다.
      }
    },
    // 실패 문구의 출처는 서버 알림 하나다 (REQ-C09).
    onError: (n) => {
      setExportJobId(null);
      setGenerating(false);
      setGenerateStatus("error");
      setGenerateError(n?.message || "PDF 생성에 실패했습니다.");
    },
  });

  const [panelWidths, setPanelWidths] = useState({
    files: 220,
    qlist: 260,
    basket: 240,
  });
  const resizingRef = useRef(null);

  // REQ-20 복원 + 표지·각주·워터마크 목록 로드 — 서로 독립적이라 병렬 호출 (REQ-P02-06)
  useEffect(() => {
    Promise.all([
      initialWorkbookId ? getWorkbook(initialWorkbookId).catch(() => null) : Promise.resolve(null),
      listTemplates().catch(() => null),
    ]).then(([meta, templateData]) => {
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
      setTemplates(templateData?.templates || []);
      // REQ-30: 이력 → 편집 복원 시 템플릿도 되살린다. 안 하면 사용자가 아무것도 안 바꿨는데
      // 재생성 결과가 달라진다(계약 #22·#23과 같은 모양). 그 사이 템플릿이 삭제됐다면
      // id 만 남고 목록에는 없는데, 그 상태를 화면이 "삭제된 템플릿"으로 드러낸다.
      if (meta?.template_id) setSelectedTemplateId(meta.template_id);
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
      // REQ-30: 표지·각주·워터마크는 템플릿이 서버에서 풀린다 — 여기서는 안 보낸다.
      // 자리(3·5·6번째 인자)는 구 프론트 호환으로 남아 있는 표면이라 null 로 채운다.
      const { job_id: newExportJobId } = await startExtractV2(
        selections,
        layout,
        null,
        trimmed,
        null,
        null,
        selectedTemplateId,
      );
      setExportJobId(newExportJobId);
    } catch (e) {
      setGenerating(false);
      setGenerateStatus("error");
      setGenerateError(e.message || "요청 실패");
    }
  };

  return (
    /* REQ-D07 2안 — 맞붙은 4열을 회색 캔버스 위 카드 4장으로 재구성.
       단계형(한 번에 한 단계)으로는 가지 않는다: 선택 → 정렬 → 결과가 동시에 보이는 것이
       이 화면의 핵심이고, 조건이 "유저 플로우를 깨지 않는 선"이었다(2026-07-29 결정). */
    <WorkCanvas>
      {/* 페이지 헤더 — 종전 컨텍스트 바를 흡수했다.
          현재 파일은 브레드크럼 꼬리로, 선택 요약과 생성 버튼은 우측 액션으로 옮겼다. */}
      <PageHeader
        title="생성"
        crumbs={[
          { label: "홈", to: "/" },
          { label: "생성", to: paths.create },
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

          {/* ── 템플릿 선택 (REQ-30) ──────────────────────────
              종전에는 표지·각주·워터마크 칩 행이 **3줄** 쌓여 있었다. 템플릿 하나를 고르면
              셋이 함께 따라오므로 1줄로 접었다(계획서 § 결정 "생성 화면 선택 UI"). */}
          {(templates.length > 0 || selectedTemplateId) && (
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
                템플릿
              </Typography>
              <Box
                onClick={() => setSelectedTemplateId(null)}
                sx={{
                  cursor: "pointer",
                  px: 1.5,
                  py: 0.5,
                  border: 2,
                  borderColor: !selectedTemplateId ? "primary.main" : "divider",
                  borderRadius: 1,
                  fontSize: 12,
                  color: !selectedTemplateId ? "primary.main" : "text.secondary",
                  flexShrink: 0,
                }}
              >
                없음
              </Box>
              {templates.map((t) => (
                <Box
                  key={t.template_id}
                  onClick={() => setSelectedTemplateId(t.template_id)}
                  sx={{
                    cursor: "pointer",
                    px: 1.5,
                    py: 0.5,
                    border: 2,
                    borderColor:
                      selectedTemplateId === t.template_id
                        ? "primary.main"
                        : "divider",
                    borderRadius: 1,
                    fontSize: 12,
                    color:
                      selectedTemplateId === t.template_id
                        ? "primary.main"
                        : "text.secondary",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                  }}
                >
                  {t.name}
                  {/* 강제 삭제로 구성이 바뀐 템플릿. 색은 계약 #20 때문에 tintSx 로 낸다 —
                      `warning.lighter` 는 라이트/다크 공유값이라 다크에서 파스텔 블록이 박힌다. */}
                  {t.needs_review && (
                    <Box
                      component="span"
                      sx={(theme) => ({
                        ...tintSx("warning")(theme),
                        px: 0.5,
                        borderRadius: 0.5,
                        fontSize: 10,
                        fontWeight: 600,
                      })}
                    >
                      구성 변경됨 · 확인 필요
                    </Box>
                  )}
                </Box>
              ))}
              {/* 복원한 템플릿이 그 사이 삭제된 경우. 생성 버튼을 누르면 서버가 400 으로
                  막지만(E), 누르기 전에 여기서 먼저 보인다. */}
              {selectedTemplateId &&
                !templates.some((t) => t.template_id === selectedTemplateId) && (
                  <Box
                    onClick={() => setSelectedTemplateId(null)}
                    sx={(theme) => ({
                      ...tintSx("error")(theme),
                      cursor: "pointer",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: 12,
                      fontWeight: 600,
                      flexShrink: 0,
                    })}
                  >
                    삭제된 템플릿 · 다시 선택해 주세요
                  </Box>
                )}
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
              // REQ-F13 — 고른 템플릿을 **객체 그대로** 넘긴다(서버 응답 항목). 표지·각주·
              // 워터마크를 따로 넘기지 않는 이유는 WorkbookPreview 주석 참조.
              // 목록에 없으면(삭제된 템플릿) null 이 되어 미리보기가 아무것도 안 그린다 —
              // 화면에는 "삭제된 템플릿" 칩이 이미 떠 있다.
              template={templates.find((t) => t.template_id === selectedTemplateId) || null}
            />
          </Box>
        </PanelCard>
      </CardRow>
    </WorkCanvas>
  );
}
