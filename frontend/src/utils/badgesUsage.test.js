/**
 * REQ-F14 Phase 2 — 뱃지 정의를 쓰는 곳 (소스 스캔)
 *
 * 검증 계약: docs/plans/PLAN-F14-stats-board-and-badges.md `## 검증 계약` (F14-18~20)
 *
 * 정의 자체는 `utils/badges.test.js`가 본다. 여기서는 ① 뱃지·칩을 그리는 화면이 그 정의를 import 하는지,
 * ② 옛 감지 상태 이름이 문자열로 남지 않았는지만 본다. 파일 안의 칩 하나하나가 정의를 쓰는지는 이 스캔이 못 본다 —
 * Phase 4 dev 육안으로 덮는다.
 *
 * 제외(2026-09-30 사용자 결정): 편집 화면 파일 목록의 **업로드 상태 칩**(`job.status` "처리 중")과 버튼 문구 "재감지 대기 중"(JSX 텍스트).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/** 블록 주석과 줄 끝 `//` 주석을 걷어낸다 — 실행되는 코드만 남긴다. */
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const read = (path) => stripComments(readFileSync(join('src', path), 'utf-8'));

/** 따옴표로 감싼 문자열 리터럴만 — JSX 본문 텍스트("재감지 대기 중" 버튼)는 걸리지 않는다. */
const stringLiterals = (code) => code.match(/(["'`])(?:(?!\1)[^\\\n]|\\.)*\1/g) ?? [];

const sourceFiles = (dir) => readdirSync(join('src', dir)).flatMap((name) => {
  const rel = `${dir}/${name}`;
  if (statSync(join('src', rel)).isDirectory()) return sourceFiles(rel);
  return /\.(jsx?|tsx?)$/.test(name) && !/\.test\./.test(name) ? [rel] : [];
});

const USERS = [
  'components/StatCards.jsx',
  'pages/analysis/index.jsx',
  'components/FileListPanel.jsx',
  'pages/analysis/work.jsx',
  'components/QuestionAnalysisPanel.jsx',
  'components/QuestionListPanel.jsx',
  'components/SelectionOrderPanel.jsx',
  'pages/editor/index.jsx',
  'pages/history/index.jsx',
];

describe('뱃지 정의 사용처', () => {
  it.each(USERS)('[F14-18] %s 가 utils/badges 를 import 한다', (path) => {
    expect(read(path)).toMatch(/from\s+['"]utils\/badges['"]/);
  });
});

describe('옛 감지 상태 이름', () => {
  it('[F14-19] "감지 중"·"감지 실패"·"감지 대기" 문자열 리터럴이 소스에 없다', () => {
    const offenders = ['components', 'pages', 'utils', 'hooks', 'layouts'].flatMap(sourceFiles).flatMap((path) =>
      stringLiterals(read(path))
        .filter((lit) => /감지 (중|실패|대기)/.test(lit))
        .map((lit) => `${path}: ${lit}`));
    expect(offenders).toEqual([]);
  });

  it('[F14-20] 목록 카드(analysis/index.jsx)에 "처리 중" 문자열 리터럴이 없다', () => {
    const offenders = stringLiterals(read('pages/analysis/index.jsx')).filter((lit) => lit.includes('처리 중'));
    expect(offenders).toEqual([]);
  });
});
