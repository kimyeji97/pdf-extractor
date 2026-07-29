# REQ-D08 — 라이트/다크 모드

> 상태: ✅ 완료 (2026-07-29) — 미검증 2건은 §6 #9·#10
> 선행: [REQ-D07](20260725-REQ-D07-minimal-template-adoption.md) — 템플릿 이식 및 하드코딩 색 제거
> 출처: D07 스펙 §6 "추가 예정 기능"에서 번호 예약

---

## 1. 배경·목표

D07에서 Minimal 템플릿 테마를 이식하면서 **light 색상만 채워 넣었다.** 템플릿 원본은
light/dark 양쪽을 갖고 있지만 우리는 당시 다크 요구가 없어 light 키만 이식했다.

이 REQ의 목표는 **다크 색상값을 채우고 사용자가 전환할 수 있게 하는 것**이다.

## 2. 사전 분석 (2026-07-29 실측)

### 2-1. 골격은 이미 다크를 받을 준비가 돼 있다

D08이 "중~대"로 추정됐던 이유(D07 스펙 §6: "하드코딩 286개가 선결")는 **이미 해소됐다.**

| 항목 | 상태 | 근거 |
|------|------|------|
| `ThemeColorScheme` 타입 | ✅ `SupportedColorScheme`(light\|dark) | `theme/types.ts:20` |
| `palette`/`shadows`/`customShadows` 시그니처 | ✅ `Partial<Record<ThemeColorScheme, …>>` | light 키만 비어 있음 |
| JSX 하드코딩 hex | ✅ 0개 | D07 Phase 2 |
| `qlist-*` 하드코딩 22개 | ✅ 제거 | D07 Phase 3-5 (당시 "D08의 선결 조건"으로 명시) |
| `--mui-palette-*` 오용 5곳 | ✅ 수정 | D07 Phase 4, 계약 #18 |

**즉 구조 변경 없이 dark 키를 채우는 것으로 대부분이 끝난다.** 남은 실제 표면은 아래 두 곳뿐이다.

### 2-2. 남은 하드코딩 표면

| 파일 | 개수 | 처리 |
|------|:----:|------|
| `App.css` (`wbp-*`·`pdf-*`·딤·스켈레톤) | 약 40 | **일부만** 토큰화 — §3 예외표 참조 |
| `components/BookCard.jsx` | 2 (rgba) | 로딩 딤은 토큰화, 책등 광택은 유지 |

### 2-3. 함정 — `InitColorSchemeScript`의 attribute 기본값이 우리 설정과 다르다

MUI의 기본 attribute는 **`data-mui-color-scheme`**인데
`themeConfig.cssVariables.colorSchemeSelector`는 **`data-color-scheme`**이다(D07 이식값).
안 맞추면 초기화 스크립트가 엉뚱한 속성을 심어 **첫 페인트에서 라이트가 번쩍인 뒤 다크로 바뀐다**(FOUC).
`attribute="data-color-scheme"`를 명시적으로 넘겨야 한다.

> 계약 #18("변수 접두사 `--palette-*`")과 **같은 계열의 실패**다 — 이름이 어긋나도 에러가 안 나고
> 조용히 틀린 화면이 나온다.

---

## 3. 다크 예외 — 어둡게 만들지 **않는** 것

> ⚠️ **이 표가 이 REQ에서 가장 중요한 기록이다.** "다크 모드니까 전부 어둡게"가 아니다.
> 아래는 UI 색이 아니라 **생성될 PDF 지면을 재현한 값**이라 다크에서도 흰색이어야 한다.

