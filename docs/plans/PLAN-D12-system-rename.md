# PLAN-D12 · 시스템 이름 변경 — 오답 클립북 / ClipBook

> 출처: 2026-10-07 세션 대화 · 작성: 2026-10-07 · 상태: ✅ 완료 2026-10-07 (Phase 1, 검증 계약 4/4 · 리뷰 (c) 1 감수)

## 배경

시스템 이름이 **기능 설명**(`PDF 문항 추출기` / `PDF Question Extractor`)이다. 서비스가 무엇을 해 주는지(오답을 오려 모아 내 문제집으로 엮기)가 이름에 드러나지 않고, 브랜드로 부를 이름이 없다.

이름이 박힌 자리(2026-10-07 전수 grep):

| 자리 | 현재 값 |
|---|---|
| `frontend/index.html` `<title>` | `PDF 문항 추출기` |
| `backend/app/main.py` FastAPI `title` | `PDF Question Extractor` (Swagger 제목) |
| `Logo.tsx` 워드마크 이미지 `logo-wordmark.png`·`alt` | `깊은생각` (이미지 속 글자) |
| `README.md` 1행 · `CLAUDE.md` 제목 | `PDF 문항 추출기` |

옛 이름을 단언하는 테스트는 없다(같은 grep).

## 범위

**포함**
- 브라우저 탭 제목 → `오답 클립북`
- Swagger 제목 → `ClipBook API`
- README·CLAUDE.md 제목 — 문서라 `/implement`가 아니라 `/checkpoint`에서 (2026-10-07 반영)

**제외**
- 도메인·Worker·R2 이름(`dailystudy-*`) — 오픈(2026-10-06) 직후라 인프라를 건드리지 않는다. 바꾸면 prod WAF 규칙(계약 #38)·R2 CORS·Worker 커스텀 도메인이 같이 움직인다. 2026-10-07 "화면 이름만" 추천에 이견 없이 `/workplan` 진행
- 레포·디렉토리 이름(`pdf-extractor`), ECS·ECR 리소스 이름 — 같은 이유
- 사이드바 메뉴 이름 — REQ-D11에서 정했다. 이번 대상이 아니다
- **워드마크·아이콘 교체(구 Phase 2)** — 2026-10-07 사용자 결정으로 **별도 작업**으로 분리. 테마 컬러 변경(남색 `#1B2B4B` · 빨강 `#F0503A`, 채점 펜 느낌)과 함께 요청 예정. 루트 `TODO.md`에 등록

## 결정

| 항목 | 결정 | 근거 | 기각한 안 |
|---|---|---|---|
| 한글 이름 | **오답 클립북** | 오답노트 의미 + 문항 클립 → 책 흐름을 함께 담는다(2026-10-07 사용자 결정) | 가위풀·엮음·문제공방·픽앤북·오려담기·오답북·다시북 등 |
| 영문 이름 | **ClipBook** | 사용자 결정. 한글 이름의 "클립북"과 발음이 같다 | MissClipBook(길다)·SnipNote·Rebook·Pick&Book |
| 변경 범위 | 화면·문서 이름만 | 오픈 직후 인프라 변경 위험 회피 | 도메인까지 변경 |

## 미결 질문

- [x] 워드마크 `깊은생각` 교체 여부 · 파비콘/`icon-192.png` 교체 여부 — 2026-10-07 별도 작업으로 이관(위 `범위 — 제외`). 이 REQ에서는 닫는다

## 작업 단계

- [x] **Phase 1** — 탭 제목 `오답 클립북` · Swagger 제목 `ClipBook API`
      완료 기준: `index.html` `<title>`이 `오답 클립북`, `GET /openapi.json`의 `info.title`이 `ClipBook API`. 옛 이름 `PDF 문항 추출기`·`PDF Question Extractor`가 `frontend/`·`backend/app/`에 0건

## 검증 계약

> 작성: 2026-10-07 · 스펙: 없음(계획서만) · 검증: `/testrun D12`

| ID | 대상 | 케이스 | 유형 | 근거 | Phase | 결과 |
|----|------|--------|:----:|------|:----:|:----:|
| D12-01 | `frontend/index.html` | `<title>`이 `오답 클립북` | 정상 | PLAN § 작업 단계 — "`index.html` `<title>`이 `오답 클립북`" | 1 | ✅ |
| D12-02 | `GET /openapi.json` | `info.title`이 `ClipBook API` | 정상 | PLAN § 작업 단계 — "`GET /openapi.json`의 `info.title`이 `ClipBook API`" | 1 | ✅ |
| D12-03 | `frontend/` (index.html + src, 테스트 제외) | `PDF 문항 추출기` 0건 | 불변식 | PLAN § 작업 단계 — "옛 이름 `PDF 문항 추출기`·`PDF Question Extractor`가 `frontend/`·`backend/app/`에 0건" | 1 | ✅ |
| D12-04 | `backend/app/` | `PDF Question Extractor` 0건 | 불변식 | 같은 인용 | 1 | ✅ |

## 제약·함정

- 프론트는 **자동 배포가 없다** — 탭 제목은 `frontend-deploy.sh dev|prod`를 돌려야 반영된다. dev에서 안 보이는 것을 버그로 읽지 말 것
- 백엔드 Swagger 제목은 백엔드 재배포가 따라와야 바뀐다. prod 이미지는 `prod-<커밋>` 태그로만(계약 #37)
