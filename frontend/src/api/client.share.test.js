/**
 * REQ-28 Phase 5 — 공유 클라이언트 함수
 *
 * 검증 계약: docs/plans/PLAN-28-analysis-sharing.md `## 검증 계약` (28-36~37)
 * 시그니처는 이 테스트가 고정한다: addShare(jobId, email, role)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { addShare } from 'api/client';

const jsonResponse = (body, { status = 200 } = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('공유 클라이언트', () => {
  it('[28-36] addShare 가 POST /jobs/{id}/shares 에 이메일·역할을 보낸다', async () => {
    fetch.mockResolvedValue(jsonResponse({ user_id: 'u2', email: 'b@x.com', role: 'viewer' }, { status: 201 }));

    await addShare('j1', 'b@x.com', 'viewer');

    const [url, opts] = fetch.mock.calls[0];
    expect([url.endsWith('/jobs/j1/shares'), opts.method, JSON.parse(opts.body)])
      .toEqual([true, 'POST', { email: 'b@x.com', role: 'viewer' }]);
  });

  it('[28-37] 실패하면 서버 문구로 던진다', async () => {
    fetch.mockResolvedValue(jsonResponse({ detail: '가입된 계정이 없는 이메일입니다.' }, { status: 404 }));

    await expect(addShare('j1', 'nobody@x.com', 'editor')).rejects.toThrow('가입된 계정이 없는 이메일입니다.');
  });
});
