/**
 * REQ-F17 Phase 1 — 부제를 숨길 때 구분자가 홀로 남지 않는다
 *
 * 검증 계약: docs/plans/PLAN-F17-source-label-format.md `## 검증 계약` (F17-23)
 *
 * `/review` 회차 2가 잡은 (b)다. 부제(`resolveFileSubtitle`)는 제목과 겹치면 `null`을 주는데,
 * `FileListPanel`만 **텍스트만 가리고 요소·구분자를 그대로 둬서** 캡션이 `" · 수학"`으로 렌더됐다.
 * 짝 소비처(`BookCard`·`PageHeader`)는 `{caption && (<Typography…>)}`로 **요소째** 가린다.
 *
 * ⚠️ 이 결함은 F17 이전에는 **드러날 수 없었다** — 그때는 왼쪽이 `job.filename || "unknown.pdf"`로
 *    항상 값이 있었다. 부제를 숨기는 수선이 비로소 빈자리를 만들었다.
 *
 * 무대는 `pages/analysis/queued.test.jsx`(B17-21)가 쓰는 것과 같다 — `FileListPanel`은
 * 편집 화면 부품이라 따로 렌더한다.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import FileListPanel from 'components/FileListPanel';

import { listJobs } from 'api/client';
import { ThemeProvider } from 'theme/theme-provider';

vi.mock('api/client', () => ({
  listJobs: vi.fn(),
  updateJobMeta: vi.fn(),
  deleteJob: vi.fn(),
}));

vi.mock('hooks/useNotificationRefresh', () => ({ useNotificationRefresh: vi.fn() }));

/** 이름이 없어 제목이 파일명에서 파생되는 job — 부제가 숨겨지는 경우다. */
const JOB = {
  job_id: 'job-1',
  filename: '2026 1학기.중간.pdf',
  workbook_name: null,
  workbook_types: ['수학'],
  status: 'DONE',
  boundaries_status: 'DONE',
  uploaded_at: '2026-10-01T00:00:00Z',
  total_question_count: 3,
};

beforeEach(() => {
  listJobs.mockResolvedValue({ items: [JOB], total: 1 });
});

describe('FileListPanel 캡션', () => {
  it('[F17-23] 부제가 숨겨져도 구분자가 홀로 남지 않는다', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <FileListPanel selectedJobId={null} onSelect={vi.fn()} />
        </ThemeProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(listJobs).toHaveBeenCalled());
    // 유형은 보이되, 그 앞에 버려진 " · " 가 붙어 있으면 안 된다.
    expect(await screen.findByText('수학')).toBeInTheDocument();
  });
});
