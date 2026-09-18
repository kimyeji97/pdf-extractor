/**
 * REQ-27 Phase 4 — 라우트 상수 + 미인증 리다이렉트
 *
 * 검증 계약: docs/plans/PLAN-27-login-registration.md `## 검증 계약` (27-46·27-47)
 *
 * 27-47은 `routes/router`가 내보내는 **실제 `routes` 트리**를 `RouterProvider`로 그려
 * 진짜 배선을 본다 — `auth-layout`이 "존재하는 줄 알았는데 실은 주석 한 줄뿐이었다"는
 * 이번 Phase 착수 계기(계획서 § 배경 정정)와 같은 실수를, `RequireAuth`를 만들어만 놓고
 * 라우터에 실제로 안 물리는 경우까지 잡기 위해서다. `RequireAuth` 자체의 동작(인증/미인증
 * 분기)은 `components/RequireAuth.test.jsx`가 격리해서 본다 — 여기는 배선만 본다.
 *
 * `routes`는 최상위 `element: <App/>` 를 포함하므로 `NotificationProvider`가 함께 뜬다
 * (App.tsx가 감싼다). `NotificationContext.test.jsx`와 같은 모킹(FakeEventSource +
 * `api/client` 최소 표면)이 그래서 필요하다 — 이 파일이 보려는 것과 무관하지만 렌더
 * 자체가 요구하는 전제다.
 */
import { act, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import paths from 'routes/paths';
import { routes } from 'routes/router';

import * as client from 'api/client';

vi.mock('api/client', () => ({
  listNotifications: vi.fn(),
  markNotificationsRead: vi.fn(),
  getStatus: vi.fn(),
  getJobInfo: vi.fn(),
  listJobs: vi.fn(),
}));

const feed = (items) => ({ notifications: items, unread_count: items.length });

/** jsdom 에는 `EventSource` 가 없다 (NotificationContext.test.jsx와 동일한 최소 표면). */
class FakeEventSource {
  constructor(url) {
    this.url = url;
  }
  addEventListener() {}
  removeEventListener() {}
  close() {}
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.stubGlobal('EventSource', FakeEventSource);
  client.listNotifications.mockResolvedValue(feed([]));
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('라우트 상수 (Phase 4)', () => {
  it('[27-46] paths.login이 /login, paths.signup이 /signup이다', () => {
    expect(paths.login).toBe('/login');
    expect(paths.signup).toBe('/signup');
  });
});

describe('미인증 리다이렉트 (Phase 4)', () => {
  it('[27-47] 토큰 없이 /로 진입하면 최종 위치가 /login이 된다', async () => {
    // access_token 없음 — beforeEach의 localStorage.clear()가 보장한다.
    let memRouter;
    await act(async () => {
      memRouter = createMemoryRouter(routes, { initialEntries: ['/'] });
      render(<RouterProvider router={memRouter} />);
    });

    await waitFor(() => expect(memRouter.state.location.pathname).toBe('/login'));
  });
});
