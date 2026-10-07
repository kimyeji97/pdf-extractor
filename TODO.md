# TODO

## 진행 중

## 예정
- [ ] E02 리뷰 TODO: `backend-deploy-prod.sh` 안정화 대기 실패·시간 초과 시 이전 리비전이 ACTIVE로 남고 재실행하면 영영 정리 안 됨 · PRIMARY 배포가 NEW인지 확인 안 함 (2026-10-05 추가)
- [ ] E02 리뷰 TODO: `backend-deploy-prod.sh` 안정화 직후 이전 리비전 deregister → 즉시 롤백 대상 소실 — N-1 유지·N-2 정리로 계획 재검토 (2026-10-05 추가)
- [ ] E02 리뷰 TODO: `frontend-deploy.sh prod`에 미커밋 변경 거부·커밋 기록 없음 (2026-10-05 추가)
- [ ] E02 리뷰 TODO: `backend-deploy-prod.sh`가 HEAD가 origin/main 조상인지 확인 안 함(막으면 브랜치 핫픽스도 막힘) (2026-10-05 추가)
- [ ] 가입 승인 절차 — 승인자는 admin, 승인 위치는 임시 모니터링 화면(운영 콘솔 `scripts/ops/admin-console`) (2026-10-06 추가)
- [ ] 계정 차단 기능 — 임시 모니터링 화면(운영 콘솔 `scripts/ops/admin-console`)에서 (2026-10-06 추가)
- [ ] F19 리뷰 TODO: 서버 다운 안내 [다시 시도]의 `/health` fetch에 타임아웃 없음 — 응답이 매달리면 버튼이 비활성으로 남음 (2026-10-07 추가)
- [ ] F19 리뷰 TODO: 사용자가 누른 raw fetch(`uploadPdf` local · `uploadCover` · `uploadWatermark` · `getJobInfo`)는 서버 다운 감지 안 됨 (2026-10-07 추가)

## 완료
