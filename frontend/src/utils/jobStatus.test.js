/**
 * REQ-F11 Phase 2 — 목록·상세가 같은 규칙을 쓴다
 *
 * 검증 계약: docs/plans/PLAN-F11-analysis-detail-entry-guard.md `## 검증 계약` (F11-08~10)
 *
 * 판정을 순수 함수로 둔 이유는 **두 화면이 같은 함수를 호출하게 하기 위해서**다.
 * 목록의 `isAnalyzing()`과 상세의 가드가 각자 조건을 들고 있으면, 한쪽만 고쳐도 아무도
 * 모른 채 규칙이 갈라진다 — 이 REQ가 메우려는 구멍이 바로 그렇게 생겼다.
 */
import { describe, expect, it } from 'vitest';

import { isEntryBlocked, isRefreshBlocked } from 'utils/jobStatus';

const job = (boundariesStatus) => ({ job_id: 'job-a', boundaries_status: boundariesStatus });

describe('isEntryBlocked', () => {
  it('[F11-08] PENDING은 차단 대상이 아니다', () => {
    // 대기 중은 아직 시작되지 않은 상태라 기존 문항이 그대로 유효하다 — 볼 수 있는 화면을 막지 않는다.
    expect(isEntryBlocked(job('PENDING'))).toBe(false);
  });

  it('[F11-09] PROCESSING은 여전히 차단된다', () => {
    expect(isEntryBlocked(job('PROCESSING'))).toBe(true);
  });
});

describe('isRefreshBlocked', () => {
  it('[F11-10] PENDING이면 재감지가 막힌다', () => {
    expect(isRefreshBlocked(job('PENDING'))).toBe(true);
  });
});
