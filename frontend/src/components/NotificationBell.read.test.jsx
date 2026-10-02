/**
 * REQ-B27 Phase 2 — 알림별 읽음 · 확인/미확인 구분 · 뱃지 = 미확인 개수
 *
 * 검증 계약: docs/plans/PLAN-B27-notification-per-user.md `## 검증 계약` (B27-19~24)
 *
 * 읽음 기준이 "벨을 열면 전체"에서 "클릭한 알림만"으로 바뀌었다(F09-41·42·47 폐기).
 * 확인/미확인은 왼쪽 아이콘 칸의 `aria-label`("확인"/"미확인")로 본다 — 아이콘 모양은 구현이 정한다.
 * 무대는 `NotificationBell.test.jsx` 와 같다(앱과 같은 ThemeProvider, 계약 #25).
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NotificationBell from 'components/NotificationBell';

import { useNotifications } from 'contexts/NotificationContext';
import { markNotificationsRead } from 'api/client';
import { ThemeProvider } from 'theme/theme-provider';

const navigate = vi.fn();

vi.mock('contexts/NotificationContext', () => ({ useNotifications: vi.fn() }));
vi.mock('api/client', () => ({
  markNotificationsRead: vi.fn(() => Promise.resolve({ cursor: null, unread_count: 0 })),
}));
vi.mock('react-router', async () => ({
  ...(await vi.importActual('react-router')),
  useNavigate: () => navigate,
}));

const notif = (jobId, createdAt, extra = {}) => ({
  job_id: jobId, created_at: createdAt, severity: 'success', title: `알림 ${jobId}`, read: false, ...extra,
});
const A = notif('job-a', '2026-10-02T10:00:00+00:00');
const B = notif('job-b', '2026-10-02T09:00:00+00:00', { read: true });

const feedIs = (items, unreadCount) => useNotifications.mockReturnValue({ notifications: items, unreadCount });

const renderBell = () => render(<ThemeProvider><NotificationBell /></ThemeProvider>);
const openPopover = () => fireEvent.click(screen.getByRole('button', { name: /^알림$/ }));
const rowOf = (title) => screen.getByText(title).closest('[role="button"]');

beforeEach(() => {
  vi.clearAllMocks();
  feedIs([A, B], 1);
});

describe('NotificationBell — 알림별 읽음 (B27)', () => {
  it('[B27-19] 팝오버를 열어도 읽음 API를 부르지 않는다', () => {
    renderBell();

    openPopover();

    expect(markNotificationsRead).not.toHaveBeenCalled();
  });

  it('[B27-20] 항목을 클릭하면 그 알림만 읽음 처리하고 화면을 이동한다', () => {
    renderBell();
    openPopover();

    fireEvent.click(screen.getByText('알림 job-a'));

    expect([markNotificationsRead.mock.calls, navigate.mock.calls.length]).toEqual([[[[A.created_at]]], 1]);
  });

  it("[B27-21] '모두 읽음' 버튼은 인자 없이 읽음 API를 부른다", () => {
    renderBell();
    openPopover();

    fireEvent.click(screen.getByRole('button', { name: '모두 읽음' }));

    expect(markNotificationsRead.mock.calls).toEqual([[]]);
  });

  it('[B27-22] 뱃지는 미확인 개수 그대로이고 팝오버를 열어도 그대로다', () => {
    feedIs([A, B], 3);
    renderBell();
    // 팝오버(모달)가 열리면 나머지 화면이 aria-hidden 이 돼 role 로 다시 못 찾는다 — 열기 전에 잡아 둔다
    const bell = screen.getByRole('button', { name: /^알림$/ });

    fireEvent.click(bell);

    expect(within(bell).getByText('3')).toBeInTheDocument();
  });

  it('[B27-23] 읽은 항목과 안 읽은 항목의 왼쪽 아이콘 칸이 확인/미확인으로 구분된다', () => {
    renderBell();
    openPopover();

    const labels = ['알림 job-a', '알림 job-b'].map(
      (t) => within(rowOf(t)).getByLabelText(/^(확인|미확인)$/).getAttribute('aria-label'),
    );
    expect(labels).toEqual(['미확인', '확인']);
  });

  it('[B27-24] 클릭한 항목은 다시 열면 서버 응답 없이 확인으로 보인다', () => {
    renderBell();
    openPopover();
    fireEvent.click(screen.getByText('알림 job-a'));   // 팝오버가 닫힌다 — 피드는 아직 read:false

    openPopover();

    expect(within(rowOf('알림 job-a')).getByLabelText(/^(확인|미확인)$/).getAttribute('aria-label')).toBe('확인');
  });
});
