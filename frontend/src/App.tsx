import { useState, useEffect } from 'react';
import { Outlet } from 'react-router';
import GlobalDim from 'components/GlobalDim';
import { setLoadingCallback } from 'api/client';

/**
 * 루트 컴포넌트.
 *
 * Aurora 템플릿의 설정 패널(SettingsPanel/Toggler)과 그에 딸린 Settings 컨텍스트는
 * REQ-D07 Phase 1에서 제거했다 — 템플릿 데모용이라 이 앱에서 쓰이지 않았다.
 * 라우트 전환 시 window.scrollTo도 뺐다. 셸이 100dvh 고정이라 window는 스크롤되지 않고,
 * 스크롤은 각 패널 내부에서만 일어난다.
 */
const App = () => {
  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    setLoadingCallback(setApiLoading);
    return () => setLoadingCallback(null);
  }, []);

  return (
    <>
      <GlobalDim visible={apiLoading} />
      <Outlet />
    </>
  );
};

export default App;
