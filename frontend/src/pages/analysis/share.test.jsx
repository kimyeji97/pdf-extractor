/**
 * REQ-28 Phase 5·7 — 분석 목록 카드의 역할별 버튼 · 공유받음 표시 · 역할 칩 · 공유 패널
 *
 * 검증 계약: docs/plans/PLAN-28-analysis-sharing.md `## 검증 계약` (28-40~41 · 28-60~61)
 * 무대는 `index.test.jsx`(F12)와 같다 — ThemeProvider + MemoryRouter, api/client·알림 훅 mock.
 * 카드 버튼은 Tooltip 제목이 접근 이름이 된다("이름·유형 편집"·"삭제"·"공유").
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AnalysisFilePage from 'pages/analysis';

import { getStats, listJobs, listShares } from 'api/client';
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

const job = (role, tag = role) => ({
  job_id: `j-${tag}`, filename: `${tag}.pdf`, workbook_name: `${tag} 문제집`, status: 'DONE',
  boundaries_status: 'DONE', total_question_count: 3, uploaded_at: new Date().toISOString(), my_role: role,
});

const renderWith = async (role, items = [job(role)]) => {
  listJobs.mockResolvedValue({ items, total: items.length, skip: 0, limit: 20 });
  render(
    <MemoryRouter>
      <ThemeProvider>
        <AnalysisFilePage />
      </ThemeProvider>
    </MemoryRouter>,
  );
  await screen.findByText(`${items[0].workbook_name}`);
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

  it('[28-41] 공유받은 카드에 "공유받음"과 역할 칩이 보인다', async () => {
    await renderWith('editor');

    expect([screen.queryByText(/공유받음/), screen.queryByText('편집자')].every(Boolean)).toBe(true);
  });

  it('[28-60] 소유자 카드에도 "소유자" 칩이 보인다', async () => {
    await renderWith('owner');

    expect(screen.getByText('소유자')).toBeInTheDocument();
  });

  it('[28-61] 공유 패널이 열린 동안 다른 카드를 누르면 공유 대상에 더해진다', async () => {
    listShares.mockResolvedValue({ owner: null, shares: [] });
    await renderWith('owner', [job('owner', 'A'), job('owner', 'B')]);

    fireEvent.click(screen.getAllByLabelText('공유')[0]);
    const panel = await screen.findByTestId('share-panel');
    fireEvent.click(screen.getByText('B 문제집'));

    expect(within(panel).getByText('B 문제집')).toBeInTheDocument();
  });
});
