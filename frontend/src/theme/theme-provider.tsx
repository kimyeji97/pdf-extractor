import type { ThemeProviderProps as MuiThemeProviderProps } from '@mui/material/styles';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as ThemeVarsProvider } from '@mui/material/styles';

import { createTheme } from './create-theme';

import type {} from './extend-theme-types';
import type { ThemeOptions } from './types';

// ----------------------------------------------------------------------

export type ThemeProviderProps = Partial<MuiThemeProviderProps> & {
  themeOverrides?: ThemeOptions;
};

export function ThemeProvider({ themeOverrides, children, ...other }: ThemeProviderProps) {
  const theme = createTheme({
    themeOverrides,
  });

  return (
    <ThemeVarsProvider
      disableTransitionOnChange
      /**
       * REQ-D08. 최초 방문 시 OS 설정을 따른다. 사용자가 명시적으로 고르면
       * localStorage(`mui-mode`)에 저장돼 이후 그쪽이 우선한다.
       *
       * ⚠️ `noSsr`: 이 앱은 CSR 전용이다. 없으면 MUI가 서버 렌더를 가정해
       * 1패스는 defaultMode, 2패스에서 저장값으로 다시 그려 **화면이 한 번 번쩍인다.**
       *
       * ⚠️ 저장 키(`mui-mode`)와 속성명(`data-color-scheme`)은 `index.html`의
       * 사전 페인트 스크립트와 **짝**이다. 한쪽만 바꾸면 FOUC가 되살아난다.
       */
      noSsr
      defaultMode="system"
      theme={theme}
      {...other}
    >
      <CssBaseline />
      {children}
    </ThemeVarsProvider>
  );
}
