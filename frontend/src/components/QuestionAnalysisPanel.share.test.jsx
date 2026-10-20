/**
 * REQ-28 Phase 5 — 뷰어는 문항 편집 컨트롤을 못 본다
 *
 * 검증 계약: docs/plans/PLAN-28-analysis-sharing.md `## 검증 계약` (28-38)
 * 무대는 `QuestionAnalysisPanel.test.jsx`(D10)와 같다 — ThemeProvider 아래(계약 #25), api/client mock.
 */
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import QuestionAnalysisPanel from 'components/QuestionAnalysisPanel';

import { getPageQuestions } from 'api/client';
import { ThemeProvider } from 'theme/theme-provider';

vi.mock('api/client', () => ({
  getPageQuestions: vi.fn(),
  updateQuestionTitle: vi.fn(),
  updateManualQuestionTitle: vi.fn(),
  bulkDeleteQuestions: vi.fn(),
}));

beforeEach(() => {
  getPageQuestions.mockReset();
  getPageQuestions.mockResolvedValue({
    questions: [{
      question_id: 'job-a:1:1:0', question_num: 1, page_num: 1, title: '제목', is_manual: false,
      is_false_positive: false, thumbnail_url: '/api/jobs/job-a/pages/1/questions/1/thumbnail',
    }],
  });
});

describe('읽기 전용', () => {
  it('[28-38] readOnly 면 삭제 버튼이 없다', async () => {
    render(
      <ThemeProvider>
        <QuestionAnalysisPanel jobId="job-a" pageNum={1} pageInfo={{}} readOnly />
      </ThemeProvider>,
    );
    await screen.findByText('문항 제목');

    expect(screen.queryByRole('button', { name: /삭제/ })).toBeNull();
  });
});
