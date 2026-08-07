/**
 * REQ-F09 Phase 4 — 목록 화면 자동 반영
 *
 * 검증 계약: docs/plans/PLAN-F09-completion-notification.md `## 검증 계약` (F09-36~39)
 *
 * 이 Phase 의 진짜 위험은 "안 되는 것"이 아니라 **너무 자주 되는 것**이다 — 재조회를
 * 폴링처럼 만들면 5초마다 목록 API(페이지네이션 + 썸네일)가 돈다. 기능은 멀쩡해 보이고
 * REQ-P03 에서 겪은 병목과 같은 계열이라 F09-38·39 가 그걸 겨냥한다.
 *
 * Phase 3 와 같은 이유로 목록 페이지를 통째로 렌더하지 않는다(BookCard·StatCards·
 * usePaginatedList 까지 따라온다). 전역 피드는 mock 으로 주입한다.
 */
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useNotificationRefresh } from 'hooks/useNotificationRefresh';

import { useNotifications } from 'contexts/NotificationContext';

vi.mock('contexts/NotificationContext', () => ({
  useNotifications: vi.fn(),
}));

const notif = (jobId, createdAt, severity = 'success') => ({
  job_id: jobId,
  created_at: createdAt,
  severity,
});

const feedIs = (items) => {
  useNotifications.mockReturnValue({ notifications: items, unreadCount: items.length });
};

beforeEach(() => {
  vi.clearAllMocks();
  feedIs([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useNotificationRefresh', () => {
  it('[F09-36] 새 알림이 도착하면 onFresh가 불린다', () => {
    const onFresh = vi.fn();
    const { rerender } = renderHook(() => useNotificationRefresh(onFresh));

    feedIs([notif('job-a', '2026-08-07T10:00:00+00:00')]);
    rerender();

    expect(onFresh).toHaveBeenCalledTimes(1);
  });

  it('[F09-37] 구독 이전에 이미 있던 알림에는 반응하지 않는다', () => {
    // 목록 화면은 마운트 때 이미 자기 목록을 읽는다. 기준선이 없으면 그 직후
    // 옛 알림을 보고 **매 페이지 진입마다 한 번 더** 읽는다.
    feedIs([notif('job-a', '2026-07-20T10:00:00+00:00')]);

    const onFresh = vi.fn();
    renderHook(() => useNotificationRefresh(onFresh));

    expect(onFresh).not.toHaveBeenCalled();
  });

  it('[F09-38] 신규 알림이 없으면 onFresh가 불리지 않는다', () => {
    const onFresh = vi.fn();
    const { rerender } = renderHook(() => useNotificationRefresh(onFresh));

    // 폴링은 5초마다 돌지만 응답이 비어 있으면 목록을 다시 읽을 이유가 없다.
    rerender();
    rerender();

    expect(onFresh).not.toHaveBeenCalled();
  });

  it('[F09-39] 한 번에 여러 알림이 와도 재조회는 1회', () => {
    const onFresh = vi.fn();
    const { rerender } = renderHook(() => useNotificationRefresh(onFresh));

    feedIs([
      notif('job-a', '2026-08-07T10:00:00+00:00'),
      notif('job-b', '2026-08-07T10:00:01+00:00'),
      notif('job-c', '2026-08-07T10:00:02+00:00'),
    ]);
    rerender();

    expect(onFresh).toHaveBeenCalledTimes(1);
  });
});
