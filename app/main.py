from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

from app.api.routes.risk import router as risk_router
from app.api.routes.stockout import router as stockout_router
from app.api.routes.transfers import router as transfers_router
from app.api.routes.actions import router as actions_router
from app.api.routes.ai import router as ai_router


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Production API for the Enterprise AI Supply Chain Platform",
)


# ============================================================
# CORS
# ============================================================
# Local React / Vite frontend.
#
# We explicitly allow both localhost and 127.0.0.1 because
# the frontend may be opened using either address during
# local development.
# ============================================================

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# API ROUTERS
# ============================================================

app.include_router(
    risk_router,
    prefix="/api/v1",
)

app.include_router(
    stockout_router,
    prefix="/api/v1",
)

app.include_router(
    transfers_router,
    prefix="/api/v1",
)

app.include_router(
    actions_router,
    prefix="/api/v1",
)

app.include_router(
    ai_router,
    prefix=settings.api_v1_prefix,
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "application": settings.app_name,
        "status": "running",
        "version": "1.0.0",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "databricks_catalog": settings.databricks_catalog,
        "databricks_schema": settings.databricks_schema,
    }