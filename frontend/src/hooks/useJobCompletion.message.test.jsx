/**
 * REQ-C09 Phase 1 — 실패 문구의 단일 출처는 서버 알림 `message` 다
 *
 * 검증 계약: docs/plans/PLAN-C09-notification-followups.md `## 검증 계약` (C09-05)
 *
 * 화면(work.jsx·editor)이 `n.message` 를 그대로 그리는지는 **육안** 항목이다(페이지 렌더 무대를
 * 만들지 않는다 — F09 Phase 3 과 같은 이유). 여기서는 그 전제, 즉 훅이 `onError` 에 알림 객체를
 * 손대지 않고 넘기는지만 잰다. 훅이 `message` 를 떨어뜨리면 화면이 아무리 맞게 그려도 문구가 사라진다.
 */
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useJobCompletion } from 'hooks/useJobCompletion';

import { useNotifications, useNotificationsReady } from 'contexts/NotificationContext';

vi.mock('contexts/NotificationContext', () => ({
  useNotifications: vi.fn(),
  useNotificationsReady: vi.fn(),
}));

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

describe('useJobCompletion — onError 인자', () => {
  it('[C09-05] onError 에 알림 객체(message 포함)가 그대로 넘어온다', () => {
    const onError = vi.fn();
    const { rerender } = renderHook(() => useJobCompletion('job-a', { onDone: vi.fn(), onError }));

    const failed = {
      job_id: 'job-a',
      created_at: '2026-08-28T10:00:00+00:00',
      severity: 'error',
      kind: 'detection',
      title: 'sample.pdf',
      message: '문항 감지에 실패했습니다.',
    };
    feedIs([failed]);
    rerender();

    expect(onError).toHaveBeenCalledWith(failed);
  });
});
