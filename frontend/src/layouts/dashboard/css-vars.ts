import type { Theme } from '@mui/material/styles';

// ----------------------------------------------------------------------

/**
 * 대시보드 레이아웃 CSS 변수 (Minimal 템플릿 이식, REQ-D07)
 *
 * 템플릿 원본과 다른 점: 이 앱은 문서를 위에서 아래로 읽는 화면이 아니라
 * 화면 전체를 채우는 작업대다. 본문 패딩(--layout-dashboard-content-*)은
 * 각 화면이 직접 관리하므로 0으로 두고, 세로 스크롤은 패널 내부에서만 일어난다.
 */
export function dashboardLayoutVars(theme: Theme) {
  return {
    '--layout-transition-easing': 'linear',
    '--layout-transition-duration': '120ms',
    '--layout-nav-vertical-width': '260px',
    // 템플릿 기본은 64/72px. 여기는 화면을 꽉 채워 쓰는 작업대라 세로 공간이 아까워
    // 헤더를 낮춘다(패널 3~4개 + PDF 뷰어가 같이 들어가야 함).
    '--layout-header-mobile-height': '56px',
    '--layout-header-desktop-height': '56px',
    '--layout-dashboard-content-pt': theme.spacing(0),
    '--layout-dashboard-content-pb': theme.spacing(0),
    '--layout-dashboard-content-px': theme.spacing(0),
  };
}
