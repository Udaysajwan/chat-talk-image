import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from unittest.mock import patch
from app.services.callmissed import CallMissedAPIError


@pytest.mark.asyncio
async def test_image_generation_success():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/images/generate",
            json={
                "prompt": "A modern futuristic workspace with voice assistants",
                "model": "flux-2-klein-9b",
                "size": "1024x1024",
                "n": 1
            }
        )
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert len(data["data"]) == 1
    assert data["model"] == "flux-2-klein-9b"
    assert data["data"][0]["b64_json"] is not None


@pytest.mark.asyncio
async def test_image_generation_empty_prompt():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/images/generate",
            json={
                "prompt": "",
                "model": "flux-2-klein-9b"
            }
        )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_image_generation_invalid_count():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/images/generate",
            json={
                "prompt": "Valid prompt",
                "n": 10  # Max is 4
            }
        )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_image_generation_error_propagation():
    with patch("app.services.callmissed.callmissed_service.generate_images") as mock_call:
        mock_call.side_effect = CallMissedAPIError(status_code=403, message="Permission denied for image generation", code="permission_denied")
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post(
                "/api/images/generate",
                json={
                    "prompt": "A sunset in Bangalore"
                }
            )
        assert response.status_code == 403
        data = response.json()
        assert data["error"]["code"] == "permission_denied"
