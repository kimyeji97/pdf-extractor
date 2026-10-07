import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

/**
 * 최상위 `errorElement` (REQ-F19 Phase 2) — 렌더 크래시·청크 로드 실패에 흰 화면 대신 띄운다.
 * 청크 로드 실패는 대개 배포 직후 옛 해시 청크를 찾는 경우라 새로고침이 곧 복구다.
 * `<App/>` 자리를 대신하므로 앱 컨텍스트(인증·알림)에 기대지 않는다.
 */
export default function RouteError() {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Paper sx={{ p: 4, width: "100%", maxWidth: 400, textAlign: "center" }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          화면을 불러오지 못했습니다
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          새 버전이 배포됐거나 일시적인 오류일 수 있습니다. 새로고침해 주세요.
        </Typography>
        <Button variant="contained" fullWidth onClick={() => window.location.reload()}>
          새로고침
        </Button>
      </Paper>
    </Box>
  );
}
