import { Link, LinkProps } from '@mui/material';
import { rootPaths } from 'routes/paths';

interface LogoProps extends Omit<LinkProps, 'href'> {
  showName?: boolean;
  height?: number;
}

const Logo = ({ showName = true, height = 32, sx, ...rest }: LogoProps) => {
  return (
    <Link
      href={rootPaths.root}
      underline="none"
      sx={[{ display: 'flex', alignItems: 'center' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...rest}
    >
      <img
        src={showName ? '/logo-wordmark.png' : '/icon-192.png'}
        alt="깊은생각"
        style={{ height, width: 'auto', display: 'block' }}
      />
    </Link>
  );
};

export default Logo;
