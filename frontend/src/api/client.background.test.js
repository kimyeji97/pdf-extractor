/**
 * REQ-F14 Phase 1 — 배경 재조회는 전역 딤을 켜지 않는다
 *
 * 검증 계약: docs/plans/PLAN-F14-stats-board-and-badges.md `## 검증 계약` (F14-09~11)
 *
 * `getStats`·`listJobs`는 `apiFetch`라 부를 때마다 `setLoadingCallback`(GlobalDim)을 켠다. 알림·`status` 이벤트로
 * 다시 읽을 때마다 화면이 번쩍이면 안 된다(계약 #26) — `{ background: true }`면 켜지 않는다.
 * 옵션 없는 호출(사용자가 누른 조회)은 그대로 켠다. 인증 헤더 누락은 B23-03 스캔이 지킨다(계약 #31).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getStats, listJobs, setLoadingCallback } from 'api/client';

const jsonResponse = (body) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

let onLoading;

beforeEach(() => {
  global.fetch = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ items: [], total: 0 })));
  localStorage.setItem('access_token', 'tok-1');
  onLoading = vi.fn();
  setLoadingCallback(onLoading);
});

afterEach(() => {
  vi.restoreAllMocks();
  setLoadingCallback(null);
  localStorage.clear();
});

describe('배경 재조회', () => {
  it('[F14-09] getStats({ background: true }) 는 로딩 콜백을 켜지 않는다', async () => {
    await getStats({ background: true });
    expect(onLoading).not.toHaveBeenCalledWith(true);
  });

  it('[F14-10] listJobs({ background: true }) 는 로딩 콜백을 켜지 않는다', async () => {
    await listJobs({ skip: 0, limit: 20, background: true });
    expect(onLoading).not.toHaveBeenCalledWith(true);
  });

  it('[F14-11] getStats() 옵션 없는 호출은 지금처럼 로딩 콜백을 켠다', async () => {
    await getStats();
    expect(onLoading).toHaveBeenCalledWith(true);
  });
});
