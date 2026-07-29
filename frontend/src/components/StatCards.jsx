/**
 * 요약 통계 카드 (REQ-D07 2안)
 *
 * 템플릿 2안의 대표 요소. 이 앱에는 별도 홈/대시보드 라우트가 없어 **분석 목록 상단**에
 * 얹는다 — 진입 화면이 곧 홈이기 때문이다.
 *
 * 합계는 서버(`GET /api/stats`)가 준다. 목록 API가 페이지네이션돼 있어(REQ-P03-03)
 * 프론트에서 더하면 한 페이지분만 세게 되고, 스크롤할수록 숫자가 커지는 이상한 카드가 된다.
 */
import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { Icon } from "@iconify/react";

import { getStats } from "api/client";

// 배경은 팔레트의 lighter 계열을 쓴다 — 하드코딩 hex를 넣으면 다크 모드(REQ-D08)에서 튄다.
const TILES = [
  {
    key: "source_count",
    label: "업로드한 문제집",
    icon: "material-symbols:library-books-outline-rounded",
    bg: "primary.lighter",
    fg: "primary.dark",
  },
  {
    key: "question_count",
    label: "감지된 문항",
    icon: "material-symbols:checklist-rounded",
    bg: "success.lighter",
    fg: "success.dark",
  },
  {
    key: "workbook_count",
    label: "생성한 문제집",
    icon: "material-symbols:picture-as-pdf-outline-rounded",
    bg: "warning.lighter",
    fg: "warning.dark",
  },
];

/**
 * @param {{ refreshTrigger?: number }} props  값이 바뀌면 다시 조회한다(업로드·삭제 후).
 */
export default function StatCards({ refreshTrigger = 0 }) {
  const [stats, setStats] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    getStats()
      .then((d) => alive && setStats(d))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [refreshTrigger]);

  // 통계는 부가 정보다. 실패하면 목록 화면을 막지 않고 조용히 사라진다.
  if (failed) return null;

  return (
    <Box sx={{ display: "flex", gap: 2, flexShrink: 0, flexWrap: "wrap" }}>
      {TILES.map((t) => (
        <Paper
          key={t.key}
          elevation={0}
          sx={{
            // 넓은 화면에서 카드 3장이 폭을 다 먹으면 숫자 사이 여백만 커져 읽기 나빠진다.
            // 좌측에 모아 두고 최대 폭을 묶는다.
            flex: "1 1 180px",
            minWidth: 180,
            maxWidth: 260,
            px: 2,
            py: 1.75,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            borderRadius: 2,
            bgcolor: t.bg,
            color: t.fg,
            boxShadow: (theme) => theme.customShadows?.card,
          }}
        >
          <Icon icon={t.icon} style={{ fontSize: 28, flexShrink: 0, opacity: 0.85 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ display: "block", opacity: 0.9 }} noWrap>
              {t.label}
            </Typography>
            {stats ? (
              <Typography variant="h5" sx={{ lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>
                {stats[t.key].toLocaleString()}
              </Typography>
            ) : (
              <Skeleton width={56} height={30} />
            )}
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
