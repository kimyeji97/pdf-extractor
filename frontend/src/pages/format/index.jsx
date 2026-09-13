/**
 * 템플릿 관리 페이지 (REQ-D06 표지 관리 → REQ-D11 이름 변경 → REQ-29 각주·워터마크 탭 추가)
 *
 * 탭 4개: 표지 · 각주 · 워터마크 · 템플릿. 표지·워터마크는 같은 모양(1패널 목록형 + 업로드
 * 모달)이고, 각주만 이미지 대신 이름+텍스트 입력 폼이다(REQ-29 § 결정 "각주 콘텐츠 형태").
 * 템플릿(REQ-30)은 앞의 셋을 **참조로** 묶는 조합이다(ADR-0004) — 값을 복사하지 않는다.
 *
 * ⚠️ 자산 삭제는 템플릿이 참조 중이면 409 로 막힌다(A′). 그때 서버가 주는 템플릿 이름을
 *    보여주고, 사용자가 동의하면 `force` 로 다시 부른다 — cascade 를 **알고 고르는** 형태다.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Paper from "@mui/material/Paper";
import { Icon } from "@iconify/react";

import PageHeader from "components/PageHeader";
import BookCard, { BOOK_CARD_W } from "components/BookCard";
import { tintSx } from "theme/tint";
import {
  listCovers, uploadCover, deleteCover,
  listFootnotes, createFootnote, deleteFootnote,
  listWatermarks, uploadWatermark, deleteWatermark,
  listTemplates, createTemplate, updateTemplate, deleteTemplate,
} from "api/client";

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/api$/, "");

const COVER_H = 226;   // BookCard 표지 높이와 맞춘다

function UploadCard({ label, onClick }) {
  return (
    <Box sx={{ width: BOOK_CARD_W, flexShrink: 0 }}>
      <Box
        onClick={onClick}
        sx={{
          height: COVER_H,
          border: "2px dashed", borderColor: "divider",
          borderRadius: "3px 8px 8px 3px",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 1,
          cursor: "pointer", color: "text.disabled",
          transition: "all 0.15s",
          "&:hover": { borderColor: "primary.main", color: "primary.main", bgcolor: "action.hover" },
        }}
      >
        <Icon icon="material-symbols:add-rounded" style={{ fontSize: 36 }} />
        <Typography variant="caption" fontWeight={600}>{label}</Typography>
      </Box>
    </Box>
  );
}

// 표지·워터마크는 실제 이미지라 두께 정보가 없다 — 가장 얇은 1층으로 통일한다
// (분석 목록의 책은 문항 수에 따라 두꺼워지므로 자연히 구분된다)
function ImageAssetCard({ id, name, thumbnailUrl, colorKey, onDelete }) {
  return (
    <BookCard
      coverUrl={`${API_ROOT}${thumbnailUrl}`}
      title={name || "이름 없음"}
      colorKey={colorKey}
      questionCount={null}
      actions={
        <Tooltip title="삭제">
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onDelete(id); }}
            sx={{
              bgcolor: "background.paper", color: "error.main",
              opacity: 0.92, "&:hover": { opacity: 1 },
            }}
          >
            <Icon icon="material-symbols:delete-outline-rounded" style={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      }
    />
  );
}

// 각주는 텍스트뿐이라 이미지 카드 대신 텍스트 카드로 보여준다.
function FootnoteCard({ footnote, onDelete }) {
  return (
    <Paper
      elevation={0}
      sx={{
        width: BOOK_CARD_W, height: COVER_H, flexShrink: 0,
        p: 1.5, display: "flex", flexDirection: "column", gap: 0.5,
        borderRadius: 2, boxShadow: (theme) => theme.customShadows?.card,
        position: "relative",
      }}
    >
      <Tooltip title="삭제">
        <IconButton
          size="small"
          onClick={() => onDelete(footnote.footnote_id)}
          sx={{
            position: "absolute", top: 6, right: 6,
            bgcolor: "background.paper", color: "error.main",
            opacity: 0.92, "&:hover": { opacity: 1 },
          }}
        >
          <Icon icon="material-symbols:delete-outline-rounded" style={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ pr: 3 }}>
        {footnote.name || "이름 없음"}
      </Typography>
      <Typography
        variant="caption" color="text.secondary"
        sx={{
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 6, WebkitBoxOrient: "vertical",
        }}
      >
        {footnote.text}
      </Typography>
    </Paper>
  );
}

/**
 * 템플릿 카드 (REQ-30)
 *
 * 구성 3줄(표지·각주·워터마크)을 이름으로 보여준다. `needs_review` 면 **"구성 변경됨"** 칩을
 * 붙인다 — 강제 삭제로 슬롯이 비워졌다는 뜻이고, 사용자가 한 번 열어 확인(수정)하면 내려간다.
 *
 * ⚠️ 칩 색은 `warning.lighter` 가 아니라 `tintSx('warning')` 다. 팔레트의 `*.lighter` 는
 *    라이트/다크가 **공유**하는 값이라 다크에서 어두운 화면에 파스텔 블록이 박힌다(계약 #20).
 *    `tintSx` 는 **함수를 반환**하므로 sx 를 함수 형태로 받아 호출해야 한다 — 객체 sx 에
 *    스프레드하면 아무것도 안 들어가고 에러도 안 난다.
 */
