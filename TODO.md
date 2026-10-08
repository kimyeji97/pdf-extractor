# TODO

## 진행 중
- [ ] 브랜드 리뉴얼 — 워드마크(`깊은생각` → 오답 클립북?)·파비콘·`icon-192.png` 교체 + 테마 컬러 변경(남색 `#1B2B4B` · 빨강 `#F0503A` 채점 펜 느낌). REQ-D12 Phase 2에서 분리 (2026-10-07 추가) → REQ-D13 진행 중(2026-10-08 Phase 1 로고·파비콘 ✅)

## 예정
- [ ] E02 리뷰 TODO: `backend-deploy-prod.sh` 안정화 대기 실패·시간 초과 시 이전 리비전이 ACTIVE로 남고 재실행하면 영영 정리 안 됨 · PRIMARY 배포가 NEW인지 확인 안 함 (2026-10-05 추가)
- [ ] E02 리뷰 TODO: `backend-deploy-prod.sh` 안정화 직후 이전 리비전 deregister → 즉시 롤백 대상 소실 — N-1 유지·N-2 정리로 계획 재검토 (2026-10-05 추가)
- [ ] E02 리뷰 TODO: `frontend-deploy.sh prod`에 미커밋 변경 거부·커밋 기록 없음 (2026-10-05 추가)
- [ ] E02 리뷰 TODO: `backend-deploy-prod.sh`가 HEAD가 origin/main 조상인지 확인 안 함(막으면 브랜치 핫픽스도 막힘) (2026-10-05 추가)
- [ ] 가입 승인 절차 — 승인자는 admin, 승인 위치는 임시 모니터링 화면(운영 콘솔 `scripts/ops/admin-console`) (2026-10-06 추가)
- [ ] 계정 차단 기능 — 임시 모니터링 화면(운영 콘솔 `scripts/ops/admin-console`)에서 (2026-10-06 추가)
- [ ] F19 리뷰 TODO: 서버 다운 안내 [다시 시도]의 `/health` fetch에 타임아웃 없음 — 응답이 매달리면 버튼이 비활성으로 남음 (2026-10-07 추가)
- [ ] F19 리뷰 TODO: 사용자가 누른 raw fetch(`uploadPdf` local · `uploadCover` · `uploadWatermark` · `getJobInfo`)는 서버 다운 감지 안 됨 (2026-10-07 추가)
- [ ] F19 리뷰 TODO: 운영 구간 계산이 예약 작업 `StartTime`/`EndTime`(유효 기간)을 무시 — 기간 끝난 cron도 계속 발화로 계산 (2026-10-08 추가)
- [ ] F19 리뷰 TODO: 운영 구간 AWS 조회 실패는 캐시 안 됨 — AccessDenied·스로틀 동안 요청마다 AWS 재호출 (2026-10-08 추가)
- [ ] F19 리뷰 TODO: 꺼짐 예고 배너(fixed·닫기 없음·z-index snackbar)가 좁은 화면에서 헤더 오른쪽 조작부·다이얼로그를 최대 1시간 가릴 수 있음 — dev 육안 확인 후 위치·폭 조정 (2026-10-08 추가)

## 완료
- [x] F19 리뷰 TODO: `at(...)`·`rate(...)` off 예약은 예외 없이 건너뛰어 앞뒤 구간이 이어 붙음 — 계획서 미결 `at(...)`과 함께 정리 (2026-10-08 추가) → 2026-10-08 완료(340ddea — at 반영 · rate는 `[]`)
