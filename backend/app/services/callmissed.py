import base64
import time
import uuid
import logging
from typing import List, Dict, Any, Optional
import httpx
from fastapi import HTTPException, status
from app.config import settings

logger = logging.getLogger(__name__)


class CallMissedAPIError(HTTPException):
    def __init__(self, status_code: int, message: str, code: str = "api_error", details: Any = None):
        super().__init__(
            status_code=status_code,
            detail={
                "error": {
                    "message": message,
                    "code": code,
                    "details": details
                }
            }
        )


class CallMissedService:
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key if api_key is not None else settings.CALLMISSED_API_KEY
        self.base_url = (base_url or settings.CALLMISSED_BASE_URL).rstrip("/")

    @property
    def headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _handle_response_error(self, response: httpx.Response):
        try:
            err_data = response.json()
            err_obj = err_data.get("error", {})
            if isinstance(err_obj, dict):
                message = err_obj.get("message", response.text)
                code = err_obj.get("code", "upstream_error")
            else:
                message = str(err_obj)
                code = "upstream_error"
        except Exception:
            message = response.text or f"HTTP error {response.status_code}"
            code = "http_error"

        logger.error(f"CallMissed API error [{response.status_code}]: {message} (code: {code})")

        if response.status_code == 401:
            raise CallMissedAPIError(status.HTTP_401_UNAUTHORIZED, "Invalid CallMissed API key or unauthorized", code="invalid_api_key")
        elif response.status_code == 402:
            raise CallMissedAPIError(status.HTTP_402_PAYMENT_REQUIRED, "Insufficient CallMissed credits", code="insufficient_credits")
        elif response.status_code == 403:
            raise CallMissedAPIError(status.HTTP_403_FORBIDDEN, f"Permission denied for this resource: {message}", code="permission_denied")
        elif response.status_code == 404:
            raise CallMissedAPIError(status.HTTP_404_NOT_FOUND, f"Resource or model not found: {message}", code="not_found")
        elif response.status_code == 429:
            raise CallMissedAPIError(status.HTTP_429_TOO_MANY_REQUESTS, "CallMissed rate limit or quota exceeded", code="rate_limit_exceeded")
        elif response.status_code >= 500:
            raise CallMissedAPIError(status.HTTP_502_BAD_GATEWAY, f"CallMissed upstream service error: {message}", code="upstream_error")
        else:
            raise CallMissedAPIError(response.status_code, message, code=code)

    async def create_chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "sarvam-105b",
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> Dict[str, Any]:
        """Call CallMissed /v1/chat/completions."""
        if settings.is_mock_enabled:
            return self._mock_chat_completion(messages=messages, model=model)

        url = f"{self.base_url}/v1/chat/completions"
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, headers=self.headers, json=payload)
                if response.is_error:
                    self._handle_response_error(response)
                return response.json()
        except httpx.TimeoutException:
            raise CallMissedAPIError(status.HTTP_504_GATEWAY_TIMEOUT, "Chat request to CallMissed timed out", code="timeout")
        except httpx.RequestError as exc:
            logger.error(f"Network error connecting to CallMissed: {exc}")
            raise CallMissedAPIError(status.HTTP_502_BAD_GATEWAY, f"Network error contacting CallMissed API: {str(exc)}", code="network_error")

    async def generate_images(
        self,
        prompt: str,
        model: str = "flux-2-klein-9b",
        size: str = "1024x1024",
        n: int = 1,
        negative_prompt: Optional[str] = None,
        seed: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Call CallMissed /v1/images/generations."""
        if settings.is_mock_enabled:
            return self._mock_image_generation(prompt=prompt, model=model, size=size, n=n)

        url = f"{self.base_url}/v1/images/generations"
        payload: Dict[str, Any] = {
            "model": model,
            "prompt": prompt,
            "size": size,
            "n": n,
            "response_format": "b64_json",
        }
        if negative_prompt:
            payload["negative_prompt"] = negative_prompt
        if seed is not None:
            payload["seed"] = seed

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(url, headers=self.headers, json=payload)
                if response.is_error:
                    self._handle_response_error(response)
                return response.json()
        except httpx.TimeoutException:
            raise CallMissedAPIError(status.HTTP_504_GATEWAY_TIMEOUT, "Image generation request timed out", code="timeout")
        except httpx.RequestError as exc:
            logger.error(f"Network error generating image with CallMissed: {exc}")
            raise CallMissedAPIError(status.HTTP_502_BAD_GATEWAY, f"Network error contacting CallMissed image API: {str(exc)}", code="network_error")

    async def create_voice_session(
        self,
        system_prompt: str,
        greeting: Optional[str] = None,
        voice: str = "shubh",
        language: str = "en-IN",
        llm_model: str = "kimi-k2.5",
        tts_provider: Optional[str] = None,
        max_duration_seconds: int = 1800,
        webhook_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Call CallMissed /v1/voice/sessions."""
        if settings.is_mock_enabled:
            return self._mock_voice_session(
                system_prompt=system_prompt,
                greeting=greeting,
                voice=voice,
                language=language,
                llm_model=llm_model
            )

        url = f"{self.base_url}/v1/voice/sessions"
        payload: Dict[str, Any] = {
            "system_prompt": system_prompt,
            "voice": voice,
            "language": language,
            "llm_model": llm_model,
            "max_duration_seconds": max_duration_seconds,
        }
        if greeting:
            payload["greeting"] = greeting
        if tts_provider:
            payload["tts_provider"] = tts_provider
        if webhook_url:
            payload["webhook_url"] = webhook_url

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=self.headers, json=payload)
                if response.is_error:
                    self._handle_response_error(response)
                return response.json()
        except httpx.TimeoutException:
            raise CallMissedAPIError(status.HTTP_504_GATEWAY_TIMEOUT, "Voice session creation timed out", code="timeout")
        except httpx.RequestError as exc:
            logger.error(f"Network error creating voice session with CallMissed: {exc}")
            raise CallMissedAPIError(status.HTTP_502_BAD_GATEWAY, f"Network error contacting CallMissed voice session API: {str(exc)}", code="network_error")

    async def get_voice_transcript(self, session_id: str, format_type: str = "json") -> Any:
        """Call CallMissed GET /v1/voice/sessions/{session_id}/transcript."""
        if settings.is_mock_enabled:
            return self._mock_voice_transcript(session_id)

        url = f"{self.base_url}/v1/voice/sessions/{session_id}/transcript"
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(url, headers=self.headers, params={"format": format_type})
                if response.is_error:
                    self._handle_response_error(response)
                if format_type == "json":
                    return response.json()
                return response.text
        except httpx.RequestError as exc:
            raise CallMissedAPIError(status.HTTP_502_BAD_GATEWAY, f"Error fetching voice transcript: {str(exc)}")

    async def delete_voice_session(self, session_id: str) -> None:
        """Call CallMissed DELETE /v1/voice/sessions/{session_id}."""
        if settings.is_mock_enabled:
            return

        url = f"{self.base_url}/v1/voice/sessions/{session_id}"
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.delete(url, headers=self.headers)
                if response.is_error and response.status_code != 404:
                    self._handle_response_error(response)
        except httpx.RequestError as exc:
            logger.warning(f"Error terminating voice session: {exc}")

    # Mock generators for local development / testing without live API keys
    def _mock_chat_completion(self, messages: List[Dict[str, str]], model: str) -> Dict[str, Any]:
        last_user_msg = "Hello!"
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_msg = m.get("content", "")
                break

        reply = (
            f"[CallMissed AI Assistant ({model})]\n\n"
            f"Thank you for your message: \"{last_user_msg}\"\n\n"
            "I am connected via the CallMissed OpenAI-compatible Chat API. "
            "I support Indic languages (Hindi, Tamil, Telugu, etc.), real-time streaming, "
            "and function calling. How else can I assist your business or project today?"
        )

        return {
            "id": f"chatcmpl-{uuid.uuid4().hex[:12]}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": model,
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": reply,
                    },
                    "finish_reason": "stop"
                }
            ],
            "usage": {
                "prompt_tokens": len(" ".join(m.get("content", "") for m in messages).split()),
                "completion_tokens": len(reply.split()),
                "total_tokens": len(" ".join(m.get("content", "") for m in messages).split()) + len(reply.split()),
            }
        }

    def _mock_image_generation(self, prompt: str, model: str, size: str, n: int) -> Dict[str, Any]:
        # Generate an aesthetically pleasing SVG encoded in base64
        svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="1024" height="1024" fill="url(#grad)" rx="32" />
            <circle cx="512" cy="400" r="140" fill="white" opacity="0.2" />
            <text x="512" y="440" font-family="system-ui, sans-serif" font-size="64" font-weight="bold" fill="#ffffff" text-anchor="middle">CallMissed AI</text>
            <text x="512" y="520" font-family="system-ui, sans-serif" font-size="28" fill="#f1f5f9" text-anchor="middle">Model: {model} • {size}</text>
            <rect x="120" y="600" width="784" height="160" rx="16" fill="rgba(0,0,0,0.3)" />
            <text x="512" y="660" font-family="system-ui, sans-serif" font-size="24" fill="#cbd5e1" text-anchor="middle">Prompt:</text>
            <text x="512" y="705" font-family="system-ui, sans-serif" font-size="22" font-style="italic" fill="#ffffff" text-anchor="middle">"{prompt[:55] + '...' if len(prompt) > 55 else prompt}"</text>
        </svg>"""
        b64_img = base64.b64encode(svg_content.encode("utf-8")).decode("utf-8")

        return {
            "created": int(time.time()),
            "model": model,
            "data": [
                {
                    "b64_json": b64_img,
                    "revised_prompt": prompt,
                    "mime_type": "image/svg+xml"
                }
                for _ in range(n)
            ]
        }

    def _mock_voice_session(
        self,
        system_prompt: str,
        greeting: Optional[str],
        voice: str,
        language: str,
        llm_model: str
    ) -> Dict[str, Any]:
        session_id = str(uuid.uuid4())
        return {
            "id": session_id,
            "tenant_id": "demo-tenant-id",
            "bot_id": None,
            "status": "created",
            "config": {
                "system_prompt": system_prompt,
                "greeting": greeting or "Hello! I am your CallMissed voice assistant.",
                "voice": voice,
                "language": language,
                "llm_model": llm_model,
                "room": f"voice-{session_id[:8]}"
            },
            # Dummy WebRTC URL and token for mock mode
            "ws_url": "wss://demo.livekit.cloud",
            "token": f"mock_jwt_token_{session_id[:12]}",
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

    def _mock_voice_transcript(self, session_id: str) -> Dict[str, Any]:
        return {
            "session_id": session_id,
            "turns": [
                {
                    "turn_index": 1,
                    "user_transcript": "Hello, can you help me schedule an appointment?",
                    "agent_response": "Of course! I would be delighted to help you schedule an appointment. What date and time suits you best?",
                    "interrupted": False,
                    "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                },
                {
                    "turn_index": 2,
                    "user_transcript": "Tomorrow at 3 PM please.",
                    "agent_response": "You are confirmed for tomorrow at 3:00 PM. Is there anything else you need assistance with?",
                    "interrupted": False,
                    "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                }
            ]
        }


callmissed_service = CallMissedService()
