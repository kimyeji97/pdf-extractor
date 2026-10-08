import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import GlobalDim from 'components/GlobalDim';
import { AuthProvider, useAuth } from 'contexts/AuthContext';
import { NotificationProvider } from 'contexts/NotificationContext';
import NotificationSnackbar from 'components/NotificationSnackbar';
import ShutdownBanner from 'components/ShutdownBanner';
import { setBlockedCallback, setLoadingCallback, setServerDownCallback } from 'api/client';
import paths from 'routes/paths';

/**
 * 루트 컴포넌트.
 *
 * Aurora 템플릿의 설정 패널(SettingsPanel/Toggler)과 그에 딸린 Settings 컨텍스트는
 * REQ-D07 Phase 1에서 제거했다 — 템플릿 데모용이라 이 앱에서 쓰이지 않았다.
 * 라우트 전환 시 window.scrollTo도 뺐다. 셸이 100dvh 고정이라 window는 스크롤되지 않고,
 * 스크롤은 각 패널 내부에서만 일어난다.
 */
/**
 * 차단된 계정이면 로그아웃하고 로그인 화면으로 보낸다 (REQ-C12).
 * `useAuth()`가 필요해 AuthProvider 안쪽에 둔다 — App 자신은 Provider 바깥이다.
 */
function BlockedGuard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  useEffect(() => {
    setBlockedCallback((notice: string) => {
      logout();
      navigate(paths.login, { replace: true, state: { notice } });
    });
    return () => setBlockedCallback(null);
  }, [navigate, logout]);
  return null;
}

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
      const { pathname, search, hash, state } = locationRef.current;
      if (pathname === paths.unavailable) return;
      // state 까지 넘긴다 — 편집 화면은 state.initialWorkbookId 로 복원한다(리뷰 F19 회차 0).
      // replace — push 면 뒤로 가기가 실패한 화면을 다시 띄워 안내로 튕기고, 동시 실패마다 기록이 쌓인다
      navigate(paths.unavailable, { replace: true, state: { from: { pathname, search, hash, state } } });
    });
    return () => setServerDownCallback(null);
  }, [navigate]);

  // NotificationProvider 는 Outlet 바깥이다 — 라우트가 바뀌어도 폴링이 끊기면 안 된다
  // (REQ-F09 Phase 2). 화면 안쪽에 두면 종전 폴링과 같은 실패로 되돌아간다.
  // AuthProvider 가 바깥인 이유는 로그인/회원가입 화면(Outlet 안, RequireAuth 밖)도
  // useAuth()를 써야 하기 때문이다 (REQ-27 Phase 4).
  return (
    <AuthProvider>
      <BlockedGuard />
      <NotificationProvider>
        <GlobalDim visible={apiLoading} />
        {/* 꺼짐 예고 배너도 라우트 밖이다 — 로그인 화면에서도 보여야 한다 (REQ-F19 Phase 4) */}
        <ShutdownBanner />
        <Outlet />
        {/* 스낵바는 라우트 밖이다 — 완료가 어느 화면에서든 잡히므로 (REQ-F09 Phase 5) */}
        <NotificationSnackbar />
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
