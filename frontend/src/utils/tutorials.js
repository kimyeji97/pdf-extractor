/**
 * 튜토리얼 정의 목록 (REQ-F20) — 신기능 튜토리얼은 여기에 항목을 더하면 끝난다.
 *
 * `id`는 본 기록 키라 한 번 배포하면 바꾸지 않는다(바꾸면 이미 본 사람에게 다시 뜬다).
 * 슬라이드는 `{ title, body, image }`. 스크린샷은 `public/tutorials/`에 두고 테스트 계정으로 찍는다.
 * 문구도 옛 메뉴 이름 스캔(D11-02) 대상이다 — 메뉴는 분석·생성·결과·템플릿 관리.
 */
export const TUTORIALS = [
  {
    id: 'welcome',
    title: '오답 클립북 시작하기',
    slides: [
      {
        title: '업로드',
        body: '분석 화면에서 [PDF 업로드]를 눌러 기출 PDF를 올립니다.',
        image: '/tutorials/welcome-1.png',
      },
      {
        title: '문항 감지',
        body: '올리면 문항을 자동으로 찾습니다. 카드를 열어 빠진 문항은 [수동 추가]로 더하고, 잘못 잡힌 문항은 지웁니다.',
        image: '/tutorials/welcome-2.png',
      },
      {
        title: '문항 선택',
        body: '생성 화면에서 파일을 고르고 문제집에 넣을 문항을 체크합니다. 순서는 끌어서 바꿉니다.',
        image: '/tutorials/welcome-3.png',
      },
      {
        title: 'PDF 생성',
        body: '레이아웃을 고르고 [PDF 생성]을 누릅니다. 만든 문제집은 결과 화면에서 내려받습니다.',
        image: '/tutorials/welcome-4.png',
      },
    ],
  },
  {
    id: 'share',
    title: '분석 결과 공유',
    slides: [
      {
        title: '공유하기',
        body: '분석 카드의 공유 버튼을 누르면 오른쪽에 공유 패널이 열립니다. 이메일과 역할을 고르고 [공유]를 누릅니다.',
        image: '/tutorials/share-1.png',
      },
      {
        title: '여러 분석을 한 번에',
        body: '패널이 열린 동안 다른 카드를 누르면 공유 대상에 더해집니다. 모두 같은 역할로 공유됩니다.',
        image: '/tutorials/share-2.png',
      },
      {
        title: '역할',
        body: '소유자는 공유 관리와 재감지·삭제까지 합니다. 편집자는 문항을 추가·수정하고, 뷰어는 보기와 문제집 생성만 합니다. 공유받은 분석 카드에는 역할 칩이 붙습니다.',
        image: '/tutorials/share-3.png',
      },
    ],
  },
];
