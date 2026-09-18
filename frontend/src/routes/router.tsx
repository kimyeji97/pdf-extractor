import { Suspense, lazy } from 'react';
import { Outlet, RouteObject, createBrowserRouter, useLocation } from 'react-router';
import App from 'App';
import DashboardLayout from 'layouts/dashboard';
import PageLoader from 'components/loading/PageLoader';
import RequireAuth from 'components/RequireAuth';
import paths from './paths';

const AnalysisPage     = lazy(() => import('pages/analysis'));
const AnalysisWorkPage = lazy(() => import('pages/analysis/work'));
const EditorPage       = lazy(() => import('pages/editor'));
const HistoryPage      = lazy(() => import('pages/history'));
const FormatPage       = lazy(() => import('pages/format'));
const LoginPage        = lazy(() => import('pages/login'));
const SignupPage       = lazy(() => import('pages/signup'));

export const SuspenseOutlet = () => {
  const location = useLocation();
  return (
    <Suspense key={location.pathname} fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
};

export const routes: RouteObject[] = [
  {
    element: <App />,
    children: [
      // /login·/signup은 RequireAuth 밖이다 — 감싸면 리다이렉트 루프가 생긴다
      // (REQ-27 Phase 4, 계획서 § 제약·함정).
      {
        path: paths.login,
        element: (
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: paths.signup,
        element: (
          <Suspense fallback={<PageLoader />}>
            <SignupPage />
          </Suspense>
        ),
      },
      {
        path: '/',
        element: (
          <RequireAuth>
            <DashboardLayout>
              <SuspenseOutlet />
            </DashboardLayout>
          </RequireAuth>
        ),
        children: [
          { index: true,                 element: <AnalysisPage /> },
          { path: paths.analysisWork,    element: <AnalysisWorkPage /> },
          { path: paths.create,          element: <EditorPage /> },
          { path: paths.results,         element: <HistoryPage /> },
          { path: paths.templates,       element: <FormatPage /> },
        ],
      },
    ],
  },
];

const router = createBrowserRouter(routes);
export default router;
