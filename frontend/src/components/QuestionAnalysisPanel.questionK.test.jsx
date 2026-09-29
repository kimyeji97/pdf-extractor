/**
 * REQ-B20 Phase 4 — 분석 패널이 같은 번호 공존 문항을 k 로 구분해 수정·삭제한다 (ADR-0006)
 *
 * 검증 계약: docs/plans/PLAN-B20-invisible-number-and-id-collision.md `## 검증 계약`
 * 케이스: B20-26 · B20-27
 *
 * 무대: 같은 쪽 번호 1 문항 둘(위 k=0 "위제목" · 아래 k=1 "아래제목"). k 는 백엔드 목록 응답의 `k` 필드다
 * (Phase 3 B20-22). 앱과 같은 `ThemeProvider` 아래에서 렌더한다(계약 #25).
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import QuestionAnalysisPanel from 'components/QuestionAnalysisPanel';

import { bulkDeleteQuestions, getPageQuestions, updateQuestionTitle } from 'api/client';
import { ThemeProvider } from 'theme/theme-provider';

vi.mock('api/client', () => ({
  getPageQuestions: vi.fn(),
  updateQuestionTitle: vi.fn(),
  updateManualQuestionTitle: vi.fn(),
  bulkDeleteQuestions: vi.fn(),
}));

const question = (k, title, y0) => ({
  question_id: `job-a:0:1:${k}`,
  question_num: 1,
  k,
  manual_id: null,
  title,
  is_manual: false,
  is_false_positive: false,
  thumbnail_url: `/api/jobs/job-a/pages/0/questions/1/thumbnail?k=${k}`,
  bbox: { x0: 50, y0, x1: 545, y1: y0 + 200 },
  col: 0,
});

const renderPanel = () =>
  render(
    <ThemeProvider>
      <QuestionAnalysisPanel jobId="job-a" pageNum={0} pageInfo={{}} columns={1} />
    </ThemeProvider>,
  );

/** 제목과 체크박스는 카드 상단 행에 함께 있다 */
const rowOf = (titleEl) => titleEl.parentElement;

beforeEach(() => {
  getPageQuestions.mockReset();
  updateQuestionTitle.mockReset();
  bulkDeleteQuestions.mockReset();
  getPageQuestions.mockResolvedValue({ questions: [question(0, '위제목', 100), question(1, '아래제목', 400)] });
  updateQuestionTitle.mockResolvedValue({});
  bulkDeleteQuestions.mockResolvedValue({ deleted_auto: 1, deleted_manual: 0 });
});

describe('같은 번호 공존 문항의 k', () => {
  it('[B20-26] 아래 문항(k=1) 제목 수정은 updateQuestionTitle 에 k=1 을 넘긴다', async () => {
    renderPanel();
    fireEvent.doubleClick(await screen.findByText('아래제목'));
    const input = await screen.findByDisplayValue('아래제목');
    fireEvent.change(input, { target: { value: '새제목' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(updateQuestionTitle).toHaveBeenCalledWith('job-a', 0, 1, '새제목', 1);
  });

  it('[B20-27] 아래 문항만 체크해 삭제하면 bulkDeleteQuestions 에 [{num:1,k:1}] 을 넘긴다', async () => {
    renderPanel();
    fireEvent.click(within(rowOf(await screen.findByText('아래제목'))).getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /삭제/ }));
    expect(bulkDeleteQuestions).toHaveBeenCalledWith('job-a', 0, [{ num: 1, k: 1 }], []);
  });
});
