from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class VoiceSessionCreateRequest(BaseModel):
    system_prompt: str = Field(
        default="You are an intelligent, friendly, and helpful voice assistant created using the CallMissed API. Keep replies conversational and concise.",
        description="System prompt directing voice agent persona and behavior"
    )
    greeting: Optional[str] = Field(
        default="Hello! I am your CallMissed AI voice assistant. How can I help you today?",
        description="First message spoken by the voice agent"
    )
    voice: str = Field(default="shubh", description="Voice ID from CallMissed (e.g. shubh)")
    language: str = Field(default="en-IN", description="BCP-47 language tag (e.g. en-IN, hi-IN)")
    llm_model: str = Field(default="kimi-k2.5", description="LLM model driving the voice agent")
    tts_provider: Optional[str] = Field(default=None, description="sarvam, cartesia, or elevenlabs")
    max_duration_seconds: int = Field(default=1800, ge=30, le=3600, description="Max session duration in seconds")
    webhook_url: Optional[str] = Field(default=None, description="Optional webhook URL for session events")


class VoiceSessionResponse(BaseModel):
    id: str = Field(..., description="Unique voice session ID")
    ws_url: str = Field(..., description="WebRTC media server URL for livekit-client")
    token: str = Field(..., description="WebRTC connection token (JWT)")
    status: str = Field(default="created", description="Session status")
    config: Optional[Dict[str, Any]] = None


class VoiceTranscriptItem(BaseModel):
    turn_index: int
    user_transcript: Optional[str] = None
    agent_response: Optional[str] = None
    interrupted: Optional[bool] = False
    created_at: Optional[str] = None


class VoiceTranscriptResponse(BaseModel):
    session_id: str
    format: str = "json"
    turns: List[Dict[str, Any]] = Field(default_factory=list)
