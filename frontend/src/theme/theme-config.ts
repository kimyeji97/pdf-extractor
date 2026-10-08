import type { CommonColors } from '@mui/material/styles';

import type { ThemeCssVariables } from './types';
import type { PaletteColorNoChannels } from './core/palette';

// ----------------------------------------------------------------------

type ThemeConfig = {
  classesPrefix: string;
  cssVariables: ThemeCssVariables;
  fontFamily: Record<'primary' | 'secondary', string>;
  palette: Record<
    'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error',
    PaletteColorNoChannels
  > & {
    common: Pick<CommonColors, 'black' | 'white'>;
    grey: Record<
      '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900',
      string
    >;
  };
};

export const themeConfig: ThemeConfig = {
  /** **************************************
   * Base
   *************************************** */
  classesPrefix: 'minimal',
  /** **************************************
   * Typography
   *************************************** */
  fontFamily: {
    primary: 'Outfit Variable',
    secondary: 'Outfit Variable',
  },
  /** **************************************
   * Palette
   *************************************** */
  palette: {
    // 오답 클립북 최종 테마 — REQ-D13(2026-10-08 사용자 테마 셋). 네이비 + 주홍 · 남색 회색
    // 다크 모드 primary 는 palette.ts 의 primaryDark 가 덮는다(계약 #20)
    primary: {
      lighter: '#E3E8F2',
      light: '#8A9BBF',
      main: '#1B2B4B',
      dark: '#121E36',
      darker: '#0A1224',
      contrastText: '#FFFFFF',
    },
    // 주홍 — 브랜드 강조
    secondary: {
      lighter: '#FFEEE6',
      light: '#F27A4A',
      main: '#CC4A12',
      dark: '#A33A0E',
      darker: '#6B260A',
      contrastText: '#FFFFFF',
    },
    // 청록
    info: {
      lighter: '#E0F5F9',
      light: '#6CC9DD',
      main: '#0B7F99',
      dark: '#08657A',
      darker: '#05414F',
      contrastText: '#FFFFFF',
    },
    success: {
      lighter: '#E3F6EA',
      light: '#7DD3A0',
      main: '#15803D',
      dark: '#116632',
      darker: '#0B4521',
      contrastText: '#FFFFFF',
    },
    warning: {
      lighter: '#FFF5E0',
      light: '#FBCB6F',
      main: '#F5A524',
      dark: '#C27D0E',
      darker: '#7E4F06',
      contrastText: '#1B2B4B',
    },
    // 장미빛 진홍
    error: {
      lighter: '#FDE7EC',
      light: '#F2879F',
      main: '#BE123C',
      dark: '#990E30',
      darker: '#640920',
      contrastText: '#FFFFFF',
    },
    // 남색 회색 — ⚠️ 100·900을 바꾸면 index.html 사전 페인트 배경도 함께(계약 #21)
    grey: {
      '50': '#FCFCFD',
      '100': '#F6F8FB',
      '200': '#EDF0F5',
      '300': '#DDE2EB',
      '400': '#B8C0CF',
      '500': '#8792A8',
      '600': '#5B6680',
      '700': '#3E4A63',
      '800': '#26324B',
      '900': '#151D2E',
    },
    common: { black: '#000000', white: '#FFFFFF' },
  },
  /** **************************************
   * Css variables
   *************************************** */
  cssVariables: {
    cssVarPrefix: '',
    colorSchemeSelector: 'data-color-scheme',
  },
};
