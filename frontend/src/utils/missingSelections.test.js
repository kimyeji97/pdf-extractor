/**
 * REQ-28 Phase 5 — 편집 복원 때 쓸 수 없는 선택 고르기
 *
 * 검증 계약: docs/plans/PLAN-28-analysis-sharing.md `## 검증 계약` (28-34~35)
 *
 * 입력 `questionsByJob` 은 job 마다 지금 있는 문항 ID 배열, 접근 못 하면 null 이다.
 * 저장된 선택에는 옛 3자리 ID(`{job}:{page}:{num}`)가 남아 있고 API 는 4자리(`…:{k}`)를 준다(ADR-0006, k 없으면 0).
 */
import { describe, expect, it } from 'vitest';

import { missingQuestionIds } from 'utils/missingSelections';

describe('missingQuestionIds', () => {
  it('[28-34] 옛 3자리 ID도 k=0으로 맞춰 보고, 지워진 문항만 고른다', () => {
    const basket = [{ questionId: 'j1:0:1', jobId: 'j1' }, { questionId: 'j1:0:2:0', jobId: 'j1' }];

    const missing = missingQuestionIds(basket, { j1: ['j1:0:1:0'] });

    expect([...missing]).toEqual(['j1:0:2:0']);
  });

  it('[28-35] 접근 못 하는 job 의 선택은 전부 고른다', () => {
    const basket = [
      { questionId: 'j1:0:1:0', jobId: 'j1' },
      { questionId: 'j2:0:manual:m1', jobId: 'j2' },
    ];

    const missing = missingQuestionIds(basket, { j1: ['j1:0:1:0'], j2: null });

    expect([...missing]).toEqual(['j2:0:manual:m1']);
  });
});
