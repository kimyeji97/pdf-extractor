/**
 * 라이트/다크/시스템 전환 메뉴 (REQ-D08)
 *
 * ━━━ 왜 2단 토글이 아니라 3단 메뉴인가 ━━━
 * 기본값이 "시스템 따름"이다. 2단 아이콘 토글(라이트↔다크)로 만들면 사용자가 한 번이라도
 * 누르는 순간 선택이 localStorage에 고정되고 **"OS 따름"으로 되돌릴 방법이 사라진다.**
 * 기본값이 system인 이상 토글도 system을 가리킬 수 있어야 한다. (스펙 §4 결정 #2)
 *
 * 아이콘은 iconify라 sx가 없다 → 계약 #18대로 부모 Box에 색을 주고 currentColor를 상속받는다.
 */
import { useState } from "react";
import { Icon } from "@iconify/react";

import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import { useColorScheme } from "@mui/material/styles";

const OPTIONS = [
  { value: "light", label: "라이트", icon: "material-symbols:light-mode-rounded" },
  { value: "dark", label: "다크", icon: "material-symbols:dark-mode-rounded" },
  { value: "system", label: "시스템 설정", icon: "material-symbols:computer-outline-rounded" },
];

export default function ColorSchemeMenu() {
  const { mode, setMode } = useColorScheme();
  const [anchorEl, setAnchorEl] = useState(null);

  // noSsr을 켜 뒀어도 mode는 첫 렌더에서 undefined일 수 있다 — 그 사이 빈 칸이 생기지 않게 기본값을 준다.
  const current = mode ?? "system";
  const currentOption = OPTIONS.find((o) => o.value === current) ?? OPTIONS[2];

  return (
    <>
      <Tooltip title="화면 모드">
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label="화면 모드 변경"
          sx={{ color: "text.secondary" }}
        >
          <Icon icon={currentOption.icon} style={{ fontSize: 22 }} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 160, boxShadow: (t) => t.customShadows.dropdown } } }}
      >
        {OPTIONS.map((o) => (
          <MenuItem
            key={o.value}
            selected={o.value === current}
            onClick={() => {
              setMode(o.value);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: 32 }}>
              <Icon icon={o.icon} style={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ variant: "body2" }}>{o.label}</ListItemText>
            {o.value === current && (
              <Box sx={{ display: "flex", ml: 1, color: "primary.main" }}>
                <Icon icon="material-symbols:check-rounded" style={{ fontSize: 18 }} />
              </Box>
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
