/**
 * REQ-F19 Phase 2 — 최상위 errorElement (흰 화면 방지)
 *
 * 검증 계약: docs/plans/PLAN-F19-server-down-notice.md `## 검증 계약` (F19-13·14)
 *
 * 실제 `routes` 의 최상위 라우트(`<App/>`)를 복제해 children 에 터지는 라우트 하나만 덧붙인다 —
 * 그래서 `errorElement` 가 **최상위 라우트에** 있어야 잡힌다(계획서 "최상위"). 화면 안쪽 라우트에만 두면 실패한다.
 * 앱과 같은 `ThemeProvider` 아래에서 그린다(계약 #25).
 *
 * [새로고침] 클릭 → `window.location.reload()` 는 jsdom 이 `location` 재정의를 막아 케이스로 쓰지 않았다(리뷰에서 코드로 본다).
 */
import { Suspense, lazy } from 'react';
import { act, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { routes } from 'routes/router';
import { ThemeProvider } from 'theme/theme-provider';

/** jsdom 에는 `EventSource` 가 없다 (authRouting.test.jsx 와 동일한 최소 표면). */
class FakeEventSource {
  constructor(url) {
    this.url = url;
  }
  addEventListener() {}
  removeEventListener() {}
  close() {}
}

function Boom() {
  throw new Error('render crash');
}

const BrokenChunk = lazy(() => Promise.reject(new Error('Failed to fetch dynamically imported module')));

/** 최상위 라우트 children 에 `extra` 를 덧붙인 트리로 `path` 에서 그린다. */
async function renderWithExtraRoute(extra, path) {
  const [root, ...rest] = routes;
  const tree = [{ ...root, children: [...(root.children ?? []), extra] }, ...rest];
  const memRouter = createMemoryRouter(tree, { initialEntries: [path] });
  await act(async () => {
    render(
      <ThemeProvider>
        <RouterProvider router={memRouter} />
      </ThemeProvider>,
    );
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('EventSource', FakeEventSource);
  global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));
  vi.spyOn(console, 'error').mockImplementation(() => {}); // React 가 잡힌 렌더 에러를 콘솔에 찍는다
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('최상위 errorElement (Phase 2)', () => {
  it('[F19-13] 하위 라우트가 렌더 중 throw 하면 [새로고침] 버튼이 있는 안내를 그린다', async () => {
    await renderWithExtraRoute({ path: '/boom', element: <Boom /> }, '/boom');

    expect(await screen.findByRole('button', { name: /새로고침/ })).toBeInTheDocument();
  });

  it('[F19-14] lazy 청크 로드가 실패해도 같은 안내를 그린다', async () => {
    await renderWithExtraRoute(
      {
        path: '/broken-chunk',
        element: (
          <Suspense fallback={null}>
            <BrokenChunk />
          </Suspense>
        ),
      },
      '/broken-chunk',
    );

    expect(await screen.findByRole('button', { name: /새로고침/ })).toBeInTheDocument();
  });
});
