/**
 * REQ-F16 Phase 2 — 클릭 한 번으로: 생성 전에 위치를 받아 두고 완료되면 바로 쓴다 (소스 스캔)
 *
 * 검증 계약: docs/plans/PLAN-F16-pdf-save-picker.md `## 검증 계약` (F16-21~22, F16-24~28)
 *
 * `editor/index.jsx`·`history/index.jsx` 는 API mock 이 여럿 필요해 렌더 무대가 없다
 * (PLAN-B12 § 제약·함정, D11·REQ-30 과 같은 결론). 여기서 보려는 것도 **순서와 배선**이라
 * 문자열로 충분하다.
 *
 * ⚠️ **F16-21 이 이 파일의 핵심이다.** `showSaveFilePicker` 는 transient user activation 을
 *    요구해서, 생성 폴링(수 초) 뒤에 열면 **브라우저가 거부한다**(계획서 § 제약·함정, F16-02).
 *    그래서 창을 **생성 요청보다 먼저** 열어야 하고, 그 순서를 여기서 고정한다.
 *    순서가 뒤집히면 단위 테스트는 녹색이어도 실제로 창이 안 뜬다.
 *
 * ⚠️ 창이 실제로 뜨는지 · **다른 창에 갔다 와도 저장되는지**는 OS 네이티브 창과 탭 포커스
 *    전환이라 자동화할 수 없다 — 육안 몫이다(계획서 § 검증 계약).
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const read = (path) => {
  const code = stripComments(readFileSync(path, 'utf-8'));
  expect(code.length).toBeGreaterThan(1000);   // 빈 스캔이 초록으로 보이는 것을 막는다
  return code;
};

const editorSource = () => read('src/pages/editor/index.jsx');
const historySource = () => read('src/pages/history/index.jsx');

/** handleGenerate 본문 — 다음 선언 전까지. 고정 창은 쓰지 않는다(/review 회차 0 교훈). */
const generateBody = (code) => {
  const start = code.indexOf('const handleGenerate');
  expect(start).toBeGreaterThan(-1);
  const rest = code.slice(start);
  const end = rest.indexOf('\n  const ', 10);
  return end > 0 ? rest.slice(0, end) : rest;
};

describe('생성 흐름 — 창이 먼저 (Phase 2)', () => {
  it('[F16-21] 생성 요청 전에 위치 선택 창을 연다', () => {
    const body = generateBody(editorSource());
    const pick = body.indexOf('pickSaveTarget');
    const start = body.indexOf('startExtractV2');

    expect(pick).toBeGreaterThan(-1);
    expect(start).toBeGreaterThan(-1);
    // 뒤집히면 활성화가 만료돼 실제 브라우저가 창을 거부한다.
    expect(pick).toBeLessThan(start);
  });

  it('[F16-22] 창에서 취소하면 생성하지 않는다', () => {
    // 취소는 "안 만들겠다"로 읽는다(계획서 § 결정) — 핸들이 없으면 조기 반환해야 한다.
    const body = generateBody(editorSource());
    const pick = body.indexOf('pickSaveTarget');

    expect(body.slice(pick, pick + 300)).toMatch(/return/);
  });
});

describe('완료 처리 (Phase 2)', () => {
  it('[F16-24] 완료되면 받아 둔 핸들에 바로 쓴다', () => {
    const code = editorSource();
    const done = code.indexOf('setGenerateStatus("done")');
    expect(done).toBeGreaterThan(-1);

    expect(code.slice(done, done + 900)).toMatch(/writePdfToHandle/);
  });

  it('[F16-25] 핸들 쓰기가 막히면 다운로드 버튼을 다시 보여 준다', () => {
    const code = editorSource();
    const done = code.indexOf('setGenerateStatus("done")');

    // 실패를 잡아 버튼을 되살리는 상태 전환이 있어야 한다.
    expect(code.slice(done, done + 900)).toMatch(/catch[\s\S]*setDownloadUrl/);
  });

  it('[F16-26] 그 버튼이 인라인 링크가 아니라 Button 이다', () => {
    const code = editorSource();
    const idx = code.indexOf('savePdfToPicker(');
    expect(idx).toBeGreaterThan(-1);

    // 눈에 잘 띄어야 한다(계획서 § 결정) — variant 를 가진 Button 으로 그린다.
    expect(code.slice(Math.max(0, idx - 600), idx)).toMatch(/<Button[\s\S]*variant=/);
  });
});

describe('결과 화면 재다운로드 (Phase 2)', () => {
  it('[F16-27] 선택 창을 쓴다', () => {
    expect(historySource()).toMatch(/savePdfToPicker\(/);
  });

  it('[F16-28] 맨 URL <a download> 가 남아 있지 않다', () => {
    // 그 앵커는 dev 에서 탭을 열고, Origin 없는 요청이라 캐시 오염원이기도 하다.
    expect(historySource()).not.toMatch(/a\.download\s*=/);
  });
});
