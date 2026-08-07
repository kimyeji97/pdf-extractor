/**
 * 완료 순간의 인앱 스낵바 (REQ-F09 Phase 5)
 *
 * ⚠️ **기준선이 없으면 앱을 여는 순간 30일치 스낵바가 쏟아진다**(계약 #27). 피드는 첫 진입에
 *    최근 30일 전체(최신 50건)를 실어 오기 때문이다. 목록 재조회에서는 같은 실수가 "조회 한 번
 *    더" 정도였지만 여기서는 화면이 즉시 망가진다.
 *
 * 동시에 여러 건이 끝나면 **최신 1건만** 보여준다(2026-08-07 결정) — 나머지는 벨 팝오버에
 * 남으므로 유실이 아니다. 큐로 순차 표시하면 동시 5건에 20초간 하단 UI가 가린다.
 */
import { useEffect, useRef, useState } from "react";

import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

import { useNotifications } from "contexts/NotificationContext";

const AUTO_HIDE_MS = 6000;

const keyOf = (n) => `${n.job_id}:${n.created_at}`;

export default function NotificationSnackbar() {
  const { notifications } = useNotifications();

  const seenRef = useRef(null);
  const [current, setCurrent] = useState(null);

  // 구독 시작 시점에 이미 있던 알림은 '본 것'으로 찍는다 (계약 #27).
  if (seenRef.current === null) {
    seenRef.current = new Set(notifications.map(keyOf));
  }

  useEffect(() => {
    const fresh = notifications.filter((n) => !seenRef.current.has(keyOf(n)));
    if (fresh.length === 0) return;

    fresh.forEach((n) => seenRef.current.add(keyOf(n)));
    setCurrent(fresh[0]); // 피드는 최신이 앞이다
  }, [notifications]);

  if (!current) return null;

  return (
    <Snackbar
      open
      autoHideDuration={AUTO_HIDE_MS}
      onClose={() => setCurrent(null)}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert
        severity={current.severity === "error" ? "error" : "success"}
        variant="filled"
        onClose={() => setCurrent(null)}
        sx={{ width: "100%" }}
      >
        {current.title || (current.severity === "error" ? "작업에 실패했습니다" : "작업이 완료되었습니다")}
      </Alert>
    </Snackbar>
  );
}
