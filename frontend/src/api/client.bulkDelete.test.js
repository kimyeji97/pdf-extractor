/**
 * REQ-B26 재작업 — 지연 삭제는 배경 요청
 *
 * 검증 계약: docs/plans/PLAN-B26-delete-undo-restore.md `## 검증 계약` (B26-12)
 *
 * `bulkDeleteQuestions` 의 유일한 호출처는 토스트 뒤·화면 정리·`pagehide` 에 나가는 지연 삭제다 — 사용자가 누르지 않은 순간이라
 * `apiFetch` 의 전역 딤이 켜지면 안 된다(계약 #26). 헤더는 직접(계약 #31), 탭을 닫아도 끝까지 가도록 `keepalive`.
 * `client.notificationAuth.test.js` 처럼 `global.fetch` 를 모킹한다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { bulkDeleteQuestions, setLoadingCallback } from 'api/client';

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
  localStorage.clear();
  localStorage.setItem('access_token', 'tok123');
});

afterEach(() => {
  setLoadingCallback(null);
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('bulkDeleteQuestions 배경 요청 (B26)', () => {
  it('[B26-12] 전역 딤 없이 Authorization 헤더·keepalive 로 보낸다', async () => {
    const loading = vi.fn();
    setLoadingCallback(loading);

    await bulkDeleteQuestions('job-a', 1, [{ num: 1, k: 0 }], []);
    const opts = fetch.mock.calls[0][1];

    expect({
      dimmed: loading.mock.calls.some(([v]) => v === true),
      auth: opts?.headers?.Authorization,
      keepalive: opts?.keepalive,
    }).toEqual({ dimmed: false, auth: 'Bearer tok123', keepalive: true });
  });
});
