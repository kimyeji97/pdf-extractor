import type { Breakpoint } from '@mui/material/styles';

import { useState } from 'react';
import { Icon } from '@iconify/react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';

import ColorSchemeMenu from 'components/ColorSchemeMenu';
import NotificationBell from 'components/NotificationBell';

import { NavMobile, NavDesktop } from './nav';
import { navData } from './nav-config';
import { dashboardLayoutVars } from './css-vars';
import { layoutClasses } from '../core/classes';
import { MainSection } from '../core/main-section';
import { HeaderSection } from '../core/header-section';
import { LayoutSection } from '../core/layout-section';

import type { MainSectionProps } from '../core/main-section';
import type { HeaderSectionProps } from '../core/header-section';
import type { LayoutSectionProps } from '../core/layout-section';

// ----------------------------------------------------------------------

type LayoutBaseProps = Pick<LayoutSectionProps, 'sx' | 'children' | 'cssVars'>;

export type DashboardLayoutProps = LayoutBaseProps & {
  layoutQuery?: Breakpoint;
  slotProps?: {
    header?: HeaderSectionProps;
    main?: MainSectionProps;
  };
};

/**
 * 앱 셸 (Minimal 템플릿 dashboard 레이아웃 이식, REQ-D07 Phase 1)
 *
 * ━━━ 템플릿 원본과 의도적으로 다른 점 ━━━
 * 템플릿은 본문이 세로로 길어지는 문서형 화면을 전제로 body가 스크롤된다.
 * 이 앱은 화면을 꽉 채우는 작업대(3~4패널 + PDF 뷰어)라 **바깥은 절대 스크롤되지
 * 않고 패널 내부에서만 스크롤**되어야 한다. 그래서 셸 전체에 높이 체인을 건다:
 *   root(100dvh, column, overflow:hidden)
 *     → sidebarContainer(flex:1, minHeight:0, overflow:hidden)
 *       → main(flex:1, minHeight:0, column, overflow:hidden)
 * 이 체인이 끊기면 목록·뷰어의 내부 스크롤이 사라진다(REQ-B04·B05·B08에서 실제로 겪음).
 */
export function DashboardLayout({ sx, cssVars, children, slotProps, layoutQuery = 'lg' }: DashboardLayoutProps) {
  const theme = useTheme();
  const [navOpen, setNavOpen] = useState(false);

  const renderHeader = () => {
    const headerSlots: HeaderSectionProps['slots'] = {
      leftArea: (
        <>
          <IconButton
            onClick={() => setNavOpen(true)}
            sx={{ mr: 1, ml: -1, [theme.breakpoints.up(layoutQuery)]: { display: 'none' } }}
          >
            <Icon icon="material-symbols:menu-rounded" style={{ fontSize: 22 }} />
          </IconButton>
          <NavMobile data={navData} open={navOpen} onClose={() => setNavOpen(false)} />
        </>
      ),
      rightArea: (
        // 추가 예정 기능 자리 — 계정(REQ-27)
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 0.75 } }}>
          <NotificationBell />
          <ColorSchemeMenu />
        </Box>
      ),
    };

    return (
      <HeaderSection
        disableElevation
        layoutQuery={layoutQuery}
        {...slotProps?.header}
        slots={{ ...headerSlots, ...slotProps?.header?.slots }}
        slotProps={{ container: { maxWidth: false }, ...slotProps?.header?.slotProps }}
        sx={slotProps?.header?.sx}
      />
    );
  };

  const renderMain = () => (
    <MainSection
      {...slotProps?.main}
      sx={[
        { flex: '1 1 auto', minHeight: 0, overflow: 'hidden' },
        ...(Array.isArray(slotProps?.main?.sx) ? slotProps.main.sx : [slotProps?.main?.sx]),
      ]}
    >
      {children}
    </MainSection>
  );

  return (
    <LayoutSection
      headerSection={renderHeader()}
      sidebarSection={<NavDesktop data={navData} layoutQuery={layoutQuery} />}
      footerSection={null}
      cssVars={{ ...dashboardLayoutVars(theme), ...cssVars }}
      sx={[
        {
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: 'background.default',
          [`& .${layoutClasses.sidebarContainer}`]: {
            flex: '1 1 auto',
            minHeight: 0,
            overflow: 'hidden',
            [theme.breakpoints.up(layoutQuery)]: {
              pl: 'var(--layout-nav-vertical-width)',
              transition: theme.transitions.create(['padding-left'], {
                easing: 'var(--layout-transition-easing)',
                duration: 'var(--layout-transition-duration)',
              }),
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {renderMain()}
    </LayoutSection>
  );
}

export default DashboardLayout;
