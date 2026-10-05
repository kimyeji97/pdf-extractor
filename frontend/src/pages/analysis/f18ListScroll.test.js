/**
 * REQ-F18 Phase 2 — 목록 스크롤 배선 (소스 스캔)
 *
 * 검증 계약: docs/plans/PLAN-F18-split-download-and-list-scroll.md `## 검증 계약` (F18-08~09)
 *
 * `work.jsx`는 렌더 무대가 없다(PLAN-B12 § 제약·함정). 판정 자체는 순수 함수가 덮고
 * (`utils/pageListScroll.test.js`), 여기서는 **어디서 부르는가**만 본다 —
 * `workPageScroll.test.js`(F12-39·40)와 같은 2단 구성이다.
 *
 * ⚠️ **F18-09 가 이 REQ 의 핵심 방어다.** `selectedPage` 가 바뀌는 경로는 셋이고
 *    (목록 클릭 · **뷰어 스크롤 역동기화(250ms 디바운스)** · 복원), "선택되면 스크롤"로
 *    짜면 **사용자가 뷰어를 스크롤할 때마다 왼쪽 목록이 제멋대로 끌려간다**
 *    (계획서 § 제약·함정). 그래서 진입 경로에서만 불러야 한다.
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/** 블록 주석과 줄 끝 `//` 주석을 걷어낸다 — workPageScroll.test.js 와 동일 기법. */
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const workSource = () => {
  const code = stripComments(readFileSync('src/pages/analysis/work.jsx', 'utf-8'));
  expect(code.length).toBeGreaterThan(1000);   // 빈 스캔이 초록으로 보이는 것을 막는다
  return code;
};

/** 이름 있는 선언의 본문 — 다음 최상위 선언(`\n  const `) 전까지. */
const blockOf = (code, decl) => {
  const start = code.indexOf(decl);
  expect(start).toBeGreaterThan(-1);
  const rest = code.slice(start + decl.length);
  const end = rest.indexOf('\n  const ');
  // 끝을 못 찾으면 파일 전체를 훑어 부정 단언이 의미를 잃는다 (계약 #25 "0건은 초록색").
  expect(end).toBeGreaterThan(0);
  return rest.slice(0, end);
};

describe('목록 스크롤 배선 (Phase 2)', () => {
  it('[F18-08] 진입 effect 안에서 목록 스크롤을 부른다', () => {
    // 진입 effect 는 `?page=` 를 1회 처리하는 자리다 — resolveTargetPage 가 그 표지다.
    const code = workSource();
    const idx = code.indexOf('resolveTargetPage(pages');
    expect(idx).toBeGreaterThan(-1);

    expect(code.slice(idx, idx + 400)).toMatch(/pageListScroll\(/);
  });

  it('[F18-09] 선택 변경 핸들러에서는 목록을 스크롤하지 않는다', () => {
    // 여기에 넣으면 뷰어를 스크롤할 때마다 목록이 끌려간다(계획서 § 제약·함정).
    const code = workSource();

    expect(blockOf(code, 'const handleViewerPageChange')).not.toMatch(/pageListScroll\(/);
    expect(blockOf(code, 'const handlePageClick')).not.toMatch(/pageListScroll\(/);
  });
});
