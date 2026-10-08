# PLAN-D13 · 브랜드 리뉴얼 — 로고·파비콘·테마색·글꼴

> 출처: 2026-10-08 세션 대화 · 작성: 2026-10-08 · 상태: 🟡 진행 (Phase 1/3)

## 배경

**이름은 바뀌었는데 얼굴은 옛것이다.**
- REQ-D12에서 시스템 이름을 "오답 클립북 / ClipBook"으로 바꿨다. 하지만 사이드바 워드마크 이미지에는 여전히 `깊은생각`이 쓰여 있다(`alt`도 같다).
- 파비콘과 `icon-192.png`도 옛 아이콘이다.
- 앱 테마색과 글꼴은 템플릿 기본값 그대로다(DM Sans · Barlow + OS 한글 고딕).
- 사용자가 새 로고 세트를 `frontend/public/`에 올렸다(2026-10-08).
  - 로고: light · dark · transparent
  - 심볼: symbol 512·1024·svg
  - 파비콘: svg · ico · 16 · 32 · 48
  - apple-touch 180, icon-192
- 브랜드 기준: 색은 남색 `#1B2B4B` · 빨강 `#F0503A`(채점 펜 느낌), 글꼴은 한글 Gothic A1 · 영문 Outfit.

## 범위

**포함**
- 사이드바 로고를 새 워드마크로 교체한다. 라이트는 `logo-transparent`, 다크는 파생한 투명 로고를 쓴다. `alt`는 "오답 클립북"이다.
- 파비콘·아이콘(`index.html` `<link>`)을 새 세트로 교체한다.
- 테마 팔레트를 바꾼다. primary는 남색, secondary는 빨강이다.
- 글꼴을 바꾼다. 영문 Outfit, 한글 Gothic A1이다.

