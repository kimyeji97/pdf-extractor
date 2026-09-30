/**
 * REQ-B22 Phase 2 — 작업 화면이 감지 안내를 쓴다 (소스 스캔)
 *
 * 검증 계약: docs/plans/PLAN-B22-missing-boundaries-cache.md `## 검증 계약` (B22-10)
 *
 * `work.jsx`는 렌더 무대가 없다. 안내 판정은 `utils/detectionNotice.test.js`가 보고, 여기서는 화면이 그 함수를
 * 실제로 불러 쓰는지(배선)만 확인한다 — B12 `workEntryName.test.js`와 같은 방식.
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/** 블록 주석과 줄 끝 `//` 주석을 걷어낸다 — 렌더되는/실행되는 코드만 남긴다. */
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

describe('작업 화면 감지 안내 배선 (Phase 2)', () => {
  it('[B22-10] work.jsx가 detectionNotice를 import 해서 호출한다', () => {
    const code = stripComments(readFileSync('src/pages/analysis/work.jsx', 'utf-8'));
    expect(code).toMatch(/import\s*\{[^}]*\bdetectionNotice\b[^}]*\}\s*from\s*['"]utils\/detectionNotice['"]/);
    expect(code).toMatch(/\bdetectionNotice\s*\(/);
  });
});
