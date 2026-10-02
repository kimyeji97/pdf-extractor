/**
 * REQ-B27 Phase 2 — 알림 API raw fetch 인증 · 단건 읽음 본문
 *
 * 검증 계약: docs/plans/PLAN-B27-notification-per-user.md `## 검증 계약` (B27-16·17·30·32·33)
 *
 * 알림 GET·읽음은 계약 #26 의 raw fetch 다(전역 딤 없음). 백엔드가 인증을 요구하게 됐으므로(B27 Phase 1)
 * `_authHeaders()` 를 직접 붙여야 한다(계약 #31). `client.uploadAuth.test.js` 처럼 `global.fetch` 를 모킹해 본다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { listNotifications, markNotificationsRead, refreshAccessToken, setLoadingCallback } from 'api/client';

const ok = (body) => new Response(JSON.stringify(body), { status: 200 });

beforeEach(() => {
  global.fetch = vi.fn().mockImplementation(() => Promise.resolve(ok({ notifications: [], unread_count: 0 })));
  localStorage.clear();
  localStorage.setItem('access_token', 'tok123');
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('알림 API 인증 (B27)', () => {
  it('[B27-16] listNotifications 와 markNotificationsRead 가 Authorization 헤더를 붙인다', async () => {
    await listNotifications();
    await markNotificationsRead();

    const auths = fetch.mock.calls.map(([, opts]) => opts?.headers?.Authorization);
    expect(auths).toEqual(['Bearer tok123', 'Bearer tok123']);
  });

  it('[B27-17] ids 를 주면 본문 {"ids":[...]}, 안 주면 본문 없이 보낸다', async () => {
    await markNotificationsRead(['2026-10-02T00:00:00+00:00']);
    await markNotificationsRead();

    const bodies = fetch.mock.calls.map(([, opts]) => opts?.body ?? null);
    expect(bodies.map((b) => (b ? JSON.parse(b) : null))).toEqual([{ ids: ['2026-10-02T00:00:00+00:00'] }, null]);
  });

  it('[B27-30] 401이면 토큰을 1회 갱신하고 새 토큰으로 다시 요청한다(전역 딤 없음)', async () => {
    localStorage.setItem('refresh_token', 'ref123');
    const loading = vi.fn();
    setLoadingCallback(loading);
    fetch.mockImplementation((url) => {
      if (String(url).endsWith('/auth/refresh')) {
        return Promise.resolve(ok({ access_token: 'tok456', refresh_token: 'ref456' }));
      }
      const auth = fetch.mock.calls.at(-1)[1]?.headers?.Authorization;
      return Promise.resolve(
        auth === 'Bearer tok456'
          ? ok({ notifications: [], unread_count: 3 })
          : new Response('{}', { status: 401 }),
      );
    });

    const data = await listNotifications();
    setLoadingCallback(null);

    expect({ unread: data.unread_count, dimmed: loading.mock.calls.some(([v]) => v === true) })
      .toEqual({ unread: 3, dimmed: false });
  });

  it('[B27-32] 갱신 응답이 5xx면 false 를 돌려주고 저장된 토큰을 지우지 않는다', async () => {
    localStorage.setItem('refresh_token', 'ref123');
    fetch.mockImplementation(() => Promise.resolve(new Response('', { status: 503 })));

    const ok = await refreshAccessToken();

    expect({ ok, access: localStorage.getItem('access_token'), refresh: localStorage.getItem('refresh_token') })
      .toEqual({ ok: false, access: 'tok123', refresh: 'ref123' });
  });

  it('[B27-33] 갱신이 네트워크 에러면 false 를 돌려주고 저장된 토큰을 지우지 않는다', async () => {
    localStorage.setItem('refresh_token', 'ref123');
    fetch.mockImplementation(() => Promise.reject(new TypeError('Failed to fetch')));

    const ok = await refreshAccessToken();

    expect({ ok, access: localStorage.getItem('access_token'), refresh: localStorage.getItem('refresh_token') })
      .toEqual({ ok: false, access: 'tok123', refresh: 'ref123' });
  });
});
