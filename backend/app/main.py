import asyncio
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.routers import upload, extract, browse, workbook, cover, notification

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# 요청 전체 타임아웃 (REQ-P03-08). 캐시 미스 시 동기적으로 무겁게 도는
# PDF 처리 엔드포인트(문항 재감지, 썸네일 생성 등)가 비정상적으로 큰 PDF를
# 만나 무한 대기하는 것을 막기 위한 방어적 조치.
_REQUEST_TIMEOUT_SECONDS = 30


class TimeoutMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            return await asyncio.wait_for(call_next(request), timeout=_REQUEST_TIMEOUT_SECONDS)
        except asyncio.TimeoutError:
            return JSONResponse(
                {"detail": f"요청 처리 시간이 {_REQUEST_TIMEOUT_SECONDS}초를 초과했습니다."},
                status_code=504,
            )


app = FastAPI(
    title="PDF Question Extractor",
    description="기출문제 PDF에서 원하는 문항만 추출하는 서비스",
    version="3.0.0",
)

# 등록 순서 주의: 나중에 add_middleware된 것이 바깥쪽(outermost)이 된다.
# TimeoutMiddleware를 먼저 등록해 CORSMiddleware가 바깥을 감싸도록 해야
# 타임아웃으로 반환되는 504 응답에도 CORS 헤더가 정상적으로 붙는다.
app.add_middleware(TimeoutMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(extract.router, prefix="/api", tags=["extract"])
app.include_router(browse.router, prefix="/api", tags=["browse"])
app.include_router(workbook.router, prefix="/api", tags=["workbook"])
app.include_router(cover.router, prefix="/api", tags=["cover"])
app.include_router(notification.router, prefix="/api", tags=["notification"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
