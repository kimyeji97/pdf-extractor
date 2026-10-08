import { Box, Link, LinkProps } from '@mui/material';
import { rootPaths } from 'routes/paths';

interface LogoProps extends Omit<LinkProps, 'href'> {
  showName?: boolean;
  height?: number;
}

/**
 * 오답 클립북 로고 (REQ-D13).
 *
 * 라이트·다크 이미지를 **둘 다 DOM에 두고 CSS로 하나만 보인다** — JS로 모드를 읽어 src를 바꾸면
 * 첫 페인트에 잘못된 로고가 번쩍인다(사전 페인트 스크립트와 같은 이유, 계약 #21).
 * 다크용은 `logo-dark.svg`에서 배경 사각형만 뺀 투명본이다. 글자는 path라 폰트와 무관하다.
 */
const Logo = ({ showName = true, height = 32, sx, ...rest }: LogoProps) => {
  const style = { height, width: 'auto', display: 'block' } as const;

  return (
    <Link
      href={rootPaths.root}
      underline="none"
      sx={[{ display: 'flex', alignItems: 'center' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...rest}
    >
      {showName ? (
        <>
          <Box
            component="img"
            src="/logo-transparent.svg"
            alt="오답 클립북"
            sx={(theme) => ({ ...style, ...theme.applyStyles('dark', { display: 'none' }) })}
          />
          <Box
            component="img"
            src="/logo-dark-transparent.svg"
            alt="오답 클립북"
            sx={(theme) => ({ ...style, display: 'none', ...theme.applyStyles('dark', { display: 'block' }) })}
          />
        </>
      ) : (
        <Box component="img" src="/symbol.svg" alt="오답 클립북" sx={style} />
      )}
    </Link>
  );
};

export default Logo;