| 대상 | 이유 | 근거 |
|------|------|------|
| `WorkbookPreview`의 `PAPER` 상수 | 생성될 PDF 지면 재현값. 라벨 배경은 백엔드 `pdf_service`의 `fill=(0.96,0.96,0.98)`과 짝 | **계약 #14**, D07 §8 #5 |
| `workbookLayout.DIVIDER_COLOR` | 백엔드 `layout_spec.py`와 동기화되는 짝 | **계약 #13** |
| `.wbp-page` / `.wbp-cell-clip` / `.wbp-cell-empty` | A4 지면과 그 위의 셀. 종이는 흰색이다 | D07 §8 #5 |
| `.wbp-scale-btns` (배율 조절 오버레이) | **흰 종이 위에 떠 있는** 컨트롤이라 지면 기준으로 밝아야 한다 | 본 REQ |
| `.pdf-page-wrapper`의 `background:#fff` | react-pdf가 그리는 실제 PDF 페이지 바탕 | 본 REQ |

**어둡게 하는 것**: `.pdf-toolbar`(뷰어 크롬) · `.pdf-scroll-container`(뷰어 여백) ·
`.pdf-loading/error/empty` · `.global-dim` · `.img-skeleton` · `.wbp-empty`(지면이 아니라 캔버스 빈 상태) ·
`BookCard` 로딩 딤.

> 판별 기준: **"이것이 종이인가, 종이를 담는 도구인가?"** 종이면 흰색, 도구면 테마를 따른다.

---

## 4. 결정 사항 (2026-07-29 사용자 확정)

| # | 결정 | 대안과 기각 이유 |
|:-:|------|------------------|
| 1 | **기본값은 OS 설정 따름**(`defaultMode: 'system'`) | 라이트 고정은 다크 OS 사용자가 매번 토글해야 함 |
| 2 | **3단 메뉴**(라이트/다크/시스템) | 2단 아이콘 토글은 **"OS 따름"으로 되돌릴 방법이 없다** — system이 기본값인데 한 번 토글하면 영영 복귀 불가 |
| 3 | 사용자 선택은 `localStorage`에 저장해 이후 우선 | — |

> 결정 #1과 #2는 묶여 있다. 기본이 system이면 토글도 system을 가리킬 수 있어야 한다.

## 4-1. 함정 — `*.lighter` / `*.darker`는 두 모드가 공유한다 (2026-07-29 발견)

> **이 REQ에서 가장 값비싼 발견이다.** 하드코딩 hex가 아니라 **팔레트 토큰을 제대로 썼는데도**
> 깨졌기 때문에 grep으로는 절대 안 잡힌다.

`palette.ts`에서 모드별로 갈리는 것은 **`text` · `background` · `action` 셋뿐**이다.
`basePalette`(primary·secondary·info·success·warning·error·grey)는 두 색상 스킴이 **공유**한다.
따라서 선택·활성 강조에 흔히 쓰는 `primary.lighter`는 다크에서도 `#D0ECFE` 그대로다.

발견 경위: 통계 카드 3장이 **어두운 화면에 파스텔 타일로 박혀 있는 것을 스크린샷에서 눈으로 보고** 찾았다.
그 시점에 수치 검증(변수 정의·콘솔 에러·문서 스크롤·지면 흰색)은 **17개 전부 통과 상태**였다.
Phase 3-4·3-5에서 두 번 겪은 "수치는 통과인데 눈으로 보고서야 잡힌다"가 세 번째로 재확인됐다.

더 나쁜 것은 **`StatCards.jsx`에 이미 예방 주석이 있었다**는 점이다 —
*"배경은 팔레트의 lighter 계열을 쓴다 — 하드코딩 hex를 넣으면 다크 모드(REQ-D08)에서 튄다."*
D07 Phase 4에서 다크를 대비해 적은 것인데, **전제가 틀려서 예방책이 오히려 함정을 고정시켰다.**

→ `theme/tint.js`(`tintBg`/`tintSx`/`tintFg`) 신설. `main` 채널의 **알파**를 깔면 밑배경을
그대로 받으므로 양쪽에서 성립한다. 글자색만 `applyStyles('dark')`로 뒤집는다.
사용처 13곳 중 11곳 교체, 2곳(`work.jsx`의 드래그 오버레이)은 **흰 지면 위**라 §3 예외로 유지.
→ **CLAUDE.md 계약 #20으로 승격.**

