/**
 * 계정 메뉴(account-popover) — 로그인 사용자 이메일 표시 + 로그아웃 (REQ-27 Phase 5)
 *
 * `ColorSchemeMenu`와 같은 IconButton+Menu 무대다. 로그아웃은 `useAuth().logout()`만
 * 부른다 — 이동은 이 컴포넌트가 하지 않는다. `logout()`이 `isAuthenticated`를 false로
 * 바꾸면 `RequireAuth`가 그 변화를 보고 `/login`으로 리다이렉트한다(계약 재사용, Phase 4).
 */
import { useState } from "react";
import { Icon } from "@iconify/react";

import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";

import { useAuth } from "contexts/AuthContext";

export default function ProfileMenu() {
  const { userEmail, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <>
      <Tooltip title="계정">
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label="계정 메뉴"
          sx={{ color: "text.secondary" }}
        >
          <Icon icon="material-symbols:account-circle-outline-rounded" style={{ fontSize: 22 }} />
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
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {userEmail}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            logout();
          }}
        >
          <ListItemIcon sx={{ color: "inherit", minWidth: 32 }}>
            <Icon icon="material-symbols:logout-rounded" style={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ variant: "body2" }}>로그아웃</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
