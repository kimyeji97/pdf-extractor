/**
 * REQ-27 Phase 4 — signup/login 클라이언트 함수 + apiFetch 토큰 부착·401 재시도
 *
 * 검증 계약: docs/plans/PLAN-27-login-registration.md `## 검증 계약` (27-48~27-55)
 *
 * `apiFetch`는 export되지 않는 내부 헬퍼라 `client.template.test.js` 선례처럼 `global.fetch`를
 * 모킹해 기존 export 함수(`signup`·`login`·`listJobs`)를 통해 관찰한다. `listJobs()`를
 * 401 재시도 케이스의 대리로 쓰는 이유는 GET이고 인자 없이 바로 부를 수 있어서다.
 *
 * `apiFetch`의 GET 경로는 응답에 `.clone()`을 호출한다(REQ-P02-03 dedup) — 그래서 진짜
 * `Response` 객체로 모킹해야 한다(`client.template.test.js`와 동일한 이유).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { signup, login, listJobs } from 'api/client';

const jsonResponse = (body, { status = 200 } = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  global.fetch = vi.fn();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('signup()', () => {
  it('[27-48] POST /api/auth/signup에 email·password를 JSON body로 보낸다', async () => {
    fetch.mockResolvedValue(jsonResponse({ user_id: 'u1', email: 'a@b.com', role: 'user' }, { status: 201 }));

    await signup('a@b.com', 'pw1234');

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain('/auth/signup');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ email: 'a@b.com', password: 'pw1234' });
  });

  it('[27-49] 409 응답의 detail로 Error를 던진다', async () => {
    fetch.mockResolvedValue(jsonResponse({ detail: '이미 가입된 이메일입니다.' }, { status: 409 }));

    await expect(signup('a@b.com', 'pw1234')).rejects.toThrow('이미 가입된 이메일입니다.');
  });
});

describe('login()', () => {
  it('[27-50] POST /api/auth/login 성공 시 access_token·refresh_token을 localStorage에 저장한다', async () => {
    fetch.mockResolvedValue(jsonResponse({ access_token: 'acc1', refresh_token: 'ref1', token_type: 'bearer' }));

    await login('a@b.com', 'pw1234');

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain('/auth/login');
    expect(JSON.parse(opts.body)).toEqual({ email: 'a@b.com', password: 'pw1234' });
    expect(localStorage.getItem('access_token')).toBe('acc1');
    expect(localStorage.getItem('refresh_token')).toBe('ref1');
  });

  it('[27-51] 401 응답의 detail로 Error를 던진다', async () => {
    fetch.mockResolvedValue(jsonResponse({ detail: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 }));

    await expect(login('a@b.com', 'wrong')).rejects.toThrow('이메일 또는 비밀번호가 올바르지 않습니다.');
  });
});

describe('apiFetch 토큰 부착 (경유: listJobs)', () => {
  it('[27-52] access_token이 있으면 Authorization: Bearer <token> 헤더가 붙는다', async () => {
    localStorage.setItem('access_token', 'tok123');
    fetch.mockResolvedValue(jsonResponse({ items: [], total: 0, skip: 0, limit: 20 }));

    await listJobs();

    const [, opts] = fetch.mock.calls[0];
    expect(opts.headers.Authorization).toBe('Bearer tok123');
  });

  it('[27-53] access_token이 없으면 Authorization 헤더를 붙이지 않는다', async () => {
    fetch.mockResolvedValue(jsonResponse({ items: [], total: 0, skip: 0, limit: 20 }));

    await listJobs();

    const [, opts] = fetch.mock.calls[0];
    expect(opts?.headers?.Authorization).toBeUndefined();
  });
});

describe('apiFetch 401 재시도 (경유: listJobs)', () => {
  it('[27-54] 401을 받으면 refresh를 1회 호출해 새 access_token으로 원 요청을 재시도한다', async () => {
    localStorage.setItem('access_token', 'expired');
    localStorage.setItem('refresh_token', 'validRefresh');
    fetch
      .mockResolvedValueOnce(jsonResponse({ detail: '유효하지 않은 토큰입니다.' }, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ access_token: 'newAccess', refresh_token: 'newRefresh' }))
      .mockResolvedValueOnce(jsonResponse({ items: [], total: 0, skip: 0, limit: 20 }));

    const result = await listJobs();

    expect(fetch).toHaveBeenCalledTimes(3);
    const [refreshUrl, refreshOpts] = fetch.mock.calls[1];
    expect(refreshUrl).toContain('/auth/refresh');
    expect(JSON.parse(refreshOpts.body)).toEqual({ refresh_token: 'validRefresh' });
    const [, retryOpts] = fetch.mock.calls[2];
    expect(retryOpts.headers.Authorization).toBe('Bearer newAccess');
    expect(result).toEqual({ items: [], total: 0, skip: 0, limit: 20 });
    expect(localStorage.getItem('access_token')).toBe('newAccess');
  });

  it('[27-55] refresh 자체가 401이면 재시도하지 않고 저장된 토큰을 지운다', async () => {
    localStorage.setItem('access_token', 'expired');
    localStorage.setItem('refresh_token', 'alsoExpired');
    fetch
      .mockResolvedValueOnce(jsonResponse({ detail: '유효하지 않은 토큰입니다.' }, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ detail: '유효하지 않은 refresh 토큰입니다.' }, { status: 401 }));

    await expect(listJobs()).rejects.toThrow();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});
