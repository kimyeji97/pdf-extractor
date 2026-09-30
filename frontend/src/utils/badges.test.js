/**
 * REQ-F14 Phase 2 — 뱃지 색·이름 단일 정의
 *
 * 검증 계약: docs/plans/PLAN-F14-stats-board-and-badges.md `## 검증 계약` (F14-12~17)
 *
 * 같은 "분석 중"이 현황판 info · 목록 뱃지 warning · 편집 화면 "감지 중…"이었고, "수동"은 secondary·info·primary 세 색이었다.
 * 규칙(2026-09-30 사용자 결정): 감지 상태 = 대기 default "대기 중" · 분석 중 info · 실패 error "분석 실패" · 완료 success("N문항").
 * 표식 = 오탐 warning · 수동 secondary. 그 외 정보성 칩 = primary 테두리형.
 */
import { describe, expect, it } from 'vitest';

import { INFO_CHIP, MARK_COLOR, detectionBadge } from 'utils/badges';

describe('detectionBadge', () => {
  it.each(['PENDING', 'QUEUED'])('[F14-12] %s → 대기 중 · default', (status) => {
    expect(detectionBadge(status)).toEqual({ label: '대기 중', color: 'default' });
  });

  it('[F14-13] PROCESSING → 분석 중 · info', () => {
    expect(detectionBadge('PROCESSING')).toEqual({ label: '분석 중', color: 'info' });
  });

  it('[F14-14] FAILED → 분석 실패 · error', () => {
    expect(detectionBadge('FAILED')).toEqual({ label: '분석 실패', color: 'error' });
  });

  it('[F14-15] DONE + 문항 12개 → 12문항 · success', () => {
    expect(detectionBadge('DONE', 12)).toEqual({ label: '12문항', color: 'success' });
  });
});

describe('표식·정보성 칩', () => {
  it('[F14-16] 오탐 = warning · 수동 = secondary', () => {
    expect(MARK_COLOR).toEqual({ falsePositive: 'warning', manual: 'secondary' });
  });

  it('[F14-17] 정보성 칩 = primary 테두리형', () => {
    expect(INFO_CHIP).toEqual({ color: 'primary', variant: 'outlined' });
  });
});
