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
import { tintSx } from "theme/tint";

/**
 * ⚠️ 색조 배경에 `*.lighter` / `*.darker`를 쓰지 말 것 (REQ-D08에서 실제로 겪음).
 *
 * `palette.ts`의 `basePalette`(primary·success·warning·…)는 **light와 dark가 공유**한다.
 * 모드별로 갈리는 것은 text·background·action 셋뿐이다. 그래서 `primary.lighter`는
 * 다크에서도 `#D0ECFE` 그대로라 **어두운 화면에 파스텔 타일 3장이 박힌다.**
 * 종전 주석은 "lighter를 쓰면 다크에서 안전하다"고 적혀 있었지만 사실이 아니었다.
 *
 * → `theme/tint.js`의 `tintSx`를 쓴다 (main 채널 알파 + 모드별 글자색).
 */
const TILES = [
  {
    key: "source_count",
    label: "업로드한 문제집",
    icon: "material-symbols:library-books-outline-rounded",
    color: "primary",
  },
  {
    key: "question_count",
    label: "감지된 문항",
    icon: "material-symbols:checklist-rounded",
    color: "success",
  },
  {
    key: "workbook_count",
    label: "생성한 문제집",
    icon: "material-symbols:picture-as-pdf-outline-rounded",
    color: "warning",
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
          sx={(theme) => ({
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
            boxShadow: theme.customShadows?.card,
            ...tintSx(t.color)(theme),
          })}
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
