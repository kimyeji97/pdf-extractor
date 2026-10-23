import { Icon } from "@iconify/react";
import { useNavigate } from "react-router";

import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";

import paths from "routes/paths";

/**
 * 헤더 도움말 버튼 — 튜토리얼 화면(다시 보기)을 연다 (REQ-F20 Phase 4).
 * 다시 보기는 본 기록을 읽지도 쓰지도 않는다. 묶음은 그 화면 목차에서 고른다.
 */
export default function TutorialMenu() {
  const navigate = useNavigate();

  return (
    <Tooltip title="튜토리얼">
      <IconButton onClick={() => navigate(paths.tutorials)} aria-label="튜토리얼" sx={{ color: "text.secondary" }}>
        <Icon icon="material-symbols:help-outline-rounded" style={{ fontSize: 22 }} />
      </IconButton>
    </Tooltip>
  );
}
