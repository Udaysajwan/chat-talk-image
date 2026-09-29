const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Handle API responses with clear error extraction.
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
    try {
      const data = await response.json();
      if (data?.detail?.error?.message) {
        errorMessage = data.detail.error.message;
      } else if (data?.detail?.message) {
        errorMessage = data.detail.message;
      } else if (typeof data?.detail === "string") {
        errorMessage = data.detail;
      } else if (data?.error?.message) {
        errorMessage = data.error.message;
      }
    } catch {
      // Keep default error message
    }
    const err = new Error(errorMessage);
    err.status = response.status;
    throw err;
  }
  return response.json();
}

/**
 * Health check endpoint
 */
export async function checkHealth() {
  const res = await fetch(`${API_BASE_URL}/api/health`);
  return handleResponse(res);
}

/**
 * Chat completion
 */
export async function sendChatMessage({ messages, model = "sarvam-105b", temperature = 0.7, max_tokens = 1024 }) {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      model,
      temperature,
      max_tokens,
    }),
  });
  return handleResponse(res);
}

/**
 * Image generation
 */
export async function generateImage({ prompt, model = "flux-2-klein-9b", size = "1024x1024", n = 1, negative_prompt = null, seed = null }) {
  const payload = {
    prompt,
    model,
    size,
    n,
  };
  if (negative_prompt) payload.negative_prompt = negative_prompt;
  if (seed !== null && seed !== undefined && seed !== "") payload.seed = parseInt(seed, 10);

  const res = await fetch(`${API_BASE_URL}/api/images/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

/**
 * Voice session creation (Keeps CallMissed API key secure server-side)
 */
export async function createVoiceSession({
  system_prompt = "You are a helpful voice assistant.",
  greeting = "Hello! I am your CallMissed AI voice assistant. How can I help you today?",
  voice = "shubh",
  language = "en-IN",
  llm_model = "kimi-k2.5",
  tts_provider = null,
  max_duration_seconds = 1800,
}) {
  const payload = {
    system_prompt,
    greeting,
    voice,
    language,
    llm_model,
    max_duration_seconds,
  };
  if (tts_provider) payload.tts_provider = tts_provider;

  const res = await fetch(`${API_BASE_URL}/api/voice/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

/**
 * Get transcript for a completed or active voice session
 */
export async function getVoiceTranscript(sessionId, format = "json") {
  const res = await fetch(`${API_BASE_URL}/api/voice/session/${sessionId}/transcript?format=${format}`);
  if (format === "json") {
    return handleResponse(res);
  }
  return res.text();
}

/**
 * Gracefully delete or end a voice session
 */
export async function deleteVoiceSession(sessionId) {
  const res = await fetch(`${API_BASE_URL}/api/voice/session/${sessionId}`, {
    method: "DELETE",
  });
  if (res.status === 204) return true;
  return handleResponse(res);
}
