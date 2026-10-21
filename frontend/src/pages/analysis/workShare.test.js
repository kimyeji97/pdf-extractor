/**
 * REQ-28 Phase 5 — 작업 화면의 역할별 컨트롤 (소스 스캔)
 *
 * 검증 계약: docs/plans/PLAN-28-analysis-sharing.md `## 검증 계약` (28-42)
 * `work.jsx`는 렌더 무대가 없다(B12·D11과 같은 사정). 판정 자체는 `utils/jobRole.test.js`가 보고,
 * 여기서는 화면이 그 판정으로 버튼을 가르는 배선만 본다. 문법 오류는 못 잡으므로 `npm run build`를 따로 돌린다.
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const code = stripComments(readFileSync('src/pages/analysis/work.jsx', 'utf-8'));

describe('작업 화면 역할 배선', () => {
  it('[28-42] 재감지는 isOwner, 수동 추가·문항 편집은 canEdit 으로 가른다', () => {
    expect([
      /isOwner\(jobInfo\)/.test(code),
      /canEdit\(jobInfo\)/.test(code),
      /readOnly=\{!\s*editable\}/.test(code),
    ]).toEqual([true, true, true]);
  });
});
