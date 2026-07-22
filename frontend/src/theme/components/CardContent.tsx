import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles';

const CardContent: Components<Omit<Theme, 'components'>>['MuiCardContent'] = {
  styleOverrides: {
    root: {
      padding: '32px 24px',
      '&:last-child': {
        paddingBottom: '32px',
      },
    },
  },
};

export default CardContent;
