import { Box, BoxProps } from '@mui/material';

export interface ReactEchartProps extends BoxProps {
  echarts?: unknown;
  option?: unknown;
}

/** echarts-for-react 미설치 환경용 stub */
const ReactEchart = ({ option: _option, echarts: _echarts, ...rest }: ReactEchartProps) => {
  return <Box {...rest} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...rest.sx }}>Chart</Box>;
};

export default ReactEchart;
