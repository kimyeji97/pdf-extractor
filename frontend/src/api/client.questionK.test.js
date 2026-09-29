/**
 * REQ-B20 Phase 4 — 번호로 문항을 지목하는 클라이언트 함수가 k 를 싣는다 (ADR-0006)
 *
 * 검증 계약: docs/plans/PLAN-B20-invisible-number-and-id-collision.md `## 검증 계약`
 * 케이스: B20-23 ~ B20-25
 *
 * 한 쪽에 같은 번호가 공존한다("유형 01" 제목 ↔ "1."). 백엔드는 k 를 쿼리 `?k=`·벌크 삭제 `(num, k)` 쌍으로
 * 받고, 빠지면 k=0 으로 본다 — 프론트가 k 를 안 실으면 아래 경계를 고쳐도 위 경계가 바뀐다.
 * `api/client.js` 는 `fetch` 를 감싼 순수 함수라 `global.fetch` 모킹으로 URL·body 를 본다(REQ-30 관례).
 *
 * ⚠️ 함수 형태는 사용자 결정(2026-09-29): `updateQuestionTitle(jobId, pageNum, questionNum, title, k = 0)`,
 *    `deleteQuestion(jobId, pageNum, questionNum, k = 0)`, `bulkDeleteQuestions(jobId, pageNum, questions, manualIds)`
 *    — `questions` 는 `[{ num, k }]`, 옛 `question_nums` 는 보내지 않는다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { bulkDeleteQuestions, deleteQuestion, updateQuestionTitle } from 'api/client';

const jsonResponse = (body, { status = 200 } = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const lastCall = () => global.fetch.mock.calls.at(-1);

describe('k 를 싣는 클라이언트 함수', () => {
  it('[B20-23] updateQuestionTitle 은 k 를 쿼리 ?k= 로 싣는다', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ question_num: 1, title: '아래' }));
    await updateQuestionTitle('job-a', 0, 1, '아래', 1);
    expect(lastCall()[0]).toMatch(/\/jobs\/job-a\/pages\/0\/questions\/1\?k=1$/);
  });

  it('[B20-24] deleteQuestion 은 k 를 쿼리 ?k= 로 싣는다', async () => {
    global.fetch.mockResolvedValue(new Response(null, { status: 204 }));
    await deleteQuestion('job-a', 0, 1, 1);
    expect(lastCall()[0]).toMatch(/\/jobs\/job-a\/pages\/0\/questions\/1\?k=1$/);
  });

  it('[B20-25] bulkDeleteQuestions 는 자동 문항을 questions:[{num,k}] 로 보내고 question_nums 를 쓰지 않는다', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ deleted_auto: 1, deleted_manual: 0 }));
    await bulkDeleteQuestions('job-a', 0, [{ num: 1, k: 1 }], []);
    expect(JSON.parse(lastCall()[1].body)).toEqual({ questions: [{ num: 1, k: 1 }], manual_ids: [] });
  });
});
