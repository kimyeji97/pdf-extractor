import { TypographyVariantsOptions } from '@mui/material/styles';
import { FontFamily, initialConfig } from 'config';

const createTypography = (
  fontFamily: FontFamily = initialConfig.fontFamily,
): TypographyVariantsOptions => ({
  fontFamily: [fontFamily, 'sans-serif', 'Spline Sans Mono', 'monospace'].join(','),
  h1: {
    fontWeight: 500,
    fontSize: '3.5rem', // 56px
    lineHeight: 1.2,
  },
  h2: {
    fontWeight: 500,
    fontSize: '3rem', // 48px
    lineHeight: 1.2,
  },
  h3: {
    fontWeight: 500,
    fontSize: '2.25rem', // 36px
    lineHeight: 1.2,
  },
  h4: {
    fontWeight: 500,
    fontSize: '2rem', // 32px
    lineHeight: 1.2,
  },
  h5: {
    fontWeight: 500,
    fontSize: '1.5rem', // 24px
    lineHeight: 1.2,
  },
  h6: {
    fontWeight: 500,
    fontSize: '1.125rem', // 18px
    lineHeight: 1.2,
  },
  subtitle1: {
    fontWeight: 400,
    fontSize: '1rem', // 16px
    lineHeight: 1.3,
  },
  subtitle2: {
    fontWeight: 500,
    fontSize: '0.875rem', // 14px
    lineHeight: 1.3,
  },
  body1: {
    fontWeight: 400,
    fontSize: '1rem', // 16px
    lineHeight: 1.6,
  },
  body2: {
    fontWeight: 400,
    fontSize: '0.875rem', // 14px
    lineHeight: 1.6,
  },
  button: {
    fontWeight: 500,
    fontSize: '0.875rem', // 14px
    lineHeight: 1.286,
    textTransform: 'capitalize',
  },
  caption: {
    fontWeight: 400,
    fontSize: '0.75rem', // 12px
    lineHeight: 1.2,
  },
  overline: {
    fontWeight: 400,
    fontSize: '0.75rem', // 12px
    lineHeight: 1.2,
    textTransform: 'uppercase',
  },
});

export default createTypography;
