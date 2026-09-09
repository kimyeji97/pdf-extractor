/**
 * 감지 품질 통계 위젯 + 상세 아코디언 (REQ-F12 Phase 2)
 *
 * 기존 3타일(업로드한 문제집 수·감지된 문항 수·생성한 문제집 수, REQ-D07 2안)을 **대체**한다.
 * 합계는 `GET /api/stats`, 타일 클릭 시 아코디언에 채울 파일·페이지 목록은
 * `GET /api/stats/detail?field=...`에서 온다 — `/api/stats`는 집계 숫자만 주므로
 * "어느 파일·어느 페이지인지"는 이 두 번째 호출이 필요하다(계획서 § 결정 "아코디언 상세
 * 데이터 출처").
 *
 * 문항 탐지율(`detection_rate`)은 상세 API의 `field` 4종에 없다 — 집계 지표라 "해당하는
 * 파일 목록"이라는 개념 자체가 없으므로 클릭해도 아코디언이 열리지 않는다.
 *
 * ⚠️ **파일 경로는 `StatCards.jsx` 그대로 유지한다** — 컴포넌트 내용은 REQ-F12로 완전히
 *    바뀌었지만, D09·D11 테스트(`headerSearchRemoval.test.jsx`·`menuRename.test.jsx`)가
 *    `vi.mock('components/StatCards', ...)`로 이 **모듈 경로**를 가로채 무해한 스텁으로
 *    바꿔 둔다(그 테스트들의 관심사가 아니라서). 새 파일(`StatsBoard.jsx`)로 옮기면 그
 *    mock이 더는 아무것도 가로채지 못해 실제 컴포넌트가 렌더되고, 그 테스트들의
 *    `api/client` mock에 `getStats`가 없어 "No getStats export" 로 깨진다(실측,
 *    2026-09-09) — 테스트 파일은 이 커맨드의 권한 밖이라 고칠 수 없으므로, 대신 새
 *    컴포넌트를 옛 파일 경로에 얹는 쪽을 택했다.
 */
import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { Icon } from "@iconify/react";

import { getStats, getStatsDetail } from "api/client";
import { tintSx } from "theme/tint";

const TILES = [
  {
    field: "processing_count",
    label: "분석중 파일수",
    icon: "material-symbols:autorenew-rounded",
    color: "info",
    clickable: true,
  },
  {
    field: "undetected_page_count",
    label: "미탐지 페이지 수",
    icon: "material-symbols:visibility-off-outline-rounded",
    color: "warning",
    clickable: true,
  },
  {
    field: "false_positive_count",
    label: "오탐 문항 수",
    icon: "material-symbols:error-outline-rounded",
    color: "error",
    clickable: true,
  },
  {
    field: "manual_count",
    label: "수동 문항 수",
    icon: "material-symbols:edit-note-rounded",
    color: "secondary",
    clickable: true,
  },
  {
    field: "detection_rate",
    label: "문항 탐지율",
    icon: "material-symbols:target-rounded",
    color: "success",
    clickable: false,
  },
];

// 탐지율은 null(계측 불가, REQ-F12 결정)이면 "—" — 0%로 보이면 "문항이 없음"과
// "감지가 전부 오탐"이 구별되지 않는다. 반올림 퍼센트 형식은 결정된 계약이 아니라
// 여기서 고른 표시 형식일 뿐이다(검증 계약에 형식 고정 케이스 없음).
function formatValue(field, stats) {
  if (field === "detection_rate") {
    const v = stats.detection_rate;
    return v == null ? "—" : `${Math.round(v * 100)}%`;
  }
  const v = stats[field];
  return typeof v === "number" ? v.toLocaleString() : v;
}

/**
 * @param {{ refreshTrigger?: number, onSelectFile?: (jobId: string, page1Based?: number) => void }} props
 *   `onSelectFile`의 `page1Based`는 파일 이름 클릭이면 없고(문서만 이동), 개별 페이지
 *   번호 클릭이면 그 페이지(1-based)가 온다(REQ-F12 Phase 3 — "페이지 클릭 → 작업 화면
 *   진입 + 해당 페이지로 스크롤·포커스").
 */
