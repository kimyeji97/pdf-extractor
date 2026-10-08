/**
 * 헤더 알림 벨 + 미읽음 뱃지 + 알림 이력 팝오버 (REQ-F09 Phase 5)
 *
 * 스낵바를 여기 두지 않은 이유는 수명이 다르기 때문이다 — 팝오버가 닫혀 있어도 스낵바는 뜬다.
 * 이력 목록이 있어야 하는 이유는, 스낵바는 그 순간 화면을 보고 있어야만 유효해서
 * **자리를 비운 사이 끝난 작업을 나중에 확인할 수단**이 따로 필요하기 때문이다(2026-07-30 결정).
 *
 * ⚠️ 색조 배경은 `theme/tint.js`를 쓴다(계약 #20). 팔레트의 밝기 변형 토큰은 **정상 토큰인데도**
 *    라이트/다크가 팔레트를 공유해 다크에서 파스텔 블록이 박힌다. 콘솔·빌드가 조용해 눈으로만
 *    잡힌다. tint 헬퍼는 **함수를 반환**하므로 객체 sx에 스프레드하면 아무것도 안 들어간다 —
 *    `sx={(theme) => ({ ...tintSx('primary')(theme) })}` 형태로 쓴다.
 *    (F09-46이 이 파일을 소스 스캔하므로 금지 토큰은 주석에도 적지 않는다.)
 * ⚠️ iconify `Icon`은 sx가 없다 → 부모에 색을 주고 currentColor를 상속받는다(계약 #18).
 */
import { useState } from "react";
import { useNavigate } from "react-router";
import { Icon } from "@iconify/react";

import Box from "@mui/material/Box";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ListItemButton from "@mui/material/ListItemButton";

import { useNotifications } from "contexts/NotificationContext";
import { markNotificationsRead } from "api/client";
import { tintBg } from "theme/tint";
import paths from "routes/paths";

/** 알림 1건의 안정적인 키 (계약 #16 계열 — job_id 하나로는 재감지·재생성이 같은 키가 된다). */
const keyOf = (n) => `${n.job_id}:${n.created_at}`;

/** 알림 → 화면 매핑 (2026-08-07 확정). 감지는 볼 대상이 있고, 생성은 받아 갈 곳이 이력이다. */
function destinationOf(n) {
  return n.kind === "export" ? paths.results : `/analysis/${n.job_id}`;
}

const formatTime = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
};

export default function NotificationBell() {
  const { notifications, unreadCount } = useNotifications();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);

  // 읽음은 **클릭한 알림만**(REQ-B27) — 벨을 열어도 읽음 처리하지 않는다. 뱃지는 서버 미확인 수 그대로.
  // 클릭한 알림은 서버 응답·피드 재조회 전에도 "확인"으로 보이도록 여기서 기억한다
  // (서버 `read` 이벤트는 개수만 싣고 어느 알림인지는 싣지 않는다).
  const [readKeys, setReadKeys] = useState(() => new Set());
  const isRead = (n) => n.read || readKeys.has(keyOf(n));

  const handleOpen = (e) => setAnchorEl(e.currentTarget);

  const handleItemClick = (n) => {
    setReadKeys((prev) => new Set(prev).add(keyOf(n)));
    markNotificationsRead([n.created_at]).catch(() => {});
    setAnchorEl(null);
    navigate(destinationOf(n));
  };

  const handleReadAll = () => {
    setReadKeys(new Set(notifications.map(keyOf)));
    markNotificationsRead().catch(() => {});
  };

  return (
    <>
      <Tooltip title="알림">
        <IconButton
          aria-label="알림"
          onClick={handleOpen}
          sx={{ color: "text.secondary" }}
        >
          <Badge badgeContent={unreadCount} color="secondary">
            <Icon icon="solar:bell-bing-bold-duotone" width={22} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 340, maxHeight: 420 } } }}
      >
        <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center" }}>
          <Typography variant="subtitle2" sx={{ flex: 1 }}>
            알림
          </Typography>
          {notifications.length > 0 && (
            <Button size="small" onClick={handleReadAll}>
              모두 읽음
            </Button>
          )}
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ px: 2, py: 3, color: "text.disabled", textAlign: "center" }}
          >
            아직 알림이 없습니다
          </Typography>
        ) : (
          notifications.map((n) => {
            const read = isRead(n);
            const tone = n.severity === "error" ? "error" : "primary";
            return (
              <ListItemButton
                key={keyOf(n)}
                onClick={() => handleItemClick(n)}
                sx={{ alignItems: "flex-start", gap: 1.5, py: 1.25 }}
              >
                {/* 확인/미확인은 왼쪽 아이콘으로 구분한다(2026-10-02 결정): 미확인 = 색 채운 아이콘, 확인 = 회색 테두리형 */}
                <Box
                  aria-label={read ? "확인" : "미확인"}
                  sx={(theme) => ({
                    mt: 0.25,
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: read ? "transparent" : tintBg(tone)(theme),
                    color: read ? "text.disabled" : `${tone}.main`,
                  })}
                >
                  <Icon
                    icon={
                      n.severity === "error"
                        ? read
                          ? "solar:danger-triangle-linear"
                          : "solar:danger-triangle-bold"
                        : read
                          ? "solar:check-read-linear"
                          : "solar:check-circle-bold"
                    }
                    width={18}
                  />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    {n.title ||
                      (n.severity === "error" ? "작업 실패" : "작업 완료")}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.disabled" }}>
                    {formatTime(n.created_at)}
                  </Typography>
                </Box>
              </ListItemButton>
            );
          })
        )}
      </Popover>
    </>
  );
}
