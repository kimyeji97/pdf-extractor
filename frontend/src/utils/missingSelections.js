/**
 * 편집 복원 때 쓸 수 없는 선택 고르기 (REQ-28)
 *
 * 공유받은 분석에서 편집자가 문항을 지우거나 공유가 해제되면, 저장된 문제집의 선택이 끊긴다.
 * 예전엔 썸네일이 깨진 채 남고 재생성 때 에러 없이 빠졌다(`pdf_service` 의 continue).
 *
 * @param {{ questionId: string, jobId: string }[]} basket
 * @param {Record<string, string[] | null>} questionsByJob job 마다 지금 있는 문항 ID, 접근 못 하면 null
 * @returns {Set<string>} 쓸 수 없는 선택의 questionId
 */
export function missingQuestionIds(basket, questionsByJob) {
  const alive = new Set(
    Object.values(questionsByJob).flatMap((ids) => (ids ?? []).map(normalizeId)),
  );
  return new Set(
    basket
      .filter((b) => questionsByJob[b.jobId] === null || !alive.has(normalizeId(b.questionId)))
      .map((b) => b.questionId),
  );
}

// 옛 3자리 ID(`{job}:{page}:{num}`)는 k=0 이다(ADR-0006). 수동(`…:manual:{uuid}`)은 그대로
function normalizeId(id) {
  const parts = String(id).split(":");
  return parts.length === 3 ? `${id}:0` : id;
}
