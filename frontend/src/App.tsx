import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import GlobalDim from 'components/GlobalDim';
import { AuthProvider } from 'contexts/AuthContext';
import { NotificationProvider } from 'contexts/NotificationContext';
import NotificationSnackbar from 'components/NotificationSnackbar';
import { setLoadingCallback, setServerDownCallback } from 'api/client';
import paths from 'routes/paths';

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

  // 서버 다운이면 안내 경로로 보낸다 — 복귀할 자리를 state 로 넘긴다 (REQ-F19).
  // 라우터 컨텍스트의 navigate 를 쓴다(모듈 싱글턴 router 가 아니라).
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    setServerDownCallback(() => {
      const { pathname, search } = locationRef.current;
      if (pathname === paths.unavailable) return;
      navigate(paths.unavailable, { state: { from: pathname + search } });
    });
    return () => setServerDownCallback(null);
  }, [navigate]);

  // NotificationProvider 는 Outlet 바깥이다 — 라우트가 바뀌어도 폴링이 끊기면 안 된다
  // (REQ-F09 Phase 2). 화면 안쪽에 두면 종전 폴링과 같은 실패로 되돌아간다.
  // AuthProvider 가 바깥인 이유는 로그인/회원가입 화면(Outlet 안, RequireAuth 밖)도
  // useAuth()를 써야 하기 때문이다 (REQ-27 Phase 4).
  return (
    <AuthProvider>
      <NotificationProvider>
        <GlobalDim visible={apiLoading} />
        <Outlet />
        {/* 스낵바는 라우트 밖이다 — 완료가 어느 화면에서든 잡히므로 (REQ-F09 Phase 5) */}
        <NotificationSnackbar />
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
