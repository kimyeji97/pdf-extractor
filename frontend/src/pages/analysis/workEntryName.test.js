/**
 * REQ-B12 Phase 1 — 작업 화면 문서 이름 출처를 jobInfo 하나로 (소스 스캔)
 *
 * 검증 계약: docs/plans/PLAN-B12-work-entry-name.md `## 검증 계약` (B12-05~07)
 *
 * `work.jsx`는 API mock 5~6개가 필요해 렌더 무대가 없다(D11 때와 같은 사정, PLAN §제약·함정).
 * 이름을 만드는 로직 자체는 `utils/documentName.test.js`가 보고, 여기서는 화면 소스가
 * "옛 출처(location.state)를 더 이상 읽지 않는다"·"목록이 더 이상 state를 안 넘긴다"·
 * "getJobInfo를 새로 부르지 않는다(가드가 유일 호출자)"는 배선 자체를 소스 스캔으로 확인한다.
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/** 블록 주석과 줄 끝 `//` 주석을 걷어낸다 — 렌더되는/실행되는 코드만 남긴다. */
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

describe('작업 화면이 옛 이름 출처(location.state)를 읽지 않는다 (Phase 1)', () => {
  it('[B12-05] work.jsx가 state?.filename·state?.workbookName을 읽지 않는다', () => {
    const code = stripComments(readFileSync('src/pages/analysis/work.jsx', 'utf-8'));
    expect(code).not.toMatch(/state\??\.\s*filename/);
    expect(code).not.toMatch(/state\??\.\s*workbookName/);
  });

  it('[B12-07] work.jsx가 getJobInfo를 새로 부르지 않는다 (가드가 유일 호출자)', () => {
    const code = stripComments(readFileSync('src/pages/analysis/work.jsx', 'utf-8'));
    expect(code).not.toContain('getJobInfo');
  });
});

describe('목록 카드 클릭이 더 이상 이름을 state로 넘기지 않는다 (Phase 1)', () => {
  it('[B12-06] analysis/index.jsx의 handleCardClick이 navigate에 state를 넘기지 않는다', () => {
    const code = stripComments(readFileSync('src/pages/analysis/index.jsx', 'utf-8'));
    const match = code.match(/const handleCardClick = \(job\) => \{([\s\S]*?)\n  \};/);
    expect(match).not.toBeNull();
    expect(match[1]).not.toMatch(/state\s*:/);
  });
});
