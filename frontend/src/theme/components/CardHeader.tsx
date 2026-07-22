import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles';

const CardHeader: Components<Omit<Theme, 'components'>>['MuiCardHeader'] = {
  defaultProps: {
    titleTypographyProps: { variant: 'h6' },
    subheaderTypographyProps: { variant: 'body2' },
  },
  styleOverrides: {
    root: {
      padding: '32px 24px 16px',
    },
  },
};

export default CardHeader;
