/**
 * REQ-B11 — 스낵바 기준선은 기준선 GET 이 돌아온 뒤에 잡는다
 *
 * 검증 계약: docs/plans/PLAN-B11-notification-baseline-before-feed.md `## 검증 계약` (B11-10~12)
 *
 * F09-45 는 "데이터가 있는 마운트"만 봤다. 실제 앱은 **빈 목록으로 마운트**되고 GET 이 나중에
 * 돌아온다 — 그 순서를 여기서 재현한다. 전역 피드는 F09 테스트와 같이 mock 으로 주입하되
 * `useNotificationsReady` 를 함께 흉내 낸다.
 */
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NotificationSnackbar from 'components/NotificationSnackbar';

import { useNotifications, useNotificationsReady } from 'contexts/NotificationContext';

vi.mock('contexts/NotificationContext', () => ({
  useNotifications: vi.fn(),
  useNotificationsReady: vi.fn(),
}));

const notif = (jobId, createdAt, title = '문제집 생성 완료') => ({
  job_id: jobId,
  created_at: createdAt,
  severity: 'success',
  title,
});

const stage = (items, ready) => {
  useNotifications.mockReturnValue({ notifications: items, unreadCount: items.length });
  useNotificationsReady.mockReturnValue(ready);
};

const OLD_FEED = Array.from({ length: 50 }, (_, i) =>
  notif(`job-old-${i}`, `2026-08-${String(1 + (i % 26)).padStart(2, '0')}T10:00:00+00:00`),
);

beforeEach(() => {
  vi.clearAllMocks();
  stage([], false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('NotificationSnackbar — 기준선 시점 (B11)', () => {
  it('[B11-10] ready=false·빈 피드로 마운트 → ready=true+옛 알림 도착 → 토스트 0건', () => {
    const { rerender } = render(<NotificationSnackbar />);

    stage(OLD_FEED, true); // 기준선 GET 도착
    rerender(<NotificationSnackbar />);

    expect(screen.queryByText('문제집 생성 완료')).not.toBeInTheDocument();
  });

  it('[B11-11] ready 이후 도착한 신규 알림은 토스트가 뜬다', () => {
    const { rerender } = render(<NotificationSnackbar />);
    stage(OLD_FEED, true);
    rerender(<NotificationSnackbar />);

    stage([notif('job-new', '2026-08-27T10:00:00+00:00', '방금 끝난 문제집'), ...OLD_FEED], true);
    rerender(<NotificationSnackbar />);

    expect(screen.getByText('방금 끝난 문제집')).toBeInTheDocument();
  });

  it('[B11-12] ready 이후 여러 건이 한꺼번에 오면 최신 1건 토스트', () => {
    const { rerender } = render(<NotificationSnackbar />);
    stage(OLD_FEED, true);
    rerender(<NotificationSnackbar />);

    // 재연결 복구분: 끊긴 사이 끝난 작업 3건이 한 번에 들어온다 — 기준선이 아니라 신규다.
    stage(
      [
        notif('job-r3', '2026-08-27T10:03:00+00:00', '복구 3'),
        notif('job-r2', '2026-08-27T10:02:00+00:00', '복구 2'),
        notif('job-r1', '2026-08-27T10:01:00+00:00', '복구 1'),
        ...OLD_FEED,
      ],
      true,
    );
    rerender(<NotificationSnackbar />);

    expect(screen.getByText('복구 3')).toBeInTheDocument();
    expect(screen.queryByText('복구 1')).not.toBeInTheDocument();
  });
});
