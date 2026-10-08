import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";

import { getOperatingWindows } from "api/client";
import { bannerEnd, saveWindows } from "utils/operatingWindows";

const TICK_MS = 10 * 1000;

/**
 * 꺼짐 예고 배너 (REQ-F19 Phase 4) — 서버가 예약대로 꺼지기 1시간 전부터 상단에 상시 띄운다(닫기 없음).
 * App 의 Outlet 밖이라 로그인·회원가입 화면에서도 보인다. 받은 운영 구간은 저장해 두고,
 * 서버가 꺼졌을 때 다운 안내 화면이 그 값으로 운영 시간을 보여 준다.
 * 조회 실패는 조용히 넘긴다 — 배너만 안 뜬다.
 * 화면 흐름 밖(fixed)에 띄운다 — 100dvh 높이 체인(계약 #1)에 블록을 끼우지 않는다.
 */
export default function ShutdownBanner() {
  const [windows, setWindows] = useState([]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let alive = true;
    getOperatingWindows()
      .then((ws) => {
        if (!alive) return;
        setWindows(ws);
        // 빈 목록은 저장하지 않는다 — 백엔드는 AWS 조회·해석 실패도 200 [] 로 준다. 덮어쓰면 서버가 불안정한
        // 바로 그때 다운 화면의 운영 시간이 사라진다(리뷰 F19 회차 7). 지난 구간은 upcomingWindow 가 거른다
        if (ws.length) saveWindows(ws);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const end = bannerEnd(windows, now);
  if (!end) return null;

  const minutes = Math.max(1, Math.ceil((end - now) / 60000));
  return (
    <Alert
      severity="warning"
      variant="filled"
      sx={{ position: "fixed", top: 8, left: "50%", transform: "translateX(-50%)", zIndex: (t) => t.zIndex.snackbar, maxWidth: "calc(100% - 32px)" }}
    >
      서버가 약 {minutes}분 뒤 종료됩니다. 진행 중인 작업(분석·PDF 생성)은 끊길 수 있으니 미리 마무리해 주세요.
    </Alert>
  );
}
