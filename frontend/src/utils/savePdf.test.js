/**
 * REQ-F16 Phase 1 — 생성된 PDF를 브라우저 저장 위치 선택 창으로 저장
 *
 * 검증 계약: docs/plans/PLAN-F16-pdf-save-picker.md `## 검증 계약` (F16-01~05, F16-08~12, F16-14~15)
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

import { savePdfToPicker, toDownloadUrl } from 'utils/savePdf';

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
  global.fetch = vi.fn(async () => { calls.push('fetch'); return { ok: true, blob: async () => 'PDF_BYTES' }; });
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
    // (2026-10-03: 폴백이 blob 경로로 바뀌어 URL 스텁이 무대에 필요해졌다 — 단언은 불변)
    const anchor = { click: vi.fn(), setAttribute: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchor);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => anchor);
    global.URL.createObjectURL = vi.fn(() => 'blob:fake');
    global.URL.revokeObjectURL = vi.fn();

    await savePdfToPicker(PDF_URL, FILENAME);

    expect(anchor.click).toHaveBeenCalled();
  });
});

describe('받기 실패 처리', () => {
  it('[F16-08] 응답이 실패면 파일에 쓰지 않는다', async () => {
    // 에러 본문이 그대로 PDF 로 저장되던 자리다(/review 회차 0).
    global.showSaveFilePicker = makePicker(makeHandle());
    global.fetch = vi.fn(async () => ({ ok: false, status: 401, blob: async () => 'ERROR_BODY' }));

    await savePdfToPicker(PDF_URL, FILENAME).catch(() => {});

    expect(writable.write).not.toHaveBeenCalled();
  });

  it('[F16-09] 쓰기 중 실패하면 abort 로 되돌린다', async () => {
    const handle = makeHandle();
    writable.write = vi.fn(async () => { throw new Error('디스크 가득'); });
    writable.abort = vi.fn(async () => {});
    global.showSaveFilePicker = makePicker(handle);

    await savePdfToPicker(PDF_URL, FILENAME).catch(() => {});

    // createWritable() 이 고른 파일을 이미 비웠다 — abort 가 없으면 원본이 파괴된다.
    expect(writable.abort).toHaveBeenCalled();
  });

  it('[F16-10] 우리 API 오리진이면 인증 자격을 실어 보낸다', async () => {
    // /api/files 는 쿠키 인증이고 dev 는 크로스오리진이다 (계약 #31).
    global.showSaveFilePicker = makePicker(makeHandle());

    await savePdfToPicker('http://localhost:8000/api/files/results/x/result.pdf', FILENAME);

    expect(global.fetch).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ credentials: 'include' }));
  });

  it('[F16-15] 다른 오리진(R2 공개 도메인)에는 자격·헤더를 붙이지 않는다', async () => {
    // R2 버킷 CORS 에 AllowCredentials 가 없어 include 면 브라우저가 응답을 막는다.
    // Authorization 도 preflight 를 유발해 같은 이유로 깨진다 (/review 회차 1).
    global.showSaveFilePicker = makePicker(makeHandle());

    await savePdfToPicker('https://cdn.dev.test/results/x/result.pdf', FILENAME);

    expect(global.fetch).toHaveBeenCalledWith(expect.anything(), undefined);
  });

  it('[F16-14] 받을 때 toDownloadUrl 을 거친다 — 캐시 키를 가른다', async () => {
    // 배선을 안 보면 toDownloadUrl(url) → url 로 되돌려도 통과한다(/review 회차 1).
    global.showSaveFilePicker = makePicker(makeHandle());

    await savePdfToPicker(PDF_URL, FILENAME);

    // 두 번째 인자는 오리진에 따라 undefined 라 expect.anything() 으로는 못 본다 — 첫 인자만 본다.
    expect(global.fetch.mock.calls[0][0]).toContain('dl=1');
  });
});

describe('미지원 브라우저 폴백', () => {
  it('[F16-11] blob 으로 받아 저장한다 — 맨 URL 앵커가 아니다', async () => {
    // 크로스오리진 맨 URL 은 download 속성이 무시돼 탭에서 열린다(계획서 § 제외 위반).
    const anchor = { click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchor);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => anchor);
    global.URL.createObjectURL = vi.fn(() => 'blob:fake');
    global.URL.revokeObjectURL = vi.fn();

    await savePdfToPicker(PDF_URL, FILENAME);

    expect(anchor.href).toBe('blob:fake');
  });
});

describe('toDownloadUrl — 캐시 키 가르기', () => {
  it('[F16-12] 다운로드용 쿼리를 붙인다', () => {
    expect(toDownloadUrl('https://cdn.test/a.pdf')).toContain('dl=1');
  });

  it('[F16-12] presigned URL 에는 손대지 않는다', () => {
    // 쿼리가 서명 대상이라 파라미터를 더하면 403 이 된다(previewUrl.js 와 같은 이유).
    const signed = 'https://cdn.test/a.pdf?X-Amz-Signature=abc';
    expect(toDownloadUrl(signed)).toBe(signed);
  });
});
