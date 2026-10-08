import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

// 폰트는 fontsource로 자체 호스팅한다 (CDN 의존 없음) — REQ-D07
// 영문 Outfit(가변 — 파일 하나) + 한글 Gothic A1(굵기마다 파일이라 400~700만) — REQ-D13
import '@fontsource-variable/outfit';
import '@fontsource/gothic-a1/400.css';
import '@fontsource/gothic-a1/500.css';
import '@fontsource/gothic-a1/600.css';
import '@fontsource/gothic-a1/700.css';

import { ThemeProvider } from 'theme/theme-provider';
import router from 'routes/router';
import './App.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
);
