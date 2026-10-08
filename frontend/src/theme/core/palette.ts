import type { PaletteColor, ColorSystemOptions, PaletteColorChannel } from '@mui/material/styles';

import { varAlpha, createPaletteChannel } from 'minimal-shared/utils';

import { themeConfig } from '../theme-config';

import type { ThemeColorScheme } from '../types';

// ----------------------------------------------------------------------

/**
 * TypeScript (type definition and extension)
 * @to {@link file://./../extend-theme-types.d.ts}
 */

// Keys for the palette colors
export type PaletteColorKey = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';

// Palette color without additional channels
export type PaletteColorNoChannels = Omit<PaletteColor, 'lighterChannel' | 'darkerChannel'>;

// Palette color with additional channels
export type PaletteColorWithChannels = PaletteColor & PaletteColorChannel;

// Extended common colors
export type CommonColorsExtend = {
  whiteChannel: string;
  blackChannel: string;
};

// Extended text colors
export type TypeTextExtend = {
  disabledChannel: string;
};

// Extended background colors
export type TypeBackgroundExtend = {
  neutral: string;
  neutralChannel: string;
};

// Extended palette colors
export type PaletteColorExtend = {
  lighter: string;
  darker: string;
  lighterChannel: string;
  darkerChannel: string;
};

// Extended grey channels
export type GreyExtend = {
  '50Channel': string;
  '100Channel': string;
  '200Channel': string;
  '300Channel': string;
  '400Channel': string;
  '500Channel': string;
  '600Channel': string;
  '700Channel': string;
  '800Channel': string;
  '900Channel': string;
};

// ----------------------------------------------------------------------

// Primary color
export const primary = createPaletteChannel(themeConfig.palette.primary);

// 다크 모드 primary — REQ-D13. 남색 #1B2B4B 는 다크 배경 #151D2E 에 묻혀서 밝힌 남색으로 따로 둔다.
// basePalette 의 main·lighter·darker 는 두 모드가 공유하므로(계약 #20) 여기서 통째로 덮어야 한다 —
// createPaletteChannel 을 거쳐야 mainChannel 도 바뀐다(tintBg/tintSx 가 채널을 쓴다).
export const primaryDark = createPaletteChannel({
  lighter: '#E6ECF8',
  light: '#B6C5E6',
  main: '#8EA4D6',
  dark: '#5E76AD',
  darker: '#2E4272',
  contrastText: '#151D2E',
});

// 다크 모드 secondary·info·success·error — REQ-D13 리뷰 회차 2. 테마 셋의 main 은 라이트용 진한 색이라
// 다크 배경 위 글자색(삭제 버튼·오류 문구 등)으로 쓰면 대비 2~2.8:1로 묻힌다. 각 색의 light 를 main 으로
// 올린다(lighter=라이트 lighter · light=light·lighter 중간 · dark=라이트 main · darker=라이트 dark).
// warning 은 라이트 main 도 다크에서 6.27:1 이라 공유한다.
const DARK_TEXT = '#151D2E';
export const secondaryDark = createPaletteChannel({
  lighter: '#FFEEE6', light: '#F8B498', main: '#F27A4A', dark: '#CC4A12', darker: '#A33A0E', contrastText: DARK_TEXT,
});
export const infoDark = createPaletteChannel({
  lighter: '#E0F5F9', light: '#A6DFEB', main: '#6CC9DD', dark: '#0B7F99', darker: '#08657A', contrastText: DARK_TEXT,
});
export const successDark = createPaletteChannel({
  lighter: '#E3F6EA', light: '#B0E4C5', main: '#7DD3A0', dark: '#15803D', darker: '#116632', contrastText: DARK_TEXT,
});
export const errorDark = createPaletteChannel({
  lighter: '#FDE7EC', light: '#F8B7C6', main: '#F2879F', dark: '#BE123C', darker: '#990E30', contrastText: DARK_TEXT,
});

// Secondary color
export const secondary = createPaletteChannel(themeConfig.palette.secondary);

// Info color
export const info = createPaletteChannel(themeConfig.palette.info);

// Success color
export const success = createPaletteChannel(themeConfig.palette.success);

// Warning color
export const warning = createPaletteChannel(themeConfig.palette.warning);

// Error color
export const error = createPaletteChannel(themeConfig.palette.error);

// Common color
export const common = createPaletteChannel(themeConfig.palette.common);

// Grey color
export const grey = createPaletteChannel(themeConfig.palette.grey);

// Text color
export const text = {
  light: createPaletteChannel({
    primary: grey[800],
    secondary: grey[600],
    disabled: grey[500],
  }),
  dark: createPaletteChannel({
    primary: '#FFFFFF',
    secondary: grey[500],
    disabled: grey[600],
  }),
};

// Background color
export const background = {
  light: createPaletteChannel({
    paper: '#FFFFFF',
    default: grey[100],
    neutral: grey[200],
  }),
  dark: createPaletteChannel({
    paper: grey[800],
    default: grey[900],
    neutral: '#2E3A55', // REQ-D13 테마 셋
  }),
};

// Base action color
export const baseAction = {
  hover: varAlpha(grey['500Channel'], 0.08),
  selected: varAlpha(grey['500Channel'], 0.16),
  focus: varAlpha(grey['500Channel'], 0.24),
  disabled: varAlpha(grey['500Channel'], 0.8),
  disabledBackground: varAlpha(grey['500Channel'], 0.24),
  hoverOpacity: 0.08,
  disabledOpacity: 0.48,
};

// Action color
export const action = {
  light: { ...baseAction, active: grey[600] },
  dark: { ...baseAction, active: grey[500] },
};

// ----------------------------------------------------------------------

// Base palette
export const basePalette = {
  primary,
  secondary,
  info,
  success,
  warning,
  error,
  common,
  grey,
  divider: varAlpha(grey['500Channel'], 0.2),
};

export const palette: Partial<Record<ThemeColorScheme, ColorSystemOptions['palette']>> = {
  light: {
    ...basePalette,
    text: text.light,
    background: background.light,
    action: action.light,
  },
  dark: {
    ...basePalette,
    primary: primaryDark,
    secondary: secondaryDark,
    info: infoDark,
    success: successDark,
    error: errorDark,
    text: text.dark,
    background: background.dark,
    action: action.dark,
  },
};
