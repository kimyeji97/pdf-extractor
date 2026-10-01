/**
 * 문항 표시 이름 — 화면·생성 PDF 라벨(`sel.label`, 계약 #12)이 모두 여기서 나온다 (REQ-C10).
 *
 * "문항 " + (사용자 이름 || 감지 원문 || 번호). "문항"은 사용자가 바꿀 수 없는 고정 접두어라
 * 이름 수정·수동 추가 입력란은 접두어 뒤만 받는다. 옛 이름에 "문항"이 들어 있어도 걷어내지 않는다(데이터 그대로).
 * 입력은 문항 조회 API 모양(`title`·`source_text`·`question_num`·`is_manual`).
 */
export const QUESTION_PREFIX = "문항";

/** 접두어 뒤 글자. 이름 없는 옛 수동 문항은 "(수동)". */
export function questionNameRest(q) {
  if (q.title) return q.title;
  if (q.is_manual) return "(수동)";
  return q.source_text || String(q.question_num);
}

export function questionDisplayName(q) {
  return `${QUESTION_PREFIX} ${questionNameRest(q)}`;
}
