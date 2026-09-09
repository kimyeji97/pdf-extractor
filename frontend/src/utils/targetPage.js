/**
 * 아코디언에서 넘어온 대상 페이지 판정 (REQ-F12 Phase 3)
 *
 * `work.jsx`는 API mock 5~6개가 필요해 렌더 무대가 없어(PLAN-B12 § 제약·함정) 이 로직을
 * 순수 함수로 뺐다 — D10의 `columnsForWidth`, B12의 `resolveDocumentName`과 같은 패턴.
 *
 * URL 쿼리 `page`는 사용자에게 보이는 1-based 번호("N페이지")이고, `pages` 배열의
 * `page_num`은 0-based다 — 여기서 그 변환을 한 곳에 고정한다.
 */

/**
 * @param {Array<{page_num: number}>} pages  현재 문서의 페이지 목록
 * @param {string|number|null|undefined} pageParam  URL의 `page` 쿼리 값(1-based)
 * @returns {{page_num: number}|null}  일치하는 페이지 객체, 없거나 범위 밖이면 null
 */
export function resolveTargetPage(pages, pageParam) {
  if (pageParam == null || pageParam === "") return null;

  const n = Number(pageParam);
  if (!Number.isInteger(n) || n < 1) return null;

  const pageIndex = n - 1;
  return pages.find((p) => p.page_num === pageIndex) || null;
}
