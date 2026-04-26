from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import upload, extract, browse, workbook

app = FastAPI(
    title="PDF Question Extractor",
    description="기출문제 PDF에서 원하는 문항만 추출하는 서비스",
    version="3.0.0",
)

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
app.include_router(workbook.router, prefix="/api", tags=["workbook"])  # v3 신규


@app.get("/health")
def health_check():
    return {"status": "ok"}
