/**
 * REQ-F19 Phase 1 — 서버 다운 안내 경로 (배선 + 안내 화면)
 *
 * 검증 계약: docs/plans/PLAN-F19-server-down-notice.md `## 검증 계약` (F19-06~12)
 *
 * `authRouting.test.jsx` 처럼 실제 `routes` 트리를 `createMemoryRouter` 로 그린다. 단 `api/client` 는
 * mock 하지 않는다 — 감지(client) → 이동(App) → 복귀(안내 화면)의 진짜 배선을 보려는 것이다.
 * 네트워크는 `global.fetch` 로 막는다. 그래서 이동은 **라우터 컨텍스트로** 해야 한다(모듈 싱글턴 `router` 금지).
 *
 * 앱과 같은 `ThemeProvider` 아래에서 그린다(계약 #25). 모듈 상태가 케이스 사이에 새지 않게 매번 새로 import 한다.
 */
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let client;
let paths;
let routes;
let ThemeProvider;

/** jsdom 에는 `EventSource` 가 없다 (authRouting.test.jsx 와 동일한 최소 표면). */
class FakeEventSource {
  constructor(url) {
    this.url = url;
  }
  addEventListener() {}
  removeEventListener() {}
  close() {}
}

const networkError = () => Promise.reject(new TypeError('Failed to fetch'));
const urlOf = (call) => String(call[0]);

/** `/health` 요청만 `health` 로 응답하고, 나머지는 전부 네트워크 에러(서버 꺼짐). */
function stubFetch(health = networkError) {
  global.fetch = vi.fn().mockImplementation((url) =>
    /\/health$/.test(String(url)) ? health() : networkError(),
  );
}

async function renderAt(path) {
  const memRouter = createMemoryRouter(routes, { initialEntries: [path] });
  await act(async () => {
    render(
      <ThemeProvider>
        <RouterProvider router={memRouter} />
      </ThemeProvider>,
    );
  });
  return memRouter;
}

/** `/login` 에서 로그인 요청이 네트워크 에러로 실패 → 안내 경로로 이동한 상태를 만든다. */
async function goDownFromLogin() {
  const memRouter = await renderAt(paths.login);
  await act(async () => {
    await client.login('a@b.c', 'pw').catch(() => {});
  });
  await waitFor(() => expect(memRouter.state.location.pathname).toBe(paths.unavailable));
  return memRouter;
}

beforeEach(async () => {
  vi.resetModules();
  client = await import('api/client');
  paths = (await import('routes/paths')).default;
  routes = (await import('routes/router')).routes;
  ThemeProvider = (await import('theme/theme-provider')).ThemeProvider;
  localStorage.clear();
  vi.stubGlobal('EventSource', FakeEventSource);
  stubFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('서버 다운 → 안내 경로 (Phase 1)', () => {
  it('[F19-06] /login 에서 login() 이 reject 하면 paths.unavailable 로 이동한다', async () => {
    const memRouter = await goDownFromLogin();
    expect(memRouter.state.location.pathname).toBe(paths.unavailable);
  });

  it('[F19-07] 토큰 없이 paths.unavailable 에 직접 들어가도 /login 으로 튕기지 않는다', async () => {
    const memRouter = await renderAt(paths.unavailable);
    expect(memRouter.state.location.pathname).toBe(paths.unavailable);
  });
});

describe('안내 화면 — 다시 시도 (Phase 1)', () => {
  it('[F19-08] [다시 시도] 에 /health 가 200 이면 원래 경로로 돌아간다', async () => {
    const memRouter = await goDownFromLogin();
    stubFetch(() => Promise.resolve(new Response('{"status":"ok"}', { status: 200 })));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /다시 시도/ }));
    });

    await waitFor(() => expect(memRouter.state.location.pathname).toBe(paths.login));
  });

  it('[F19-09] [다시 시도] 에 /health 가 reject 하면 안내 경로에 머문다', async () => {
    const memRouter = await goDownFromLogin();
    stubFetch(networkError);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /다시 시도/ }));
    });
    await waitFor(() => expect(global.fetch.mock.calls.some((c) => /\/health$/.test(urlOf(c)))).toBe(true));

    expect(memRouter.state.location.pathname).toBe(paths.unavailable);
  });

  it('[F19-10] 재시도는 …/api/health 가 아니라 <오리진>/health 를 부른다', async () => {
    await goDownFromLogin();
    stubFetch(() => new Promise(() => {}));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /다시 시도/ }));
    });

    const urls = global.fetch.mock.calls.map(urlOf);
    expect(urls.some((u) => /\/health$/.test(u) && !/\/api\/health$/.test(u))).toBe(true);
  });

  it('[F19-11] 재시도 응답을 기다리는 동안 GlobalDim 이 켜지지 않는다', async () => {
    await goDownFromLogin();
    stubFetch(() => new Promise(() => {})); // 응답이 오지 않는 동안을 본다

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /다시 시도/ }));
    });

    expect(document.querySelector('.global-dim')).toBeNull();
  });
});

describe('안내 화면 — 오프라인 구분 (Phase 1)', () => {
  it('[F19-12] navigator.onLine 이 false 일 때와 true 일 때 안내 문구가 다르다', async () => {
    const onLine = vi.spyOn(window.navigator, 'onLine', 'get');

    onLine.mockReturnValue(true);
    await renderAt(paths.unavailable);
    const serverDownText = document.body.textContent;
    cleanup();

    onLine.mockReturnValue(false);
    await renderAt(paths.unavailable);
    const offlineText = document.body.textContent;

    expect(offlineText).not.toBe(serverDownText);
  });
});
