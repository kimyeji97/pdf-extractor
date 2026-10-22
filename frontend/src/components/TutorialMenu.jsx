import { useState } from "react";
import { Icon } from "@iconify/react";

import Menu from "@mui/material/Menu";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";

import TutorialDialog from "components/TutorialDialog";
import { TUTORIALS } from "utils/tutorials";

/**
 * 헤더 도움말 버튼 — 튜토리얼을 골라 다시 본다 (REQ-F20 Phase 2).
 * 본 기록을 읽지도 쓰지도 않는다. 다시 보지 않기로 끈 것도 목록에 나온다.
 */
export default function TutorialMenu({ tutorials = TUTORIALS }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selected, setSelected] = useState(null);

  return (
    <>
      <Tooltip title="튜토리얼">
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label="튜토리얼"
          sx={{ color: "text.secondary" }}
        >
          <Icon icon="material-symbols:help-outline-rounded" style={{ fontSize: 22 }} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 200, boxShadow: (t) => t.customShadows.dropdown } } }}
      >
        {tutorials.map((t) => (
          <MenuItem
            key={t.id}
            sx={{ typography: "body2" }}
            onClick={() => {
              setSelected(t);
              setAnchorEl(null);
            }}
          >
            {t.title}
          </MenuItem>
        ))}
      </Menu>

      {selected && <TutorialDialog key={selected.id} tutorial={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
