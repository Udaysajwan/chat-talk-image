from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"] = Field(..., description="Role of the message sender")
    content: str = Field(default="", description="Text content of the message")
    reasoning_content: Optional[str] = Field(default=None, description="Reasoning content if provided by model")


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., min_length=1, description="List of messages in conversation")
    model: str = Field(default="sarvam-105b", description="Model ID to invoke on CallMissed")
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0, description="Sampling temperature")
    max_tokens: Optional[int] = Field(default=1024, ge=1, le=8192, description="Max tokens to generate")
    stream: Optional[bool] = Field(default=False, description="Whether to stream response")


class ChatUsage(BaseModel):
    prompt_tokens: Optional[int] = 0
    completion_tokens: Optional[int] = 0
    total_tokens: Optional[int] = 0


class ChatResponse(BaseModel):
    id: str = Field(..., description="Unique completion ID")
    model: str = Field(..., description="Model ID used")
    message: ChatMessage = Field(..., description="Generated assistant message")
    usage: Optional[ChatUsage] = None
