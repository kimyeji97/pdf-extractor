# REQ-D05 표지관리 디자인을 문항 분석 디자인으로 통일

> ⚠️ **[대체됨 / superseded by REQ-D06]** (2026-07-22)
> 본 스펙은 표지 관리를 **2패널 수평 레이아웃**으로 정의했고 실제 구현도 그렇게 되어 있었으나,
> 이후 요구가 **1패널 목록형 + 업로드 모달**로 변경되어 [REQ-D06](20260716-REQ-D06-cover-list-single-panel.md)이 이를 대체한다.
> 아래 내용은 이력 보존용이며 현재 구현과 일치하지 않는다.

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-06-29 |
| 작성자 | kimyeji97 |
| 상태 | superseded (→ REQ-D06) |
| 관련 | REQ-D03 문항 분석 3패널 레이아웃, REQ-26 표지 이미지 관리, **REQ-D06 (대체)** |

---

## 1. 배경·목표

**배경**

현재 표지관리(CoverFormatView) 화면은 단일 컬럼 중앙 정렬 레이아웃을 사용하고 있어, 멀티 패널 수평 레이아웃을 사용하는 문항 분석(QuestionAnalysisView) 화면과 디자인이 일관되지 않는다.

| 요소 | 표지관리 (현재) | 문항 분석 (목표) |
|------|-----------------|------------------|
| 레이아웃 | 단일 컬럼, max-width 800px 중앙 정렬 | 멀티 패널 수평 배치, 리사이즈 가능 |
| 패널 구조 | 없음 (`.cfv-*` 커스텀 클래스) | `.panel` + `.panel-header` + `.panel-body` 공용 구조 |
| 섹션 구분 | 수직 스택 (gap 28px) | 리사이즈 핸들 (`.resize-handle`) |
| 헤더 | `<h3>` 섹션 타이틀 | `.panel-header` + `.panel-title` (42px 고정 높이, 배경색) |
| 스크롤 | 전체 페이지 수직 스크롤 | 패널별 독립 스크롤 (`.panel-body`) |
| 빈 상태 | 텍스트만 (`cfv-empty`) | 아이콘 + 텍스트 (`qav-empty-state`) |

**목표**

표지관리 화면을 문항 분석 화면과 동일한 2패널 수평 레이아웃으로 변경하여 앱 전체의 디자인 일관성을 확보한다.

---

## 2. Scope

**In-scope**

- CoverFormatView 레이아웃을 2패널 구조로 변경
- 공용 패널 클래스(`.panel`, `.panel-header`, `.panel-body`) 활용
- 리사이즈 핸들로 패널 너비 조절 지원
- 기존 `.cfv-*` 스타일 정리 (불필요 클래스 제거, 패널 내부 스타일 유지)

**Out-of-scope (non-goal)**

- 기능 변경 (업로드/삭제/목록 조회 로직 유지)
- 문항 분석 화면 변경
- 표지 관련 백엔드 API 변경

---

## 3. UI 변경

### 변경 전 (단일 컬럼)

