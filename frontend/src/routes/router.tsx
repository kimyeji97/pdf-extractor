import { Suspense, lazy } from 'react';
import { Outlet, RouteObject, createBrowserRouter, useLocation } from 'react-router';
import App from 'App';
import MainLayout from 'layouts/main-layout';
import PageLoader from 'components/loading/PageLoader';
import paths from './paths';

const AnalysisPage  = lazy(() => import('pages/analysis'));
const EditorPage    = lazy(() => import('pages/editor'));
const HistoryPage   = lazy(() => import('pages/history'));
const FormatPage    = lazy(() => import('pages/format'));

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
      {
        path: '/',
        element: (
          <MainLayout>
            <SuspenseOutlet />
          </MainLayout>
        ),
        children: [
          { index: true,           element: <AnalysisPage /> },
          { path: paths.editor,    element: <EditorPage /> },
          { path: paths.history,   element: <HistoryPage onLoadForEdit={undefined} /> },
          { path: paths.format,    element: <FormatPage /> },
        ],
      },
    ],
  },
];

const router = createBrowserRouter(routes);
export default router;
