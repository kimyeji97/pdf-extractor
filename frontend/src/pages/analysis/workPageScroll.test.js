/**
 * REQ-F12 Phase 3 — 아코디언에서 넘어온 대상 페이지로 자동 스크롤 (소스 스캔)
 *
 * 검증 계약: docs/plans/PLAN-F12-detection-stats-dashboard.md `## 검증 계약` (F12-39~40)
 *
 * `work.jsx`는 API mock 5~6개가 필요해 렌더 무대가 없다(PLAN-B12 § 제약·함정, D11-06·07과
 * 같은 결론 — `workEntryName.test.js`·`menuRename.test.jsx` 참조). 대상 페이지를 찾는 로직
 * 자체는 순수 함수로 뺐고(`targetPage.test.js`가 렌더 없이 완전히 덮는다), 여기서는
 * `work.jsx`가 그 함수를 실제로 불러 기존 스크롤 경로(`handlePageClick`)로 넘기는
 * **배선**만 소스 문자열로 확인한다 — 이 파일이 확인하는 건 "연결돼 있다"이지 "정확히
 * 스크롤된다"가 아니다(그건 렌더 무대가 없어 이 레포에서 검증 불가능한 영역).
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/** 블록 주석과 줄 끝 `//` 주석을 걷어낸다 — workEntryName.test.js와 동일 기법. */
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const workSource = () => stripComments(readFileSync('src/pages/analysis/work.jsx', 'utf-8'));

describe('work.jsx가 대상 페이지 판정 함수를 불러와 스크롤에 넘긴다 (Phase 3)', () => {
  it('[F12-39] resolveTargetPage를 utils/targetPage에서 불러와 쓴다', () => {
    const code = workSource();

    expect(code).toMatch(
      /import\s*\{[^}]*resolveTargetPage[^}]*\}\s*from\s*["']utils\/targetPage["']/,
    );
  });

  it('[F12-40] resolveTargetPage(pages, ...) 결과를 handlePageClick으로 넘기는 배선이 있다', () => {
    const code = workSource();

    // pages가 로드된 뒤 판정해야 하므로 pages를 그대로 인자로 받는 호출이어야 한다.
    const idx = code.indexOf('resolveTargetPage(pages');
    expect(idx).toBeGreaterThan(-1);

    // 같은 이펙트 블록 안에서 기존 스크롤 경로(handlePageClick)로 이어지는지 근접 검사.
    const nearby = code.slice(idx, idx + 400);
    expect(nearby).toContain('handlePageClick(');
  });
});
