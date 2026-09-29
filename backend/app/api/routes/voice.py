import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Query, Response
from app.schemas.voice import VoiceSessionCreateRequest, VoiceSessionResponse, VoiceTranscriptResponse
from app.services.callmissed import callmissed_service, CallMissedAPIError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/voice", tags=["Voice Agent"])


@router.post("/session", response_model=VoiceSessionResponse, status_code=status.HTTP_201_CREATED, summary="Create WebRTC voice agent session")
async def create_voice_session_endpoint(request: VoiceSessionCreateRequest) -> VoiceSessionResponse:
    """
    Creates a voice session server-side to protect the CallMissed API key.
    Returns only the client-safe WebRTC media URL (ws_url) and token (JWT) to the browser.
    """
    try:
        session = await callmissed_service.create_voice_session(
            system_prompt=request.system_prompt,
            greeting=request.greeting,
            voice=request.voice,
            language=request.language,
            llm_model=request.llm_model,
            tts_provider=request.tts_provider,
            max_duration_seconds=request.max_duration_seconds,
            webhook_url=request.webhook_url,
        )

        return VoiceSessionResponse(
            id=session.get("id"),
            ws_url=session.get("ws_url"),
            token=session.get("token"),
            status=session.get("status", "created"),
            config=session.get("config", {})
        )
    except CallMissedAPIError:
        raise
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected error creating voice session")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error creating voice session: {str(exc)}"
        )


@router.get("/session/{session_id}/transcript", summary="Get transcript of a voice session")
async def get_transcript_endpoint(
    session_id: str,
    format_type: str = Query("json", alias="format", pattern="^(json|txt|srt)$")
):
    """Retrieve session transcript in json, txt, or srt format."""
    try:
        result = await callmissed_service.get_voice_transcript(session_id=session_id, format_type=format_type)
        if format_type == "json":
            if isinstance(result, list):
                return VoiceTranscriptResponse(session_id=session_id, format=format_type, turns=result)
            elif isinstance(result, dict) and "turns" in result:
                return VoiceTranscriptResponse(session_id=session_id, format=format_type, turns=result["turns"])
            return result
        return Response(content=result, media_type="text/plain")
    except CallMissedAPIError:
        raise
    except Exception as exc:
        logger.exception("Error getting transcript")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch transcript: {str(exc)}"
        )


@router.delete("/session/{session_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Terminate a voice session")
async def delete_voice_session_endpoint(session_id: str):
    """Gracefully terminate a voice session."""
    try:
        await callmissed_service.delete_voice_session(session_id=session_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except CallMissedAPIError:
        raise
    except Exception as exc:
        logger.exception("Error terminating voice session")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to terminate session: {str(exc)}"
        )
