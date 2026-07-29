/**
 * 작업 화면 캔버스 · 패널 카드 · 카드 사이 리사이즈 핸들 (REQ-D07 2안)
 *
 * 2안은 작업 화면을 "맞붙은 판"이 아니라 **회색 캔버스 위에 떠 있는 카드들**로 본다.
 * 문항 분석 작업과 문제집 편집이 같은 규격을 써야 두 화면이 한 앱으로 읽힌다.
 *
 * ━━━ 높이 체인은 여기서 끊기기 쉽다 (계약 #1) ━━━
 * 카드를 도입하면 중간 래퍼가 한 겹 늘어난다. `WorkCanvas`(flex 컬럼, minHeight:0)
 * → `CardRow`(flex 행, minHeight:0) → `PanelCard`(flex 컬럼, minHeight:0, overflow:hidden)
 * → 소비처 내부 스크롤 영역. 한 군데만 빠져도 패널 내부 스크롤이 죽는다.
 * `PanelCard`는 `PdfPreviewPanel`의 부모 계약(#2)도 그대로 만족시킨다.
 *
 * ━━━ 리사이즈 핸들을 남긴 이유 ━━━
 * 아티팩트 2안 목업에서는 카드 경계와 어울리지 않는다며 핸들이 사라졌지만,
 * 206페이지 문서에서 뷰어를 넓혀 보는 용도가 실제로 쓰여 **유지하기로 결정**했다
 * (2026-07-29). 대신 카드에 붙이지 않고 **카드 사이 여백 안에** 알약 모양으로 둔다 —
 * 카드의 둥근 모서리를 침범하지 않으면서 잡을 곳은 분명해진다.
 */
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";

/** 화면 전체 캔버스 — 페이지 헤더 + 카드 행을 세로로 쌓는다. */
export function WorkCanvas({ children, sx }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        gap: 2,
        p: 2,
        bgcolor: "background.default",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

/** 카드들이 놓이는 가로 행. */
export function CardRow({ children, sx }) {
  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

/**
 * 패널 카드 — 흰 배경 + 라운드 + 그림자.
 * 헤더/본문은 소비처가 채우되, 본문은 반드시 `flex:1; minHeight:0`을 가져야 한다.
 */
export function PanelCard({ children, sx, ...rest }) {
  return (
    <Paper
      elevation={0}
      {...rest}
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        minWidth: 0,
        overflow: "hidden",
        borderRadius: 2,
        boxShadow: (theme) => theme.customShadows?.card,
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

/** 카드 헤더 — 아이콘 + 제목 + 우측 액션. 4개 패널이 같은 높이를 갖게 한다. */
export function PanelCardHeader({ children, sx }) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.25,
        borderBottom: 1,
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        gap: 1,
        flexShrink: 0,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

/**
 * 카드 사이 여백에 놓이는 리사이즈 핸들.
 * `CardRow`의 gap 대신 이 컴포넌트가 좌우 여백을 만든다 — gap과 핸들을 같이 쓰면
 * 간격이 두 배가 된다.
 */
export function CardResizeHandle({ onMouseDown }) {
  return (
    <Box
      onMouseDown={onMouseDown}
      sx={{
        width: 16,
        flexShrink: 0,
        cursor: "col-resize",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        "&:hover .pill, &:active .pill": { bgcolor: "primary.main", height: 48 },
      }}
    >
      <Box
        className="pill"
        sx={{
          width: 4,
          height: 28,
          borderRadius: 2,
          bgcolor: "divider",
          transition: "background-color .15s, height .15s",
        }}
      />
    </Box>
  );
}
