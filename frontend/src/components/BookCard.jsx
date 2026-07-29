/**
 * 책 카드 (REQ-D07 §5-1, B안 = 책등 + 두께)
 *
 * 목록의 한 항목을 "파일"이 아니라 "책(문제집)"으로 읽히게 한다.
 * 분석 목록·생성 이력·표지 관리가 같은 규격을 공유한다.
 *
 * ━━━ 구현 주의 ━━━
 * 1) 카드 **폭은 층 수와 무관하게 고정**한다. 층이 폭을 밀면 문항 수에 따라
 *    래핑 그리드 정렬이 흔들린다. 층은 카드 내부 우측 여백 안에서 그린다.
 * 2) 두께 연동이 과하다고 판단되면 layerCount만 상수로 바꾸면 되돌릴 수 있다
 *    (분기는 thicknessOf() 한 곳).
 * 3) 표지 썸네일 URL은 호출부가 조립해 넘긴다 — 목록 API 추가 호출 금지(REQ-P02-02).
 */
import { useState } from 'react';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { Icon } from '@iconify/react';

export const BOOK_CARD_W = 172;
const COVER_H = 226;
const SPINE_W = 10;
const LAYER_W = 4; // 종이 한 층의 폭

/**
 * 책등 색.
 *
 * 실데이터의 workbook_types는 자유 입력이라(5권에 13종, 대부분 일회성 라벨)
 * 유형→색 매핑이 의미를 갖지 못한다. 대신 **이름 해시로 책마다 고정 색**을 준다 —
 * 같은 책은 항상 같은 색이라 목록에서 찾기 쉬워진다는 게 책 은유의 목적에 맞다.
 * 값은 테마 팔레트에서 가져와 톤이 튀지 않게 한다.
 */
const SPINE_COLORS = [
  'primary.dark',
  'secondary.dark',
  'info.dark',
  'success.dark',
  'warning.dark',
  'error.dark',
];

export function spineColorOf(key = '') {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return SPINE_COLORS[Math.abs(hash) % SPINE_COLORS.length];
}

/** 문항 수 → 페이지 스택 층 수. 감지 전/실패는 가장 얇게(1층). */
function thicknessOf(count) {
  if (count == null) return 1;
  if (count < 200) return 2;
  if (count < 500) return 3;
  return 4;
}

/**
 * @param {{
 *   coverUrl?: string,
 *   title: string,
 *   subtitle?: string,
 *   tags?: string[],
 *   badge?: { label: string, color?: string },
 *   questionCount?: number | null,
 *   colorKey?: string,
 *   disabled?: boolean,
 *   loading?: boolean,
 *   selected?: boolean,
 *   actions?: React.ReactNode,
 *   onClick?: () => void,
 * }} props
 */
export default function BookCard({
  coverUrl,
  title,
  subtitle,
  tags = [],
  badge,
  questionCount = null,
  colorKey,
  disabled = false,
  loading = false,
  selected = false,
  actions,
  onClick,
}) {
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);

  const layerCount = thicknessOf(questionCount);
  const spineColor = spineColorOf(colorKey ?? title);
  // 층이 차지하는 폭만큼 표지를 좁혀 카드 전체 폭은 항상 같게 유지한다
  const stackW = layerCount * LAYER_W;

  return (
    <Box
      onClick={() => !disabled && onClick?.()}
      sx={{
        width: BOOK_CARD_W,
        flexShrink: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'transform .15s',
        // 액션은 평소 숨기고 카드에 마우스를 올릴 때만 보여 준다 —
        // 172px 표지에 버튼 2~3개가 상시 떠 있으면 배지·표지를 가린다.
        '& .book-card-actions': { opacity: 0, transition: 'opacity .12s' },
        '&:hover .book-card-actions': { opacity: 1 },
        '&:focus-within .book-card-actions': { opacity: 1 },
        ...(!disabled && { '&:hover': { transform: 'translateY(-3px)' } }),
      }}
    >
      {/* ── 책 본체 (표지 + 책등 + 두께) ─────────────────── */}
      <Box sx={{ position: 'relative', height: COVER_H }}>
        {/* 겹친 종이 층 — 표지 오른쪽 뒤로 어긋나게 쌓는다 */}
        {Array.from({ length: layerCount }).map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              top: (i + 1) * 3,
              bottom: (i + 1) * 3,
              right: stackW - (i + 1) * LAYER_W,
              width: LAYER_W + 2,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: '0 3px 3px 0',
            }}
          />
        ))}

        {/* 표지 */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            right: stackW,
            overflow: 'hidden',
            borderRadius: '3px 8px 8px 3px',
            bgcolor: 'action.hover',
            boxShadow: (theme) => theme.customShadows?.card,
            // 선택 상태는 표지 테두리로 표시한다 (생성 이력의 목록↔뷰어 연동용)
            border: selected ? 2 : 1,
            borderColor: selected ? 'primary.main' : 'divider',
          }}
        >
          {!coverLoaded && !coverFailed && coverUrl && (
            <Box className="img-skeleton" sx={{ position: 'absolute', inset: 0 }} />
          )}

          {coverUrl && !coverFailed ? (
            <Box
              component="img"
              src={coverUrl}
              alt={title}
              onLoad={() => setCoverLoaded(true)}
              onError={() => setCoverFailed(true)}
              sx={{
                position: 'absolute',
                inset: 0,
                width: 1,
                height: 1,
                objectFit: 'cover',
                objectPosition: 'top center',
                display: coverLoaded ? 'block' : 'none',
              }}
            />
          ) : (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.disabled',
              }}
            >
              <Icon icon="material-symbols:menu-book-outline-rounded" style={{ fontSize: 40 }} />
            </Box>
          )}

          {/* 책등 + 안쪽 광택 — 두께감을 만든다 */}
          <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: SPINE_W, bgcolor: spineColor }} />
          <Box
            sx={{
              position: 'absolute',
              left: SPINE_W,
              top: 0,
              bottom: 0,
              width: 14,
              background: 'linear-gradient(90deg, rgba(28,37,46,.20), rgba(28,37,46,0))',
              pointerEvents: 'none',
            }}
          />

          {/* 상태 배지 */}
          {badge && (
            <Box sx={{ position: 'absolute', top: 6, left: SPINE_W + 8 }}>
              <Chip label={badge.label} size="small" color={badge.color ?? 'default'} sx={{ fontSize: 10, height: 18 }} />
            </Box>
          )}

          {/* 액션 (편집·삭제 등) */}
          {actions && (
            <Box
              className="book-card-actions"
              sx={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 0.5 }}
            >
              {actions}
            </Box>
          )}

          {/* 진행 중 딤 */}
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                // 흰 딤은 다크에서 카드가 오히려 밝아진다 — 카드 지면색을 알파로 덮는다 (REQ-D08)
                bgcolor: (t) => varAlpha(t.vars.palette.background.paperChannel, 0.6),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress size={24} thickness={4} />
            </Box>
          )}
        </Box>
      </Box>

      {/* ── 정보 영역 ──────────────────────────────────── */}
      <Box sx={{ pt: 1.25, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.35, wordBreak: 'break-word' }} title={title}>
          {title}
        </Typography>

        {subtitle && (
          <Typography variant="caption" color="text.disabled" noWrap>
            {subtitle}
          </Typography>
        )}

        {tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {tags.slice(0, 3).map((t) => (
              <Chip key={t} label={t} size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
