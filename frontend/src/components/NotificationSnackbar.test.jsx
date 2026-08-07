/**
 * REQ-F09 Phase 5 — 완료 순간의 인앱 스낵바
 *
 * 검증 계약: docs/plans/PLAN-F09-completion-notification.md `## 검증 계약` (F09-44~46)
 *
 * F09-45 가 이 Phase 에서 가장 큰 사고를 막는다 — 기준선이 없으면 **앱을 여는 순간
 * 30일치 스낵바가 쏟아진다.** Phase 3·4 에서는 같은 실수가 "조회 한 번 더" 정도였지만
 * 여기서는 화면이 즉시 망가진다.
 */
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NotificationSnackbar from 'components/NotificationSnackbar';

import { useNotifications } from 'contexts/NotificationContext';

vi.mock('contexts/NotificationContext', () => ({
  useNotifications: vi.fn(),
}));

const notif = (jobId, createdAt) => ({
  job_id: jobId,
  created_at: createdAt,
  severity: 'success',
  title: '문제집 생성 완료',
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

describe('NotificationSnackbar', () => {
  it('[F09-44] 새 완료 알림이 오면 스낵바가 나타난다', () => {
    const { rerender } = render(<NotificationSnackbar />);

    feedIs([notif('job-a', '2026-08-07T10:00:00+00:00')]);
    rerender(<NotificationSnackbar />);

    expect(screen.getByText('문제집 생성 완료')).toBeInTheDocument();
  });

  it('[F09-45] 구독 이전 알림에는 스낵바를 띄우지 않는다', () => {
    // 피드는 최근 30일 전체(최신 50건)를 담고 온다. 기준선이 없으면 앱 진입 즉시 폭발한다.
    feedIs([
      notif('job-old-1', '2026-07-20T10:00:00+00:00'),
      notif('job-old-2', '2026-07-21T10:00:00+00:00'),
    ]);

    render(<NotificationSnackbar />);

    expect(screen.queryByText('문제집 생성 완료')).not.toBeInTheDocument();
  });
});

describe('색조 토큰 (계약 #20)', () => {
  it('[F09-46] Phase 5 컴포넌트가 *.lighter 계열 모드 비안전 토큰을 쓰지 않는다', () => {
    // 렌더 단언으로는 못 잡는다 — `primary.lighter` 는 **정상 토큰**이라 콘솔·빌드가 조용하고
    // 라이트 모드에서는 멀쩡해 보인다. 소스에 그 토큰이 없는지 보는 것이 유일한 자동 방어선이다.
    const sources = [
      'src/components/NotificationBell.jsx',
      'src/components/NotificationSnackbar.jsx',
    ]
      .map((path) => readFileSync(path, 'utf-8'))
      .join('\n');

    expect(sources).not.toMatch(/\.(lighter|darker)\b/);
  });
});
