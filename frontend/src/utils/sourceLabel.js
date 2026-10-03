/**
 * 출처 문구 조립 (REQ-C07 형식 → REQ-F17 개정)
 *
 * "**n번) 문제집. p쪽. 문항이름.**" — 번호 뒤 `)`, 끝에 마침표 하나.
 * 값이 없는 요소는 통째로 빠지므로 끝이 이미 `.`일 수 있다 → **마침표는 정확히 하나**만 남긴다.
 *
 * ⚠️ **계약 #12 — 백엔드 `pdf_service.build_source_label()`이 같은 문자열을 그린다.**
 *    한쪽만 고치면 미리보기와 생성 PDF가 갈린다. 짝이 되는 테스트는
 *    `utils/sourceLabel.test.js`(F17-10~13)와 `backend/tests/test_f17_source_label.py`(F17-14)다.
 */
import { stripExtension } from "utils/documentName";

/**
 * @param {object}  p
 * @param {number}  p.index         전체 문항 순번 (1-based)
 * @param {string}  [p.workbookName] 문제집 이름 — 없으면 filename에서 확장자를 뺀 것을 쓴다
 * @param {string}  [p.filename]     원본 파일명
 * @param {number}  [p.pageNum]      0-based 쪽 번호 (표시는 +1)
 * @param {string}  [p.questionName] 문항 이름
 */
export function buildSourceLabel({ index, workbookName, filename, pageNum, questionName }) {
  // 번호만 `)` + 공백으로 잇고, 나머지는 `. `로 잇는다 — "1번) 심화대비. p3."
  const parts = [];

  const name = workbookName || stripExtension(filename);
  if (name) parts.push(name);
  if (pageNum != null) parts.push(`p${pageNum + 1}`);
  if (questionName) parts.push(questionName);

  const body = parts.join(". ");
  const joined = body ? `${index}번) ${body}` : `${index}번)`;
  return joined.endsWith(".") ? joined : `${joined}.`;
}
