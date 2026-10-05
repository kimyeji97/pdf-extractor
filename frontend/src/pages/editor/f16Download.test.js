/**
 * REQ-F16 Phase 1 — 완료 시 자동으로 받거나 열지 않는다 (소스 스캔)
 *
 * 검증 계약: docs/plans/PLAN-F16-pdf-save-picker.md `## 검증 계약` (F16-06~07) — F16-13·16·18·19 는 REQ-F18 로 폐기
 *
 * `editor/index.jsx` 는 API mock 이 5~6개 필요해 렌더 무대가 없다(PLAN-B12 § 제약·함정,
 * D11·REQ-30 과 같은 결론). 여기서 보려는 것도 "화면이 어떻게 보이나"가 아니라
 * **완료 분기가 무엇을 하지 않는가**라서 문자열로 충분하다.
 *
 * ⚠️ 부정 단언이라 **스캔 대상이 비면 조용히 통과한다** — 계약 #25 의 "0건은 초록색으로
 *    보인다"와 같은 결이다. 그래서 파일을 읽었는지부터 단언한다.
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/** 블록 주석과 줄 끝 `//` 주석을 걷어낸다 — workEntryName.test.js 와 동일 기법. */
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const editorSource = () => {
  const code = stripComments(readFileSync('src/pages/editor/index.jsx', 'utf-8'));
  expect(code.length).toBeGreaterThan(1000);   // 빈 스캔이 초록으로 보이는 것을 막는다
  return code;
};

/**
 * 생성 완료 분기(폴링의 done 처리)만 떼어 본다 — 버튼 핸들러는 대상이 아니다.
 *
 * ⚠️ 시작점이 `onDone:` 이고 무대 가드가 `setGenerateStatus("done")` 이다.
 *    종전엔 `setGenerateStatus("done")` 에서 시작해 `getStatus` 로 무대를 확인했는데,
 *    **REQ-F18 이 완료 분기의 `getStatus` 호출을 없애면서**(받는 일이 결과 화면으로 갔다)
 *    그 앵커가 사라졌고, 창이 거의 비어 **부정 단언이 공허하게 통과**하게 됐다
 *    (계약 #25 "0건은 초록색"). 분기 전체를 덮도록 시작점을 앞으로 옮겼다.
 */
const completionBranch = (code) => {
  const start = code.indexOf('onDone:');
  expect(start).toBeGreaterThan(-1);
  // 고정 창은 분기가 길어지면 재유입을 놓친다(/review 회차 0). 다음 분기 시작까지로 잡는다.
  const rest = code.slice(start);
  const end = rest.indexOf('onError:');
  expect(end).toBeGreaterThan(0);
  const branch = rest.slice(0, end);
  expect(branch).toContain('setGenerateStatus("done")');   // 창이 실제로 완료 분기를 덮는지
  return branch;
};

describe('생성 완료 분기 (소스 스캔)', () => {
  it('[F16-06] 완료 시 자동으로 받지 않는다', () => {
    // a.click() 으로 몰래 받던 경로를 없앴는지 본다.
    expect(completionBranch(editorSource())).not.toMatch(/\.click\(\)/);
  });

  it('[F16-07] 완료 시 새 탭으로 열지 않는다', () => {
    expect(completionBranch(editorSource())).not.toMatch(/window\.open/);
  });
});
