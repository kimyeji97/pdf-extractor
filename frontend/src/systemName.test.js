/**
 * REQ-D12 Phase 1 — 시스템 이름 변경 (오답 클립북) — 소스 스캔
 *
 * 검증 계약: docs/plans/PLAN-D12-system-rename.md `## 검증 계약` (D12-01, D12-03)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const sourceFiles = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  if (statSync(path).isDirectory()) return sourceFiles(path);
  return /\.(jsx?|tsx?)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
});

describe('REQ-D12 시스템 이름', () => {
  it('[D12-01] index.html <title>이 오답 클립북이다', () => {
    const html = readFileSync('index.html', 'utf-8');
    expect(html.match(/<title>(.*?)<\/title>/)?.[1]).toBe('오답 클립북');
  });

  it('[D12-03] frontend(index.html + src)에 옛 이름 PDF 문항 추출기가 없다', () => {
    const files = ['index.html', ...sourceFiles('src')];
    const hits = files.filter((f) => readFileSync(f, 'utf-8').includes('PDF 문항 추출기'));
    expect(hits).toEqual([]);
  });
});
