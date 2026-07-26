import { Icon } from '@iconify/react';
import paths from 'routes/paths';

// ----------------------------------------------------------------------

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
};

const navIcon = (name: string) => <Icon icon={name} style={{ fontSize: 22 }} />;

/** 사이드바 메뉴 — 템플릿 데모 메뉴(대시보드·유저·상품·블로그) 대신 이 앱의 4개 라우트 */
export const navData: NavItem[] = [
  {
    title: '문항 분석',
    path: paths.analysis,
    icon: navIcon('material-symbols:document-scanner-outline-rounded'),
  },
  {
    title: '문제집 편집',
    path: paths.editor,
    icon: navIcon('material-symbols:edit-document-outline-rounded'),
  },
  {
    title: '생성 이력',
    path: paths.history,
    icon: navIcon('material-symbols:history-rounded'),
  },
  {
    title: '표지 관리',
    path: paths.format,
    icon: navIcon('material-symbols:imagesmode-outline-rounded'),
  },
];