**제외**
- **생성되는 PDF 지면**(라벨·각주·워터마크): UI 테마가 아니라 종이를 재현한 것이다(계약 #14 `PAPER`는 토큰화 금지). 폰트도 `fitz.Font("korea")` 경로다(계약 #39).
- **도메인·Worker·R2·레포 이름**: REQ-D12에서 범위 밖으로 둔 그대로다.
- **로고 이미지 자체의 디자인 수정**: 사용자가 준 파일을 그대로 쓴다. 다크 투명 로고만 기존 `logo-dark.svg`에서 배경 사각형을 빼 파생한다.

## 결정

| 항목 | 결정 | 근거 | 기각한 안 |
|------|------|------|-----------|
| 범위 | **로고+파비콘+테마색+글꼴을 한 REQ로**, Phase로 나눈다 | 2026-10-08 사용자 결정 | 로고·파비콘만 · 로고+파비콘+테마색(글꼴은 나중) |
| primary/secondary | **남색 primary · 빨강 secondary**. 다크 모드에서는 primary를 밝은 남색으로 **모드별로 나눈다** | 2026-10-08 사용자 결정. 로고와 같은 인상을 준다. 팔레트 `main`은 라이트/다크 공용이라(계약 #20) 남색 primary는 다크 배경 `#141A21`에서 거의 안 보인다 | 빨강 primary(앱 전체가 붉고, 오류 빨강과 안 갈림) · 남색 primary 모드 구분 없이(다크에서 묻힘) |
| 다크 모드 로고 | **`logo-dark.svg`에서 배경 사각형만 뺀 투명 로고를 파생**한다(글자 흰색 · CLIPBOOK 밝은 회청) | 2026-10-08 사용자 결정. 올라온 `logo-dark`는 남색 배경이 깔려 있고, 투명본은 라이트용(글자 남색)뿐이다 | 양 모드 모두 `logo-transparent`(다크에서 "클립북" 남색 글자가 묻힘) · 다크에선 심볼만 |
| 다크 primary | **`#8FA3D1`**(밝힌 남색) | 2026-10-08 사용자 결정. 다크 배경 `#141A21` 위 대비가 높다 | `#A9B4CC`(로고 CLIPBOOK색 — 회청이라 강조가 약함) · `#5B78C2`(채도 높아 로고와 톤이 다름) |
| 글꼴 | **본문·제목 모두 Outfit(영문) + Gothic A1(한글), 굵기 400·500·600·700** | 2026-10-08 사용자 결정. 앱 전체를 한 글꼴 체계로 | 본문만 교체(제목 Barlow 유지) · 굵기 전부(100~900 — Gothic A1은 굵기마다 별 파일이라 용량 증가) |
| 글꼴 배포 | **fontsource 자체 호스팅** — `@fontsource-variable/outfit` · `@fontsource/gothic-a1` 추가, `@fontsource-variable/dm-sans` · `@fontsource/barlow` 제거 | 2026-10-08 사용자 결정. REQ-D07 "CDN 의존 없음" 관례 | Google Fonts CDN(외부 의존) |
| "수동" 칩 | **primary(남색)** | 2026-10-08 사용자 결정. secondary가 빨강이 되면 "분석 실패"(error) 칩과 헷갈린다. 오탐(warning)·실패(error)와 모두 구분된다 | secondary(빨강) 유지 · info(파랑 — "분석 중"과 같아짐) |
| 파일 정리 | **옛 `logo-wordmark.png`만 삭제**, 새 로고 파일은 앱이 안 써도 모두 보관 | 2026-10-08 사용자 결정. 나중에 OG 이미지·PWA 등에 쓸 수 있다 | 안 쓰는 파일 전부 삭제 · 아무것도 삭제 안 함 |

## 미결 질문

- [x] 다크 모드 primary 값 — **`#8FA3D1`** (2026-10-08) → § 결정
- [x] 글꼴 역할·굵기 — **본문·제목 모두 Outfit + Gothic A1, 400·500·600·700** → § 결정
- [x] 글꼴 배포 — **fontsource 자체 호스팅**(의존성 2개 추가 승인, DM Sans·Barlow 제거) → § 결정
- [x] "수동" 칩 색 — **primary(남색)로 변경** → § 결정
- [x] 파일 정리 — **옛 `logo-wordmark.png`만 삭제, 새 파일은 모두 보관** → § 결정

## 작업 단계

- [x] **Phase 1** — 로고·파비콘
      완료 기준:
      - 사이드바 로고가 라이트에서 `logo-transparent`, 다크에서 파생 투명 로고로 바뀐다
      - `alt`가 "오답 클립북"이다
      - 옛 `logo-wordmark.png`를 지우고, 그 파일을 참조하는 곳이 없다
      - `index.html`이 새 파비콘 세트(svg · ico · png 크기별 · apple-touch 180)를 가리킨다
      - vitest 케이스가 녹색이다
      - `npm run build`가 통과한다
      - dev 육안(라이트·다크 로고, 브라우저 탭 아이콘)을 확인한다
- [ ] **Phase 2** — 테마색
      완료 기준:
      - primary가 라이트 `#1B2B4B` · 다크 `#8FA3D1`(모드별)이다
      - secondary가 `#F0503A`다
      - "수동" 칩이 primary다(`badges.js`)
      - vitest 케이스가 녹색이다
      - `npm run build`가 통과한다
      - dev 육안(라이트·다크에서 버튼·선택 강조·칩)을 확인한다
- [ ] **Phase 3** — 글꼴
      완료 기준:
      - 본문·제목 글꼴 스택이 Outfit → Gothic A1 순서다
      - 굵기 400·500·600·700만 불러온다
      - DM Sans·Barlow 의존성과 import가 없다
      - vitest 케이스가 녹색이다
      - `npm run build`가 통과한다
      - dev 육안(한글·영문·숫자 렌더)을 확인한다

## 검증 계약

> 작성: 2026-10-08 · 스펙: 없음(계획서가 근거) · 검증: `/testrun D13` · Phase 1분만 — Phase 2·3은 착수 직전에 추가

| ID | 대상 | 케이스 | 유형 | 근거 | Phase | 결과 |
|----|------|--------|:----:|------|:----:|:----:|
| D13-01 | `Logo` | 로고 `alt` = "오답 클립북" | 정상 | PLAN § 작업 단계 — "`alt`가 \"오답 클립북\"이다" | 1 | ✅ |
| D13-02 | `Logo` | 라이트 이미지 `src` = `logo-transparent.svg` | 정상 | PLAN § 작업 단계 — "라이트에서 `logo-transparent`" | 1 | ✅ |
| D13-03 | `Logo` | 다크 이미지 `src` = `logo-dark-transparent.svg` | 정상 | PLAN § 결정 — "`logo-dark.svg`에서 배경 사각형만 뺀 투명 로고를 파생" | 1 | ✅ |
| D13-04 | `public/` | `logo-dark-transparent.svg`에 전체 크기 배경 사각형 없음 | 회귀 | PLAN § 결정 — "`logo-dark.svg`에서 배경 사각형만 뺀 투명 로고를 파생" | 1 | ✅ |
| D13-05 | `public/`·`src` | 옛 `logo-wordmark.png` 파일 없음 · 참조 없음 | 정상 | PLAN § 작업 단계 — "옛 `logo-wordmark.png`를 지우고, 그 파일을 참조하는 곳이 없다" | 1 | ✅ |
| D13-06 | `index.html` | 아이콘 링크에 `favicon.svg`·`favicon.ico` | 정상 | PLAN § 작업 단계 — "새 파비콘 세트(svg · ico · png 크기별 · apple-touch 180)" | 1 | ✅ |
| D13-07 | `index.html` | `apple-touch-icon` = `apple-touch-icon-180.png` | 정상 | PLAN § 작업 단계 — "새 파비콘 세트(svg · ico · png 크기별 · apple-touch 180)" | 1 | ✅ |
| D13-08 | `index.html` | 아이콘 `href`가 가리키는 파일이 모두 `public/`에 있다 | 회귀 | PLAN § 작업 단계 — "새 파비콘 세트(svg · ico · png 크기별 · apple-touch 180)" | 1 | ✅ |

> 테스트가 정하는 인터페이스: 다크 투명 로고 = **`public/logo-dark-transparent.svg`** · `Logo`는 라이트·다크 이미지를 **둘 다 DOM에 두고 CSS(색 체계 선택자)로 하나만 보인다**(JS로 모드를 읽어 바꾸면 첫 페인트에 잘못된 로고가 번쩍인다 — 계약 #21 계열) · 로고는 svg.

## 제약·함정

| 대상 | 내용 |
|---|---|
| 팔레트 공유 (계약 #20) | `*.main`·`lighter`·`darker`는 라이트/다크가 공유한다. 남색 primary를 그대로 두면 다크에서 묻힌다. 색조 배경은 `tintBg`/`tintSx`를 거친다 |
| 칩 색 단일 출처 (계약 #36) | 칩 색은 `utils/badges.js` 한 곳에서만 정한다. secondary가 바뀌면 "수동" 칩이 따라 바뀐다 |
| 사전 페인트 스크립트 (계약 #21) | `index.html`의 FOUC 방지 스크립트 배경 hex(`#141A21`/`#F9FAFB`)는 `grey[900]`/`grey[100]`과 짝이다. 회색 팔레트를 바꾸면 함께 고쳐야 한다(이번엔 primary/secondary만 바꿀 예정) |
| 한글 폴백 | `typography.ts`의 `setFontWithKorean`은 라틴 글꼴 **바로 뒤**에 OS 한글 고딕을 끼운다. Gothic A1을 넣으면 그 자리를 대체한다 |
| 테스트 무대 (계약 #18·#25) | 테마 CSS 변수 접두사는 `--palette-*`다. 프론트 컴포넌트는 앱과 같은 `ThemeProvider` 아래에서 렌더한다 |
| 미추적 파일 | 새 로고 파일들은 아직 미추적(`??`) 상태이고 `favicon.ico`·`icon-192.png`는 수정(`M`) 상태다. Phase 1 커밋에 함께 넣는다 |
