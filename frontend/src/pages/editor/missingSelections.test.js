/**
 * REQ-28 Phase 5 — 편집 복원 때 쓸 수 없는 문항 표시 (소스 스캔)
 *
 * 검증 계약: docs/plans/PLAN-28-analysis-sharing.md `## 검증 계약` (28-43)
 * `editor/index.jsx`는 렌더 무대가 없다. 고르는 로직은 `utils/missingSelections.test.js`가 본다.
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

describe('편집 복원 배선', () => {
  it('[28-43] 복원 때 missingQuestionIds 로 고르고 "삭제된 문항"을 그린다', () => {
    const editor = stripComments(readFileSync('src/pages/editor/index.jsx', 'utf-8'));
    const basket = stripComments(readFileSync('src/components/SelectionOrderPanel.jsx', 'utf-8'));

    expect([editor.includes('missingQuestionIds('), basket.includes('삭제된 문항')]).toEqual([true, true]);
  });
});
