/**
 * REQ-C09 Phase 1 — 목록 재조회를 알림 `kind` 로 가려 받는다
 *
 * 검증 계약: docs/plans/PLAN-C09-notification-followups.md `## 검증 계약` (C09-01~04)
 *
 * F09-36~39 가 "신규가 있으면 1회"를 고정했고, 여기서는 **어느 종류의 신규인가**를 더한다 —
 * 분석 목록은 `detection`, 생성 이력은 `export` 만 다시 읽어야 한다. 무대는 F09 와 같다
 * (컨텍스트 mock · 페이지 렌더 없음).
 */
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useNotificationRefresh } from 'hooks/useNotificationRefresh';

import { useNotifications, useNotificationsReady } from 'contexts/NotificationContext';

vi.mock('contexts/NotificationContext', () => ({
  useNotifications: vi.fn(),
  useNotificationsReady: vi.fn(),
}));

const notif = (jobId, createdAt, kind) => ({
  job_id: jobId,
  created_at: createdAt,
  severity: 'success',
  kind,
});

const feedIs = (items) => {
  useNotifications.mockReturnValue({ notifications: items, unreadCount: items.length });
  useNotificationsReady.mockReturnValue(true);
};

beforeEach(() => {
  vi.clearAllMocks();
  feedIs([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useNotificationRefresh — kind 필터', () => {
  it('[C09-01] kind=detection 일 때 export 신규 알림에는 onFresh 가 불리지 않는다', () => {
    const onFresh = vi.fn();
    const { rerender } = renderHook(() => useNotificationRefresh(onFresh, { kind: 'detection' }));

    feedIs([notif('job-a', '2026-08-28T10:00:00+00:00', 'export')]);
    rerender();

    expect(onFresh).not.toHaveBeenCalled();
  });

  it('[C09-02] kind=detection 일 때 detection 신규 알림에는 onFresh 가 1회 불린다', () => {
    const onFresh = vi.fn();
    const { rerender } = renderHook(() => useNotificationRefresh(onFresh, { kind: 'detection' }));

    feedIs([notif('job-a', '2026-08-28T10:00:00+00:00', 'detection')]);
    rerender();

    expect(onFresh).toHaveBeenCalledTimes(1);
  });

  it('[C09-03] kind 를 지정하지 않으면 어느 종류든 onFresh 가 1회 불린다', () => {
    const onFresh = vi.fn();
    const { rerender } = renderHook(() => useNotificationRefresh(onFresh));

    feedIs([notif('job-a', '2026-08-28T10:00:00+00:00', 'export')]);
    rerender();

    expect(onFresh).toHaveBeenCalledTimes(1);
  });

  it('[C09-04] 여러 건 중 일치하는 종류가 1건이라도 있으면 1회, 없으면 0회', () => {
    const onFresh = vi.fn();
    const { rerender } = renderHook(() => useNotificationRefresh(onFresh, { kind: 'export' }));

    // 불일치만 — 0회
    feedIs([
      notif('job-a', '2026-08-28T10:00:00+00:00', 'detection'),
      notif('job-b', '2026-08-28T10:00:01+00:00', 'detection'),
    ]);
    rerender();
    expect(onFresh).not.toHaveBeenCalled();

    // 일치 1건 + 불일치 2건 — 1회
    feedIs([
      notif('job-a', '2026-08-28T10:00:00+00:00', 'detection'),
      notif('job-b', '2026-08-28T10:00:01+00:00', 'detection'),
      notif('job-c', '2026-08-28T10:00:02+00:00', 'export'),
      notif('job-d', '2026-08-28T10:00:03+00:00', 'detection'),
    ]);
    rerender();
    expect(onFresh).toHaveBeenCalledTimes(1);
  });
});
