/**
 * REQ-F18 Phase 1 — 생성 화면에서 다운로드를 걷어낸다 (소스 스캔)
 *
 * 검증 계약: docs/plans/PLAN-F18-split-download-and-list-scroll.md `## 검증 계약` (F18-01~04)
 *
 * 사용자 결정 — *"생성은 PDF 를 만드는 곳, 결과는 만들어진 걸 다운로드 하는 곳"*.
 * REQ-F16 이 생성 화면에 넣었던 저장 위치 선택 창·다운로드 버튼을 통째로 걷어내고,
 * 완료 Alert 은 **문구 + [결과로 이동] 버튼**만 남긴다.
 *
 * ⚠️ **결과 화면(`history/index.jsx`)의 선택 창은 그대로다** — 계획서 § 범위 제외.
 *    그쪽은 `F16-27·28·31` 이 지키고, `utils/savePdf.js` 도 건드리지 않는다.
 *    **이 파일은 생성 화면만 본다.**
 *
 * ⚠️ `editor/index.jsx` 는 API mock 이 5~6개 필요해 렌더 무대가 없다(PLAN-B12 § 제약·함정).
 *    여기서 보려는 것도 "무엇이 **없는가**"라 문자열로 충분하다 — 다만 **부정 단언이라
 *    스캔 대상이 비면 조용히 통과**하므로(계약 #25 "0건은 초록색") 파일을 읽었는지부터 단언한다.
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const editorSource = () => {
  const code = stripComments(readFileSync('src/pages/editor/index.jsx', 'utf-8'));
  expect(code.length).toBeGreaterThan(1000);
  return code;
};

/** 생성 완료 Alert 분기 — 다음 분기(`generateStatus === "error"`) 전까지. */
const doneAlert = (code) => {
  const start = code.indexOf('generateStatus === "done"');
  expect(start).toBeGreaterThan(-1);
  const rest = code.slice(start);
  const end = rest.indexOf('generateStatus === "error"');
  // 고정 창은 분기가 길어지면 재유입을 놓친다(F16 `/review` 회차 0 교훈).
  expect(end).toBeGreaterThan(0);
  return rest.slice(0, end);
};

describe('생성 화면에서 다운로드가 사라졌다 (Phase 1)', () => {
  it('[F18-01] savePdf 의 어떤 함수도 불러오지 않는다', () => {
    // 창을 여는 경로가 import 로 남아 있으면 되살리기 한 줄이다.
    expect(editorSource()).not.toMatch(/from\s+["']utils\/savePdf["']/);
  });

  it('[F18-02] 완료 분기에 다운로드 버튼이 없다', () => {
    expect(doneAlert(editorSource())).not.toMatch(/다운로드/);
  });

  it('[F18-03] 저장 에러 상태·표시가 없다', () => {
    // saveError 는 저장을 이 화면에서 하던 시절의 잔재다 — 남으면 영영 비어 있는 분기가 된다.
    expect(editorSource()).not.toMatch(/saveError/);
  });
});

describe('완료 Alert 이 결과 화면으로 보낸다 (Phase 1)', () => {
  it('[F18-04] 완료 Alert 에 결과 화면으로 가는 버튼이 있다', () => {
    // 버튼이 없으면 사용자가 어디서 받는지 알 수 없다(계획서 § 결정에서 "문구만" 기각).
    const alertBlock = doneAlert(editorSource());

    expect(alertBlock).toMatch(/<Button/);
    expect(alertBlock).toMatch(/paths\.results/);
  });
});
