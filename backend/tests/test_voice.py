import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.config import settings


@pytest.mark.asyncio
async def test_voice_session_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Create Voice Session
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
        session_id = data["id"]

        # Crucial security check: Ensure CallMissed API key is never exposed
        raw_text = response.text
        if settings.CALLMISSED_API_KEY:
            assert settings.CALLMISSED_API_KEY not in raw_text

        # 2. Get Voice Transcript
        transcript_res = await ac.get(f"/api/voice/session/{session_id}/transcript?format=json")
        assert transcript_res.status_code in (200, 404)

        # 3. Terminate Voice Session
        delete_res = await ac.delete(f"/api/voice/session/{session_id}")
        assert delete_res.status_code in (204, 200, 404)


@pytest.mark.asyncio
async def test_voice_session_invalid_uuid():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        random_uuid = str(uuid.uuid4())
        response = await ac.get(f"/api/voice/session/{random_uuid}/transcript?format=json")
    # Non-existent session returns 404 or mock empty
    assert response.status_code in (200, 404)
