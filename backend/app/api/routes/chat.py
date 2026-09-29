import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas.chat import ChatRequest, ChatResponse, ChatMessage, ChatUsage
from app.services.callmissed import callmissed_service, CallMissedAPIError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse, summary="Send chat message to CallMissed AI")
async def chat_endpoint(request: ChatRequest) -> ChatResponse:
    """Validate incoming chat messages and forward to CallMissed chat completions."""
    try:
        messages_payload = [{"role": m.role, "content": m.content} for m in request.messages]
        
        result = await callmissed_service.create_chat_completion(
            messages=messages_payload,
            model=request.model,
            temperature=request.temperature or 0.7,
            max_tokens=request.max_tokens or 1024,
        )

        choices = result.get("choices", [])
        if not choices:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Empty response received from CallMissed API"
            )

        assistant_msg = choices[0].get("message", {})
        raw_content = assistant_msg.get("content")
        reasoning = assistant_msg.get("reasoning_content") or assistant_msg.get("thought")

        # If content is None or empty string, fallback to reasoning content or friendly placeholder
        final_content = ""
        if raw_content and str(raw_content).strip():
            final_content = str(raw_content).strip()
        elif reasoning and str(reasoning).strip():
            final_content = str(reasoning).strip()
        else:
            final_content = "I have processed your request."

        usage_data = result.get("usage", {})

        return ChatResponse(
            id=result.get("id", "cm-chat-id"),
            model=result.get("model", request.model),
            message=ChatMessage(
                role=assistant_msg.get("role", "assistant"),
                content=final_content,
                reasoning_content=str(reasoning) if reasoning else None,
            ),
            usage=ChatUsage(
                prompt_tokens=usage_data.get("prompt_tokens", 0),
                completion_tokens=usage_data.get("completion_tokens", 0),
                total_tokens=usage_data.get("total_tokens", 0),
            )
        )
    except CallMissedAPIError:
        raise
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected error in chat endpoint")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error processing chat: {str(exc)}"
        )
