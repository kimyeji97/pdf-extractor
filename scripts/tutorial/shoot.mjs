// 튜토리얼 스크린샷 촬영 (REQ-F20 Phase 6, CLAUDE.md 계약 #44)
//
// 사용: cd scripts/tutorial && npm install && PW='<test@test.com 비밀번호>' node shoot.mjs
//   ONLY=create-1,create-2   일부 장면만
//   BASE=http://localhost:5173 NOSEC=1   dev 프론트에 아직 없는 화면을 로컬 프론트로 찍을 때.
//     localhost 오리진은 dev API CORS에 막혀 격리 Chrome의 웹 보안을 끈다(--disable-web-security)
//
// 장면 이름 = 그림 파일 이름 = utils/tutorials.js 의 image. 장면을 빼먹으면 F20-62가 잡는다.
// 빨간 테두리는 요소에 outline을 거는 대신 body 위 고정 박스로 그린다 — 카드 조상의 overflow:hidden이 outline을 자른다.
// 비밀번호는 저장하지 않는다. dev 백엔드는 찍는 동안만 켜고 끝나면 desired 0.
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE ?? 'https://dailystudy-workbook-dev.yejicraft-cf.com';
const OUT = process.env.OUT ?? fileURLToPath(new URL('../../frontend/public/tutorials', import.meta.url));
const ONLY = process.env.ONLY?.split(',');
const EMAIL = 'test@test.com';
if (!process.env.PW) throw new Error('PW 환경변수에 test@test.com 비밀번호를 넣으세요');

// dev test 계정의 데이터 (2026-10-23 기준)
const OWN = '2026 2학기 중3 심화대비'; // 첫 번째 문제집, test 계정 소유
const OWN2 = '2026 2학기 중3 학교별 심화기출 Blue(1~3회)';
const RESULT = '문제집_2026-10-22';
const TEMPLATE = '기본 템플릿';

const browser = await chromium.launch({ channel: 'chrome', args: process.env.NOSEC ? ['--disable-web-security'] : [] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 } });
await ctx.addInitScript((email) => {
  localStorage.setItem('mui-mode', 'light');
  sessionStorage.setItem(`tutorial_redirected:${email}`, '1'); // 튜토리얼 화면으로 보내지 않게
}, EMAIL);
const page = await ctx.newPage();
page.on('response', (r) => { if (r.status() >= 400 && r.status() !== 401) console.log('HTTP', r.status(), r.url().slice(0, 140)); });

const wait = (ms = 1500) => page.waitForTimeout(ms);
const go = async (p) => { await page.goto(BASE + p, { waitUntil: 'load' }); await wait(3500); };
const card = (title) => page.getByText(title, { exact: true }).first();
const paper = (title) => page.getByText(title, { exact: true }).first().locator('xpath=ancestor::div[contains(@class,"MuiPaper-root")][1]');

async function boxOf(locators) {
  const bs = [];
  for (const l of locators) { const b = await l.first().boundingBox(); if (b) bs.push(b); }
  if (!bs.length) throw new Error('강조할 요소를 못 찾음');
  const x = Math.min(...bs.map((b) => b.x)), y = Math.min(...bs.map((b) => b.y));
  return { x, y, width: Math.max(...bs.map((b) => b.x + b.width)) - x, height: Math.max(...bs.map((b) => b.y + b.height)) - y };
}

// 요소마다 따로 테두리
async function mark(...locators) {
  for (const l of locators) await markUnion(l);
}

// 여러 요소를 한 테두리로
async function markUnion(...locators) {
  const b = await boxOf(locators);
  await page.evaluate((b) => {
    const d = document.createElement('div');
    d.className = '__tut_mark';
    Object.assign(d.style, {
      position: 'fixed', left: `${b.x - 5}px`, top: `${b.y - 5}px`, width: `${b.width + 10}px`, height: `${b.height + 10}px`,
      border: '3px solid #E53935', borderRadius: '10px', zIndex: 2147483647, pointerEvents: 'none',
    });
    document.body.appendChild(d);
  }, b);
}

let failed = 0;
async function shot(name, fn) {
  if (ONLY && !ONLY.includes(name)) return;
  try {
    await fn();
    await wait(400);
    await page.screenshot({ path: `${OUT}/${name}.png` });
    console.log('shot', name);
  } catch (e) {
    failed += 1;
    console.log('ERR', name, e.message.split('\n')[0]);
  }
  await page.evaluate(() => document.querySelectorAll('.__tut_mark').forEach((e) => e.remove()));
  await page.keyboard.press('Escape');
}

