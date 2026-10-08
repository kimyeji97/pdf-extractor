/**
 * REQ-C12 Phase 2 — 차단된 계정 감지 (client)
 *
 * 검증 계약: docs/plans/PLAN-C12-ops-console-accounts-server.md `## 검증 계약` (C12-15)
 *
 * 차단은 즉시다 — 이미 로그인한 세션의 요청도 403 "이용이 제한된 계정"을 받는다. client 는 토큰을 지우고
 * `setBlockedCallback` 구독자에게 알린다(F19 `setServerDownCallback` 과 같은 모양). 로그인 화면으로 보내는 건 App 몫.
 *
 * 모듈 상태가 케이스 사이에 새지 않게 매번 새로 import 한다(client.serverDown.test.js 관례).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let client;
let onBlocked;

const blockedResponse = () =>
  Promise.resolve(new Response(JSON.stringify({ detail: '이용이 제한된 계정입니다. 관리자에게 문의해 주세요.' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  }));

beforeEach(async () => {
  vi.resetModules();
  client = await import('api/client');
  localStorage.setItem('access_token', 'acc');
  localStorage.setItem('refresh_token', 'ref');
  global.fetch = vi.fn().mockImplementation(blockedResponse);
  onBlocked = vi.fn();
  client.setBlockedCallback(onBlocked);
});

afterEach(() => {
  client.setBlockedCallback(null);
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('차단된 계정 감지', () => {
  it('[C12-15] 403 "이용이 제한된 계정"이면 토큰을 지우고 차단 콜백을 부른다', async () => {
    await client.getStats().catch(() => {});

    expect([
      localStorage.getItem('access_token'),
      localStorage.getItem('refresh_token'),
      onBlocked.mock.calls.length > 0,
    ]).toEqual([null, null, true]);
  });
});
