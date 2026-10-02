/**
 * REQ-B26 재작업 — 재감지 전에 대기 삭제를 확정한다
 *
 * 검증 계약: docs/plans/PLAN-B26-delete-undo-restore.md `## 검증 계약` (B26-14)
 *
 * `work.jsx` 는 렌더 무대가 없다(API mock 5~6개) — `utils/questionName.test.js` 처럼 소스를 읽어 순서만 본다.
 * 지연 삭제는 옛 경계의 (번호, k)로 지목하므로 재감지 요청보다 **먼저** 끝나야 한다.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/** 블록 주석과 줄 끝 `//` 주석을 걷어낸다 — 실행되는 코드만 남긴다. */
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

describe('재감지 전 대기 삭제 확정 (B26)', () => {
  it('[B26-14] handleRefresh 가 refreshJobQuestions 전에 flushPendingDeletes 를 기다린다', () => {
    const src = stripComments(readFileSync(join('src', 'pages/analysis/work.jsx'), 'utf-8'));
    const start = src.indexOf('const handleRefresh');
    const body = src.slice(start, src.indexOf('}, [', start));
    const flushAt = body.indexOf('await flushPendingDeletes(');
    const refreshAt = body.indexOf('refreshJobQuestions(');

    expect({ found: start >= 0 && flushAt >= 0, flushFirst: flushAt >= 0 && flushAt < refreshAt })
      .toEqual({ found: true, flushFirst: true });
  });
});
