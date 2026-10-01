/**
 * REQ-C10 Phase 2 — 분석 패널의 표시 이름·이름 수정 입력란
 *
 * 검증 계약: docs/plans/PLAN-C10-question-source-title.md `## 검증 계약`
 * 케이스: C10-25 · C10-26 · C10-27 · C10-29 · C10-30
 *
 * 무대: 이름 없고 원문 `유형 01`인 자동 문항 하나. 카드 제목은 `문항 유형 01`, 수정 입력란은 고정 접두어 "문항" 뒤에
 * 보이는 그대로(`유형 01`)를 채운다. 바꾸지 않고 저장하면 원문이 사용자 이름으로 굳지 않게 저장하지 않는다(2026-10-01 결정).
 * 앱과 같은 `ThemeProvider` 아래에서 렌더한다(계약 #25).
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import QuestionAnalysisPanel from 'components/QuestionAnalysisPanel';

import { getPageQuestions, updateQuestionTitle } from 'api/client';
import { ThemeProvider } from 'theme/theme-provider';

vi.mock('api/client', () => ({
  getPageQuestions: vi.fn(),
  updateQuestionTitle: vi.fn(),
  updateManualQuestionTitle: vi.fn(),
  bulkDeleteQuestions: vi.fn(),
}));

const question = {
  question_id: 'job-a:0:1:0',
  question_num: 1,
  k: 0,
  manual_id: null,
  title: null,
  source_text: '유형 01',
  is_manual: false,
  is_false_positive: false,
  thumbnail_url: '/api/jobs/job-a/pages/0/questions/1/thumbnail?k=0',
  bbox: { x0: 50, y0: 100, x1: 545, y1: 300 },
  col: 0,
};

const renderPanel = () =>
  render(
    <ThemeProvider>
      <QuestionAnalysisPanel jobId="job-a" pageNum={0} pageInfo={{}} columns={1} />
    </ThemeProvider>,
  );

/** 카드 제목을 더블클릭해 수정 입력란을 연다 */
const openEdit = async () => {
  fireEvent.doubleClick(await screen.findByText('문항 유형 01'));
  return screen.findByRole('textbox');
};

beforeEach(() => {
  getPageQuestions.mockReset();
  updateQuestionTitle.mockReset();
  getPageQuestions.mockResolvedValue({ questions: [question] });
  updateQuestionTitle.mockResolvedValue({});
});

describe('표시 이름', () => {
  it('[C10-25] 이름 없고 원문이 있는 카드 제목은 "문항 유형 01"', async () => {
    renderPanel();
    expect(await screen.findByText('문항 유형 01')).toBeTruthy();
  });
});

describe('이름 수정 입력란', () => {
  it('[C10-26] 고정 접두어 "문항"이 입력값 밖에 붙어 있다', async () => {
    renderPanel();
    const input = await openEdit();
    expect(within(input.closest('.MuiInputBase-root')).getByText('문항')).toBeTruthy();
  });

  it('[C10-27] "심화"를 입력해 저장하면 updateQuestionTitle 에 "심화"만 넘긴다', async () => {
    renderPanel();
    const input = await openEdit();
    fireEvent.change(input, { target: { value: '심화' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(updateQuestionTitle).toHaveBeenCalledWith('job-a', 0, 1, '심화', 0);
  });

  it('[C10-29] 이름 없는 문항의 처음 값은 보이는 그대로(원문)', async () => {
    renderPanel();
    expect((await openEdit()).value).toBe('유형 01');
  });

  it('[C10-30] 바꾸지 않고 저장하면 저장하지 않는다', async () => {
    renderPanel();
    fireEvent.keyDown(await openEdit(), { key: 'Enter' });
    expect(updateQuestionTitle).not.toHaveBeenCalled();
  });
});
