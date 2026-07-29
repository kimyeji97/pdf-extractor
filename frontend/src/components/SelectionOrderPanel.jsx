/**
 * 선택 문항 순서 편집 패널 (REQ-D07 Phase 3-5)
 *
 * editor/index.jsx가 899줄까지 커져 이번 변경이 집중되는 이 패널만 떼어냈다.
 * DnD 정렬 + 항목 제거 + **출처 표시**(멀티 파일 선택 노출, D07 조건 ②)를 담당한다.
 *
 * ━━━ 멀티 파일 선택은 신규 기능이 아니라 가시성 작업이다 ━━━
 * 파일을 바꿔도 basket은 비워지지 않고(`handleJobSelect`가 jobId만 교체),
 * 항목마다 jobId·workbookName이 이미 저장되며, question_id는 복합키(ADR-0002)라
 * 파일 간 번호 충돌도 없다. 백엔드 `/api/extract-v2`도 멀티소스 전제다.
 * **동작은 전부 되는데 화면이 그렇게 보이지 않았을 뿐**이라, 여기서 하는 일은
 * 이미 갖고 있는 `item.workbookName`을 드러내는 것뿐이다.
 *
 * ━━━ 계약 ━━━
 * - 출처 색은 `BookCard.spineColorOf`를 **재사용**한다. 목록 화면의 책등 색과 같은
 *   함수라야 "저 파란 책에서 온 문항"이 시각적으로 이어진다. 자체 색 배열을 만들면
 *   두 화면이 조용히 어긋난다.
 * - 단, **색 키는 이름이 아니라 jobId다.** `workbook_name`은 사용자 자유 입력이라
 *   고유하지 않다 — 실데이터에 서로 다른 두 파일이 똑같이 "테스트03"인 사례가 있고,
 *   이름으로 해시하면 두 출처가 같은 색·같은 글자가 되어 구분 기능이 통째로 죽는다.
 *   (Phase 3-5 브라우저 검증에서 실제로 색이 1종만 나와 발견)
 *   목록 화면은 책 1권 = 1카드라 이름 해시로 충분하지만, 여기선 출처끼리 붙어 있어
 *   충돌이 바로 드러난다.
 * - 출처 이름은 **화면 표시용으로만** 쓴다. 미리보기·PDF의 라벨은 REQ-C07에서
 *   `sel.label` 단일 출처로 통일했고 `WorkbookPreview`가 이미 workbookName을
 *   라벨에 넣는다 — 여기서 라벨 문자열을 조립하면 이중 표기가 된다.
 * - 목록이 flex 컬럼이므로 항목에 `flexShrink: 0`이 필요하다(계약 #5).
 */
import { memo, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { Icon } from "@iconify/react";

import { spineColorOf } from "./BookCard";

const API_ROOT = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"
).replace(/\/api$/, "");

/** 항목 라벨 — 제목 + 페이지 번호.
 *
 *  종전 코드는 `title || (수동 ? … : `문항 N`) + ` · Np``였는데 `+`가 `||`보다
 *  먼저 묶여, **제목이 있으면 페이지 접미가 통째로 사라졌다**. 감지된 문항은
 *  대부분 title이 있어 사실상 늘 페이지가 안 보이던 셈이다. 괄호로 바로잡는다. */
function labelOf(item) {
  const title =
    item.displayTitle ||
    (item.isManual ? "(수동 문항)" : `문항 ${item.questionNum}`);
  return `${title} · ${item.pageNum + 1}p`;
}

// 항목 하나를 드래그·제거해도 나머지 전체가 리렌더되지 않도록 memo 처리한다.
// 순서(index)와 출처 표시(sourceLabel)가 바뀌면 다시 그려야 한다.
const SortableItem = memo(function SortableItem({
  item,
  index,
  sourceLabel,
  onRemove,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.questionId });

  const label = labelOf(item);

  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 1,
        flexShrink: 0, // 계약 #5 — flex 컬럼 안에서 축소돼 썸네일이 잘리는 것을 막는다
        bgcolor: isDragging ? "action.selected" : "background.paper",
        borderBottom: 1,
        borderColor: "divider",
        opacity: isDragging ? 0.8 : 1,
        boxShadow: isDragging ? 3 : 0,
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{
          cursor: "grab",
          color: "text.disabled",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <Icon icon="material-symbols:drag-indicator" style={{ fontSize: 18 }} />
      </Box>

      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          minWidth: 20,
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        {index + 1}
      </Typography>

      {item.thumbnailUrl ? (
        <Box
          component="img"
          src={`${API_ROOT}${item.thumbnailUrl}`}
          alt={label}
          draggable={false}
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            objectFit: "cover",
            borderRadius: 0.5,
            border: 1,
            borderColor: "divider",
          }}
        />
      ) : (
        <Box
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            bgcolor: "action.hover",
            borderRadius: 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "text.disabled",
          }}
        >
          <Icon
            icon="material-symbols:edit-outline-rounded"
            style={{ fontSize: 16 }}
          />
        </Box>
      )}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" noWrap display="block" title={label}>
          {label}
        </Typography>
        {/* 출처는 파일이 2개 이상 섞였을 때만 노출한다 — 단일 파일에서는
            모든 항목에 같은 이름이 반복돼 정보가 아니라 잡음이 된다. */}
        {sourceLabel && (
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.125 }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                flexShrink: 0,
                bgcolor: spineColorOf(item.jobId),
              }}
            />
            <Typography
              variant="caption"
              color="text.disabled"
              noWrap
              sx={{ fontSize: 10, minWidth: 0 }}
              title={sourceLabel}
            >
              {sourceLabel}
            </Typography>
          </Box>
        )}
      </Box>

      <Tooltip title="제거">
        <IconButton
          size="small"
          onClick={() => onRemove(item.questionId)}
          sx={{ color: "error.main", p: 0.25, flexShrink: 0 }}
        >
          <Icon icon="material-symbols:close-rounded" style={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
});

