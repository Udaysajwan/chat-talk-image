import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from unittest.mock import patch
from app.services.callmissed import CallMissedAPIError


@pytest.mark.asyncio
async def test_chat_success():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/chat",
            json={
                "messages": [
                    {"role": "user", "content": "Hello CallMissed!"}
                ],
                "model": "sarvam-105b"
            }
        )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["message"]["role"] == "assistant"
    assert len(data["message"]["content"]) > 0
    assert data["model"] == "sarvam-105b"


@pytest.mark.asyncio
async def test_chat_empty_messages_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/chat",
            json={
                "messages": [],
                "model": "sarvam-105b"
            }
        )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_chat_invalid_role():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/chat",
            json={
                "messages": [
                    {"role": "superuser", "content": "Invalid role"}
                ],
                "model": "sarvam-105b"
            }
        )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_chat_api_error_propagation():
    with patch("app.services.callmissed.callmissed_service.create_chat_completion") as mock_call:
        mock_call.side_effect = CallMissedAPIError(status_code=402, message="Insufficient credits", code="insufficient_credits")
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post(
                "/api/chat",
                json={
                    "messages": [{"role": "user", "content": "Test credits"}]
                }
            )
        assert response.status_code == 402
        data = response.json()
        assert data["error"]["code"] == "insufficient_credits"