> ⚠️ 부수 함정: `tintSx`/`tintFg`는 **함수를 반환**한다. 객체 리터럴 sx에 `...tintSx('primary')`로
> 스프레드하면 함수에 열거 가능한 속성이 없어 **아무것도 안 들어가고 에러도 안 난다.**
> `sx={(theme) => ({ ...tintSx('primary')(theme) })}`로 써야 한다. 고치는 도중에 같은 부류의
> 조용한 실패를 두 곳(`nav.tsx`·`QuestionListPanel`) 만들었다가 빌드가 아니라 **재측정에서 잡았다.**

## 5. 작업 계획

- [x] **Phase 1 — 테마 다크 값**: `core/palette.ts`(text·background·action·palette) ·
      `core/shadows.ts` · `core/custom-shadows.ts`에 dark 키 추가, `create-theme.ts`에 `colorSchemes.dark`
- [x] **Phase 2 — 전환 UI**: `theme-provider.tsx`에 `defaultMode`·`noSsr`, `index.html`에
      FOUC 방지 사전 페인트 스크립트(§2-3 attribute 주의), 헤더 `rightArea`에 3단 메뉴
- [x] **Phase 3 — 잔여 하드코딩**: `App.css` · `BookCard.jsx`를 §3 예외표에 따라 정리
- [x] **Phase 3-1 — `*.lighter` 일괄 교체**(계획에 없던 작업, §4-1): `theme/tint.js` 신설 + 11곳 교체
- [x] **Phase 4 — 검증**: §6

## 6. 검증 계획

검증 방식: headless Chrome + CDP(node 22 내장 `WebSocket`, 의존성 추가 없음 — Phase 3-5와 동일 방식).
1600×1000, 실데이터(SOURCE 5개·2,686문항).

| # | 케이스 | 결과 |
|:-:|--------|:----:|
| 1 | 4개 라우트가 다크에서 콘솔 에러 0건 | ✅ |
| 2 | 다크에서 `WorkbookPreview` 지면이 흰색 유지(§3) | ✅ |
| 3 | 다크에서 PDF 뷰어 페이지 바탕 흰색 유지, 툴바·여백은 어두움 | ✅ |
| 4 | 새로고침 시 선택 모드 유지 | ✅ |
| 5 | 계약 #1(높이 체인) 유지 — 4개 라우트 문서 스크롤 0 | ✅ |
| 6 | 라이트 모드 회귀 없음 | ✅ |
| 7 | 헤더 3단 메뉴 렌더 + 현재 모드 체크 표시 | ✅ |
| 8 | tint 적용 요소의 계산색이 **모드별로 다름**(§4-1 조용한 실패 탐지) | ✅ |
| 9 | FOUC 없음 (사전 페인트 스크립트) | — |
| 10 | "시스템" 선택 후 OS 테마 변경이 즉시 반영 | — |

**#9·#10 미검증 사유**: 둘 다 자동 계측이 실측을 보장하지 못한다. #9는 첫 페인트의 **찰나**를
재야 하는데 CDP 스크린샷은 그 시점을 안정적으로 못 집는다. #10은 **OS 테마 변경**이 필요해
headless 프로필 밖의 조작이다. 사용자 육안 확인에 맡긴다.

**실측 요약**: 참조한 CSS 변수 12개 전원 정의 확인, 그중 7개가 모드별로 값이 갈림
(`action.hover`·`primary.main`·`error.main`·`grey-500Channel`은 설계상 공유 — §4-1).
다크 body `rgb(20,26,33)`, 툴바 `rgb(40,50,61)`, 지면 `rgb(255,255,255)`.
통계 카드 3장 + nav 배지의 배경·글자색이 모드별로 전부 다름.