```
┌──────────────────────────────────┐
│         cfv-content (800px)      │
│  ┌────────────────────────────┐  │
│  │   업로드 섹션               │  │
│  │   (드롭존 + 이름 + 버튼)   │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │   저장된 표지               │  │
│  │   (그리드 카드)             │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### 변경 후 (2패널 수평)

```
┌──────────────────────────────────────────────────┐
│ ① 표지 업로드         │ resize │ ② 저장된 표지    │
│ ┌──────────────────┐  │ handle │ ┌──────────────┐ │
│ │ panel-header     │  │   ║    │ │ panel-header │ │
│ ├──────────────────┤  │   ║    │ ├──────────────┤ │
│ │ panel-body       │  │   ║    │ │ panel-body   │ │
│ │                  │  │   ║    │ │              │ │
│ │ [드롭존]         │  │   ║    │ │ [그리드 카드]│ │
│ │ [이름 입력]      │  │   ║    │ │              │ │
│ │ [업로드 버튼]    │  │   ║    │ │              │ │
│ │ [에러 메시지]    │  │   ║    │ │              │ │
│ │                  │  │   ║    │ │              │ │
│ └──────────────────┘  │   ║    │ └──────────────┘ │
└──────────────────────────────────────────────────┘
```

### 패널 상세

**① 표지 업로드 (좌측 패널)**
- 헤더: `① 표지 업로드`
- 본문: 드롭존 (이미지 선택) + 이름 입력 + 업로드 버튼 + 에러 메시지
- 기본 너비: 320px (min: 200, max: 480)

**② 저장된 표지 (우측 패널)**
- 헤더: `② 저장된 표지` + 새로고침 버튼
- 본문: 그리드 카드 목록 (기존 `.cfv-grid` 패턴 유지) + 빈 상태 안내
- flex: 1 (나머지 영역 채움)

---

## 4. 수정 내용

### 4-1. CoverFormatView.jsx — 레이아웃 변경

**변경 사항:**

1. 최상위 컨테이너를 `qav-panels`와 동일한 패널 컨테이너(`.cfv-panels`)로 변경
2. 업로드 섹션 → 좌측 패널 (`.panel` + `.panel-header` + `.panel-body`)
3. 목록 섹션 → 우측 패널 (`.panel` + `.panel-header` + `.panel-body`)
4. 패널 사이에 `.resize-handle` 추가
5. 리사이즈 로직 추가 (QuestionAnalysisView와 동일 패턴)

**구조 변경:**

```jsx
<div className="cfv-layout view-layout">
  <div className="cfv-panels">
    {/* ① 표지 업로드 */}
    <div className="panel cfv-section-1" style={{ width, minWidth: 200, flexShrink: 0 }}>
      <div className="panel-header">
        <span className="panel-title">① 표지 업로드</span>
      </div>
      <div className="panel-body">
        {/* 드롭존 + 이름 입력 + 업로드 버튼 */}
      </div>
    </div>

    <div className="resize-handle" onMouseDown={...} />

    {/* ② 저장된 표지 */}
    <div className="panel cfv-section-2" style={{ flex: 1, minWidth: 0 }}>
      <div className="panel-header">
        <span className="panel-title">② 저장된 표지</span>
        <button className="qap-btn qap-btn--small" onClick={fetchCovers}>↺</button>
      </div>
      <div className="panel-body">
        {/* 그리드 카드 목록 */}
      </div>
    </div>
  </div>
</div>
```

### 4-2. App.css — 스타일 변경

**추가:**

```css
.cfv-panels {
  display: flex;
  flex: 1;
  overflow: hidden;
}
```

**제거 대상 (불필요 클래스):**

- `.cfv-content` — 단일 컬럼 래퍼 (패널 컨테이너로 대체)
- `.cfv-upload-section` — 배경/테두리 래퍼 (`.panel` + `.panel-body`로 대체)
- `.cfv-section-title` — `<h3>` 타이틀 (`.panel-title`로 대체)
- `.cfv-section-desc` — 설명 텍스트 (`.panel-body` 내 인라인으로 유지)
- `.cfv-list-section` — 목록 래퍼 (`.panel`로 대체)
- `.cfv-list-header` — 헤더 래퍼 (`.panel-header`로 대체)
- `.cfv-refresh-btn` — 새로고침 버튼 (`.qap-btn .qap-btn--small`로 대체)
- `.cfv-empty` — 빈 상태 (`.qav-empty-state` 패턴으로 대체)

**유지 대상 (패널 내부 스타일):**

- `.cfv-dropzone`, `.cfv-dropzone--has-file` — 드롭존
- `.cfv-preview-img` — 미리보기 이미지
- `.cfv-dropzone-hint`, `.cfv-dropzone-icon` — 드롭존 힌트
- `.cfv-upload-meta`, `.cfv-name-input` — 이름 입력
- `.cfv-upload-btn` — 업로드 버튼
- `.cfv-error` — 에러 메시지
- `.cfv-grid`, `.cfv-card`, `.cfv-card-img`, `.cfv-card-name`, `.cfv-card-delete` — 카드 그리드

---

## 5. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 표지관리 화면 진입 | 2패널 수평 레이아웃으로 표시됨 |
| 2 | 좌측 패널에서 이미지 선택 | 드롭존에 미리보기 표시 |
| 3 | 이름 입력 후 업로드 | 업로드 성공, 우측 목록에 반영 |
| 4 | 리사이즈 핸들 드래그 | 좌/우 패널 너비 조절됨 (min 200, max 480) |
| 5 | 우측 패널 새로고침 버튼 | 표지 목록 재조회 |
| 6 | 표지 카드 hover → 삭제 | 기존 삭제 기능 정상 동작 |
| 7 | 표지 0건 상태 | 우측 패널에 빈 상태 안내 표시 (아이콘 + 텍스트) |
| 8 | 문항 분석 화면과 비교 | 패널 헤더/본문 스타일 일관됨 |

---

## 6. 미결 질문 (Open Questions)

- 없음
