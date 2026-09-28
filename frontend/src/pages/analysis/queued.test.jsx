/**
 * REQ-B17 Phase 3 — `QUEUED`("대기 중") 표시 + 현황판 "대기 중" 타일
 *
 * 검증 계약: docs/plans/PLAN-B17-analysis-oom.md `## 검증 계약` (B17-20~23)
 *
 * 무대는 `pages/analysis/index.test.jsx`(REQ-F12)와 같다 — `ThemeProvider` + `MemoryRouter`(계약 #25),
 * `api/client`·알림 훅·`react-router` mock. `FileListPanel`은 편집 화면 부품이라 따로 렌더한다
 * (무한 스크롤의 IntersectionObserver는 `setupTests.js`가 대역을 둔다).
 *
 * 타일 **제목 문구**와 배지 **색**은 계획서가 정하지 않아 단언하지 않는다 — 타일은 testid와 값으로,
 * 배지·칩은 계획서에 명시된 "대기 중" 문구로만 본다.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import FileListPanel from 'components/FileListPanel';
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

const STATS = {
  source_count: 1,
  question_count: 0,
  workbook_count: 0,
  processing_count: 0,
  queued_count: 3,
  undetected_page_count: 0,
  false_positive_count: 0,
  manual_count: 0,
  detection_rate: null,
};

const QUEUED_JOB = {
  job_id: 'job-queued',
  filename: 'queued.pdf',
  workbook_name: '대기 문제집',
  status: 'DONE',
  boundaries_status: 'QUEUED',
  uploaded_at: new Date().toISOString(),
  workbook_types: [],
};

const wrap = (ui) => render(
  <MemoryRouter>
    <ThemeProvider>{ui}</ThemeProvider>
  </MemoryRouter>,
);

beforeEach(() => {
  vi.clearAllMocks();
  getStats.mockResolvedValue(STATS);
  getStatsDetail.mockImplementation((field) => Promise.resolve({ field, items: [] }));
  listJobs.mockResolvedValue({ items: [QUEUED_JOB], total: 1, skip: 0, limit: 20 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('"대기 중" 표시', () => {
  it('[B17-20] QUEUED job 카드에 "대기 중"이 보인다', async () => {
    wrap(<AnalysisFilePage />);

    expect(await screen.findByText('대기 중')).toBeInTheDocument();
  });

  it('[B17-21] FileListPanel에서 QUEUED job에 "대기 중" 칩이 보인다', async () => {
    wrap(<FileListPanel selectedJobId={null} onSelect={vi.fn()} />);

    expect(await screen.findByText('대기 중')).toBeInTheDocument();
  });
});

describe('현황판 "대기 중" 타일', () => {
  it('[B17-22] queued_count 타일에 값이 보인다', async () => {
    wrap(<AnalysisFilePage />);

    const tile = await screen.findByTestId('stat-tile-queued_count');
    await waitFor(() => expect(tile).toHaveTextContent('3'));
  });

  it("[B17-23] 타일 클릭 시 getStatsDetail('queued_count')로 파일 목록을 조회한다", async () => {
    wrap(<AnalysisFilePage />);

    fireEvent.click(await screen.findByTestId('stat-tile-queued_count'));

    await waitFor(() => expect(getStatsDetail).toHaveBeenCalledWith('queued_count'));
  });
});
