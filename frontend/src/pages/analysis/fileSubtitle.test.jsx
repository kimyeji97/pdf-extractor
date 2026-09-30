/**
 * REQ-F15 Phase 2 — 문항분석 목록 카드: 문제집 이름 아래 파일명
 *
 * 검증 계약: docs/plans/PLAN-F15-workbook-name-and-filename.md `## 검증 계약` (F15-08~10)
 *
 * 무대는 F12 목록 화면 테스트(`index.test.jsx`)와 같다(ThemeProvider + MemoryRouter, `api/client`·알림 훅 mock).
 * 카드는 `listJobs` 응답으로 그린다. 판정 규칙 자체는 `utils/documentName.subtitle.test.js`(F15-05~07)가 본다.
 * "작은 글씨"(크기·색)는 jsdom 이 볼 수 없어 Phase 3 육안으로 둔다.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AnalysisFilePage from 'pages/analysis';

import { getStats, listJobs } from 'api/client';
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

const THREE_DAYS_AGO = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();

const job = (overrides) => ({
  job_id: 'job-a',
  status: 'DONE',
  boundaries_status: 'DONE',
  total_question_count: 12,
  filename: '2026_중3.pdf',
  workbook_name: '중3 기출',
  workbook_types: [],
  uploaded_at: THREE_DAYS_AGO,
  ...overrides,
});

const renderWith = async (jobs) => {
  listJobs.mockResolvedValue({ items: jobs, total: jobs.length, skip: 0, limit: 20 });
  render(
    <MemoryRouter>
      <ThemeProvider>
        <AnalysisFilePage />
      </ThemeProvider>
    </MemoryRouter>,
  );
  await waitFor(() => expect(listJobs).toHaveBeenCalled());
};

beforeEach(() => {
  vi.clearAllMocks();
  getStats.mockResolvedValue({
    processing_count: 0, queued_count: 0, undetected_page_count: 0,
    false_positive_count: 0, manual_count: 0, detection_rate: null,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('목록 카드 파일명 병기', () => {
  it('[F15-08] 문제집 이름과 파일명이 다르면 카드에 파일명이 보인다', async () => {
    await renderWith([job()]);
    expect(await screen.findByText('2026_중3.pdf')).toBeInTheDocument();
  });

  it('[F15-09] 문제집 이름이 없으면 파일명은 한 번만 보인다', async () => {
    await renderWith([job({ workbook_name: null })]);
    await screen.findAllByText('2026_중3.pdf');
    expect(screen.getAllByText('2026_중3.pdf')).toHaveLength(1);
  });

  it('[F15-10] 업로드 시각은 그대로 보인다', async () => {
    await renderWith([job()]);
    expect(await screen.findByText(/3일 전/)).toBeInTheDocument();
  });
});
