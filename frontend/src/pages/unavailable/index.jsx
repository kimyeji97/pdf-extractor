import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

import paths from "routes/paths";

// `/health` 는 `/api` 아래가 아니다(backend main.py) — BASE_URL 에서 오리진만 쓴다.
// client.js 의 BASE_URL 과 같은 규칙이다(NotificationContext 와 같은 이유로 거기서 export 하지 않는다).
const HEALTH_URL = new URL(
  "/health",
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
).href;

/**
 * 서버 다운 안내 (REQ-F19 Phase 1) — `apiFetch` 가 네트워크 에러를 만나면 App 이 여기로 보낸다.
 * 재시도는 raw fetch 다 — apiFetch 를 거치면 전역 딤이 켜지고, 실패하면 감지가 또 일어난다(계약 #26).
 */
export default function UnavailablePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);

  // `onLine === false` 만 확실한 오프라인이다 — true 는 연결을 보장하지 않으므로 서버 다운으로 본다
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;

  const handleRetry = async () => {
    setChecking(true);
    setFailed(false);
    try {
      const res = await fetch(HEALTH_URL, { cache: "no-store" });
      if (res.ok) {
        const from = location.state?.from;
        navigate(from ? { pathname: from.pathname, search: from.search, hash: from.hash } : paths.analysis, {
          replace: true,
          state: from?.state,
        });
        return;
      }
    } catch {
      // 아직 닿지 않는다 — 아래에서 실패 표시
    }
    setFailed(true);
    setChecking(false);
  };

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
          {offline ? "인터넷 연결이 끊겼습니다" : "서버에 연결할 수 없습니다"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {offline
            ? "네트워크 연결을 확인한 뒤 다시 시도해 주세요."
            : "서버가 꺼져 있거나 점검 중입니다. 잠시 후 다시 시도해 주세요."}
        </Typography>

        {failed && (
          <Alert severity="warning" sx={{ mb: 2, textAlign: "left" }}>
            아직 연결되지 않습니다.
          </Alert>
        )}

        <Button variant="contained" fullWidth disabled={checking} onClick={handleRetry}>
          다시 시도
        </Button>
      </Paper>
    </Box>
  );
}
