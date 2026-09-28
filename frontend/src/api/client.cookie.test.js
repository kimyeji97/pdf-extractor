/**
 * REQ-B15 Phase 2 — login·refresh·logout fetch의 `credentials: 'include'` + 서버 로그아웃 호출
 *
 * 검증 계약: docs/plans/PLAN-B15-image-auth-cookie.md `## 검증 계약` (B15-17 ~ B15-20)
 *
 * 교차 출처 fetch에서 `credentials: 'include'`가 빠지면 응답의 `Set-Cookie`가 **에러 없이 무시된다**
 * (계획서 § 제약·함정) — 응답은 200이고 이미지만 계속 401이다. 그래서 옵션 자체를 단언한다.
 *
 * 무대는 `client.auth.test.js`(REQ-27 Phase 4)와 같다 — `global.fetch`를 진짜 `Response`로 모킹하고,
 * export되지 않는 refresh 경로는 `listJobs()`의 401 재시도로 관찰한다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { listJobs, login, logout } from 'api/client';

const jsonResponse = (body, { status = 200 } = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const callTo = (path) => fetch.mock.calls.find(([url]) => String(url).includes(path));

beforeEach(() => {
  global.fetch = vi.fn();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('login()', () => {
  it('[B15-17] /auth/login fetch가 credentials: include로 나간다', async () => {
    fetch.mockResolvedValue(jsonResponse({ access_token: 'acc1', refresh_token: 'ref1', token_type: 'bearer' }));

    await login('a@b.com', 'pw1234');

    const [, opts] = callTo('/auth/login');
    expect(opts.credentials).toBe('include');
  });
});

describe('refresh (경유: listJobs 401 재시도)', () => {
  it('[B15-18] /auth/refresh fetch가 credentials: include로 나간다', async () => {
    localStorage.setItem('access_token', 'expired');
    localStorage.setItem('refresh_token', 'validRefresh');
    fetch
      .mockResolvedValueOnce(jsonResponse({ detail: '유효하지 않은 토큰입니다.' }, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ access_token: 'newAccess', refresh_token: 'newRefresh' }))
      .mockResolvedValueOnce(jsonResponse({ items: [], total: 0, skip: 0, limit: 20 }));

    await listJobs();

    const [, opts] = callTo('/auth/refresh');
    expect(opts.credentials).toBe('include');
  });
});

describe('logout()', () => {
  it('[B15-19] POST /api/auth/logout을 부른다', async () => {
    fetch.mockResolvedValue(new Response(null, { status: 204 }));

    await logout();

    const call = callTo('/auth/logout');
    expect(call?.[1]?.method).toBe('POST');
  });

  it('[B15-20] /auth/logout fetch가 credentials: include로 나간다', async () => {
    fetch.mockResolvedValue(new Response(null, { status: 204 }));

    await logout();

    const [, opts] = callTo('/auth/logout');
    expect(opts.credentials).toBe('include');
  });
});
