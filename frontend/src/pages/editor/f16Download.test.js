/**
 * REQ-F16 Phase 1 — 완료 시 자동으로 받거나 열지 않는다 (소스 스캔)
 *
 * 검증 계약: docs/plans/PLAN-F16-pdf-save-picker.md `## 검증 계약` (F16-06~07, F16-13, F16-16, F16-18~19)
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

/** 생성 완료 분기(폴링의 done 처리)만 떼어 본다 — 버튼 핸들러는 대상이 아니다. */
const completionBranch = (code) => {
  const start = code.indexOf('setGenerateStatus("done")');
  expect(start).toBeGreaterThan(-1);
  // 고정 창은 분기가 길어지면 재유입을 놓친다(/review 회차 0). 다음 분기 시작까지로 잡는다.
  const rest = code.slice(start);
  const end = rest.indexOf('onError:');
  const branch = end > 0 ? rest.slice(0, end) : rest.slice(0, 900);
  expect(branch).toContain('getStatus');   // 창이 실제로 완료 분기를 덮는지
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

describe('저장 버튼 (소스 스캔)', () => {
  it('[F16-13] 저장 실패를 화면에 알린다', () => {
    // promise 를 버리면 picker 이후 모든 실패가 조용하다 — F16 이 자동 다운로드를 없애
    // 알림이 유일한 피드백 경로다(/review 회차 0).
    const code = editorSource();
    const idx = code.indexOf('savePdfToPicker(');
    expect(idx).toBeGreaterThan(-1);

    // ⚠️ `catch` 글자만 보면 `.catch(() => {})` 도 통과한다(/review 회차 1).
    //    실패를 **화면에 닿게** 하는 상태 전환까지 본다.
    const near = code.slice(idx, idx + 400);
    expect(near).toMatch(/catch[\s\S]*setSaveError/);
  });

  it('[F16-18] 저장 에러가 생성 완료 분기 안에서 렌더된다', () => {
    // generateError 는 `generateStatus === "error"` 분기에만 있어 저장 실패를 못 보여준다.
    const code = editorSource();
    const done = code.indexOf('generateStatus === "done"');
    expect(done).toBeGreaterThan(-1);

    expect(code.slice(done, done + 900)).toMatch(/saveError/);
  });

  it('[F16-19] 재생성하면 직전 저장 에러가 비워진다', () => {
    // 안 지우면 완료 Alert 안에 **저장을 시도하지도 않은 채** 옛 빨간 글씨가 되살아난다.
    const code = editorSource();
    const idx = code.indexOf('const handleGenerate');
    expect(idx).toBeGreaterThan(-1);

    expect(code.slice(idx, idx + 1800)).toMatch(/setSaveError\(""\)/);
  });

  it('[F16-16] 저장 창 기본 이름을 생성 시점에 고정한다', () => {
    // 입력 칸을 저장 시점에 다시 읽으면 생성 이력의 이름과 어긋난다(계획서 § 결정).
    const code = editorSource();

    expect(code).toMatch(/setSavedFilename\(/);
    expect(code).toMatch(/savePdfToPicker\(\s*downloadUrl\s*,\s*savedFilename/);
  });
});