function TemplateCard({ template, coverName, footnoteName, watermarkName, onEdit, onDelete }) {
  const rows = [
    ["표지", coverName],
    ["각주", footnoteName],
    ["워터마크", watermarkName],
  ];
  return (
    <Paper
      elevation={0}
      sx={{
        width: BOOK_CARD_W, height: COVER_H, flexShrink: 0,
        p: 1.5, display: "flex", flexDirection: "column", gap: 0.5,
        borderRadius: 2, boxShadow: (theme) => theme.customShadows?.card,
        position: "relative", cursor: "pointer",
      }}
      onClick={() => onEdit(template)}
    >
      <Tooltip title="삭제">
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); onDelete(template.template_id); }}
          sx={{
            position: "absolute", top: 6, right: 6,
            bgcolor: "background.paper", color: "error.main",
            opacity: 0.92, "&:hover": { opacity: 1 },
          }}
        >
          <Icon icon="material-symbols:delete-outline-rounded" style={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ pr: 3 }}>
        {template.name || "이름 없음"}
      </Typography>
      {template.needs_review && (
        <Box
          sx={(theme) => ({
            ...tintSx("warning")(theme),
            alignSelf: "flex-start",
            px: 0.75, py: 0.25, borderRadius: 1,
            fontSize: 11, fontWeight: 600,
          })}
        >
          구성 변경됨 · 확인 필요
        </Box>
      )}
      <Box sx={{ mt: 0.5, display: "flex", flexDirection: "column", gap: 0.25 }}>
        {rows.map(([label, value]) => (
          <Box key={label} sx={{ display: "flex", gap: 1 }}>
            <Typography variant="caption" color="text.disabled" sx={{ width: 52, flexShrink: 0 }}>
              {label}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

export default function FormatPage() {
  const [tab, setTab] = useState(0);   // 0=표지 · 1=각주 · 2=워터마크 · 3=템플릿 (REQ-30)

  // ── 표지 ──────────────────────────────────────────────
  const [covers, setCovers]         = useState([]);
  const [coversLoading, setCoversLoading] = useState(false);
  const [coversError, setCoversError]     = useState("");
  const [coverUploadOpen, setCoverUploadOpen] = useState(false);
  const [coverUploading, setCoverUploading]   = useState(false);
  const [coverUploadError, setCoverUploadError] = useState("");
  const [coverName, setCoverName]     = useState("");
  const [coverFile, setCoverFile]     = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
  const [coverDragOver, setCoverDragOver]     = useState(false);
  const coverInputRef = useRef(null);

  const fetchCovers = useCallback(async () => {
    setCoversLoading(true); setCoversError("");
    try {
      const data = await listCovers();
      setCovers(data.covers || []);
    } catch (e) { setCoversError(e.message); }
    finally     { setCoversLoading(false); }
  }, []);

  useEffect(() => { fetchCovers(); }, [fetchCovers]);

  useEffect(() => {
    if (!coverFile) { setCoverPreviewUrl(null); return; }
    const url = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const acceptCoverFile = (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setCoverUploadError("JPEG 또는 PNG 이미지만 업로드할 수 있습니다."); return;
    }
    setCoverFile(file); setCoverUploadError("");
  };

  const openCoverUpload = () => {
    setCoverUploadError(""); setCoverName(""); setCoverFile(null); setCoverUploadOpen(true);
  };
  const closeCoverUpload = () => { if (!coverUploading) setCoverUploadOpen(false); };

  const handleCoverUpload = async () => {
    if (!coverFile || coverUploading) return;
    setCoverUploading(true); setCoverUploadError("");
    try {
      await uploadCover(coverFile, coverName);
      setCoverUploadOpen(false);
      await fetchCovers();
    } catch (e) { setCoverUploadError(e.message); }
    finally     { setCoverUploading(false); }
  };

  const handleCoverDelete = async (coverId) => {
    if (!confirm("이 표지를 삭제하시겠습니까?")) return;
    try {
      await deleteCover(coverId);
      setCovers((prev) => prev.filter((c) => c.cover_id !== coverId));
    } catch (e) {
      if (!(await confirmForceDelete(e))) return;
      try {
        await deleteCover(coverId, { force: true });
        setCovers((prev) => prev.filter((c) => c.cover_id !== coverId));
        await fetchTemplates();
      } catch (e2) { alert(e2.message); }
    }
  };

  // ── 각주 (REQ-29) ─────────────────────────────────────
  const [footnotes, setFootnotes] = useState([]);
  const [footnotesLoading, setFootnotesLoading] = useState(false);
  const [footnotesError, setFootnotesError]     = useState("");
  const [footnoteDialogOpen, setFootnoteDialogOpen] = useState(false);
  const [footnoteSaving, setFootnoteSaving]     = useState(false);
  const [footnoteSaveError, setFootnoteSaveError] = useState("");
  const [footnoteName, setFootnoteName] = useState("");
  const [footnoteText, setFootnoteText] = useState("");

  const fetchFootnotes = useCallback(async () => {
    setFootnotesLoading(true); setFootnotesError("");
    try {
      const data = await listFootnotes();
      setFootnotes(data.footnotes || []);
    } catch (e) { setFootnotesError(e.message); }
    finally     { setFootnotesLoading(false); }
  }, []);

  useEffect(() => { fetchFootnotes(); }, [fetchFootnotes]);

  const openFootnoteDialog = () => {
    setFootnoteSaveError(""); setFootnoteName(""); setFootnoteText(""); setFootnoteDialogOpen(true);
  };
  const closeFootnoteDialog = () => { if (!footnoteSaving) setFootnoteDialogOpen(false); };

  const handleFootnoteSave = async () => {
    if (!footnoteName.trim() || !footnoteText.trim() || footnoteSaving) return;
    setFootnoteSaving(true); setFootnoteSaveError("");
    try {
      await createFootnote(footnoteName.trim(), footnoteText.trim());
      setFootnoteDialogOpen(false);
      await fetchFootnotes();
    } catch (e) { setFootnoteSaveError(e.message); }
    finally     { setFootnoteSaving(false); }
  };

  const handleFootnoteDelete = async (footnoteId) => {
    if (!confirm("이 각주를 삭제하시겠습니까?")) return;
    try {
      await deleteFootnote(footnoteId);
      setFootnotes((prev) => prev.filter((f) => f.footnote_id !== footnoteId));
    } catch (e) {
      if (!(await confirmForceDelete(e))) return;
      try {
        await deleteFootnote(footnoteId, { force: true });
        setFootnotes((prev) => prev.filter((f) => f.footnote_id !== footnoteId));
        await fetchTemplates();
      } catch (e2) { alert(e2.message); }
    }
  };

  // ── 워터마크 (REQ-29) — 표지와 완전히 동일한 업로드 방식 ──
  const [watermarks, setWatermarks] = useState([]);
  const [watermarksLoading, setWatermarksLoading] = useState(false);
  const [watermarksError, setWatermarksError]     = useState("");
  const [watermarkUploadOpen, setWatermarkUploadOpen] = useState(false);
  const [watermarkUploading, setWatermarkUploading]   = useState(false);
  const [watermarkUploadError, setWatermarkUploadError] = useState("");
  const [watermarkName, setWatermarkName]     = useState("");
  const [watermarkFile, setWatermarkFile]     = useState(null);
  const [watermarkPreviewUrl, setWatermarkPreviewUrl] = useState(null);
  const [watermarkDragOver, setWatermarkDragOver]     = useState(false);
  const watermarkInputRef = useRef(null);

  const fetchWatermarks = useCallback(async () => {
    setWatermarksLoading(true); setWatermarksError("");
    try {
      const data = await listWatermarks();
      setWatermarks(data.watermarks || []);
    } catch (e) { setWatermarksError(e.message); }
    finally     { setWatermarksLoading(false); }
  }, []);

  useEffect(() => { fetchWatermarks(); }, [fetchWatermarks]);

  useEffect(() => {
    if (!watermarkFile) { setWatermarkPreviewUrl(null); return; }
    const url = URL.createObjectURL(watermarkFile);
    setWatermarkPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [watermarkFile]);

  const acceptWatermarkFile = (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setWatermarkUploadError("JPEG 또는 PNG 이미지만 업로드할 수 있습니다."); return;
    }
    setWatermarkFile(file); setWatermarkUploadError("");
  };

  const openWatermarkUpload = () => {
    setWatermarkUploadError(""); setWatermarkName(""); setWatermarkFile(null); setWatermarkUploadOpen(true);
  };
  const closeWatermarkUpload = () => { if (!watermarkUploading) setWatermarkUploadOpen(false); };

  const handleWatermarkUpload = async () => {
    if (!watermarkFile || watermarkUploading) return;
    setWatermarkUploading(true); setWatermarkUploadError("");
    try {
      await uploadWatermark(watermarkFile, watermarkName);
      setWatermarkUploadOpen(false);
      await fetchWatermarks();
    } catch (e) { setWatermarkUploadError(e.message); }
    finally     { setWatermarkUploading(false); }
  };

  const handleWatermarkDelete = async (watermarkId) => {
    if (!confirm("이 워터마크를 삭제하시겠습니까?")) return;
    try {
      await deleteWatermark(watermarkId);
      setWatermarks((prev) => prev.filter((w) => w.watermark_id !== watermarkId));
    } catch (e) {
      if (!(await confirmForceDelete(e))) return;
      try {
        await deleteWatermark(watermarkId, { force: true });
        setWatermarks((prev) => prev.filter((w) => w.watermark_id !== watermarkId));
        await fetchTemplates();
      } catch (e2) { alert(e2.message); }
    }
  };

  // ── 템플릿 (REQ-30) — 앞의 셋을 참조로 묶는 조합 ──────────
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError]     = useState("");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateSaving, setTemplateSaving]     = useState(false);
  const [templateSaveError, setTemplateSaveError] = useState("");
  const [editingTemplate, setEditingTemplate]   = useState(null);   // null 이면 신규
  const [templateName, setTemplateName]         = useState("");
  const [templateCoverId, setTemplateCoverId]         = useState("");
  const [templateFootnoteId, setTemplateFootnoteId]   = useState("");
  const [templateWatermarkId, setTemplateWatermarkId] = useState("");

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true); setTemplatesError("");
    try {
      const data = await listTemplates();
      setTemplates(data.templates || []);
    } catch (e) { setTemplatesError(e.message); }
    finally     { setTemplatesLoading(false); }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  /**
   * 자산 삭제가 409 로 막혔을 때의 강제 삭제 확인 (A′).
   *
   * 409 가 아니면 그냥 알리고 끝낸다 — 강제 삭제로 넘길 일이 아니다.
   * 409 면 서버가 준 문구(사용 중인 템플릿 이름)를 **그대로** 보여준다.
   */
  const confirmForceDelete = async (error) => {
    if (error?.status !== 409) { alert(error.message); return false; }
    return confirm(
      `${error.message}\n\n` +
      "그래도 삭제하면 해당 템플릿에서 이 항목이 빠지고 '구성 변경됨'으로 표시됩니다.\n삭제할까요?"
    );
  };

  const openTemplateDialog = (template = null) => {
    setTemplateSaveError("");
    setEditingTemplate(template);
    setTemplateName(template?.name || "");
    setTemplateCoverId(template?.cover_id || "");
    setTemplateFootnoteId(template?.footnote_id || "");
    setTemplateWatermarkId(template?.watermark_id || "");
    setTemplateDialogOpen(true);
  };
  const closeTemplateDialog = () => { if (!templateSaving) setTemplateDialogOpen(false); };

  const handleTemplateSave = async () => {
    if (!templateName.trim() || templateSaving) return;
    // 빈 템플릿은 "템플릿 없음"과 결과가 같아 서버가 400 으로 막는다. 누르기 전에 알린다.
    if (!templateCoverId && !templateFootnoteId && !templateWatermarkId) {
      setTemplateSaveError("표지·각주·워터마크 중 최소 하나는 선택해야 합니다."); return;
    }
    setTemplateSaving(true); setTemplateSaveError("");
    try {
      if (editingTemplate) {
        // PATCH 는 **실은 키만** 바꾼다. 슬롯을 비우려면 null 을 명시해야 하므로
        // 빈 문자열을 null 로 바꿔 네 필드를 모두 싣는다.
        await updateTemplate(editingTemplate.template_id, {
          name: templateName.trim(),
          cover_id: templateCoverId || null,
          footnote_id: templateFootnoteId || null,
          watermark_id: templateWatermarkId || null,
        });
      } else {
        await createTemplate(
          templateName.trim(),
          templateCoverId || null,
          templateFootnoteId || null,
          templateWatermarkId || null,
        );
      }
      setTemplateDialogOpen(false);
      await fetchTemplates();
    } catch (e) { setTemplateSaveError(e.message); }
    finally     { setTemplateSaving(false); }
  };

  const handleTemplateDelete = async (templateId) => {
    if (!confirm("이 템플릿을 삭제하시겠습니까?")) return;
    try {
      await deleteTemplate(templateId);
      setTemplates((prev) => prev.filter((t) => t.template_id !== templateId));
    } catch (e) { alert(e.message); }
  };

  const assetName = (list, idField, id, fallback) =>
    id ? (list.find((x) => x[idField] === id)?.name || "(삭제됨)") : fallback;

  const refreshing = tab === 0 ? coversLoading : tab === 1 ? footnotesLoading
    : tab === 2 ? watermarksLoading : templatesLoading;
  const refresh = tab === 0 ? fetchCovers : tab === 1 ? fetchFootnotes
    : tab === 2 ? fetchWatermarks : fetchTemplates;

  return (
    <Box sx={{
      display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
      gap: 2, p: 2, bgcolor: "background.default",
    }}>

      {/* ── 페이지 헤더 + 브레드크럼 (REQ-D07 2안) ──────── */}
      <PageHeader
        title="템플릿 관리"
        crumbs={[{ label: "홈", to: "/" }, { label: "템플릿 관리" }]}
        actions={
          <Tooltip title="새로고침">
            <IconButton size="small" onClick={refresh} disabled={refreshing}>
              {refreshing
                ? <CircularProgress size={16} />
                : <Icon icon="material-symbols:refresh-rounded" style={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
        }
      />

      {/* ── 탭 (REQ-29) — 표지·각주·워터마크. REQ-30이 조합 UI를 여기 더할 예정 ── */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ flexShrink: 0, minHeight: 36 }}>
        <Tab label="표지" sx={{ minHeight: 36 }} />
        <Tab label="각주" sx={{ minHeight: 36 }} />
        <Tab label="워터마크" sx={{ minHeight: 36 }} />
        <Tab label="템플릿" sx={{ minHeight: 36 }} />
      </Tabs>

      {tab === 0 && coversError && (
        <Alert severity="error" sx={{ flexShrink: 0 }} onClose={() => setCoversError("")}>{coversError}</Alert>
      )}
      {tab === 1 && footnotesError && (
        <Alert severity="error" sx={{ flexShrink: 0 }} onClose={() => setFootnotesError("")}>{footnotesError}</Alert>
      )}
      {tab === 2 && watermarksError && (
        <Alert severity="error" sx={{ flexShrink: 0 }} onClose={() => setWatermarksError("")}>{watermarksError}</Alert>
      )}
      {tab === 3 && templatesError && (
        <Alert severity="error" sx={{ flexShrink: 0 }} onClose={() => setTemplatesError("")}>{templatesError}</Alert>
      )}

      {/* ── 메인: 카드 래핑 그리드 (세로 스크롤) ─────────── */}
      <Box sx={{
        flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden",
        display: "flex", flexWrap: "wrap", gap: 2,
        p: 2, borderRadius: 2, alignContent: "flex-start",
        bgcolor: "background.paper",
        boxShadow: (theme) => theme.customShadows?.card,
      }}>
        {tab === 0 && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ width: 1, mb: -0.5 }}>
              문제집 생성 시 첫 페이지로 넣을 표지를 관리합니다.
            </Typography>
            <UploadCard label="표지 업로드" onClick={openCoverUpload} />
            {coversLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", pl: 2 }}><CircularProgress size={24} /></Box>
            ) : (
              covers.map((c) => (
                <ImageAssetCard
                  key={c.cover_id} id={c.cover_id} name={c.name}
                  thumbnailUrl={c.thumbnail_url} colorKey={c.cover_id}
                  onDelete={handleCoverDelete}
                />
              ))
            )}
            {!coversLoading && covers.length === 0 && (
              <Box sx={{ display: "flex", alignItems: "center", pl: 2, color: "text.disabled" }}>
                <Typography variant="body2" color="text.disabled">업로드된 표지가 없습니다.</Typography>
              </Box>
            )}
          </>
        )}

        {tab === 1 && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ width: 1, mb: -0.5 }}>
              문제집 생성 시 표지를 제외한 모든 페이지 하단에 넣을 각주를 관리합니다.
            </Typography>
            <UploadCard label="각주 추가" onClick={openFootnoteDialog} />
            {footnotesLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", pl: 2 }}><CircularProgress size={24} /></Box>
            ) : (
              footnotes.map((f) => (
                <FootnoteCard key={f.footnote_id} footnote={f} onDelete={handleFootnoteDelete} />
              ))
            )}
            {!footnotesLoading && footnotes.length === 0 && (
              <Box sx={{ display: "flex", alignItems: "center", pl: 2, color: "text.disabled" }}>
                <Typography variant="body2" color="text.disabled">등록된 각주가 없습니다.</Typography>
              </Box>
            )}
          </>
        )}

        {tab === 2 && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ width: 1, mb: -0.5 }}>
              문제집 생성 시 표지를 제외한 모든 페이지 중앙에 반투명하게 넣을 워터마크를 관리합니다.
            </Typography>
            <UploadCard label="워터마크 업로드" onClick={openWatermarkUpload} />
            {watermarksLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", pl: 2 }}><CircularProgress size={24} /></Box>
            ) : (
              watermarks.map((w) => (
                <ImageAssetCard
                  key={w.watermark_id} id={w.watermark_id} name={w.name}
                  thumbnailUrl={w.thumbnail_url} colorKey={w.watermark_id}
                  onDelete={handleWatermarkDelete}
                />
              ))
            )}
            {!watermarksLoading && watermarks.length === 0 && (
              <Box sx={{ display: "flex", alignItems: "center", pl: 2, color: "text.disabled" }}>
                <Typography variant="body2" color="text.disabled">업로드된 워터마크가 없습니다.</Typography>
              </Box>
            )}
          </>
        )}

        {tab === 3 && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ width: 1, mb: -0.5 }}>
              표지·각주·워터마크를 조합해 템플릿으로 저장합니다. 문제집 생성 화면에서 이 템플릿 하나만 고르면 됩니다.
            </Typography>
            <UploadCard label="템플릿 추가" onClick={() => openTemplateDialog(null)} />
            {templatesLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", pl: 2 }}><CircularProgress size={24} /></Box>
            ) : (
              templates.map((t) => (
                <TemplateCard
                  key={t.template_id}
                  template={t}
                  coverName={assetName(covers, "cover_id", t.cover_id, "없음")}
                  footnoteName={assetName(footnotes, "footnote_id", t.footnote_id, "없음")}
                  watermarkName={assetName(watermarks, "watermark_id", t.watermark_id, "없음")}
                  onEdit={openTemplateDialog}
                  onDelete={handleTemplateDelete}
                />
              ))
            )}
            {!templatesLoading && templates.length === 0 && (
              <Box sx={{ display: "flex", alignItems: "center", pl: 2, color: "text.disabled" }}>
                <Typography variant="body2" color="text.disabled">등록된 템플릿이 없습니다.</Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* ── 표지 업로드 모달 ───────────────────────────── */}
      <Dialog open={coverUploadOpen} onClose={closeCoverUpload} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>표지 업로드</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          {coverUploadError && <Alert severity="error" sx={{ py: 0 }}>{coverUploadError}</Alert>}
          <Box
            onClick={() => coverInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setCoverDragOver(true); }}
            onDragLeave={() => setCoverDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setCoverDragOver(false); acceptCoverFile(e.dataTransfer.files?.[0]); }}
            sx={{
              width: "100%", aspectRatio: "3/4", maxHeight: 300,
              border: "2px dashed",
              borderColor: coverDragOver || coverFile ? "primary.main" : "divider",
              borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", overflow: "hidden", bgcolor: coverDragOver ? "action.selected" : "action.hover",
              transition: "border-color 0.2s, background-color 0.2s",
              "&:hover": { borderColor: "primary.main" },
            }}
          >
            {coverPreviewUrl ? (
              <Box component="img" src={coverPreviewUrl} alt="미리보기"
                sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <Box sx={{ textAlign: "center", color: "text.disabled", p: 2 }}>
                <Icon icon="material-symbols:image-outline-rounded" style={{ fontSize: 40 }} />
                <Typography variant="caption" display="block" mt={1}>클릭 또는 드래그하여 선택<br />(JPEG · PNG)</Typography>
              </Box>
            )}
            <input ref={coverInputRef} type="file" accept="image/jpeg,image/jpg,image/png"
              style={{ display: "none" }}
              onChange={(e) => { acceptCoverFile(e.target.files?.[0]); e.target.value = ""; }} />
          </Box>
          {coverFile && (
            <Alert severity="info" sx={{ py: 0.5 }}><Typography variant="caption">{coverFile.name}</Typography></Alert>
          )}
          <TextField
            size="small" fullWidth label="표지 이름 (선택)"
            value={coverName} onChange={(e) => setCoverName(e.target.value)} disabled={coverUploading}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeCoverUpload} disabled={coverUploading} color="inherit">취소</Button>
          <Button
            variant="contained" onClick={handleCoverUpload} disabled={!coverFile || coverUploading}
            startIcon={coverUploading ? <CircularProgress size={14} color="inherit" /> : <Icon icon="material-symbols:cloud-upload-outline-rounded" />}
          >
            {coverUploading ? "업로드 중..." : "업로드"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── 각주 등록 모달 (REQ-29) ─────────────────────── */}
      <Dialog open={footnoteDialogOpen} onClose={closeFootnoteDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>각주 등록</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          {footnoteSaveError && <Alert severity="error" sx={{ py: 0 }}>{footnoteSaveError}</Alert>}
          <TextField
            size="small" fullWidth autoFocus label="각주 이름"
            value={footnoteName} onChange={(e) => setFootnoteName(e.target.value)} disabled={footnoteSaving}
          />
          <TextField
            size="small" fullWidth multiline minRows={3} label="각주 텍스트"
            value={footnoteText} onChange={(e) => setFootnoteText(e.target.value)} disabled={footnoteSaving}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeFootnoteDialog} disabled={footnoteSaving} color="inherit">취소</Button>
          <Button
            variant="contained" onClick={handleFootnoteSave}
            disabled={!footnoteName.trim() || !footnoteText.trim() || footnoteSaving}
            startIcon={footnoteSaving ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {footnoteSaving ? "저장 중..." : "저장"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── 워터마크 업로드 모달 (REQ-29) ────────────────── */}
      <Dialog open={watermarkUploadOpen} onClose={closeWatermarkUpload} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>워터마크 업로드</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          {watermarkUploadError && <Alert severity="error" sx={{ py: 0 }}>{watermarkUploadError}</Alert>}
          <Box
            onClick={() => watermarkInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setWatermarkDragOver(true); }}
            onDragLeave={() => setWatermarkDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setWatermarkDragOver(false); acceptWatermarkFile(e.dataTransfer.files?.[0]); }}
            sx={{
              width: "100%", aspectRatio: "3/4", maxHeight: 300,
              border: "2px dashed",
              borderColor: watermarkDragOver || watermarkFile ? "primary.main" : "divider",
              borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", overflow: "hidden", bgcolor: watermarkDragOver ? "action.selected" : "action.hover",
              transition: "border-color 0.2s, background-color 0.2s",
              "&:hover": { borderColor: "primary.main" },
            }}
          >
            {watermarkPreviewUrl ? (
              <Box component="img" src={watermarkPreviewUrl} alt="미리보기"
                sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <Box sx={{ textAlign: "center", color: "text.disabled", p: 2 }}>
                <Icon icon="material-symbols:image-outline-rounded" style={{ fontSize: 40 }} />
                <Typography variant="caption" display="block" mt={1}>클릭 또는 드래그하여 선택<br />(JPEG · PNG)</Typography>
              </Box>
            )}
            <input ref={watermarkInputRef} type="file" accept="image/jpeg,image/jpg,image/png"
              style={{ display: "none" }}
              onChange={(e) => { acceptWatermarkFile(e.target.files?.[0]); e.target.value = ""; }} />
          </Box>
          {watermarkFile && (
            <Alert severity="info" sx={{ py: 0.5 }}><Typography variant="caption">{watermarkFile.name}</Typography></Alert>
          )}
          <TextField
            size="small" fullWidth label="워터마크 이름 (선택)"
            value={watermarkName} onChange={(e) => setWatermarkName(e.target.value)} disabled={watermarkUploading}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeWatermarkUpload} disabled={watermarkUploading} color="inherit">취소</Button>
          <Button
            variant="contained" onClick={handleWatermarkUpload} disabled={!watermarkFile || watermarkUploading}
            startIcon={watermarkUploading ? <CircularProgress size={14} color="inherit" /> : <Icon icon="material-symbols:cloud-upload-outline-rounded" />}
          >
            {watermarkUploading ? "업로드 중..." : "업로드"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── 템플릿 추가·수정 모달 (REQ-30) ─────────────── */}
      <Dialog open={templateDialogOpen} onClose={closeTemplateDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          {editingTemplate ? "템플릿 수정" : "템플릿 추가"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {templateSaveError && <Alert severity="error">{templateSaveError}</Alert>}
          <TextField
            size="small" fullWidth autoFocus label="템플릿 이름"
            value={templateName} onChange={(e) => setTemplateName(e.target.value)} disabled={templateSaving}
          />
          <TextField
            select SelectProps={{ native: true }} size="small" fullWidth label="표지"
            InputLabelProps={{ shrink: true }}
            value={templateCoverId} onChange={(e) => setTemplateCoverId(e.target.value)} disabled={templateSaving}
          >
            <option value="">없음</option>
            {covers.map((c) => <option key={c.cover_id} value={c.cover_id}>{c.name}</option>)}
          </TextField>
          <TextField
            select SelectProps={{ native: true }} size="small" fullWidth label="각주"
            InputLabelProps={{ shrink: true }}
            value={templateFootnoteId} onChange={(e) => setTemplateFootnoteId(e.target.value)} disabled={templateSaving}
          >
            <option value="">없음</option>
            {footnotes.map((f) => <option key={f.footnote_id} value={f.footnote_id}>{f.name}</option>)}
          </TextField>
          <TextField
            select SelectProps={{ native: true }} size="small" fullWidth label="워터마크"
            InputLabelProps={{ shrink: true }}
            value={templateWatermarkId} onChange={(e) => setTemplateWatermarkId(e.target.value)} disabled={templateSaving}
          >
            <option value="">없음</option>
            {watermarks.map((w) => <option key={w.watermark_id} value={w.watermark_id}>{w.name}</option>)}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeTemplateDialog} disabled={templateSaving} color="inherit">취소</Button>
          <Button
            variant="contained" onClick={handleTemplateSave} disabled={!templateName.trim() || templateSaving}
            startIcon={templateSaving ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {templateSaving ? "저장 중..." : "저장"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
