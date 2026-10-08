/**
 * REQ-D13 Phase 1 — 로고·파비콘 교체
 *
 * 검증 계약: docs/plans/PLAN-D13-brand-renewal.md `## 검증 계약` (D13-01~08)
 *
 * `Logo`는 라이트·다크 이미지를 둘 다 DOM에 두고 CSS(색 체계 선택자)로 하나만 보인다 —
 * JS로 모드를 읽어 src를 바꾸면 첫 페인트에 잘못된 로고가 번쩍인다. 그래서 둘 다 DOM에서 찾는다.
 * 앱과 같은 `ThemeProvider` 아래에서 그린다(계약 #25). 나머지는 index.html·public/ 소스 스캔(D12 관례).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Logo from 'components/common/Logo';
import { ThemeProvider } from 'theme/theme-provider';

const sourceFiles = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  if (statSync(path).isDirectory()) return sourceFiles(path);
  return /\.(jsx?|tsx?)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
});

const logoImgs = () => {
  const { container } = render(
    <ThemeProvider>
      <Logo />
    </ThemeProvider>,
  );
  return [...container.querySelectorAll('img')];
};

const html = () => readFileSync('index.html', 'utf-8');
const iconLinks = () => [...html().matchAll(/<link[^>]*rel="(?:icon|apple-touch-icon)"[^>]*>/g)].map((m) => m[0]);
const hrefOf = (tag) => tag.match(/href="([^"]+)"/)?.[1];

describe('REQ-D13 로고 (Phase 1)', () => {
  it('[D13-01] 로고 이미지 alt가 "오답 클립북"이다', () => {
    expect(logoImgs().map((img) => img.getAttribute('alt'))).toContain('오답 클립북');
  });

  it('[D13-02] 라이트 이미지 src가 logo-transparent.svg다', () => {
    expect(logoImgs().map((img) => img.getAttribute('src'))).toContain('/logo-transparent.svg');
  });

  it('[D13-03] 다크 이미지 src가 logo-dark-transparent.svg다', () => {
    expect(logoImgs().map((img) => img.getAttribute('src'))).toContain('/logo-dark-transparent.svg');
  });

  it('[D13-04] logo-dark-transparent.svg에 전체 크기 배경 사각형이 없다', () => {
    const svg = readFileSync('public/logo-dark-transparent.svg', 'utf-8');
    expect(svg).not.toMatch(/<rect width="481" height="184"/);
  });

  it('[D13-05] 옛 logo-wordmark.png가 없고 아무도 참조하지 않는다', () => {
    const refs = ['index.html', ...sourceFiles('src')].filter((f) => readFileSync(f, 'utf-8').includes('logo-wordmark'));
    expect([existsSync('public/logo-wordmark.png'), refs]).toEqual([false, []]);
  });
});

describe('REQ-D13 파비콘 (Phase 1)', () => {
  it('[D13-06] 아이콘 링크에 favicon.svg와 favicon.ico가 있다', () => {
    const hrefs = iconLinks().filter((t) => /rel="icon"/.test(t)).map(hrefOf);
    expect(['/favicon.svg', '/favicon.ico'].every((h) => hrefs.includes(h))).toBe(true);
  });

  it('[D13-07] apple-touch-icon이 apple-touch-icon-180.png다', () => {
    const touch = iconLinks().filter((t) => /rel="apple-touch-icon"/.test(t)).map(hrefOf);
    expect(touch).toEqual(['/apple-touch-icon-180.png']);
  });

  it('[D13-08] 아이콘 href가 가리키는 파일이 모두 public/에 있다', () => {
    const missing = iconLinks().map(hrefOf).filter((h) => !existsSync(join('public', h)));
    expect(missing).toEqual([]);
  });
});
