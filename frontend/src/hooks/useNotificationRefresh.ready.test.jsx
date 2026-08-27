/**
 * REQ-B11 — 목록 재조회 훅의 기준선은 기준선 GET 이 돌아온 뒤에 잡는다
 *
 * 검증 계약: docs/plans/PLAN-B11-notification-baseline-before-feed.md `## 검증 계약` (B11-13~14)
 *
 * 빈 기준선이면 새로고침마다 목록 API 가 **한 번 더** 돈다 — F09-37 이 겨냥한 사고의 마운트 순서 변종.
 */
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useNotificationRefresh } from 'hooks/useNotificationRefresh';

import { useNotifications, useNotificationsReady } from 'contexts/NotificationContext';

vi.mock('contexts/NotificationContext', () => ({
  useNotifications: vi.fn(),
  useNotificationsReady: vi.fn(),
}));

const notif = (jobId, createdAt) => ({ job_id: jobId, created_at: createdAt, severity: 'success' });

const stage = (items, ready) => {
  useNotifications.mockReturnValue({ notifications: items, unreadCount: items.length });
  useNotificationsReady.mockReturnValue(ready);
};

const OLD_FEED = [
  notif('job-old-1', '2026-08-20T10:00:00+00:00'),
  notif('job-old-2', '2026-08-21T10:00:00+00:00'),
];

beforeEach(() => {
  vi.clearAllMocks();
  stage([], false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useNotificationRefresh — 기준선 시점 (B11)', () => {
  it('[B11-13] ready=false 마운트 → ready=true+옛 알림 → onFresh 0회', () => {
    const onFresh = vi.fn();
    const { rerender } = renderHook(() => useNotificationRefresh(onFresh));

    stage(OLD_FEED, true);
    rerender();

    expect(onFresh).not.toHaveBeenCalled();
  });

  it('[B11-14] ready 이후 신규 알림 → onFresh 1회', () => {
    const onFresh = vi.fn();
    const { rerender } = renderHook(() => useNotificationRefresh(onFresh));
    stage(OLD_FEED, true);
    rerender();

    stage([notif('job-new', '2026-08-27T10:00:00+00:00'), ...OLD_FEED], true);
    rerender();

    expect(onFresh).toHaveBeenCalledTimes(1);
  });
});
