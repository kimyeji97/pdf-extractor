/**
 * REQ-D10 Phase 1 — 문항 목록 그리드 열 수 + 제목 툴팁
 *
 * 검증 계약: docs/plans/PLAN-D10-question-grid-columns.md `## 검증 계약` (D10-05~07)
 *
 * 열 수는 부모(`work.jsx`)가 `columns` prop으로 넘긴다 — 이 패널은 너비를 재지 않는다.
 * 그래서 `ResizeObserver` mock이 없다. **필요해졌다면 결정과 어긋난 구현이다**(계획서 함정).
 *
 * ⚠️ jsdom은 레이아웃을 하지 않는다 — "이미지 폭이 열 폭을 따른다"는 여기서 못 잰다.
 *    그리드 컨테이너의 `data-columns` 속성만 단언하고, 실제 폭·잘림은 Phase 2 육안이 맡는다.
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

const LONG_TITLE = '2024 수능 수학 홀수형 15번 — 말줄임될 만큼 긴 사용자 제목';

const question = (extra = {}) => ({
  question_id: 'job-a:1:1',
  question_num: 1,
  page_num: 1,
  title: LONG_TITLE,
  is_manual: false,
  is_false_positive: false,
  thumbnail_url: '/api/jobs/job-a/pages/1/questions/1/thumbnail',
  ...extra,
});

/**
 * 앱과 같은 테마 아래에서 렌더한다.
 *
 * ⚠️ `ThemeProvider` 없이 렌더하면 `tint.js`가 `theme.vars.palette`를 읽다 죽는다 —
 *    구현 결함이 아니라 앱과 다른 무대다(계약 #25).
 */
const renderPanel = (props) =>
  render(
    <ThemeProvider>
      <QuestionAnalysisPanel jobId="job-a" pageNum={1} pageInfo={{}} {...props} />
    </ThemeProvider>,
  );

const gridContainer = (container) => container.querySelector('[data-columns]');

beforeEach(() => {
  getPageQuestions.mockReset();
  getPageQuestions.mockResolvedValue({ questions: [question()] });
});

describe('그리드 열 수 (columns prop → data-columns)', () => {
  it('[D10-05] columns={1} → 그리드 컨테이너 data-columns="1"', async () => {
    const { container } = renderPanel({ columns: 1 });
    await screen.findByText(LONG_TITLE);
    expect(gridContainer(container)).toHaveAttribute('data-columns', '1');
  });

  it('[D10-06] columns={2} → 그리드 컨테이너 data-columns="2"', async () => {
    const { container } = renderPanel({ columns: 2 });
    await screen.findByText(LONG_TITLE);
    expect(gridContainer(container)).toHaveAttribute('data-columns', '2');
  });
});

describe('카드 제목 툴팁', () => {
  it('[D10-07] 오탐 아닌 문항의 제목 요소 title 속성에 전체 제목이 들어 있다', async () => {
    // 현행은 오탐 문항만 제목을 보여 주고 나머지는 "더블클릭하여 타이틀 수정" 고정이라
    // 말줄임된 긴 제목을 읽을 방법이 없었다. 2열(카드 ~192px)에서 매 긴 제목마다 드러난다.
    renderPanel({ columns: 2 });
    const title = await screen.findByText(LONG_TITLE);
    expect(title.getAttribute('title')).toContain(LONG_TITLE);
  });
});
