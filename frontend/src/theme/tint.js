/**
 * 색조(tint) 강조 헬퍼 — REQ-D08
 *
 * ━━━ 왜 필요한가 ━━━
 * `palette.ts`의 `basePalette`(primary·secondary·info·success·warning·error·grey)는
 * **light와 dark 색상 스킴이 공유한다.** 모드별로 갈리는 것은 `text`·`background`·`action`
 * 셋뿐이다. 그래서 선택·활성 강조에 흔히 쓰는 `primary.lighter`는 다크에서도 `#D0ECFE`
 * 그대로라 **어두운 화면에 파스텔 블록이 박힌다.**
 *
 * 하드코딩 hex가 아니라 팔레트 토큰을 썼는데도 깨지므로 **grep으로는 안 잡힌다.**
 * REQ-D08 브라우저 검증에서 통계 카드 3장이 밝게 남아 있는 것을 눈으로 보고 발견했다.
 *
 * → 대신 `main` 채널의 **알파**를 깐다. 알파는 밑에 깔린 배경을 그대로 받으므로
 *   라이트에서는 옅은 색조, 다크에서는 어두운 색조가 되어 양쪽 모두에서 성립한다.
 */
import { varAlpha } from 'minimal-shared/utils';

/**
 * 색조 **배경색**만 반환한다. `bgcolor: cond ? tintBg('primary') : 'transparent'`처럼
 * 조건부 자리에 그대로 끼울 수 있다.
 *
 * @param {'primary'|'secondary'|'info'|'success'|'warning'|'error'} color
 * @param {number} alpha 라이트 기준 불투명도. 다크는 배경이 어두워 조금 더 준다.
 */
export const tintBg =
  (color = 'primary', alpha = 0.12) =>
  (theme) =>
    varAlpha(theme.vars.palette[color].mainChannel, alpha);

/**
 * 색조 배경 **+ 그 위에서 읽히는 글자색**을 함께 반환하는 sx 조각.
 *
 * 글자색은 모드에 따라 뒤집어야 한다 — 라이트에선 `dark`(진한 색)가, 다크에선
 * `light`(밝은 색)가 읽힌다. 한쪽만 쓰면 반대 모드에서 배경과 붙어 안 보인다.
 *
 * @example sx={(theme) => ({ ...tintSx('warning')(theme), px: 1 })}
 */
export const tintSx =
  (color = 'primary', { alpha = 0.12, darkAlpha = 0.16 } = {}) =>
  (theme) => ({
    bgcolor: varAlpha(theme.vars.palette[color].mainChannel, alpha),
    color: theme.vars.palette[color].dark,
    ...theme.applyStyles('dark', {
      bgcolor: varAlpha(theme.vars.palette[color].mainChannel, darkAlpha),
      color: theme.vars.palette[color].light,
    }),
  });

/**
 * 색조 **글자색**만 — 배경 없이 강조 텍스트에 쓴다.
 */
export const tintFg =
  (color = 'primary') =>
  (theme) => ({
    color: theme.vars.palette[color].dark,
    ...theme.applyStyles('dark', { color: theme.vars.palette[color].light }),
  });
