import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.config import settings


@pytest.mark.asyncio
async def test_create_voice_session():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/voice/session",
            json={
                "system_prompt": "You are a customer support agent for CallMissed.",
                "greeting": "Hi! How can I help you?",
                "voice": "shubh",
                "language": "en-IN",
                "llm_model": "kimi-k2.5"
            }
        )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert "ws_url" in data
    assert "token" in data
    assert data["status"] == "created"
    
    # Crucial security check: Ensure CallMissed API key is never exposed
    raw_text = response.text
    if settings.CALLMISSED_API_KEY:
        assert settings.CALLMISSED_API_KEY not in raw_text


@pytest.mark.asyncio
async def test_get_voice_transcript():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/voice/session/test-session-123/transcript?format=json")
    assert response.status_code == 200
    data = response.json()
    assert "turns" in data
    assert isinstance(data["turns"], list)


@pytest.mark.asyncio
async def test_delete_voice_session():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.delete("/api/voice/session/test-session-123")
    assert response.status_code == 204
