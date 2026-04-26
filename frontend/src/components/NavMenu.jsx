/**
 * 상단 탭 네비게이션 (REQ-10)
 *
 * 세 가지 메뉴를 탭 버튼으로 전환한다:
 *   - 문항 분석   : 자동/수동 문항 관리 (재감지, 타이틀 수정, 추가/삭제, 오탐지 표시)
 *   - 문제집 생성 : 문항 선택 + 레이아웃 지정 → PDF 생성
 *   - 생성된 문제집: 생성 이력 확인 + 재다운로드 + 편집 복원
 *
 * 설계 원칙:
 *   - 탭 전환은 App.jsx의 activeMenu state를 업데이트하여 처리
 *   - 뷰 컴포넌트는 unmount하지 않고 CSS display:none으로 숨겨 상태 보존 (hide-not-unmount)
 */
export default function NavMenu({ activeMenu, onMenuChange }) {
  const tabs = [
    { id: "analysis", label: "문항 분석" },
    { id: "editor",   label: "문제집 생성" },
    { id: "history",  label: "생성된 문제집" },
  ];

  return (
    <nav className="nav-menu">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-tab${activeMenu === tab.id ? " nav-tab--active" : ""}`}
          onClick={() => onMenuChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
