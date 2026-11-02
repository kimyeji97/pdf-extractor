import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

import paths from "routes/paths";
import { formatWindow, loadWindows, upcomingWindow } from "utils/operatingWindows";

// `/health` 는 `/api` 아래가 아니다(backend main.py) — BASE_URL 에서 오리진만 쓴다.
// client.js 의 BASE_URL 과 같은 규칙이다(NotificationContext 와 같은 이유로 거기서 export 하지 않는다).
const HEALTH_URL = new URL(
  "/health",
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
).href;

// 웨이커(REQ-E03) — 유휴 스케일인으로 꺼진 서버를 깨우는 Lambda Function URL. 없으면(로컬 등) [서버 켜기]를 숨긴다
const WAKE_URL = import.meta.env.VITE_WAKE_URL || "";
const WAKE_POLL_MS = 3000; // 깨운 뒤 /health 확인 간격 (Q15)
const WAKE_TIMEOUT_MS = 120000; // 이만큼 지나도 안 뜨면 다시 누르게 한다 (dev 콜드 스타트 43초 실측)

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

  // 켜져 있을 때 받아 둔 운영 구간 — 서버가 꺼져 있으면 물을 수 없다(REQ-F19 Phase 4).
  // 운영 중 장애면 지금 구간을 보여 준다(2026-10-08 결정). 없으면 줄을 생략한다
  const now = new Date();
  const win = upcomingWindow(loadWindows(), now);
  const winLabel = win && new Date(win.start) <= now ? "운영 시간" : "다음 운영";

  // 깨우기 상태: idle → sending → starting → (복귀) | timeout · closed(운영 시간 밖) · error
  const [wake, setWake] = useState("idle");
  const timers = useRef([]);
  const stopTimers = () => {
    timers.current.forEach((t) => clearInterval(t));
    timers.current = [];
  };
  useEffect(() => stopTimers, []);

  const goBack = () => {
    const from = location.state?.from;
    navigate(from ? { pathname: from.pathname, search: from.search, hash: from.hash } : paths.analysis, {
      replace: true,
      state: from?.state,
    });
  };

  // raw fetch — apiFetch 를 거치면 전역 딤이 켜지고, 실패하면 다운 감지가 또 일어난다(계약 #26)
  const healthy = async () => {
    try {
      return (await fetch(HEALTH_URL, { cache: "no-store" })).ok;
    } catch {
      return false;
    }
  };

  const handleRetry = async () => {
    setChecking(true);
    setFailed(false);
    if (await healthy()) {
      goBack();
      return;
    }
    setFailed(true);
    setChecking(false);
  };

  const handleWake = async () => {
    setWake("sending");
    let res;
    try {
      res = await fetch(WAKE_URL, { method: "POST" });
    } catch {
      setWake("error");
      return;
    }
    if (res.status === 403) {
      setWake("closed");
      return;
    }
    if (!res.ok) {
      setWake("error");
      return;
    }
    setWake("starting");
    stopTimers();
    timers.current.push(
      setInterval(async () => {
        if (await healthy()) {
          stopTimers();
          goBack();
        }
      }, WAKE_POLL_MS),
      setTimeout(() => {
        stopTimers();
        setWake("timeout");
      }, WAKE_TIMEOUT_MS),
    );
  };
  const waking = wake === "sending" || wake === "starting";

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

        {win && (
          <Typography variant="body2" fontWeight={600} sx={{ mb: 3 }}>
            {winLabel}: {formatWindow(win)}
          </Typography>
        )}

        {failed && (
          <Alert severity="warning" sx={{ mb: 2, textAlign: "left" }}>
            아직 연결되지 않습니다.
          </Alert>
        )}

        {wake === "starting" && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            서버를 켜는 중입니다. 1분쯤 걸립니다.
          </Typography>
        )}
        {wake === "timeout" && (
          <Alert severity="warning" sx={{ mb: 2, textAlign: "left" }}>
            아직 켜지지 않았습니다. 다시 눌러 주세요.
          </Alert>
        )}
        {wake === "closed" && (
          <Alert severity="info" sx={{ mb: 2, textAlign: "left" }}>
            지금은 운영 시간이 아니라 서버를 켤 수 없습니다.
          </Alert>
        )}
        {wake === "error" && (
          <Alert severity="warning" sx={{ mb: 2, textAlign: "left" }}>
            서버를 켜지 못했습니다. 잠시 후 다시 시도해 주세요.
          </Alert>
        )}

        {WAKE_URL && !offline && (
          <Button variant="contained" fullWidth disabled={waking} onClick={handleWake} sx={{ mb: 1 }}>
            서버 켜기
          </Button>
        )}
        <Button
          variant={WAKE_URL && !offline ? "outlined" : "contained"}
          fullWidth
          disabled={checking || waking}
          onClick={handleRetry}
        >
          다시 시도
        </Button>
      </Paper>
    </Box>
  );
}
