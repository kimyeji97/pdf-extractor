"""
운영 구간 라우터 (REQ-F19 Phase 3)

Endpoints:
  GET /api/operating-windows — 앞으로 2주 치 운영 구간 `[{start, end}]` (ISO, 시간대 포함)

**무인증이다** — 로그인·회원가입 화면의 꺼짐 예고 배너도 이 값을 쓴다. 노출하는 정보는 운영 시각뿐이다.
"""
from fastapi import APIRouter

from app.services import operating_schedule

router = APIRouter()


@router.get("/operating-windows")
def get_operating_windows():
    # 모듈 속성으로 부른다 — 테스트가 fetch_scheduled_actions 를 갈아 끼운다
    return operating_schedule.upcoming_windows()
