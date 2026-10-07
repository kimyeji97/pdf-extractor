# TODO

## 진행 중

## 예정
- [ ] E02 리뷰 TODO: `backend-deploy-prod.sh` 안정화 대기 실패·시간 초과 시 이전 리비전이 ACTIVE로 남고 재실행하면 영영 정리 안 됨 · PRIMARY 배포가 NEW인지 확인 안 함 (2026-10-05 추가)
- [ ] E02 리뷰 TODO: `backend-deploy-prod.sh` 안정화 직후 이전 리비전 deregister → 즉시 롤백 대상 소실 — N-1 유지·N-2 정리로 계획 재검토 (2026-10-05 추가)
- [ ] E02 리뷰 TODO: `frontend-deploy.sh prod`에 미커밋 변경 거부·커밋 기록 없음 (2026-10-05 추가)
- [ ] E02 리뷰 TODO: `backend-deploy-prod.sh`가 HEAD가 origin/main 조상인지 확인 안 함(막으면 브랜치 핫픽스도 막힘) (2026-10-05 추가)
- [ ] 가입 승인 절차 — 승인자는 admin, 승인 위치는 임시 모니터링 화면(운영 콘솔 `scripts/ops/admin-console`) (2026-10-06 추가)
- [ ] 계정 차단 기능 — 임시 모니터링 화면(운영 콘솔 `scripts/ops/admin-console`)에서 (2026-10-06 추가)
- [ ] 브랜드 리뉴얼 — 워드마크(`깊은생각` → 오답 클립북?)·파비콘·`icon-192.png` 교체 + 테마 컬러 변경(남색 `#1B2B4B` · 빨강 `#F0503A` 채점 펜 느낌). REQ-D12 Phase 2에서 분리 (2026-10-07 추가)

## 완료