/**
 * @param {{
 *   items: Array<object>,          // basket
 *   onReorder: (next: Array<object>) => void,
 *   onRemove: (questionId: string) => void,
 *   onClear: () => void,
 * }} props
 */
export default function SelectionOrderPanel({
  items,
  onReorder,
  onRemove,
  onClear,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // 출처 파일 수 — 저장분 복원(workbookName이 빈 문자열일 수 있음)까지 고려해
  // jobId로 센다. 이름은 표시용, 개수 판정은 식별자로 한다.
  const sourceLabels = useMemo(() => {
    const byJob = new Map();
    for (const b of items) {
      if (!byJob.has(b.jobId)) {
        byJob.set(b.jobId, b.workbookName || b.sourceFilename || "(이름 없음)");
      }
    }
    if (byJob.size < 2) return null; // 단일 출처면 표시하지 않는다

    // 이름이 겹치는 출처는 **원본 파일명으로 대체**한다.
    // "이름 · 파일명"으로 덧붙이면 240px 패널에서 앞의 공통 이름만 보이고 정작
    // 구분되는 파일명이 잘려 나간다(실측). 겹치는 순간 이름은 정보가 아니므로 버린다.
    // 겹치는데 파일명도 없으면(예전 저장분) 색 점만으로 구분된다.
    const nameCount = new Map();
    for (const name of byJob.values()) {
      nameCount.set(name, (nameCount.get(name) || 0) + 1);
    }
    const labels = {};
    for (const b of items) {
      if (labels[b.jobId]) continue;
      const name = byJob.get(b.jobId);
      labels[b.jobId] =
        nameCount.get(name) > 1 && b.sourceFilename ? b.sourceFilename : name;
    }
    return labels;
  }, [items]);

  const sourceCount = new Set(items.map((b) => b.jobId)).size;
  const showSource = Boolean(sourceLabels);

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    onReorder(
      arrayMove(
        items,
        items.findIndex((b) => b.questionId === active.id),
        items.findIndex((b) => b.questionId === over.id),
      ),
    );
  };

  return (
    <>
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
        }}
      >
        <Icon
          icon="material-symbols:reorder-rounded"
          style={{ fontSize: 18, flexShrink: 0 }}
        />
        <Typography variant="subtitle2" fontWeight={700} noWrap>
          순서 편집
        </Typography>
        <Box sx={{ flex: 1 }} />
        {items.length > 0 && (
          <Button
            size="small"
            color="error"
            onClick={onClear}
            sx={{ fontSize: 11, minWidth: 0 }}
          >
            전체 제거
          </Button>
        )}
      </Box>

      <Box
        sx={{
          px: 2,
          py: 0.75,
          borderBottom: 1,
          borderColor: "divider",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 0.75,
        }}
      >
        <Chip label={`${items.length}개 선택됨`} size="small" variant="outlined" />
        {/* 여러 파일을 섞어 담았다는 사실 자체를 요약으로 먼저 알린다 */}
        {showSource && (
          <Chip
            label={`${sourceCount}개 파일`}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {items.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center", color: "text.disabled" }}>
            <Icon
              icon="material-symbols:playlist-add-rounded"
              style={{ fontSize: 36 }}
            />
            <Typography variant="caption" display="block" mt={1}>
              문항 선택에서 체크하면
              <br />
              여기에 추가됩니다.
              <br />
              여러 파일에서 골라 담을 수 있습니다.
            </Typography>
          </Box>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((b) => b.questionId)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item, idx) => (
                <SortableItem
                  key={item.questionId}
                  item={item}
                  index={idx}
                  sourceLabel={sourceLabels?.[item.jobId] || null}
                  onRemove={onRemove}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </Box>
    </>
  );
}
