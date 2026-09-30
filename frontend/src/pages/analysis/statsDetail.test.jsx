/**
 * REQ-F14 Phase 3 — 현황판 상세 영역: 닫기 수단 + 목록 영역 우측으로 이동
 *
 * 검증 계약: docs/plans/PLAN-F14-stats-board-and-badges.md `## 검증 계약` (F14-21~26)
 *
 * 상세 영역은 같은 타일을 다시 누르면 닫혔지만(F12) 그 수단이 안 보여 "닫을 수 없다"로 읽혔다. 그리고 현황판 안 우측에 붙어
 * 있었다. 결정(2026-09-30): 제목 + X 닫기 · 열린 타일 강조 · 목록 영역(검색란 포함) 우측, 폭 320.
 *
 * 무대는 F12 목록 화면 테스트(`index.test.jsx`)와 같다(ThemeProvider + MemoryRouter, `api/client`·알림 훅 mock).
 * 고정하는 표면: 현황판 루트 `stats-board` · 목록 영역(검색란 + 목록) `analysis-list-area` · 타일 강조 `aria-pressed` ·
 * 닫기 버튼 접근 이름 "닫기". 폭 320·각자 스크롤·좁은 화면 배치는 jsdom 이 레이아웃을 계산하지 못해 Phase 4 육안으로 본다.
 * "다시 누르면 닫힌다"는 F12 기존 케이스가 덮는다.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AnalysisFilePage from 'pages/analysis';

import { getStats, getStatsDetail, listJobs } from 'api/client';
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

vi.mock('react-router', async () => ({
  ...(await vi.importActual('react-router')),
  useNavigate: () => vi.fn(),
}));

const renderLoaded = async () => {
  render(
    <MemoryRouter>
      <ThemeProvider>
        <AnalysisFilePage />
      </ThemeProvider>
    </MemoryRouter>,
  );
  await waitFor(() => expect(getStats).toHaveBeenCalled());
  await screen.findByTestId('stat-tile-processing_count');
};

/** "분석중" 타일을 열고 상세 영역을 돌려준다. */
const openProcessing = async () => {
  fireEvent.click(screen.getByTestId('stat-tile-processing_count'));
  return screen.findByTestId('stat-detail-panel');
};

beforeEach(() => {
  vi.clearAllMocks();
  getStats.mockResolvedValue({
    processing_count: 1, queued_count: 0, undetected_page_count: 2,
    false_positive_count: 4, manual_count: 5, detection_rate: 0.6,
  });
  getStatsDetail.mockImplementation((field) => Promise.resolve({
    field, items: [{ job_id: 'job-a', filename: 'a.pdf', workbook_name: '문제집 A' }],
  }));
  listJobs.mockResolvedValue({ items: [], total: 0, skip: 0, limit: 20 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('상세 영역 닫기', () => {
  it('[F14-21] 열린 상세 영역의 제목이 그 타일 이름이다', async () => {
    await renderLoaded();
    const panel = await openProcessing();
    expect(within(panel).getByText('분석중 파일수')).toBeInTheDocument();
  });

  it('[F14-22] 상세 영역의 "닫기" 버튼을 누르면 상세 영역이 사라진다', async () => {
    await renderLoaded();
    const panel = await openProcessing();

    fireEvent.click(within(panel).getByRole('button', { name: '닫기' }));

    await waitFor(() => expect(screen.queryByTestId('stat-detail-panel')).not.toBeInTheDocument());
  });

  it('[F14-23] 열린 타일은 aria-pressed="true", 다른 타일은 "false"', async () => {
    await renderLoaded();
    await openProcessing();

    expect([
      screen.getByTestId('stat-tile-processing_count').getAttribute('aria-pressed'),
      screen.getByTestId('stat-tile-manual_count').getAttribute('aria-pressed'),
    ]).toEqual(['true', 'false']);
  });
});

describe('상세 영역 위치', () => {
  it('[F14-24] 상세 영역이 현황판 안에 있지 않다', async () => {
    await renderLoaded();
    const panel = await openProcessing();
    expect(screen.getByTestId('stats-board').contains(panel)).toBe(false);
  });

  it('[F14-25] 상세 영역이 목록 영역과 형제이고 그 뒤(우측)에 온다', async () => {
    await renderLoaded();
    const panel = await openProcessing();
    const listArea = screen.getByTestId('analysis-list-area');

    const follows = Boolean(listArea.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect([panel.parentElement === listArea.parentElement, follows]).toEqual([true, true]);
  });

  it('[F14-26] 목록 영역 안에 검색란이 있다', async () => {
    await renderLoaded();
    const listArea = screen.getByTestId('analysis-list-area');
    expect(within(listArea).getByPlaceholderText('문제집 이름 검색')).toBeInTheDocument();
  });
});
