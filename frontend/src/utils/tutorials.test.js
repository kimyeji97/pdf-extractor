/**
 * REQ-F20 Phase 1·3 — 튜토리얼 정의 목록과 콘텐츠
 *
 * 검증 계약: docs/plans/PLAN-F20-tutorial.md `## 검증 계약` (F20-12, F20-17~20, F20-24~25)
 *
 * F20-20은 테스트가 frontend/ 에서 돈다는 전제로 `public${image}` 를 본다 (tutorialSlot.test.js 의 readFileSync 와 같은 전제)
 */
import { existsSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { TUTORIALS } from 'utils/tutorials';

describe('튜토리얼 정의 목록', () => {
  it('[F20-12] 목록이 비지 않고 id가 겹치지 않으며 슬라이드가 1장 이상이다', () => {
    const ids = TUTORIALS.map((t) => t.id);
    const problems = [
      ...(TUTORIALS.length === 0 ? ['목록이 비었다'] : []),
      ...ids.filter((id, i) => ids.indexOf(id) !== i).map((id) => `id 중복: ${id}`),
      ...TUTORIALS.filter((t) => !(t.slides?.length > 0)).map((t) => `슬라이드 없음: ${t.id}`),
    ];

    expect(problems).toEqual([]);
  });
});

describe('튜토리얼 콘텐츠 (Phase 3)', () => {
  const byId = (id) => TUTORIALS.find((t) => t.id === id);

  it('[F20-17] 기본 흐름(welcome)과 공유(share) 두 개다', () => {
    expect(TUTORIALS.map((t) => t.id)).toEqual(['welcome', 'share']);
  });

  it('[F20-18] 기본 흐름 슬라이드 제목이 업로드·감지·선택·생성 순서다', () => {
    const titles = (byId('welcome')?.slides ?? []).map((s) => s.title).join(' / ');

    expect(titles).toMatch(/업로드.*감지.*선택.*생성/);
  });

  it('[F20-19] 공유 튜토리얼이 공유받은 쪽 역할(편집자·뷰어)을 설명한다', () => {
    const text = (byId('share')?.slides ?? []).map((s) => `${s.title} ${s.body}`).join(' ');

    expect(['편집자', '뷰어'].filter((role) => !text.includes(role))).toEqual([]);
  });

  it('[F20-20] 모든 슬라이드에 스크린샷 경로가 있고 public 아래에 파일이 있다', () => {
    const missing = TUTORIALS.flatMap((t) => t.slides)
      .filter((s) => !s.image || !existsSync(`public${s.image}`))
      .map((s) => s.image ?? `(없음) ${s.title}`);

    expect(missing).toEqual([]);
  });
});

describe('공유 문구가 실제 동작과 맞다 (Phase 3 리뷰 회차 0)', () => {
  const shareText = () => (TUTORIALS.find((t) => t.id === 'share')?.slides ?? []).map((s) => s.body).join(' ');

  it('[F20-24] 공유 문구가 역할 칩이 모든 카드에 붙는다고 설명한다', () => {
    expect(shareText()).toContain('모든 카드');
  });

  it('[F20-25] 공유 문구가 패널에 더해지는 건 내가 소유자인 카드라고 설명한다', () => {
    expect(shareText()).toContain('소유자인');
  });
});
