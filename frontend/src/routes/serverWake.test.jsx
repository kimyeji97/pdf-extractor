/**
 * REQ-E03 Phase 4 — 다운 안내 화면의 [서버 켜기] (웨이커 호출 → /health 대기 → 원래 경로)
 *
 * 검증 계약: docs/plans/PLAN-E03-prod-idle-scale-to-zero.md `## 검증 계약` (E03-24 ~ E03-35)
 *
 * `serverDown.test.jsx`(F19)와 같은 무대다 — 실제 `routes` 트리를 `createMemoryRouter` 로 그리고 `api/client` 는
 * mock 하지 않는다. 네트워크는 `global.fetch` 로 막는다.
 * - `VITE_WAKE_URL` 은 모듈 로드 때 읽으므로 `vi.stubEnv` 뒤 모듈을 새로 import 한다.
 * - 폴링(3초 간격, 2분까지)은 가짜 타이머로 본다. 타이머를 가짜로 둔 구간에서는 `waitFor` 를 쓰지 않는다 —
 *   `waitFor` 도 내부에서 타이머로 폴링한다(계약 #25). 안내 경로까지는 진짜 타이머로 간다.
 *
 * 앱과 같은 `ThemeProvider` 아래에서 그린다(계약 #25).
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const WAKE = 'https://waker.example.test/';

let client;
let paths;
let routes;
let ThemeProvider;

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
const isWake = (url) => String(url) === WAKE;
const isHealth = (url) => /\/health$/.test(String(url));
const json = (status, body) => () => Promise.resolve(new Response(JSON.stringify(body), { status }));

/** 웨이커·`/health` 만 지정한 대로 응답하고 나머지는 네트워크 에러(서버 꺼짐). */
function stubFetch({ wake = networkError, health = networkError } = {}) {
  global.fetch = vi.fn().mockImplementation((url) => {
    if (isWake(url)) return wake();
    if (isHealth(url)) return health();
    return networkError();
  });
}

const healthCalls = () => global.fetch.mock.calls.filter((c) => isHealth(urlOf(c))).length;

async function load(wakeUrl) {
  vi.resetModules();
  vi.stubEnv('VITE_WAKE_URL', wakeUrl);
  client = await import('api/client');
  paths = (await import('routes/paths')).default;
  routes = (await import('routes/router')).routes;
  ThemeProvider = (await import('theme/theme-provider')).ThemeProvider;
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

/** `/login` 에서 로그인 요청이 네트워크 에러로 실패 → 안내 경로(복귀할 곳 = /login). */
async function goDownFromLogin() {
  const memRouter = await renderAt(paths.login);
  await act(async () => {
    await client.login('a@b.c', 'pw').catch(() => {});
  });
  await waitFor(() => expect(memRouter.state.location.pathname).toBe(paths.unavailable));
  return memRouter;
}

/** 안내 경로에서 가짜 타이머로 바꾸고 [서버 켜기]를 누른다. */
async function clickWake() {
  vi.useFakeTimers();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /서버 켜기/ }));
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

const advance = (ms) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

beforeEach(async () => {
  localStorage.clear();
  vi.stubGlobal('EventSource', FakeEventSource);
  await load(WAKE);
  stubFetch();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('[서버 켜기] 노출', () => {
  it('[E03-24] VITE_WAKE_URL 이 있으면 [서버 켜기] 가 보인다', async () => {
    await renderAt(paths.unavailable);
    expect(screen.queryByRole('button', { name: /서버 켜기/ })).not.toBeNull();
  });

  it('[E03-25] VITE_WAKE_URL 이 비면 [서버 켜기] 가 없다', async () => {
    await load('');
    await renderAt(paths.unavailable);
    expect(screen.queryByRole('button', { name: /서버 켜기/ })).toBeNull();
  });

  it('[E03-26] 오프라인이면 [서버 켜기] 가 없다', async () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    await renderAt(paths.unavailable);
    expect(screen.queryByRole('button', { name: /서버 켜기/ })).toBeNull();
  });

  it('[E03-35] [서버 켜기] 가 있어도 [다시 시도] 가 남는다', async () => {
    await renderAt(paths.unavailable);
    expect(screen.queryByRole('button', { name: /다시 시도/ })).not.toBeNull();
  });
});

describe('[서버 켜기] 동작', () => {
  it('[E03-27] [서버 켜기] 를 누르면 VITE_WAKE_URL 로 POST 한다', async () => {
    await goDownFromLogin();
    stubFetch({ wake: () => new Promise(() => {}) });
    await clickWake();

    const call = global.fetch.mock.calls.find((c) => isWake(urlOf(c)));
    expect(call?.[1]?.method).toBe('POST');
  });

  it('[E03-28] 웨이커가 202 면 "켜는 중" 을 보여 준다', async () => {
    await goDownFromLogin();
    stubFetch({ wake: json(202, { status: 'starting' }) });
    await clickWake();

    expect(document.body.textContent).toContain('켜는 중');
  });

  it('[E03-29] 대기 중 /health 가 200 이면 원래 경로로 돌아간다', async () => {
    const memRouter = await goDownFromLogin();
    stubFetch({ wake: json(202, { status: 'starting' }), health: json(200, { status: 'ok' }) });
    await clickWake();
    await advance(3000);

    expect(memRouter.state.location.pathname).toBe(paths.login);
  });

  it('[E03-30] /health 는 3초마다 한 번씩 확인한다', async () => {
    await goDownFromLogin();
    stubFetch({ wake: json(202, { status: 'starting' }) });
    await clickWake();
    const n0 = healthCalls();
    await advance(3000);
    const n1 = healthCalls();
    await advance(3000);

    expect([n1 - n0, healthCalls() - n1]).toEqual([1, 1]);
  });

  it('[E03-31] 2분 동안 안 뜨면 "아직 켜지지 않았습니다" 를 보여 준다', async () => {
    await goDownFromLogin();
    stubFetch({ wake: json(202, { status: 'starting' }) });
    await clickWake();
    await advance(120000);

    expect(document.body.textContent).toContain('아직 켜지지 않았습니다');
  });

  it('[E03-32] 2분이 지나면 [서버 켜기] 를 다시 누를 수 있다', async () => {
    await goDownFromLogin();
    stubFetch({ wake: json(202, { status: 'starting' }) });
    await clickWake();
    await advance(120000);

    expect(screen.getByRole('button', { name: /서버 켜기/ }).disabled).toBe(false);
  });

  it('[E03-33] 웨이커가 403 이면 운영 시간 안내를 보여 준다', async () => {
    await goDownFromLogin();
    stubFetch({ wake: json(403, { status: 'closed' }) });
    await clickWake();

    // role=alert 는 꺼짐 예고 배너(F19)도 쓴다 — 하나라도 안내를 담고 있으면 된다
    expect(screen.queryAllByRole('alert').some((el) => el.textContent.includes('운영 시간'))).toBe(true);
  });

  it('[E03-34] 웨이커 응답을 기다리는 동안 GlobalDim 이 켜지지 않는다', async () => {
    await goDownFromLogin();
    stubFetch({ wake: () => new Promise(() => {}) });
    await clickWake();

    expect(document.querySelector('.global-dim')).toBeNull();
  });
});
