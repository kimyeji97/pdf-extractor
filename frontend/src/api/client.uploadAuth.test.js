/**
 * REQ-B14 Phase 2 — uploadPdf() 로컬 direct-upload 분기의 Authorization 헤더 누락
 *
 * 검증 계약: docs/plans/PLAN-B14-upload-extract-auth-owner-id.md `## 검증 계약` (B14-12)
 *
 * `uploadPdf()`의 로컬 모드 분기는 `apiFetch`가 아니라 raw `fetch`를 직접 쓴다(계약
 * #26/#31과 같은 "raw fetch 누락" 패턴) — 백엔드가 `POST /api/upload/direct`에 인증을
 * 요구하게 되면(REQ-B14 Phase 1) 이 분기는 토큰이 있어도 401을 받는다.
 *
 * `client.auth.test.js` 선례와 동일하게 `global.fetch`를 모킹해 관찰한다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { uploadPdf } from 'api/client';

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('uploadPdf() 로컬 direct-upload', () => {
  it('[B14-12] access_token이 있으면 Authorization 헤더를 붙여 보낸다', async () => {
    localStorage.setItem('access_token', 'tok123');
    const file = new File([new Uint8Array([1, 2, 3])], 'sample.pdf', { type: 'application/pdf' });

    await uploadPdf('http://localhost:8000/api/upload/direct?key=uploads/j1/original.pdf', file, 'j1');

    const [, opts] = fetch.mock.calls[0];
    expect(opts.headers.Authorization).toBe('Bearer tok123');
  });
});
