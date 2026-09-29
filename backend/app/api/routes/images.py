import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas.images import ImageGenerateRequest, ImageGenerateResponse, ImageData
from app.services.callmissed import callmissed_service, CallMissedAPIError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/images", tags=["Images"])


@router.post("/generate", response_model=ImageGenerateResponse, summary="Generate image from text prompt")
async def generate_image_endpoint(request: ImageGenerateRequest) -> ImageGenerateResponse:
    """Validate prompt and options, call CallMissed image generation API, and return image info."""
    try:
        result = await callmissed_service.generate_images(
            prompt=request.prompt,
            model=request.model,
            size=request.size,
            n=request.n,
            negative_prompt=request.negative_prompt,
            seed=request.seed
        )

        image_items = []
        for item in result.get("data", []):
            image_items.append(
                ImageData(
                    b64_json=item.get("b64_json"),
                    url=item.get("url"),
                    revised_prompt=item.get("revised_prompt")
                )
            )

        return ImageGenerateResponse(
            created=result.get("created", 0),
            model=result.get("model", request.model),
            data=image_items
        )
    except CallMissedAPIError:
        raise
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected error in image generation endpoint")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error generating image: {str(exc)}"
        )
