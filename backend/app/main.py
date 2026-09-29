import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to CallMissed Voice Agent Platform API",
        "docs": "/docs",
        "health": "/api/health"
    }


# Include all application routes under /api
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
