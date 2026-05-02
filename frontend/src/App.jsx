/**
 * 앱 루트 컴포넌트
 *
 * v3에서 NavMenu + 3개 뷰로 구조 개편 (REQ-10).
 * 기존 단일 3패널 레이아웃을 QuestionAnalysisView로 이전하고
 * 탭 네비게이션으로 뷰를 전환한다.
 *
 * 탭 전환 전략 — hide-not-unmount:
 *   각 뷰 컴포넌트는 한 번만 마운트되고, display:none / display:block 으로 가시성 전환.
 *   이유: unmount하면 파일 선택, 페이지 선택 등 하위 상태가 초기화되어 UX가 나빠짐.
 *   탭 간 이동 후 돌아왔을 때 직전 상태 그대로 유지됨.
 *
 * 뷰 간 통신:
 *   - WorkbookHistoryView → WorkbookEditorView: initialWorkbookId 로 편집 복원 (REQ-20)
 *   - onLoadForEdit 콜백이 activeMenu 전환 + initialWorkbookId 설정을 담당
 */
import { useState } from "react";
import NavMenu from "./components/NavMenu";
import QuestionAnalysisView from "./views/QuestionAnalysisView";
import WorkbookEditorView from "./views/WorkbookEditorView";
import WorkbookHistoryView from "./views/WorkbookHistoryView";
import CoverFormatView from "./views/CoverFormatView";
import "./App.css";

export default function App() {
  // 현재 활성 탭: "analysis" | "editor" | "history" | "format"
  const [activeMenu, setActiveMenu] = useState("analysis");

  // 생성된 문제집 탭에서 "편집으로 불러오기" 클릭 시 전달되는 workbook_id (REQ-20)
  // WorkbookEditorView에 prop으로 전달하여 해당 문제집의 selections/layout 복원
  const [initialWorkbookId, setInitialWorkbookId] = useState(null);

  // 생성된 문제집 탭에서 편집 탭으로 전환하는 콜백
  const handleLoadForEdit = (workbookId) => {
    setInitialWorkbookId(workbookId);
    setActiveMenu("editor");
  };

  // 탭 변경 시 편집 복원 ID 초기화 (직접 탭 클릭 시에는 빈 에디터로 시작)
  const handleMenuChange = (menuId) => {
    if (menuId !== "editor") {
      setInitialWorkbookId(null);
    }
    setActiveMenu(menuId);
  };

  return (
    <div className="app-layout">

      {/* ─── 상단 헤더 ─────────────────────────────── */}
      <header className="app-header">
        <h1>기출문제 PDF 문항 추출기</h1>

        {/* ─── 탭 네비게이션 (REQ-10) ───────────────── */}
        <NavMenu activeMenu={activeMenu} onMenuChange={handleMenuChange} />
      </header>

      {/* ─── 뷰 컨테이너 (hide-not-unmount) ─────────── */}
      {/* display를 CSS로 제어하여 컴포넌트 상태를 유지한 채 탭 전환 */}

      <div style={{ display: activeMenu === "analysis" ? "contents" : "none" }}>
        <QuestionAnalysisView />
      </div>

      <div style={{ display: activeMenu === "editor" ? "contents" : "none" }}>
        <WorkbookEditorView initialWorkbookId={initialWorkbookId} />
      </div>

      <div style={{ display: activeMenu === "history" ? "contents" : "none" }}>
        <WorkbookHistoryView onLoadForEdit={handleLoadForEdit} />
      </div>

      <div style={{ display: activeMenu === "format" ? "contents" : "none" }}>
        <CoverFormatView />
      </div>

    </div>
  );
}
