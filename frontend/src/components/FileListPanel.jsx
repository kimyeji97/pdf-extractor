/**
 * 파일 선택 패널 (문제집 편집 화면 좌측)
 *
 * REQ-D07 Phase 2에서 인라인 style 객체를 MUI sx + 테마 토큰으로 옮겼다.
 * 하드코딩 색을 없애야 다크 모드(REQ-D08)가 가능해진다.
 *
 * 스크롤 계약: container(flex 컬럼) → scrollArea(flex:1, minHeight:0, overflowY:auto).
 * 이 체인이 끊기면 목록이 페이지 전체로 늘어나며 내부 스크롤이 사라진다(REQ-B04·B08).
 */
import { useEffect, useState, useCallback, useRef } from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import { Icon } from "@iconify/react";

import { listJobs } from "../api/client";
import usePaginatedList from "../hooks/usePaginatedList";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { tintBg } from "theme/tint";

// 상태 → MUI 시맨틱 컬러 (하드코딩 hex 대신 팔레트를 쓴다)
const STATUS_CHIP = {
  PROCESSING: { label: "처리 중", color: "warning" },
  DONE:       { label: "완료",    color: "success" },
  FAILED:     { label: "실패",    color: "error" },
};

const BOUNDARIES_CHIP = {
  PENDING:    { label: "감지 대기", color: "default" },
  PROCESSING: { label: "감지 중…",  color: "warning" },
  FAILED:     { label: "감지 실패", color: "error" },
};

function relativeTime(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const sec  = Math.floor(diff / 1000);
  if (sec < 60)  return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60)  return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  return `${Math.floor(hour / 24)}일 전`;
}

const chipSx = { fontSize: 10, height: 18 };

function BoundariesBadge({ boundariesStatus, totalQuestionCount }) {
  if (!boundariesStatus) return null;

  if (boundariesStatus === "DONE") {
    return <Chip label={`${totalQuestionCount ?? 0}문항`} size="small" color="primary" sx={chipSx} />;
  }
  const entry = BOUNDARIES_CHIP[boundariesStatus];
  if (!entry) return null;
  return <Chip label={entry.label} size="small" color={entry.color} variant="outlined" sx={chipSx} />;
}

function JobCard({ job, isSelected, selectedCount = 0, onSelect }) {
  // PENDING은 업로드 직후 잠깐이라 별도 표시하지 않는다
  const status = job.status === "PENDING" ? null : STATUS_CHIP[job.status];

  return (
    <Box
      component="li"
      onClick={() => onSelect(job.job_id, job.filename, job.workbook_name)}
      sx={{
        listStyle: "none",
        px: 1.25, py: 1,
        borderRadius: 1.5,
        cursor: "pointer",
        flexShrink: 0,   // 계약 #5 — flex 컬럼 안에서 카드가 축소되지 않게
        border: 1,
        borderColor: isSelected ? "primary.main" : "divider",
        bgcolor: isSelected ? tintBg("primary") : "background.paper",
        transition: "border-color .15s, background-color .15s",
        "&:hover": { borderColor: isSelected ? "primary.main" : "text.disabled" },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 0.75 }}>
        <Typography
          variant="caption"
          fontWeight={600}
          noWrap
          title={job.workbook_name || job.filename || "unknown.pdf"}
          sx={{ minWidth: 0, color: "text.primary" }}
        >
          {job.workbook_name || job.filename || "unknown.pdf"}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0, gap: 0.5 }}>
          {status && <Chip label={status.label} size="small" color={status.color} sx={chipSx} />}
          <BoundariesBadge
            boundariesStatus={job.boundaries_status}
            totalQuestionCount={job.total_question_count}
          />
        </Box>
      </Box>

      <Typography variant="caption" color="text.disabled" noWrap sx={{ display: "block", mt: 0.25 }}>
        <span title={job.filename}>{job.filename || "unknown.pdf"}</span>
        {job.workbook_types?.length > 0 && ` · ${job.workbook_types.join(", ")}`}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
        {job.uploaded_at && (
          <Typography variant="caption" color="text.disabled">
            {relativeTime(job.uploaded_at)}
          </Typography>
        )}
        {/* 멀티 파일 선택 노출(REQ-D07 조건 ②) — 다른 파일로 넘어가도 선택은
            유지되는데 화면에 흔적이 없어 "선택이 날아갔나" 싶게 만들던 지점이다.
            선택이 살아 있는 파일에만 배지를 띄운다. */}
        {selectedCount > 0 && (
          <Chip
            label={`${selectedCount}개 선택됨`}
            size="small"
            color="primary"
            sx={{ ...chipSx, ml: "auto" }}
          />
        )}
      </Box>
    </Box>
  );
}

