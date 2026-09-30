/**
 * REQ-F14 Phase 1 — 목록 화면: status 이벤트·감지 완료 알림 → 목록과 현황판을 함께, 딤 없이 다시 읽는다
 *
 * 검증 계약: docs/plans/PLAN-F14-stats-board-and-badges.md `## 검증 계약` (F14-06~08)
 *
 * 업로드 직후 목록은 "대기 중", 현황판은 "분석 중" — 둘이 다른 시점에 읽고, 완료 알림은 목록만 다시 읽었다.
 *
 * 무대는 F12 목록 화면 테스트(`index.test.jsx`)와 같다(ThemeProvider + MemoryRouter, `api/client` mock).
 * 두 신호는 훅을 가로채 흘린다:
 *   - 감지 완료 알림: `useNotificationRefresh` 로 넘긴 콜백을 직접 부른다(구독 자체는 F09/C09가 덮는다)
 *   - `status` 이벤트: `useStatusEvents()` 값을 올리고 다시 렌더한다(이벤트 → 값 증가는 F14-05가 덮는다)
 *
 * ⚠️ `useStatusEvents()`는 Provider 밖에서 0이어야 한다 — F12 목록 테스트는 Provider 없이 이 화면을 그린다.
 */
import { act, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AnalysisFilePage from 'pages/analysis';

import { getStats, listJobs } from 'api/client';
import { useStatusEvents } from 'contexts/NotificationContext';
import { useNotificationRefresh } from 'hooks/useNotificationRefresh';
import { ThemeProvider } from 'theme/theme-provider';

vi.mock('api/client', () => ({
  getStats: vi.fn(),
  getStatsDetail: vi.fn(),
  listJobs: vi.fn(),
  requestUploadUrl: vi.fn(),
  uploadPdf: vi.fn(),
  updateJobMeta: vi.fn(),
  deleteJob: vi.fn(),
}));

vi.mock('hooks/useNotificationRefresh', () => ({
  useNotificationRefresh: vi.fn(),
}));

vi.mock('contexts/NotificationContext', async () => ({
  ...(await vi.importActual('contexts/NotificationContext')),
  useStatusEvents: vi.fn(() => 0),
}));

vi.mock('react-router', async () => ({
  ...(await vi.importActual('react-router')),
  useNavigate: () => vi.fn(),
}));

const page = () => (
  <MemoryRouter>
    <ThemeProvider>
      <AnalysisFilePage />
    </ThemeProvider>
  </MemoryRouter>
);

/** 첫 로드가 끝난 화면 + 호출 기록 초기화 — 이후 호출만 "재조회"로 센다. */
const renderLoaded = async () => {
  const view = render(page());
  await waitFor(() => expect(getStats).toHaveBeenCalled());
  await waitFor(() => expect(listJobs).toHaveBeenCalled());
  getStats.mockClear();
  listJobs.mockClear();
  return view;
};

const sendStatusEvent = (view) => {
  useStatusEvents.mockReturnValue(1);
  view.rerender(page());
};

const fireDetectionDone = async () => {
  const onFresh = useNotificationRefresh.mock.calls.at(-1)[0];
  await act(async () => { onFresh(); });
};

beforeEach(() => {
  vi.clearAllMocks();
  useStatusEvents.mockReturnValue(0);
  getStats.mockResolvedValue({
    processing_count: 1, queued_count: 0, undetected_page_count: 0,
    false_positive_count: 0, manual_count: 0, detection_rate: null,
  });
  listJobs.mockResolvedValue({ items: [], total: 0, skip: 0, limit: 20 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('목록 화면 배경 재조회', () => {
  it('[F14-06] status 이벤트가 오면 목록과 현황판을 둘 다 다시 읽는다', async () => {
    const view = await renderLoaded();

    sendStatusEvent(view);

    await waitFor(() => expect([getStats.mock.calls.length > 0, listJobs.mock.calls.length > 0]).toEqual([true, true]));
  });

  it('[F14-07] 감지 완료 알림 콜백이 오면 현황판도 다시 읽는다', async () => {
    await renderLoaded();

    await fireDetectionDone();

    await waitFor(() => expect(getStats).toHaveBeenCalled());
  });

  it('[F14-08] 배경 재조회는 getStats·listJobs 에 { background: true } 를 넘긴다', async () => {
    const view = await renderLoaded();

    sendStatusEvent(view);

    await waitFor(() => expect([
      getStats.mock.calls.at(-1)?.[0]?.background,
      listJobs.mock.calls.at(-1)?.[0]?.background,
    ]).toEqual([true, true]));
  });
});
