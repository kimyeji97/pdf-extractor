import type { Theme, SxProps, Breakpoint } from '@mui/material/styles';

import { varAlpha } from 'minimal-shared/utils';
import { Link as RouterLink, useLocation } from 'react-router';

import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import { useTheme } from '@mui/material/styles';
import ListItemButton from '@mui/material/ListItemButton';
import Drawer, { drawerClasses } from '@mui/material/Drawer';

import Logo from 'components/common/Logo';

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

function NavContent({ data = navData, onNavigate }: NavContentProps & { onNavigate?: () => void }) {
  const { pathname } = useLocation();

  return (
    <>
      <Logo height={26} sx={{ flexShrink: 0 }} />

      <Box
        component="nav"
        sx={{ display: 'flex', flex: '1 1 auto', flexDirection: 'column', mt: 2.5, minHeight: 0, overflowY: 'auto' }}
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
