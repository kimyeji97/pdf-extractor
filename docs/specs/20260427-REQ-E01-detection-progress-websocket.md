# REQ-E01 감지 진행률 WebSocket 스트리밍

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-04-27 |
| 작성자 | kimyeji97 |
| 상태 | confirmed |

> ⚠️ **구현 상태: 미착수 (❌) — 차후 개발 예정.** 본 spec은 요구사항으로 확정되었으나 코드는 아직 작성되지 않음.

---

## 1. 배경·목표

**배경**

문항 감지는 페이지 수가 많을수록 오래 걸린다. 현재는 명시적 새로고침으로만 상태를 확인할 수 있어(REQ-07) 진행 상황이 불투명하다.

**목표 / 달성 기준**

- 감지 중 WebSocket으로 페이지별 진행률을 스트리밍한다(총 n페이지 중 n페이지 완료).
- 프론트의 파일+페이지 패널(`FilePagePanel`, REQ-D04)에 진행률 바를 표시한다.

---

## 2. Scope

**In-scope**

- `detect_page()` 분리 → 비동기화
- WebSocket 엔드포인트 (`extract.py`)
- `question_parser.py` 페이지 단위 콜백
- 프론트 진행률 훅 + `FilePagePanel` 진행률 바

**Out-of-scope (non-goal)**

- 감지 알고리즘 자체 변경

---

## 3. API·데이터 변경

### API

| Method | Path | 설명 |
|--------|------|------|
| WS | (감지 진행률 WebSocket 엔드포인트) | `{ total, done, page }` 형태 진행 이벤트 스트리밍 |

### 데이터 모델·스키마

진행 이벤트: `{ job_id, total_pages, done_pages, current_page }`.

### 마이그레이션 메모

기존 백그라운드 감지 태스크를 페이지 단위로 분해.

---

## 4. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 다페이지 PDF 감지 | 페이지 완료마다 진행 이벤트 수신 |
| 2 | 감지 완료 | 100% 후 연결 종료 |
| 3 | 연결 끊김 | 재연결 또는 폴백(REQ-07) |

---

## 5. 미결 질문 (Open Questions)

- [ ] WebSocket vs SSE 최종 선택 (현 plan은 WebSocket)
- [ ] ECS + Cloudflare Tunnel 환경에서 WS 연결 유지 검증 필요
