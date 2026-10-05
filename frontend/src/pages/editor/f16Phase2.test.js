/**
 * REQ-F16 Phase 2 — 클릭 한 번으로: 생성 전에 위치를 받아 두고 완료되면 바로 쓴다 (소스 스캔)
 *
 * 검증 계약: docs/plans/PLAN-F16-pdf-save-picker.md `## 검증 계약` (F16-27~28, F16-31) — F16-21·22·24·25·26·29·30 은 REQ-F18 로 폐기
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
  // ⚠️ 끝을 못 찾으면 **파일 전체**를 훑어 어떤 부정/순서 단언도 의미를 잃는다
  //    (계약 #25 "0건은 초록색" 계열 — /review Phase 2 회차 0 에서 실제로 그 상태였다).
  const end = rest.indexOf('\n  };');
  expect(end).toBeGreaterThan(0);
  return rest.slice(0, end);
};

describe('결과 화면도 창이 먼저 (Phase 2)', () => {
  it('[F16-31] 재다운로드는 getStatus 전에 창을 연다', () => {
    // 뒤에 열면 그 await 동안 활성화가 만료돼 브라우저가 거부한다(dev 는 터널+Fargate).
    // ⚠️ `indexOf('pickSaveTarget')` 는 **import 줄**을 잡는다 — 호출을 뒤로 되돌려도
    //    통과했다(/review Phase 2 회차 1 실측). `await` 가 붙은 호출만 본다.
    const code = historySource();
    const pick = code.indexOf('await pickSaveTarget(');
    const status = code.indexOf('await getStatus(wb.result_job_id)');

    expect(pick).toBeGreaterThan(-1);
    expect(status).toBeGreaterThan(-1);
    expect(pick).toBeLessThan(status);
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
