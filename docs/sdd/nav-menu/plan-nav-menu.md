# plan-nav-menu — 상단 탭 메뉴 도입

> **요구사항**: REQ-10  
> **작성일**: 2026-04-26  
> **관련 spec**: [plan-v3.md](../plan-v3.md)  
> **변경 범위**: 프론트엔드 전용

---

## 1. 목표

현재 App.jsx의 단일 레이아웃을 세 개의 독립적인 뷰로 전환할 수 있도록 상단 탭 메뉴를 도입한다.

---

## 2. 탭 구성

```
┌─────────────────────────────────────────────────────┐
│  [문항 분석]   [문제집 생성]   [생성된 문제집]         │
└─────────────────────────────────────────────────────┘
```

| 탭 키 | 표시명 | 연결 뷰 |
|-------|--------|---------|
| `analysis` | 문항 분석 | `QuestionAnalysisView` |
| `editor` | 문제집 생성 | `WorkbookEditorView` |
| `history` | 생성된 문제집 | `WorkbookHistoryView` |

---

## 3. 상태 관리

- `activeMenu: 'analysis' | 'editor' | 'history'` — React state로 관리.
- React Router 미사용. 단일 페이지 구조 유지.
- 탭 전환 시 각 뷰의 내부 상태(선택 파일, 페이지 등)는 독립적으로 유지.
  - 뷰 컴포넌트를 `display:none`으로 숨김 처리 (unmount가 아닌 hide) — 상태 보존 목적.

---

## 4. 컴포넌트 변경

### 4.1 신규: `NavMenu.jsx`

```
frontend/src/components/NavMenu.jsx
```

Props:
```js
{ activeMenu, onMenuChange }
// activeMenu: 'analysis' | 'editor' | 'history'
// onMenuChange: (menu) => void
```

### 4.2 변경: `App.jsx`

현재 App.jsx의 3패널 레이아웃 코드를 `QuestionAnalysisView`로 이전한다.

```
App.jsx
├── state: activeMenu (기본값: 'analysis')
├── <NavMenu activeMenu onMenuChange />
└── 뷰 렌더링 (hide 방식):
    ├── <QuestionAnalysisView hidden={activeMenu !== 'analysis'} />
    ├── <WorkbookEditorView   hidden={activeMenu !== 'editor'} />
    └── <WorkbookHistoryView  hidden={activeMenu !== 'history'} />
```

### 4.3 신규: 뷰 파일 (초기 골격)

```
frontend/src/views/
├── QuestionAnalysisView.jsx   (기존 App.jsx 로직 이전)
├── WorkbookEditorView.jsx     (초기 빈 뷰)
└── WorkbookHistoryView.jsx    (초기 빈 뷰)
```

---

## 5. 구현 작업 목록

1. `frontend/src/views/` 디렉토리 생성
2. `NavMenu.jsx` 신규 작성
3. 기존 App.jsx의 3패널 로직 → `QuestionAnalysisView.jsx`로 이전
4. `WorkbookEditorView.jsx`, `WorkbookHistoryView.jsx` 빈 컴포넌트 생성
5. `App.jsx` 를 NavMenu + 뷰 조건부 렌더링 구조로 교체
6. CSS: 탭 활성 스타일, 탭 전환 트랜지션
