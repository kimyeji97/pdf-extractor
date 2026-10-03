/**
 * REQ-F16 Phase 1 — 생성된 PDF를 브라우저 저장 위치 선택 창으로 저장
 *
 * 검증 계약: docs/plans/PLAN-F16-pdf-save-picker.md `## 검증 계약` (F16-01~05)
 *
 * 저장 로직을 순수 함수로 뺐다 — `window.showSaveFilePicker`·`fetch`·DOM 을 인자로 받지 않고
 * 전역에서 읽되, 테스트가 그 전역을 갈아끼워 검증한다(브라우저 없이 돈다).
 *
 * ⚠️ **F16-02 가 이 파일의 핵심이다.** 계획서 § 제약·함정이 적어 둔 "선택 창은 사용자 클릭
 *    안에서 열어야 한다 — 비동기 대기 뒤 열면 거부"는 **브라우저에서만 드러나고 단위 테스트로는
 *    보이지 않는다.** 그래서 직접 재지 못하는 대신 **호출 순서**(picker 가 fetch 보다 앞)를
 *    단언해 간접적으로 고정한다. 순서가 뒤집히면 실제 브라우저에서 창이 안 뜬다.
 *
 * ⚠️ 실제 창이 뜨는지·고른 곳에 저장되는지는 **육안 몫**이다(완료 기준). 여기서 녹색이어도
 *    dev Chrome 확인을 건너뛰지 말 것 — B25·F17 과 같은 구조다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { savePdfToPicker } from 'utils/savePdf';

const PDF_URL = 'https://example.test/result.pdf';
const FILENAME = '문제집_2026-10-03.pdf';

/** 호출 순서를 한 배열에 기록해 F16-02 가 볼 수 있게 한다. */
let calls;
let writable;

const makePicker = (handle) => vi.fn(async () => { calls.push('picker'); return handle; });

const makeHandle = () => {
  writable = { write: vi.fn(async () => { calls.push('write'); }), close: vi.fn(async () => { calls.push('close'); }) };
  return { createWritable: vi.fn(async () => writable) };
};

beforeEach(() => {
  calls = [];
  global.fetch = vi.fn(async () => { calls.push('fetch'); return { blob: async () => 'PDF_BYTES' }; });
});

afterEach(() => {
  delete global.showSaveFilePicker;
  vi.restoreAllMocks();
});

describe('savePdfToPicker — 지원 브라우저', () => {
  it('[F16-01] showSaveFilePicker 를 부른다', async () => {
    const picker = makePicker(makeHandle());
    global.showSaveFilePicker = picker;

    await savePdfToPicker(PDF_URL, FILENAME);

    expect(picker).toHaveBeenCalled();
  });

  it('[F16-02] 창을 먼저 띄우고 그 뒤 PDF 를 받는다', async () => {
    global.showSaveFilePicker = makePicker(makeHandle());

    await savePdfToPicker(PDF_URL, FILENAME);

    // 순서가 뒤집히면(먼저 fetch 하고 창을 열면) 실제 브라우저가 창을 거부한다.
    expect(calls.indexOf('picker')).toBeLessThan(calls.indexOf('fetch'));
  });

  it('[F16-03] 고른 파일에 받은 내용을 쓴다', async () => {
    global.showSaveFilePicker = makePicker(makeHandle());

    await savePdfToPicker(PDF_URL, FILENAME);

    expect(writable.write).toHaveBeenCalledWith('PDF_BYTES');
  });

  it('[F16-04] 사용자가 취소하면 조용히 끝낸다', async () => {
    const abort = Object.assign(new Error('취소'), { name: 'AbortError' });
    global.showSaveFilePicker = vi.fn(async () => { throw abort; });

    await expect(savePdfToPicker(PDF_URL, FILENAME)).resolves.toBeUndefined();
  });
});

describe('savePdfToPicker — 미지원 브라우저', () => {
  it('[F16-05] showSaveFilePicker 가 없으면 <a download> 로 받는다', async () => {
    // Safari·Firefox 경로. 앵커를 만들어 클릭하는지로 본다.
    const anchor = { click: vi.fn(), setAttribute: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchor);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => anchor);

    await savePdfToPicker(PDF_URL, FILENAME);

    expect(anchor.click).toHaveBeenCalled();
  });
});
