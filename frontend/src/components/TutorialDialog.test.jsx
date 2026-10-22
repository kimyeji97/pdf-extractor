/**
 * REQ-F20 Phase 3 — 슬라이드 스크린샷
 *
 * 검증 계약: docs/plans/PLAN-F20-tutorial.md `## 검증 계약` (F20-21)
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TutorialDialog from 'components/TutorialDialog';
import { ThemeProvider } from 'theme/theme-provider';

const T = {
  id: 't',
  title: '그림 튜토리얼',
  slides: [{ title: '업로드', body: 'PDF를 올립니다.', image: '/tutorials/sample.png' }],
};

describe('슬라이드 스크린샷', () => {
  it('[F20-21] 슬라이드 스크린샷을 alt가 슬라이드 제목인 이미지로 그린다', () => {
    render(
      <ThemeProvider>
        <TutorialDialog tutorial={T} onClose={() => {}} />
      </ThemeProvider>,
    );

    expect(screen.getByRole('img', { name: '업로드' })).toHaveAttribute('src', '/tutorials/sample.png');
  });
});
