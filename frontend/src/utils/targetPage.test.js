/**
 * REQ-F12 Phase 3 — 아코디언 → 작업 화면 페이지 진입, 대상 페이지 판정
 *
 * 검증 계약: docs/plans/PLAN-F12-detection-stats-dashboard.md `## 검증 계약` (F12-36~38)
 *
 * `work.jsx`는 렌더 무대가 없어(PLAN-B12 § 제약·함정 — "API mock 5~6개가 필요해 렌더
 * 무대가 없다") 대상 페이지를 찾는 로직을 순수 함수로 뺐다 — D10의 `columnsForWidth`,
 * B12의 `resolveDocumentName`과 같은 패턴. 이 파일이 그 로직을 완전히 덮고,
 * `work.jsx` 쪽 배선은 `workPageScroll.test.js`가 소스 스캔으로 확인한다.
 */
import { describe, expect, it } from 'vitest';

import { resolveTargetPage } from 'utils/targetPage';

const pages = [
  { page_num: 0, width: 595, height: 842 },
  { page_num: 1, width: 595, height: 842 },
  { page_num: 2, width: 595, height: 842 },
];

describe('resolveTargetPage', () => {
  it('[F12-36] page 파라미터가 없으면 null', () => {
    expect(resolveTargetPage(pages, null)).toBeNull();
    expect(resolveTargetPage(pages, undefined)).toBeNull();
  });

  it('[F12-37] page=2(1-based)는 page_num=1 페이지 객체를 반환', () => {
    expect(resolveTargetPage(pages, '2')).toEqual(pages[1]);
  });

  it('[F12-38] 목록에 없는 페이지 번호는 null', () => {
    expect(resolveTargetPage(pages, '99')).toBeNull();
  });
});
