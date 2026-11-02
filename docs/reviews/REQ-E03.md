# 리뷰 결과 — REQ-E03

- 회차: 2 · 범위: 44c51a7..9625676 · 2026-11-02
- 리뷰: REQ-E03 @ 9625676 — (b) 4 · (c) 1 · nit 5
  - (b): [scripts/ops/admin_console.py:141] 운영 구간 안에서 유휴로 desired 0이면 콘솔 "다음 예약"이 다음 날 15:00으로 뜬다 · 실측
    - 방안: A running 판정을 확장 대상 MaxCapacity ≥ 1로 (+3줄 · admin_console.py, set_power 문서 1줄) · TODO · 감수 — 추천 A
    - 결정: A → 닫힘 (9625676, 회차 1에서 44c51a7로 닫힌 뒤 같은 Phase fix 커밋에 합쳐짐)
  - (b): [frontend/src/pages/unavailable/index.jsx:100] 3초 폴링이 응답 느린 /health를 겹쳐 띄우고, 늦게 끝난 요청이 언마운트·시간 초과 뒤에도 goBack한다 · 가설
    - 방안: A setTimeout 재귀 + 중단 ref (~10줄 · index.jsx) · TODO · 감수 — 추천 감수
    - 결정: 감수
  - (b): [backend/app/services/idle_scale_in.py:82] 스케일인 뒤에도 루프가 돌아, 종료 전 웨이커가 desired 1로 올리면 옛 태스크가 다시 0으로 내릴 수 있다 · 가설
    - 방안: A check_once가 True면 루프 종료 (+1줄 · idle_scale_in.py) · TODO · 감수 — 추천 감수
    - 결정: 감수
  - (b): [scripts/ops/admin-console.html:209] 타일 이름은 아직 desired로 정해서, 운영 구간 안 유휴 0이면 "다음 예약 켜짐 · 23:00"(실제는 꺼짐)으로 뜬다 · 실측
    - 방안: A server()가 다음 예약 종류를 응답에 넣고 타일이 그걸 쓴다 (+2줄 · admin_console.py, admin-console.html) · B A + 옛 "다음 예약까지만 유효" 문구 4곳 정리 (+6줄 · 같은 두 파일, operating_schedule.py docstring) · TODO · 감수 — 추천 A
    - 결정: A → 닫힘 (9625676)
  - (c): [backend/app/main.py:74] 활동 판정이 사람 아닌 요청도 센다(봇·무인증 401·SSE 재연결 때 refresh/알림 GET) · 가설
    - 방안: A 계획서 미결로 (/workplan) · TODO · 감수 — 추천 TODO
    - 결정: TODO
