import { Theme } from '@mui/material';
import { paperClasses } from '@mui/material/Paper';
import { Components } from '@mui/material/styles';

const Card: Components<Omit<Theme, 'components'>>['MuiCard'] = {
  styleOverrides: {
    root: {
      borderRadius: 20,
      [`&.${paperClasses.elevation1}`]: {
        boxShadow: '0 5px 22px 0 rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
};

export default Card;