await page.goto(BASE + '/login', { waitUntil: 'load' });
await page.getByLabel('이메일').fill(EMAIL);
await page.getByLabel('비밀번호').fill(process.env.PW);
await page.getByRole('button', { name: '로그인' }).click();
await wait(4000);

// ── 분석 ──
await shot('analysis-1', async () => { await go('/'); await mark(page.getByText('PDF 업로드', { exact: true }).locator('..')); });
await shot('analysis-2', async () => {
  await go('/');
  await page.getByText('오탐 문항 수', { exact: true }).click(); await wait(2500);
  await markUnion(page.getByText('대기 중 파일수', { exact: true }), page.getByText('문항 탐지율', { exact: true }));
});
await shot('analysis-3', async () => { await go('/'); await card(OWN).hover(); await wait(800); await mark(page.getByLabel('이름·유형 편집')); });
await shot('analysis-4', async () => {
  await go('/');
  await card(OWN).click(); await wait(5000);
  await page.getByText('3페이지', { exact: true }).click(); await wait(6000);
  await mark(paper('문항 목록'), page.getByRole('button', { name: '수동 추가' }));
});
await shot('analysis-5', async () => { await mark(page.getByLabel('전체 재감지')); });

// ── 생성: 첫 번째 문제집 → 2쪽 문항 4개 + 3쪽 앞 2개 → 6단 (PLAN-F20 결정 "생성 묶음 장면") ──
await shot('create-1', async () => {
  await go('/create');
  await page.getByText(OWN, { exact: false }).first().click(); await wait(3000);
  const boxes = page.locator('input[type=checkbox]'); // 1쪽 4개(0~3) 다음이 2쪽(4~7), 3쪽(8~)
  for (const i of [4, 5, 6, 7, 8, 9]) await boxes.nth(i).check();
  await page.getByRole('button', { name: '6단' }).click(); await wait(2500);
  await mark(paper('파일 선택'), paper('문항 선택'));
});
await shot('create-2', async () => { await mark(paper('순서 편집')); });
await shot('create-3', async () => { await mark(page.getByText('레이아웃', { exact: true }).locator('..'), page.getByText('템플릿', { exact: true }).locator('..')); });
await shot('create-4', async () => { await mark(page.getByRole('button', { name: 'PDF 생성' })); });

// ── 결과 ──
await shot('results-1', async () => { await go('/results'); await page.getByText(RESULT).first().hover(); await wait(800); await mark(page.getByLabel('PDF 재다운로드')); });
await shot('results-2', async () => { await go('/results'); await page.getByText(RESULT).first().hover(); await wait(800); await mark(page.getByLabel('편집으로 불러오기')); });

// ── 템플릿 관리 ──
await shot('templates-1', async () => {
  await go('/templates');
  await page.getByRole('tab', { name: '템플릿' }).click(); await wait(2000);
  await mark(page.getByRole('tablist'), page.getByText('템플릿 추가', { exact: true }).first().locator('..'));
});
await shot('templates-2', async () => {
  await go('/templates');
  await page.getByRole('tab', { name: '템플릿' }).click(); await wait(2000);
  await mark(page.getByText(TEMPLATE, { exact: true }).first().locator('xpath=ancestor::div[contains(@class,"MuiPaper-root") or contains(@class,"MuiCard-root")][1]'));
});

// ── 분석 결과 공유 ──
const openShare = async () => { await go('/'); await card(OWN).hover(); await wait(800); await page.getByLabel('공유').first().click(); await wait(3000); };
await shot('share-1', async () => {
  await openShare();
  await markUnion(page.getByLabel('이메일'), page.getByRole('button', { name: '공유', exact: true }).last());
  await mark(page.getByLabel('공유').first());
});
await shot('share-2', async () => {
  await openShare();
  await card(OWN2).click(); await wait(2500);
  await mark(page.getByText(/공유할 분석 \d개/), card(OWN2));
});
await shot('share-3', async () => { await openShare(); await mark(page.getByText('접근할 수 있는 사람', { exact: true }).locator('..')); });

// ── 알림과 튜토리얼 ──
await shot('notify-1', async () => {
  await go('/');
  await page.getByLabel('알림').first().click(); await wait(2000);
  await mark(page.getByLabel('알림').first(), paper('모두 읽음'));
});
await shot('notify-2', async () => {
  await go('/');
  await page.getByLabel('튜토리얼').first().click(); await wait(3000);
  await mark(page.getByLabel('튜토리얼').first(), paper('목차'));
});

await browser.close();
if (failed) { console.log(`실패 ${failed}건`); process.exit(1); }
