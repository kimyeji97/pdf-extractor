// vitest 공용 셋업 (REQ-F09 Phase 2에서 도입)
//
// 프론트의 첫 테스트 기반이다. 백엔드 `tests/conftest.py` 와 달리 격리할 실데이터가
// 없다 — 프론트 테스트는 API 클라이언트를 mock 하므로 네트워크로 나가지 않는다.
// **그 mock 을 빠뜨리면 실제 서버로 요청이 나간다**는 점만 백엔드와 같은 계열의 위험이다.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom에는 IntersectionObserver가 없다 — usePaginatedList(무한 스크롤)를 쓰는 화면을
// 렌더하는 모든 테스트가 필요로 한다.
global.IntersectionObserver = class {
  observe() {}
  disconnect() {}
};

afterEach(() => {
  cleanup();
});
