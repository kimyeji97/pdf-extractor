/**
 * REQ-F09 Phase 5 — 헤더 벨 + 미읽음 뱃지 + 알림 이력 팝오버
 *
 * 검증 계약: docs/plans/PLAN-F09-completion-notification.md `## 검증 계약` (F09-40~43)
 *
 * ⚠️ **라이트/다크 양쪽 확인은 이 파일이 못 한다** — 계약 #20 이 겨냥하는 실패는
 *    "정상 토큰(`primary.lighter`)을 썼는데 다크에서만 깨지는 것"이라 렌더 단언으로는
 *    안 잡힌다. 자동으로 잡을 수 있는 부분만 F09-46(소스 스캔)이 맡고, 나머지는 육안이다.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NotificationBell from 'components/NotificationBell';

import { useNotifications } from 'contexts/NotificationContext';
import { markNotificationsRead } from 'api/client';
import { ThemeProvider } from 'theme/theme-provider';

const navigate = vi.fn();

vi.mock('contexts/NotificationContext', () => ({
  useNotifications: vi.fn(),
}));

vi.mock('api/client', () => ({
  markNotificationsRead: vi.fn(() => Promise.resolve({ cursor: null, unread_count: 0 })),
}));

vi.mock('react-router', async () => ({
  ...(await vi.importActual('react-router')),
  useNavigate: () => navigate,
}));

const notif = (jobId, createdAt, extra = {}) => ({
  job_id: jobId,
  created_at: createdAt,
  severity: 'success',
  title: '문항 감지 완료',
  ...extra,
});

const feedIs = (items, unreadCount = items.length) => {
  useNotifications.mockReturnValue({ notifications: items, unreadCount });
};

/**
 * 앱과 같은 테마 아래에서 렌더한다.
 *
 * ⚠️ `ThemeProvider` 없이 렌더하면 `theme.vars` 가 undefined 라 `tint.js` 가
 *    `Cannot read properties of undefined (reading 'palette')` 로 터진다 —
 *    **구현 결함이 아니라 앱과 다른 조건에서 렌더한 것**이다(2026-08-07 실측).
 *    색조 헬퍼는 CSS 변수 테마를 전제한다(계약 #20).
 */
const renderBell = () =>
  render(
    <ThemeProvider>
      <NotificationBell />
    </ThemeProvider>,
  );

const openPopover = () => fireEvent.click(screen.getByRole('button', { name: /알림/ }));

beforeEach(() => {
  vi.clearAllMocks();
  feedIs([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('NotificationBell', () => {
  it('[F09-40] 미읽음 수가 뱃지로 표시된다', () => {
    feedIs([notif('job-a', '2026-08-07T10:00:00+00:00')], 3);

    renderBell();

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('[F09-41] 팝오버를 열면 읽음 커서 갱신 API가 불린다', () => {
    feedIs([notif('job-a', '2026-08-07T10:00:00+00:00')], 1);
    renderBell();

    openPopover();

    // 항목별이 아니라 전체 읽음이다 — 커서 하나로 충분하다는 결정(2026-08-03).
    expect(markNotificationsRead).toHaveBeenCalledTimes(1);
  });

  it('[F09-42] 읽음 처리 후 뱃지가 사라진다', async () => {
    feedIs([notif('job-a', '2026-08-07T10:00:00+00:00')], 1);
    const { rerender } = renderBell();

    openPopover();
    feedIs([notif('job-a', '2026-08-07T10:00:00+00:00')], 0); // 서버가 0을 돌려준 뒤
    rerender(
      <ThemeProvider>
        <NotificationBell />
      </ThemeProvider>,
    );

    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('[F09-47] 읽음 처리 후 새 알림이 오면 뱃지가 다시 나타난다', () => {
    // 서버의 unread_count 는 **읽음 커서 이후 개수**라 mark_all_read 뒤 0으로 리셋되고
    // 새 알림마다 1부터 다시 센다(`notification_service.list_feed`). 즉 이 값은
    // 단조 증가하지 않는다 — 그렇게 가정하면 읽은 뒤의 알림이 영영 안 보인다.
    feedIs([notif('job-a', '2026-08-07T10:00:00+00:00')], 1);
    const { rerender } = renderBell();

    openPopover(); // 읽음 처리 (커서가 지금으로 이동)

    feedIs(
      [notif('job-b', '2026-08-07T10:05:00+00:00'), notif('job-a', '2026-08-07T10:00:00+00:00')],
      1, // 커서 이후 1건 — 값은 읽기 전과 같지만 **다른 알림**이다
    );
    rerender(
      <ThemeProvider>
        <NotificationBell />
      </ThemeProvider>,
    );

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('[F09-43] 팝오버 항목을 클릭하면 화면 이동이 일어난다', () => {
    feedIs([notif('job-a', '2026-08-07T10:00:00+00:00')], 1);
    renderBell();
    openPopover();

    fireEvent.click(screen.getByText('문항 감지 완료'));

    // 목적지 경로는 단언하지 않는다 — 알림 종류별 매핑이 계획서 미결이다.
    expect(navigate).toHaveBeenCalled();
  });
});
