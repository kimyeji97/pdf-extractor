/**
 * 페이지 목록을 선택된 쪽으로 스크롤 (REQ-F18 Phase 2)
 *
 * `work.jsx`는 API mock 5~6개가 필요해 렌더 무대가 없어(PLAN-B12 § 제약·함정) 이 판정을
 * 순수 함수로 뺐다 — `targetPage.js`의 `resolveTargetPage`, D10의 `columnsForWidth`,
 * B12의 `resolveDocumentName`과 같은 패턴.
 *
 * ⚠️ **진입(`?page=`) 경로에서만 부른다.** `selectedPage`가 바뀌는 경로는 셋이고
 *    (목록 클릭 · **뷰어 스크롤 역동기화**(250ms 디바운스) · 복원), 선택 변경을 트리거로
 *    삼으면 **사용자가 뷰어를 스크롤할 때마다 왼쪽 목록이 제멋대로 끌려간다.**
 *    F18-09가 그 자리를 지킨다.
 *
 * ⚠️ 이 목록은 **가상화가 아니다** — 212개 항목이 전부 렌더되므로 계약 #7(가상화
 *    `scrollToPage`의 0px 누적)은 여기 안 걸린다. B25와 증상이 비슷하다고 그 해법을
 *    끌어오지 말 것.
 */

/**
 * @param {HTMLElement|null} container  `data-page-num` 항목들을 담은 스크롤 컨테이너
 * @param {number|null|undefined} pageNum  0-based 쪽 번호
 */
export function pageListScroll(container, pageNum) {
  if (!container || pageNum == null) return;

  const item = container.querySelector(`[data-page-num="${pageNum}"]`);
  // 목록이 아직 안 그려졌거나 범위 밖이면 조용히 끝낸다 — 던지면 진입 자체가 깨진다.
  if (!item) return;

  // `block: "center"` — 앞·뒤 페이지가 같이 보여 맥락이 산다(계획서 § 결정).
  // `inline: "nearest"` 는 가로축을 건드리지 않기 위한 것이다.
  item.scrollIntoView({ block: "center", inline: "nearest" });
}
