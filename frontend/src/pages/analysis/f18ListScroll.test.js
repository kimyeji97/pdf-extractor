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

/**
 * 이름 있는 선언의 본문 — **들여쓰기 2칸으로 시작하는 다음 최상위 구문** 전까지.
 *
 * ⚠️ `\n  const ` 로만 끊으면 안 된다 — `handlePageClick` 다음이 `useEffect` 라
 *    **진입 effect 까지 삼켜** 부정 단언이 거짓 실패한다(/testrun 에서 실측).
 *    `const`·`useEffect`·`function` 중 먼저 오는 것으로 끊는다.
 */
const blockOf = (code, decl) => {
  const start = code.indexOf(decl);
  expect(start).toBeGreaterThan(-1);
  const rest = code.slice(start + decl.length);
  const end = rest.search(/\n {2}(const |useEffect\(|function )/);
  // 끝을 못 찾으면 파일 전체를 훑어 부정 단언이 의미를 잃는다 (계약 #25 "0건은 초록색").
  expect(end).toBeGreaterThan(0);
  return rest.slice(0, end);
};

describe('목록 스크롤 배선 (Phase 2)', () => {
  /**
   * 진입 effect 본문 — `resolveTargetPage(pages` 부터 **그 effect 의 deps 배열**까지.
   *
   * ⚠️ 고정 창(400자)을 쓰면 안 된다 — effect 는 197자에서 끝나는데 400자는
   *    `handleViewerPageChange` 본문까지 닿아, **스크롤 호출을 그 핸들러 맨 위로 옮겨도
   *    F18-08 이 통과**했다(/review 회차 0 실측). 구문으로 닫는다.
   */
  const entryEffect = (code) => {
    const start = code.indexOf('resolveTargetPage(pages');
    expect(start).toBeGreaterThan(-1);
    const rest = code.slice(start);
    const end = rest.indexOf('}, [pages,');
    expect(end).toBeGreaterThan(0);
    return rest.slice(0, end);
  };

  it('[F18-08] 진입 effect 안에서 목록 스크롤을 부른다', () => {
    expect(entryEffect(workSource())).toMatch(/pageListScroll\(/);
  });

  it('[F18-10] 같은 `?page=` 로는 한 번만 스크롤한다', () => {
    // 이 effect 는 `pages` 가 deps 라 **재감지 완료가 fetchPages 를 다시 부르면 재실행된다**.
    // 가드가 없으면 사용자가 다른 쪽을 보던 중에 목록이 `?page=` 로 튄다(/review 회차 0 의 (b)).
    const effect = entryEffect(workSource());
    const call = effect.indexOf('pageListScroll(');
    expect(call).toBeGreaterThan(-1);

    // 호출보다 **앞에서** 이미 처리한 키와 비교해 걸러야 한다.
    const before = effect.slice(0, call);
    expect(before).toMatch(/entryScrollRef\.current !==/);
    // ⚠️ 비교만 보면 **대입을 지운 구현**(가드가 영원히 참 → 매번 스크롤)이 통과한다
    //    (/review 회차 1 변형 실측). 키를 실제로 찍는지까지 본다.
    expect(before).toMatch(/entryScrollRef\.current\s*=\s*entryKey/);
  });

  it('[F18-09] 선택 변경 핸들러에서는 목록을 스크롤하지 않는다', () => {
    // 여기에 넣으면 뷰어를 스크롤할 때마다 목록이 끌려간다(계획서 § 제약·함정).
    const code = workSource();

    expect(blockOf(code, 'const handleViewerPageChange')).not.toMatch(/pageListScroll\(/);
    expect(blockOf(code, 'const handlePageClick')).not.toMatch(/pageListScroll\(/);
  });
});