/**
 * @param {{
 *   selectedJobId: string | null,
 *   onSelect: (jobId: string, filename: string, workbookName?: string) => void,
 *   refreshTrigger: number,
 *   selectedCounts?: Record<string, number>   // jobId → 선택된 문항 수 (편집 화면 전용)
 * }} props
 */
export default function FileListPanel({
  selectedJobId,
  onSelect,
  refreshTrigger = 0,
  selectedCounts,
}) {
  const [searchName, setSearchName] = useState("");
  const [searchType, setSearchType] = useState("");

  // 검색은 서버가 처리한다 (REQ-P03-03)
  const debouncedName = useDebouncedValue(searchName, 300);
  const debouncedType = useDebouncedValue(searchType, 300);

  const fetchPage = useCallback(
    (skip, limit) => listJobs({ skip, limit, name: debouncedName, types: debouncedType }),
    [debouncedName, debouncedType],
  );

  const {
    items: sourceJobs, total, loading, loadingMore, error, sentinelRef, reload: fetchJobs,
  } = usePaginatedList(fetchPage);

  // 부모가 refreshTrigger를 올리면(업로드 등) 목록을 처음부터 다시 받는다.
  // 값이 실제로 바뀐 경우에만 재조회 — fetchJobs 참조 변경(검색어 변경)만으로는
  // 훅이 이미 재로드하므로 여기서 또 부르면 중복 요청이 된다.
  const lastTriggerRef = useRef(refreshTrigger);
  useEffect(() => {
    if (lastTriggerRef.current === refreshTrigger) return;
    lastTriggerRef.current = refreshTrigger;
    fetchJobs();
  }, [refreshTrigger, fetchJobs]);

  const hasSearch = Boolean(debouncedName.trim() || debouncedType.trim());

  return (
    <Box sx={{ width: 1, height: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* 검색 필터 — 검색은 서버가 처리한다(REQ-P03-03).
          "업로드된 파일" 부제목은 두지 않는다. 패널 헤더가 이미 '파일 선택'이라
          제목이 두 줄로 겹친다(Phase 3-2에서 표지 관리에 같은 정리를 했다).
          새로고침 버튼만 검색 줄 옆에 남긴다. */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, mb: 1, flexShrink: 0 }}>
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.75 }}>
          <TextField
            size="small" fullWidth
            placeholder="문제집 이름 검색"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <TextField
            size="small" fullWidth
            placeholder="유형 검색"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          />
        </Box>
        <Tooltip title="새로고침">
          <span>
            <IconButton size="small" onClick={fetchJobs} disabled={loading} sx={{ mt: 0.5 }}>
              {loading
                ? <CircularProgress size={14} />
                : <Icon icon="material-symbols:refresh-rounded" style={{ fontSize: 16 }} />}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {error && <Alert severity="error" sx={{ py: 0, mb: 1 }}>{error}</Alert>}

        {!loading && sourceJobs.length === 0 ? (
          <Typography variant="body2" color="text.disabled" align="center" sx={{ py: 2 }}>
            {hasSearch ? "검색 결과 없음" : "업로드된 파일 없음"}
          </Typography>
        ) : (
          <Box component="ul" sx={{ m: 0, p: 0, display: "flex", flexDirection: "column", gap: 0.75 }}>
            {sourceJobs.map((job) => (
              <JobCard
                key={job.job_id}
                job={job}
                isSelected={selectedJobId === job.job_id}
                selectedCount={selectedCounts?.[job.job_id] ?? 0}
                onSelect={onSelect}
              />
            ))}
          </Box>
        )}

        {/* 무한 스크롤 센티널 (REQ-P03-03) */}
        <Box ref={sentinelRef} sx={{ minHeight: 8, py: 0.75, textAlign: "center" }}>
          {loadingMore && (
            <Typography variant="caption" color="text.disabled">
              불러오는 중… ({sourceJobs.length}/{total})
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