export default function StatsBoard({ refreshTrigger = 0, onSelectFile }) {
  const [stats, setStats] = useState(null);
  const [failed, setFailed] = useState(false);

  const [openField, setOpenField] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    getStats()
      .then((d) => alive && setStats(d))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [refreshTrigger]);

  const handleTileClick = (tile) => {
    if (!tile.clickable) return;

    if (openField === tile.field) {
      setOpenField(null);
      setDetail(null);
      return;
    }

    setOpenField(tile.field);
    setDetail(null);
    setDetailLoading(true);
    getStatsDetail(tile.field)
      .then((d) => setDetail(d))
      .catch(() => setDetail({ field: tile.field, items: [] }))
      .finally(() => setDetailLoading(false));
  };

  // 통계는 부가 정보다. 실패하면 목록 화면을 막지 않고 조용히 사라진다(종전과 동일 원칙).
  if (failed) return null;

  return (
    <Box sx={{ display: "flex", gap: 2, flexShrink: 0, minHeight: 0 }}>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", flex: 1, alignContent: "flex-start" }}>
        {TILES.map((t) => (
          <Paper
            key={t.field}
            data-testid={`stat-tile-${t.field}`}
            elevation={0}
            onClick={() => handleTileClick(t)}
            sx={(theme) => ({
              flex: "1 1 160px",
              minWidth: 160,
              maxWidth: 220,
              px: 2,
              py: 1.75,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              borderRadius: 2,
              boxShadow: theme.customShadows?.card,
              cursor: t.clickable ? "pointer" : "default",
              ...tintSx(t.color)(theme),
            })}
          >
            <Icon icon={t.icon} style={{ fontSize: 26, flexShrink: 0, opacity: 0.85 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" sx={{ display: "block", opacity: 0.9 }} noWrap>
                {t.label}
              </Typography>
              {stats ? (
                <Typography variant="h6" sx={{ lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>
                  {formatValue(t.field, stats)}
                </Typography>
              ) : (
                <Skeleton width={48} height={26} />
              )}
            </Box>
          </Paper>
        ))}
      </Box>

      {/* ── 상세 아코디언 — 고르기 전에는 DOM에 없다(D09-01과 같은 원칙) ── */}
      {openField && (
        <Paper
          data-testid="stat-detail-panel"
          elevation={0}
          sx={(theme) => ({
            width: 320,
            flexShrink: 0,
            borderRadius: 2,
            p: 1.5,
            boxShadow: theme.customShadows?.card,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            overflowY: "auto",
          })}
        >
          {detailLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={20} />
            </Box>
          ) : (
            <>
              {(detail?.items || []).map((item) => (
                <Box
                  key={item.job_id}
                  data-testid="stat-detail-file"
                  onClick={() => onSelectFile?.(item.job_id)}
                  sx={{
                    px: 1,
                    py: 0.75,
                    borderRadius: 1,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <Typography variant="body2" noWrap>
                    {item.workbook_name || item.filename || item.job_id}
                  </Typography>
                  {item.pages != null && (
                    <Typography variant="caption" color="text.disabled" component="div">
                      {item.count}건 · 페이지{" "}
                      {item.pages.map((p, i) => (
                        <Box
                          key={p}
                          component="span"
                          data-testid="stat-detail-page"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectFile?.(item.job_id, p + 1);
                          }}
                          sx={{
                            cursor: "pointer",
                            textDecoration: "underline",
                            "&:hover": { color: "text.primary" },
                          }}
                        >
                          {p + 1}
                          {i < item.pages.length - 1 ? ", " : ""}
                        </Box>
                      ))}
                    </Typography>
                  )}
                </Box>
              ))}
              {(detail?.items || []).length === 0 && (
                <Typography variant="caption" color="text.disabled" sx={{ px: 1, py: 1 }}>
                  해당하는 파일이 없습니다.
                </Typography>
              )}
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}
