/**
 * REQ-B26 Phase 1 — 문항 삭제 지연 + [되돌리기] 복원
 *
 * 검증 계약: docs/plans/PLAN-B26-delete-undo-restore.md `## 검증 계약` (B26-01~09)
 *
 * 삭제는 화면에서 먼저 숨기고 4초 토스트가 닫힐 때 서버에 보낸다. 되돌리면 숨긴 것만 되살린다(서버 요청 없음).
 * 무대는 `QuestionAnalysisPanel.test.jsx` 와 같다(`ThemeProvider` 아래 렌더, 계약 #25).
 * ⚠️ 가짜 타이머를 쓰므로 `waitFor` 를 쓰지 않는다 — 내부 폴링 타이머가 측정 대상에 섞인다(계약 #25). `act` 로 플러시한다.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import QuestionAnalysisPanel from 'components/QuestionAnalysisPanel';

import { bulkDeleteQuestions, getPageQuestions } from 'api/client';
import { ThemeProvider } from 'theme/theme-provider';

vi.mock('api/client', () => ({
  getPageQuestions: vi.fn(),
  updateQuestionTitle: vi.fn(),
  updateManualQuestionTitle: vi.fn(),
  bulkDeleteQuestions: vi.fn(),
}));

const auto = (num, extra = {}) => ({
  question_id: `job-a:1:${num}:0`,
  question_num: num,
  k: 0,
  page_num: 1,
  title: `자동${num}`,
  is_manual: false,
  is_false_positive: false,
  thumbnail_url: `/api/jobs/job-a/pages/1/questions/${num}/thumbnail`,
  ...extra,
});

const manual = (id) => ({
  question_id: `job-a:1:manual:${id}`,
  manual_id: id,
  page_num: 1,
  title: `수동${id}`,
  is_manual: true,
  is_false_positive: false,
  thumbnail_url: `/api/jobs/job-a/pages/1/questions/manual/${id}/thumbnail`,
});

const ui = (props) => (
  <ThemeProvider>
    <QuestionAnalysisPanel jobId="job-a" pageNum={1} pageInfo={{}} {...props} />
  </ThemeProvider>
);

const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

/** 문항 체크박스 — 0번은 전체 선택이라 i+1 */
const checkItem = (i) => fireEvent.click(screen.getAllByRole('checkbox')[i + 1]);
const checkAll = () => fireEvent.click(screen.getAllByRole('checkbox')[0]);
const pressDelete = () => act(async () => { fireEvent.click(screen.getByRole('button', { name: /삭제/ })); });
const pressUndo = () => act(async () => { fireEvent.click(screen.getByRole('button', { name: '되돌리기' })); });
const elapse = (ms) => act(async () => { vi.advanceTimersByTime(ms); await Promise.resolve(); });

/** 서버처럼 응답한다 — 삭제 요청이 오면 그 문항을 목록에서 뺀다. 되돌리기가 "서버를 다시 읽기"면 문항이 안 돌아온다 */
const mount = async (questions, props) => {
  let served = [...questions];
  getPageQuestions.mockImplementation(async () => ({ questions: served }));
  bulkDeleteQuestions.mockImplementation(async (_job, _page, refs, ids) => {
    served = served.filter((q) =>
      q.is_manual ? !ids.includes(q.manual_id) : !refs.some((r) => r.num === q.question_num && r.k === (q.k ?? 0)));
    return {};
  });
  const view = render(ui(props));
  await flush();
  return view;
};

beforeEach(() => {
  vi.useFakeTimers();
  getPageQuestions.mockReset();
  bulkDeleteQuestions.mockReset();
  bulkDeleteQuestions.mockResolvedValue({});
});

afterEach(() => {
  vi.useRealTimers();
});

describe('삭제 지연 + 되돌리기 (B26)', () => {
  it('[B26-01] 삭제 직후 목록에서 사라지고, 토스트 동안 서버 삭제를 부르지 않는다', async () => {
    await mount([auto(1), auto(2)]);

    checkItem(0);
    await pressDelete();
    await elapse(3000);

    expect({ shown: screen.queryAllByText(/자동1/).length, calls: bulkDeleteQuestions.mock.calls.length })
      .toEqual({ shown: 0, calls: 0 });
  });

  it('[B26-02] 되돌리기 뒤 4초가 지나도 서버 삭제 0회', async () => {
    await mount([auto(1)]);

    checkItem(0);
    await pressDelete();
    await pressUndo();
    await elapse(5000);

    expect(bulkDeleteQuestions).not.toHaveBeenCalled();
  });

  it('[B26-03] 오탐 문항을 지웠다 되돌리면 오탐지 의심 표시가 그대로 보인다', async () => {
    await mount([auto(1, { is_false_positive: true })]);

    checkItem(0);
    await pressDelete();
    await pressUndo();

    expect(screen.getByText('오탐지 의심')).toBeInTheDocument();
  });

  it('[B26-04] 수동 문항을 지웠다 되돌리면 다시 나타난다', async () => {
    await mount([manual('m1')]);

    checkItem(0);
    await pressDelete();
    await pressUndo();

    expect(screen.getByText('수동')).toBeInTheDocument();
  });

  it('[B26-05] 토스트가 닫히면(4초) 서버 삭제를 정확히 1회 부른다', async () => {
    await mount([auto(1)]);

    checkItem(0);
    await pressDelete();
    await elapse(4000);
    await elapse(4000);

    expect(bulkDeleteQuestions).toHaveBeenCalledTimes(1);
  });

  it('[B26-06] 토스트 중 화면을 떠나면 대기 중 삭제를 즉시 1회 보낸다', async () => {
    const { unmount } = await mount([auto(1)]);

    checkItem(0);
    await pressDelete();
    await act(async () => { unmount(); });

    expect(bulkDeleteQuestions).toHaveBeenCalledTimes(1);
  });

  it('[B26-07] 토스트 중 또 삭제하면 앞 삭제가 즉시 1회 확정된다(앞 문항만)', async () => {
    await mount([auto(1), auto(2)]);

    checkItem(0);
    await pressDelete();
    checkItem(0); // 남은 자동2
    await pressDelete();

    expect(bulkDeleteQuestions.mock.calls).toEqual([['job-a', 1, [{ num: 1, k: 0 }], []]]);
  });

  it('[B26-08] 토스트 중 쪽을 옮기면 앞 삭제가 원래 쪽 번호로 1회 확정된다', async () => {
    const { rerender } = await mount([auto(1)]);

    checkItem(0);
    await pressDelete();
    getPageQuestions.mockResolvedValue({ questions: [] });
    await act(async () => { rerender(ui({ pageNum: 2 })); });
    await flush();

    expect(bulkDeleteQuestions.mock.calls).toEqual([['job-a', 1, [{ num: 1, k: 0 }], []]]);
  });

  it('[B26-09] 자동·수동을 함께 지우면 벌크 1회에 (번호, k) 목록과 수동 id 목록을 담는다', async () => {
    await mount([auto(3, { k: 1, question_id: 'job-a:1:3:1' }), manual('m9')]);

    checkAll();
    await pressDelete();
    await elapse(4000);

    expect(bulkDeleteQuestions.mock.calls).toEqual([['job-a', 1, [{ num: 3, k: 1 }], ['m9']]]);
  });
});
