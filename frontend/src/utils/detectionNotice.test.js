/**
 * REQ-B22 Phase 2 — 경계 캐시가 없는 job 의 작업 화면 안내
 *
 * 검증 계약: docs/plans/PLAN-B22-missing-boundaries-cache.md `## 검증 계약` (B22-04~09)
 *
 * `work.jsx`는 렌더 무대가 없어(API mock 5~6개 필요) 안내 판정을 순수 함수로 떼어 본다 — B12 `documentName` 선례.
 * 입력: 진입 가드가 읽은 `jobInfo`(`boundaries_status`·`error`)와 자동 감지 문항 수. 출력: 안내가 없으면 null,
 * 있으면 `{ message, detail }` — `detail`은 본문 아래 작은 글씨(서버 `error` 원문, 없으면 null).
 *
 * 조회 응답만으로는 "캐시 없음"과 "감지했는데 0개"를 구분할 수 없다 — DONE 0문항 안내는 "실패"라고 단정하지 않는다.
 */
import { describe, expect, it } from 'vitest';

import { detectionNotice } from 'utils/detectionNotice';

const FAILED_MESSAGE = '문항 감지에 실패했습니다. 재감지해 주세요.';

describe('detectionNotice — FAILED', () => {
  it('[B22-04] FAILED 면 본문은 고정 문구다', () => {
    const notice = detectionNotice({ boundaries_status: 'FAILED', error: null }, 0);
    expect(notice?.message).toBe(FAILED_MESSAGE);
  });

  it('[B22-05] FAILED 이고 error 가 있으면 보조 문구가 error 원문이다', () => {
    const error = 'PDFSyntaxError: No /Root object!';
    const notice = detectionNotice({ boundaries_status: 'FAILED', error }, 0);
    expect(notice?.detail).toBe(error);
  });

  it('[B22-06] FAILED 이고 error 가 없으면 보조 문구가 없다', () => {
    const notice = detectionNotice({ boundaries_status: 'FAILED', error: null }, 0);
    expect(notice?.detail ?? null).toBeNull();
  });
});

describe('detectionNotice — DONE 인데 자동 문항 0개', () => {
  it('[B22-07] 안내가 있고 재감지를 권한다', () => {
    const notice = detectionNotice({ boundaries_status: 'DONE', error: null }, 0);
    expect(notice?.message).toContain('재감지');
  });

  it('[B22-08] 안내에 "실패"라고 쓰지 않는다', () => {
    const notice = detectionNotice({ boundaries_status: 'DONE', error: null }, 0);
    expect(notice).not.toBeNull();
    expect(notice.message).not.toContain('실패');
  });
});

describe('detectionNotice — 안내 없음', () => {
  it.each([
    ['PROCESSING', 0],
    ['QUEUED', 0],
    ['DONE', 3],
  ])('[B22-09] %s · 자동 문항 %i개면 안내가 없다', (status, count) => {
    expect(detectionNotice({ boundaries_status: status, error: null }, count)).toBeNull();
  });
});
