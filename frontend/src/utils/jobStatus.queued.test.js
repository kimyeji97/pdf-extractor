/**
 * REQ-B17 Phase 3 — `QUEUED`(분석 슬롯 대기)의 진입·재감지 규칙
 *
 * 검증 계약: docs/plans/PLAN-B17-analysis-oom.md `## 검증 계약` (B17-18~19)
 *
 * `QUEUED`는 `PENDING`과 같은 규칙이다 — 아직 시작 전이라 기존 문항이 그대로 유효하므로 상세 진입은
 * 막지 않고, 이미 감지가 걸려 있으니 재감지는 막는다(`jobStatus.test.js`의 F11 규칙과 짝).
 */
import { describe, expect, it } from 'vitest';

import { isEntryBlocked, isRefreshBlocked } from 'utils/jobStatus';

const job = (boundariesStatus) => ({ job_id: 'job-q', boundaries_status: boundariesStatus });

describe('QUEUED', () => {
  it('[B17-18] QUEUED는 상세 진입을 막지 않는다', () => {
    expect(isEntryBlocked(job('QUEUED'))).toBe(false);
  });

  it('[B17-19] QUEUED면 재감지가 막힌다', () => {
    expect(isRefreshBlocked(job('QUEUED'))).toBe(true);
  });
});
