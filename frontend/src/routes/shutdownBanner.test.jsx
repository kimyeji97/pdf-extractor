/**
 * REQ-F19 Phase 4 — 꺼짐 예고 배너 · 운영 구간 저장 · 다운 화면 운영 시간
 *
 * 검증 계약: docs/plans/PLAN-F19-server-down-notice.md `## 검증 계약` (F19-29~38)
 *
 * `serverDown.test.jsx` 처럼 실제 `routes` 트리를 그리고 `api/client` 는 mock 하지 않는다.
 * 네트워크는 `global.fetch` 로: `/operating-windows` 만 응답하고 나머지는 **영원히 대기**(reject 하면
 * 서버 다운 감지로 이동해 버린다). 시간은 가짜 타이머로 움직인다 — `waitFor`/`findBy` 는 내부에서
 * setInterval 로 폴링하므로 쓰지 않고 `act` 플러시로 기다린다(계약 #25).
 * 배너는 role="alert". 시각 표기는 Asia/Seoul 기준(계획서 예시 "10월 8일(목) 15:00 ~ 23:00").
 * F19-37 은 운영 구간 저장소 키만 막는다 — 그래서 그 키 이름에 `token`·`mode`·`email` 이 들어가면 안 된다.
 */
import { act, cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let paths;
let routes;
let ThemeProvider;
let ow; // utils/operatingWindows

const WINDOWS = [
  { start: '2026-10-07T15:00:00+09:00', end: '2026-10-07T23:00:00+09:00' },
  { start: '2026-10-08T15:00:00+09:00', end: '2026-10-08T23:00:00+09:00' },
];

class FakeEventSource {
  addEventListener() {}
  removeEventListener() {}
  close() {}
}

const pending = () => new Promise(() => {});
const json = (body) =>
  Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } }));

function stubFetch(windows = () => json(WINDOWS)) {
  global.fetch = vi.fn().mockImplementation((url) => (/\/operating-windows/.test(String(url)) ? windows() : pending()));
}

async function flush() {
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {});
  }
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
  await flush();
  return memRouter;
}

async function advance(ms) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
  await flush();
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  vi.resetModules();
  paths = (await import('routes/paths')).default;
  routes = (await import('routes/router')).routes;
  ThemeProvider = (await import('theme/theme-provider')).ThemeProvider;
  ow = await import('utils/operatingWindows');
  localStorage.clear();
  vi.stubGlobal('EventSource', FakeEventSource);
  stubFetch();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('꺼짐 예고 배너 (Phase 4)', () => {
  it('[F19-29] 꺼짐 30분 전 로그인 화면에 배너가 보인다', async () => {
    vi.setSystemTime(new Date('2026-10-07T22:30:00+09:00'));
    await renderAt(paths.login);
    expect(screen.queryByRole('alert')).not.toBeNull();
  });

  it('[F19-30] 90분 전에 열어 두고 31분이 지나면 배너가 나타난다', async () => {
    vi.setSystemTime(new Date('2026-10-07T21:30:00+09:00'));
    await renderAt(paths.login);
    expect(screen.queryByRole('alert')).toBeNull();

    await advance(31 * 60 * 1000);
    expect(screen.queryByRole('alert')).not.toBeNull();
  });

  it('[F19-31] 60초 뒤 카운트다운 문구가 바뀐다', async () => {
    vi.setSystemTime(new Date('2026-10-07T22:30:00+09:00'));
    await renderAt(paths.login);
    const before = screen.getByRole('alert').textContent;

    await advance(60 * 1000);
    expect(screen.getByRole('alert').textContent).not.toBe(before);
  });

  it('[F19-32] 배너에 진행 중 작업이 끊긴다는 경고가 있다', async () => {
    vi.setSystemTime(new Date('2026-10-07T22:30:00+09:00'));
    await renderAt(paths.login);
    expect(screen.getByRole('alert').textContent).toMatch(/끊/);
  });

  it('[F19-33] 운영 구간 조회가 reject 해도 다운 안내로 가지 않고 배너도 없다', async () => {
    vi.setSystemTime(new Date('2026-10-07T22:30:00+09:00'));
    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')));
    const memRouter = await renderAt(paths.login);
    expect([memRouter.state.location.pathname, screen.queryByRole('alert')]).toEqual([paths.login, null]);
  });

  it('[F19-34] 앱이 받은 운영 구간을 저장한다', async () => {
    vi.setSystemTime(new Date('2026-10-07T12:00:00+09:00'));
    await renderAt(paths.login);
    expect(ow.loadWindows()).toEqual(WINDOWS);
  });
});

describe('다운 안내 화면 — 운영 시간 (Phase 4)', () => {
  it('[F19-35] 저장된 구간이 있으면 "다음 운영: 10월 8일(목) 15:00 ~ 23:00"을 보여 준다', async () => {
    vi.setSystemTime(new Date('2026-10-08T10:00:00+09:00'));
    ow.saveWindows(WINDOWS);
    await renderAt(paths.unavailable);
    expect(document.body.textContent).toContain('다음 운영: 10월 8일(목) 15:00 ~ 23:00');
  });

  it('[F19-36] 저장된 구간이 모두 지났으면 "다음 운영" 줄을 생략한다', async () => {
    vi.setSystemTime(new Date('2026-10-09T10:00:00+09:00'));
    ow.saveWindows(WINDOWS);
    await renderAt(paths.unavailable);
    expect(document.body.textContent).not.toContain('다음 운영');
  });

  it('[F19-37] 저장소 읽기가 throw 해도 [다시 시도]는 뜨고 "다음 운영" 줄만 빠진다', async () => {
    vi.setSystemTime(new Date('2026-10-08T10:00:00+09:00'));
    ow.saveWindows(WINDOWS);
    // 운영 구간 저장소만 막는다 — 인증 토큰·테마 키까지 막으면 앱 셸이 먼저 죽어 이 케이스가 보려는 게 아니게 된다
    const realGetItem = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function getItem(key) {
      if (/token|mode|email/i.test(key)) return realGetItem.call(this, key); // 앱 셸 키(인증·테마·AuthProvider user_email)
      throw new Error('SecurityError');
    });
    await renderAt(paths.unavailable);
    expect([
      screen.queryByRole('button', { name: /다시 시도/ }) !== null,
      document.body.textContent.includes('다음 운영'),
    ]).toEqual([true, false]);
  });

  it('[F19-38] 지금이 운영 구간 안이면 지금 구간(10월 8일(목) 15:00 ~ 23:00)을 보여 준다', async () => {
    vi.setSystemTime(new Date('2026-10-08T16:00:00+09:00'));
    ow.saveWindows(WINDOWS);
    await renderAt(paths.unavailable);
    expect(document.body.textContent).toContain('10월 8일(목) 15:00 ~ 23:00');
  });
});
