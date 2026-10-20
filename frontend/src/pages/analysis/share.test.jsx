/**
 * REQ-28 Phase 5 — 분석 목록 카드의 역할별 버튼 · 공유받음 표시
 *
 * 검증 계약: docs/plans/PLAN-28-analysis-sharing.md `## 검증 계약` (28-40~41)
 * 무대는 `index.test.jsx`(F12)와 같다 — ThemeProvider + MemoryRouter, api/client·알림 훅 mock.
 * 카드 버튼은 Tooltip 제목이 접근 이름이 된다("이름·유형 편집"·"삭제"·"공유").
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  listShares: vi.fn(),
  addShare: vi.fn(),
  updateShare: vi.fn(),
  removeShare: vi.fn(),
}));

vi.mock('hooks/useNotificationRefresh', () => ({ useNotificationRefresh: vi.fn() }));

const job = (role) => ({
  job_id: `j-${role}`, filename: `${role}.pdf`, workbook_name: `${role} 문제집`, status: 'DONE',
  boundaries_status: 'DONE', total_question_count: 3, uploaded_at: new Date().toISOString(), my_role: role,
});

const renderWith = async (role) => {
  listJobs.mockResolvedValue({ items: [job(role)], total: 1, skip: 0, limit: 20 });
  render(
    <MemoryRouter>
      <ThemeProvider>
        <AnalysisFilePage />
      </ThemeProvider>
    </MemoryRouter>,
  );
  await screen.findByText(`${role} 문제집`);
};

beforeEach(() => {
  getStats.mockResolvedValue({
    source_count: 1, question_count: 3, workbook_count: 0, processing_count: 0, queued_count: 0,
    undetected_page_count: 0, false_positive_count: 0, manual_count: 0, detection_rate: 1,
  });
});

describe('역할별 카드', () => {
  it('[28-40] 뷰어로 받은 카드에 편집·삭제·공유 버튼이 없다', async () => {
    await renderWith('viewer');

    expect(['이름·유형 편집', '삭제', '공유'].filter((name) => screen.queryByLabelText(name))).toEqual([]);
  });

  it('[28-41] 공유받은 카드에 "공유받음"과 역할이 보인다', async () => {
    await renderWith('editor');

    expect(screen.getByText(/공유받음 · 편집자/)).toBeInTheDocument();
  });
});
