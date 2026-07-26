import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

// 폰트는 fontsource로 자체 호스팅한다 (CDN 의존 없음) — REQ-D07
import '@fontsource-variable/dm-sans';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow/700.css';
import '@fontsource/barlow/800.css';

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
