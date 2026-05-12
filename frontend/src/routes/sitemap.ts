import React from 'react';
import { SxProps } from '@mui/material';
import paths, { rootPaths } from './paths';

export interface SubMenuItem {
  name: string;
  pathName: string;
  key?: string;
  selectionPrefix?: string;
  path?: string;
  target?: React.HTMLAttributeAnchorTarget;
  active?: boolean;
  icon?: string;
  iconSx?: SxProps;
  items?: SubMenuItem[];
}

export interface MenuItem {
  id: string;
  subheader?: string;
  icon: string;
  iconSx?: SxProps;
  items: SubMenuItem[];
}

const sitemap: MenuItem[] = [
  {
    id: 'main',
    icon: 'material-symbols:menu-book-outline-rounded',
    items: [
      {
        name: '문항 분석',
        path: paths.analysis,
        pathName: 'analysis',
        icon: 'material-symbols:document-scanner-outline-rounded',
        active: true,
      },
      {
        name: '문제집 편집',
        path: paths.editor,
        pathName: 'editor',
        icon: 'material-symbols:edit-document-outline-rounded',
        active: true,
      },
      {
        name: '생성 이력',
        path: paths.history,
        pathName: 'history',
        icon: 'material-symbols:history-rounded',
        active: true,
      },
      {
        name: '표지 관리',
        path: paths.format,
        pathName: 'format',
        icon: 'material-symbols:image-outline-rounded',
        active: true,
      },
    ],
  },
];

export default sitemap;
