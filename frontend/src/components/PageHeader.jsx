/**
 * 페이지 헤더 + 브레드크럼 (REQ-D07 2안 공통 요소)
 *
 * 2안에서 앱 헤더는 검색에 자리를 내줬다. 그래서 "지금 어느 화면인가"를 알려 주는 책임이
 * 이 컴포넌트로 넘어왔다 — 빼면 사용자가 위치를 잃는다.
 *
 * 목록 화면과 작업 화면이 같은 규격을 공유해야 화면을 오갈 때 제목 위치가 흔들리지 않는다.
 */
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import { Link as RouterLink } from "react-router";

/**
 * @param {{
 *   title: string,
 *   crumbs?: Array<{ label: string, to?: string }>,  // 마지막 항목은 링크 없이 현재 위치
 *   actions?: React.ReactNode,                        // 우측 버튼 영역
 * }} props
 */
export default function PageHeader({ title, crumbs = [], actions = null }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flexShrink: 0,
        minWidth: 0,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6" noWrap title={title} sx={{ lineHeight: 1.3 }}>
          {title}
        </Typography>
        {crumbs.length > 0 && (
          <Breadcrumbs
            separator="·"
            sx={{ mt: 0.25, "& .MuiBreadcrumbs-separator": { mx: 0.75 } }}
          >
            {crumbs.map((c, i) =>
              c.to && i < crumbs.length - 1 ? (
                <Link
                  key={c.label}
                  component={RouterLink}
                  to={c.to}
                  variant="caption"
                  color="text.secondary"
                  underline="hover"
                >
                  {c.label}
                </Link>
              ) : (
                <Typography key={c.label} variant="caption" color="text.disabled" noWrap>
                  {c.label}
                </Typography>
              ),
            )}
          </Breadcrumbs>
        )}
      </Box>

      <Box sx={{ flex: 1 }} />

      {actions && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          {actions}
        </Box>
      )}
    </Box>
  );
}
