/**
 * REQ-D11 Phase 2 — 벨 알림 클릭 이동 대상이 새 경로(`/results`)다
 *
 * 검증 계약: docs/plans/PLAN-D11-menu-rename.md `## 검증 계약` (D11-14)
 *
 * 무대는 F09 Phase 5(`NotificationBell.test.jsx`)와 같다 — 피드 훅·읽음 API·`useNavigate` 대역,
 * `ThemeProvider` 아래 렌더(계약 #25). F09-43은 "이동이 일어난다"까지만 봤고(종류별 매핑이 당시 미결),
 * 여기서는 **`export` 알림의 목적지**를 본다.
 *
 * ⚠️ 벨은 이동 대상 `/history`를 `paths`가 아니라 직접 문자열로 들고 있었다(계획서 제약·함정).
 *    라우터에 폴백이 없어 안 고치면 404가 아니라 **빈 화면**으로 간다 — 이 케이스가 그 함정의 회수다.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NotificationBell from 'components/NotificationBell';

import { useNotifications } from 'contexts/NotificationContext';
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

/** 서버 알림 제목("문제집 생성 완료")은 메뉴명이 아니라 사건 이름이라 D11 범위 밖 — 그대로 쓴다. */
const exportNotif = (jobId) => ({
  job_id: jobId,
  kind: 'export',
  created_at: '2026-09-04T10:00:00+00:00',
  severity: 'success',
  title: '문제집 생성 완료',
});

const renderBell = () =>
  render(
    <ThemeProvider>
      <NotificationBell />
    </ThemeProvider>,
  );

const openPopover = () => fireEvent.click(screen.getByRole('button', { name: /알림/ }));

beforeEach(() => {
  vi.clearAllMocks();
  useNotifications.mockReturnValue({ notifications: [], unreadCount: 0 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('벨 알림 이동 대상 (Phase 2)', () => {
  it('[D11-14] export 알림 항목을 클릭하면 /results로 이동한다', () => {
    useNotifications.mockReturnValue({ notifications: [exportNotif('job-x')], unreadCount: 1 });
    renderBell();
    openPopover();

    fireEvent.click(screen.getByText('문제집 생성 완료'));

    expect(navigate).toHaveBeenCalledWith('/results');
  });
});
