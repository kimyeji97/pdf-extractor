import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import BreakpointsProvider from 'providers/BreakpointsProvider';
import SettingsPanelProvider from 'providers/SettingsPanelProvider';
import SettingsProvider from 'providers/SettingsProvider';
import ThemeProvider from 'providers/ThemeProvider';
import router from 'routes/router';
import './App.css';

// StrictMode 제거: 개발 모드 effect 이중 실행(중복 API 요청)을 끄기 위함.
// 프로덕션 동작에는 영향 없으며, effect cleanup 누락 조기 발견 이점은 포기한다.
createRoot(document.getElementById('root')!).render(
  <SettingsProvider>
    <ThemeProvider>
      <BreakpointsProvider>
        <SettingsPanelProvider>
          <RouterProvider router={router} />
        </SettingsPanelProvider>
      </BreakpointsProvider>
    </ThemeProvider>
  </SettingsProvider>,
);
