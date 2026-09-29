import os
import logging
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.api.api_router import api_router
from app.services.callmissed import CallMissedAPIError

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("callmissed_app")

app = FastAPI(
    title="CallMissed Voice Agent Platform API",
    description="Backend API proxying requests securely to CallMissed (Chat, Image Gen, Voice Agent)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
origins = settings.cors_origins
logger.info(f"Configuring CORS with origins: {origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(CallMissedAPIError)
async def callmissed_api_error_handler(request: Request, exc: CallMissedAPIError):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
    )


@app.get("/api", tags=["Root"])
async def api_root():
    return {
        "message": "Welcome to CallMissed Voice Agent Platform API",
        "docs": "/docs",
        "health": "/api/health"
    }


# Include all application routes under /api
app.include_router(api_router)

# Mount frontend production build if available
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    logger.info(f"Mounting production frontend build from: {frontend_dist}")
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
else:
    @app.get("/", tags=["Root"])
    async def root():
        return {
            "message": "Welcome to CallMissed Voice Agent Platform API",
            "docs": "/docs",
            "health": "/api/health"
        }

if __name__ == "__main__":
    import uvicorn
    is_prod = settings.ENVIRONMENT.lower() == "production"
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=not is_prod)
