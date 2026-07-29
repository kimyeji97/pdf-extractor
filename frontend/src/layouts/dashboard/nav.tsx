import type { Theme, SxProps, Breakpoint } from '@mui/material/styles';

import { varAlpha } from 'minimal-shared/utils';
import { Icon } from '@iconify/react';
import { Link as RouterLink, useLocation } from 'react-router';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import ListItemButton from '@mui/material/ListItemButton';
import Drawer, { drawerClasses } from '@mui/material/Drawer';

import Logo from 'components/common/Logo';
import { tintSx } from 'theme/tint';

import { navData, type NavItem } from './nav-config';

// ----------------------------------------------------------------------

export type NavContentProps = {
  data?: NavItem[];
  sx?: SxProps<Theme>;
};

export function NavDesktop({ sx, data = navData, layoutQuery }: NavContentProps & { layoutQuery: Breakpoint }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        pt: 2.5,
        px: 2.5,
        top: 0,
        left: 0,
        height: 1,
        display: 'none',
        position: 'fixed',
        flexDirection: 'column',
        zIndex: 'var(--layout-nav-zIndex)',
        width: 'var(--layout-nav-vertical-width)',
        bgcolor: 'background.paper',
        borderRight: `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
        [theme.breakpoints.up(layoutQuery)]: { display: 'flex' },
        ...sx,
      }}
    >
      <NavContent data={data} />
    </Box>
  );
}

export function NavMobile({
  sx,
  data = navData,
  open,
  onClose,
}: NavContentProps & { open: boolean; onClose: () => void }) {
  const { pathname } = useLocation();

  // 라우트가 바뀌면 모바일 서랍을 닫는다
  const closeOnNavigate = () => onClose();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      key={pathname}
      sx={{
        [`& .${drawerClasses.paper}`]: {
          pt: 2.5,
          px: 2.5,
          overflow: 'unset',
          width: 'var(--layout-nav-mobile-width)',
          ...sx,
        },
      }}
    >
      <NavContent data={data} onNavigate={closeOnNavigate} />
    </Drawer>
  );
}

// ----------------------------------------------------------------------

/**
 * 워크스페이스 선택기 (REQ-D07 2안).
 *
 * 템플릿 2안의 대표 요소라 자리를 잡아 두지만 **아직 고를 것이 없다** —
 * 인증이 없어 워크스페이스/계정 개념 자체가 없기 때문이다(REQ-27에서 생긴다).
 * 눌리지 않는 표시 전용으로 두고, 왜 비활성인지 툴팁으로 알린다.
 * 동작하지 않는 드롭다운을 열어 주는 것보다 낫다고 판단했다.
 */
function WorkspaceSelector() {
  return (
    <Tooltip title="계정 기능(REQ-27)이 붙으면 작업공간을 전환할 수 있습니다" placement="right">
      <Box
        sx={(theme) => ({
          mt: 2,
          px: 1.25,
          py: 1,
          gap: 1,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          borderRadius: 1.25,
          cursor: 'default',
          border: `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.16)}`,
        })}
      >
        <Box
          sx={(theme) => ({
            width: 24,
            height: 24,
            flexShrink: 0,
            borderRadius: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // `*.lighter`/`*.dark`는 두 색상 스킴이 공유한다 → tint 헬퍼 (REQ-D08)
            ...tintSx('primary')(theme),
            typography: 'caption',
            fontWeight: 'fontWeightBold',
          })}
        >
          내
        </Box>
        <Typography variant="caption" fontWeight="fontWeightSemiBold" noWrap sx={{ flex: 1, minWidth: 0 }}>
          내 작업공간
        </Typography>
        <Box component="span" sx={{ display: 'flex', color: 'text.disabled' }}>
          <Icon icon="material-symbols:keyboard-arrow-down-rounded" style={{ fontSize: 16 }} />
        </Box>
      </Box>
    </Tooltip>
  );
}

function NavContent({ data = navData, onNavigate }: NavContentProps & { onNavigate?: () => void }) {
  const { pathname } = useLocation();

  return (
    <>
      <Logo height={26} sx={{ flexShrink: 0 }} />

      <WorkspaceSelector />

      <Box
        component="nav"
        sx={{ display: 'flex', flex: '1 1 auto', flexDirection: 'column', mt: 1.5, minHeight: 0, overflowY: 'auto' }}
      >
        <Box component="ul" sx={{ gap: 0.5, display: 'flex', flexDirection: 'column', p: 0, m: 0 }}>
          {data.map((item) => {
            // 문항 분석은 '/'이자 '/analysis/:jobId'의 상위라 하위 경로도 활성으로 본다
            const isActived =
              item.path === '/' ? pathname === '/' || pathname.startsWith('/analysis') : pathname === item.path;

            return (
              <ListItem disableGutters disablePadding key={item.title}>
                <ListItemButton
                  disableGutters
                  component={RouterLink}
                  to={item.path}
                  onClick={onNavigate}
                  sx={[
                    (theme) => ({
                      pl: 2,
                      py: 1,
                      gap: 2,
                      pr: 1.5,
                      borderRadius: 0.75,
                      typography: 'body2',
                      fontWeight: 'fontWeightMedium',
                      color: theme.vars.palette.text.secondary,
                      minHeight: 44,
                      ...(isActived && {
                        fontWeight: 'fontWeightSemiBold',
                        color: theme.vars.palette.primary.main,
                        bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
                        '&:hover': { bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.16) },
                      }),
                    }),
                  ]}
                >
                  <Box component="span" sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center' }}>
                    {item.icon}
                  </Box>
                  <Box component="span" sx={{ flexGrow: 1 }}>
                    {item.title}
                  </Box>
                </ListItemButton>
              </ListItem>
            );
          })}
        </Box>
      </Box>
    </>
  );
}
