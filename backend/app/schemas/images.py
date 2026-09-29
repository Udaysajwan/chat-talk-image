from typing import List, Optional
from pydantic import BaseModel, Field


class ImageGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000, description="Text prompt for image generation")
    model: str = Field(default="flux-2-klein-9b", description="Model ID (e.g. flux-2-klein-9b, sdxl-lightning)")
    size: str = Field(default="1024x1024", description="Image dimensions (e.g. 1024x1024, 768x768, 512x512)")
    n: int = Field(default=1, ge=1, le=4, description="Number of images to generate")
    negative_prompt: Optional[str] = Field(default=None, description="Elements to avoid in the image")
    seed: Optional[int] = Field(default=None, description="Optional seed for reproducibility")


class ImageData(BaseModel):
    b64_json: Optional[str] = Field(default=None, description="Base64 encoded image data")
    url: Optional[str] = Field(default=None, description="Signed image URL if provided")
    revised_prompt: Optional[str] = Field(default=None, description="Revised prompt if rewritten")


class ImageGenerateResponse(BaseModel):
    created: int = Field(..., description="Timestamp of creation")
    model: str = Field(..., description="Model ID used")
    data: List[ImageData] = Field(..., description="List of generated image objects")
