/**
 * REQ-F18 Phase 2 — 진입 시 페이지 목록을 선택된 쪽으로 스크롤
 *
 * 검증 계약: docs/plans/PLAN-F18-split-download-and-list-scroll.md `## 검증 계약` (F18-05~07)
 *
 * `work.jsx`는 API mock 5~6개가 필요해 렌더 무대가 없다(PLAN-B12 § 제약·함정). 그래서
 * "어느 항목을 어떻게 스크롤하나"를 순수 함수로 뺐다 — `targetPage.js`·`columnsForWidth`·
 * `resolveDocumentName`과 같은 패턴이고, 배선은 `workPageScroll.test.js`가 스캔한다.
 *
 * ⚠️ **"가운데에 실제로 오는지"는 여기서 검증할 수 없다** — jsdom에는 레이아웃이 없어
 *    `scrollIntoView`가 스텁이다. 이 파일이 덮는 것은 **어느 항목을 고르고 어떤 인자로
 *    부르는가**까지이고, 실제 위치는 **dev 육안** 몫이다(B25·F17과 같은 구조).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { pageListScroll } from 'utils/pageListScroll';

/** 페이지 목록 컨테이너를 만든다 — 항목마다 `data-page-num`(0-based)을 단다. */
const makeList = (pageNums) => {
  const container = document.createElement('div');
  for (const n of pageNums) {
    const item = document.createElement('div');
    item.dataset.pageNum = String(n);
    item.scrollIntoView = vi.fn();
    container.appendChild(item);
  }
  document.body.appendChild(container);
  return container;
};

const itemAt = (container, pageNum) =>
  container.querySelector(`[data-page-num="${pageNum}"]`);

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('pageListScroll', () => {
  it('[F18-05] 그 쪽 항목을 찾아 스크롤한다', () => {
    const container = makeList([0, 1, 2, 3]);

    pageListScroll(container, 2);

    expect(itemAt(container, 2).scrollIntoView).toHaveBeenCalled();
  });

  it('[F18-06] 목록 가운데로 오도록 block: "center" 로 부른다', () => {
    // 끝에 붙으면 앞뒤 페이지 맥락이 사라진다(계획서 § 결정).
    const container = makeList([0, 1, 2, 3]);

    pageListScroll(container, 2);

    expect(itemAt(container, 2).scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: 'center' }),
    );
  });

  it('[F18-07] 그 쪽 항목이 없으면 아무것도 하지 않는다', () => {
    // 목록이 아직 안 그려졌거나 범위 밖인 경우 — 던지면 진입 자체가 깨진다.
    const container = makeList([0, 1]);

    expect(() => pageListScroll(container, 7)).not.toThrow();
    expect(itemAt(container, 0).scrollIntoView).not.toHaveBeenCalled();
    expect(itemAt(container, 1).scrollIntoView).not.toHaveBeenCalled();
  });
});
