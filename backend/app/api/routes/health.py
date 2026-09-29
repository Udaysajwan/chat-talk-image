from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Health check endpoint")
async def health_check():
    return {
        "status": "healthy",
        "service": "CallMissed Voice Agent Platform Backend",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "mock_mode": settings.is_mock_enabled,
        "has_api_key": bool(settings.CALLMISSED_API_KEY.strip()),
    }
