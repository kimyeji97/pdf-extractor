/**
 * REQ-F12 Phase 2 — 목록 화면 통계 위젯 + 아코디언
 *
 * 검증 계약: docs/plans/PLAN-F12-detection-stats-dashboard.md `## 검증 계약` (F12-25~32)
 *
 * ⚠️ 아직 구현 전이다 — 5타일 위젯·아코디언·`getStatsDetail` 클라이언트 함수가 없어
 *    지금은 전부 빨간불이어야 정상이다.
 *
 * D09 테스트(`pages/history/index.test.jsx`) 관례를 그대로 따른다 — `ThemeProvider` +
 * `MemoryRouter` 래핑(계약 #25, `theme/tint.js`가 `theme.vars.palette`를 읽으므로 provider
 * 없이 렌더하면 죽는다), `api/client`·`react-router`·알림 훅 mock.
 *
 * job 카드 그리드(`listJobs`)는 이 Phase의 검증 대상이 아니므로 빈 목록으로 고정해 둔다 —
 * `BookCard`를 mock하지 않아도 카드가 아예 안 그려져 무관한 실패를 피한다.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AnalysisFilePage from 'pages/analysis';

import { getStats, getStatsDetail, listJobs } from 'api/client';
import { ThemeProvider } from 'theme/theme-provider';

const navigate = vi.fn();

vi.mock('api/client', () => ({
  getStats: vi.fn(),
  getStatsDetail: vi.fn(),
  listJobs: vi.fn(),
  requestUploadUrl: vi.fn(),
  uploadPdf: vi.fn(),
  updateJobMeta: vi.fn(),
  deleteJob: vi.fn(),
}));

// 알림 구독은 이 화면의 검증 대상이 아니다 — 훅을 통째로 비운다(F09/C09가 따로 덮는다).
vi.mock('hooks/useNotificationRefresh', () => ({
  useNotificationRefresh: vi.fn(),
}));

vi.mock('react-router', async () => ({
  ...(await vi.importActual('react-router')),
  useNavigate: () => navigate,
}));

const DEFAULT_STATS = {
  source_count: 3,
  question_count: 10,
  workbook_count: 2,
  processing_count: 1,
  undetected_page_count: 2,
  false_positive_count: 4,
  manual_count: 5,
  detection_rate: 0.6,
};

const statsAre = (overrides = {}) => {
  getStats.mockResolvedValue({ ...DEFAULT_STATS, ...overrides });
};

const detailIs = (byField) => {
  getStatsDetail.mockImplementation((field) =>
    Promise.resolve({ field, items: byField[field] || [] }));
};

const renderPage = () => render(
  <MemoryRouter>
    <ThemeProvider>
      <AnalysisFilePage />
    </ThemeProvider>
  </MemoryRouter>,
);

/** 통계 위젯 로드가 끝난 뒤의 화면을 얻는다. */
const renderLoaded = async () => {
  const view = renderPage();
  await waitFor(() => expect(getStats).toHaveBeenCalled());
  return view;
};

const clickTile = async (field) => {
  fireEvent.click(screen.getByTestId(`stat-tile-${field}`));
  await waitFor(() => expect(getStatsDetail).toHaveBeenCalled());
};

beforeEach(() => {
  vi.clearAllMocks();
  statsAre();
  detailIs({});
  listJobs.mockResolvedValue({ items: [], total: 0, skip: 0, limit: 20 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('목록 화면 통계 위젯 (Phase 2)', () => {
  it('[F12-25] 4개 카운트 타일 값이 /api/stats 응답과 일치', async () => {
    await renderLoaded();

    expect(screen.getByTestId('stat-tile-processing_count')).toHaveTextContent('1');
    expect(screen.getByTestId('stat-tile-undetected_page_count')).toHaveTextContent('2');
    expect(screen.getByTestId('stat-tile-false_positive_count')).toHaveTextContent('4');
    expect(screen.getByTestId('stat-tile-manual_count')).toHaveTextContent('5');
  });

  it('[F12-26] 기존 StatCards 3타일(업로드한 문제집 수·감지된 문항 수·생성한 문제집 수)은 더 이상 렌더되지 않는다', async () => {
    await renderLoaded();

    expect(screen.queryByText(/업로드한 문제집/)).not.toBeInTheDocument();
    expect(screen.queryByText(/감지된 문항/)).not.toBeInTheDocument();
    expect(screen.queryByText(/생성한 문제집/)).not.toBeInTheDocument();
  });

  it('[F12-27] detection_rate가 null이면 "—"로 표시된다', async () => {
    statsAre({ detection_rate: null });

    await renderLoaded();

    expect(screen.getByTestId('stat-tile-detection_rate')).toHaveTextContent('—');
  });
});

describe('아코디언 (Phase 2)', () => {
  it('[F12-28] 타일 클릭 시 아코디언이 열리고 해당 field로 상세를 조회한다', async () => {
    await renderLoaded();

    await clickTile('processing_count');

    expect(getStatsDetail).toHaveBeenCalledWith('processing_count');
    expect(screen.getByTestId('stat-detail-panel')).toBeInTheDocument();
  });

  it('[F12-29] 같은 타일을 다시 클릭하면 아코디언이 닫힌다', async () => {
    await renderLoaded();
    await clickTile('processing_count');

    fireEvent.click(screen.getByTestId('stat-tile-processing_count'));

    await waitFor(() => expect(screen.queryByTestId('stat-detail-panel')).not.toBeInTheDocument());
  });

  it('[F12-30] 아코디언의 파일을 클릭하면 해당 작업 화면으로 이동한다', async () => {
    detailIs({
      false_positive_count: [
        { job_id: 'job-x', filename: 'a.pdf', workbook_name: null, count: 2, pages: [0, 1] },
      ],
    });
    await renderLoaded();
    await clickTile('false_positive_count');

    fireEvent.click(screen.getAllByTestId('stat-detail-file')[0]);

    expect(navigate).toHaveBeenCalledWith('/analysis/job-x');
  });

  it('[F12-31] 문항 탐지율 타일은 클릭해도 아코디언이 열리지 않는다', async () => {
    await renderLoaded();

    fireEvent.click(screen.getByTestId('stat-tile-detection_rate'));

    expect(getStatsDetail).not.toHaveBeenCalled();
    expect(screen.queryByTestId('stat-detail-panel')).not.toBeInTheDocument();
  });

  it('[F12-32] 다른 타일을 클릭하면 아코디언 내용이 새 field로 교체된다', async () => {
    detailIs({
      processing_count: [
        { job_id: 'job-p', filename: 'p.pdf', workbook_name: null, count: null, pages: null },
      ],
      manual_count: [
        { job_id: 'job-m', filename: 'm.pdf', workbook_name: null, count: 3, pages: [0] },
      ],
    });
    await renderLoaded();
    await clickTile('processing_count');
    expect(screen.getAllByTestId('stat-detail-file')).toHaveLength(1);

    await clickTile('manual_count');

    const files = screen.getAllByTestId('stat-detail-file');
    expect(files).toHaveLength(1);
    expect(files[0]).toHaveTextContent('m.pdf');
  });
});
