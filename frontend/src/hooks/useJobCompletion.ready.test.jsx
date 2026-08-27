/**
 * REQ-B11 — job 완료 훅의 기준선은 기준선 GET 이 돌아온 뒤에 잡는다
 *
 * 검증 계약: docs/plans/PLAN-B11-notification-baseline-before-feed.md `## 검증 계약` (B11-15~16)
 *
 * 지금 화면들은 `jobId` 를 클릭으로만 넣어 이 순서가 실제로 나지 않는다(계획서 § 미결 3). 그래도
 * "생성 중 복원" 류 기능이 들어오면 조용히 깨지는 자리라 규칙을 여기서 고정한다.
 */
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useJobCompletion } from 'hooks/useJobCompletion';

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

beforeEach(() => {
  vi.clearAllMocks();
  stage([], false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useJobCompletion — 기준선 시점 (B11)', () => {
  it('[B11-15] ready=false에 jobId 감시 시작 → ready=true+그 job의 옛 알림 → onDone 0회', () => {
    const onDone = vi.fn();
    const { rerender } = renderHook(() => useJobCompletion('job-a', { onDone }));

    // 기준선 GET 도착 — 지난주 같은 job 의 알림(재감지 이력)이 실려 온다.
    stage([notif('job-a', '2026-08-20T10:00:00+00:00')], true);
    rerender();

    expect(onDone).not.toHaveBeenCalled();
  });

  it('[B11-16] ready 이후 그 job의 신규 알림 → onDone 1회', () => {
    const onDone = vi.fn();
    const { rerender } = renderHook(() => useJobCompletion('job-a', { onDone }));
    stage([notif('job-a', '2026-08-20T10:00:00+00:00')], true);
    rerender();

    stage(
      [notif('job-a', '2026-08-27T10:00:00+00:00'), notif('job-a', '2026-08-20T10:00:00+00:00')],
      true,
    );
    rerender();

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
