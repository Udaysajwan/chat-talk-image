import React, { useState, useRef, useEffect } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { Phone, PhoneOff, Mic, MicOff, Settings, AlertCircle, Sparkles, Sliders } from 'lucide-react';
import VoiceVisualizer from './VoiceVisualizer';
import LiveTranscript from './LiveTranscript';
import { createVoiceSession, deleteVoiceSession } from '../../services/api';

export default function VoiceAgentContainer({ backendStatus }) {
  const [connectionState, setConnectionState] = useState('idle'); // idle | connecting | connected | error
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Voice session configuration
  const [config, setConfig] = useState({
    language: 'en-IN',
    voice: 'shubh',
    llm_model: 'kimi-k2.5',
    greeting: 'Hello! I am your CallMissed AI voice assistant. How can I help you today?',
    system_prompt: 'You are an intelligent, friendly, and helpful voice assistant created with CallMissed. Answer queries clearly, naturally, and concisely in one or two sentences.',
  });

  const roomRef = useRef(null);
  const audioElementsRef = useRef([]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnectCall();
    };
  }, []);

  const startCall = async () => {
    try {
      setErrorMessage(null);
      setConnectionState('connecting');

      // 1. Request voice session token from FastAPI backend
      const session = await createVoiceSession({
        system_prompt: config.system_prompt,
        greeting: config.greeting,
        voice: config.voice,
        language: config.language,
        llm_model: config.llm_model,
      });

      setSessionId(session.id);

      // Add agent greeting to transcript if present
      if (config.greeting) {
        setTranscript([
          {
            speaker: 'Agent',
            text: config.greeting,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          },
        ]);
      } else {
        setTranscript([]);
      }

      // Check if this is a live WebRTC token or mock environment
      if (backendStatus?.mock_mode || session.ws_url.includes('demo.livekit.cloud')) {
        // Simulated mock voice call session
        setConnectionState('connected');
        setIsMuted(false);
        setAgentSpeaking(true);

        setTimeout(() => {
          setAgentSpeaking(false);
        }, 3000);
        return;
      }

      // 2. Initialize standard LiveKit WebRTC client
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      // Handle subscribed audio track from the agent
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          const element = track.attach();
          audioElementsRef.current.push(element);
          document.body.appendChild(element);
        }
      });

      // Handle live speech transcription
      room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
        for (const seg of segments) {
          if (!seg.final) continue;
          const who = participant?.isLocal ? 'You' : 'Agent';
          setTranscript((prev) => [
            ...prev,
            {
              speaker: who,
              text: seg.text,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            },
          ]);
        }
      });

      // Monitor active speaking state
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const hasLocal = speakers.some((s) => s.isLocal);
        const hasRemote = speakers.some((s) => !s.isLocal);
        setIsSpeaking(hasLocal);
        setAgentSpeaking(hasRemote);
      });

      // Handle server-initiated disconnection
      room.on(RoomEvent.Disconnected, () => {
        disconnectCall();
      });

      // 3. Connect over WebRTC
      await room.connect(session.ws_url, session.token);
      await room.localParticipant.setMicrophoneEnabled(true);

      setIsMuted(false);
      setConnectionState('connected');
    } catch (err) {
      console.error('Failed to start voice call:', err);
      setErrorMessage(err.message || 'Failed to connect voice agent session');
      setConnectionState('error');
      disconnectCall();
    }
  };

  const disconnectCall = () => {
    try {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      audioElementsRef.current.forEach((el) => {
        try {
          el.remove();
        } catch {}
      });
      audioElementsRef.current = [];

      if (sessionId) {
        deleteVoiceSession(sessionId).catch(() => {});
      }
    } catch (e) {
      console.warn('Error during disconnect cleanup:', e);
    } finally {
      setConnectionState('idle');
      setIsSpeaking(false);
      setAgentSpeaking(false);
    }
  };

  const toggleMic = async () => {
    if (!roomRef.current?.localParticipant) {
      // In mock mode toggle state directly
      setIsMuted(!isMuted);
      return;
    }
    try {
      const nextState = !isMuted;
      await roomRef.current.localParticipant.setMicrophoneEnabled(!nextState);
      setIsMuted(nextState);
    } catch (e) {
      console.error('Error toggling mic:', e);
    }
  };

  const handleDownloadTranscript = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transcript, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `callmissed-voice-transcript-${sessionId || 'session'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const isConnected = connectionState === 'connected';

  return (
    <div className="space-y-6">
      {/* Title & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">CallMissed Voice Agent</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              WebRTC Live
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Full-duplex conversational voice agent powered by CallMissed STT, LLM, and TTS pipeline.
          </p>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
            showSettings
              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
              : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Agent Parameters</span>
        </button>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between gap-3 text-rose-300 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-400 hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Settings Drawer / Panel */}
      {showSettings && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 animate-in fade-in duration-150">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-400" />
            Voice Agent Configuration
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Language (STT & TTS)</label>
              <select
                disabled={isConnected}
                value={config.language}
                onChange={(e) => setConfig({ ...config, language: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="en-IN">English (India) - en-IN</option>
                <option value="hi-IN">Hindi - hi-IN</option>
                <option value="ta-IN">Tamil - ta-IN</option>
                <option value="te-IN">Telugu - te-IN</option>
                <option value="bn-IN">Bengali - bn-IN</option>
                <option value="mr-IN">Marathi - mr-IN</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Voice ID</label>
              <select
                disabled={isConnected}
                value={config.voice}
                onChange={(e) => setConfig({ ...config, voice: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="shubh">shubh (Natural Indian English/Hindi)</option>
                <option value="maya">maya (Friendly Female)</option>
                <option value="arjun">arjun (Professional Male)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">LLM Model</label>
              <select
                disabled={isConnected}
                value={config.llm_model}
                onChange={(e) => setConfig({ ...config, llm_model: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="kimi-k2.5">kimi-k2.5 (Fast Reasoning)</option>
                <option value="sarvam-105b">sarvam-105b (Indic 105B)</option>
                <option value="gpt-5.6-luna">gpt-5.6-luna (Low Latency)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Agent Greeting</label>
              <input
                type="text"
                disabled={isConnected}
                value={config.greeting}
                onChange={(e) => setConfig({ ...config, greeting: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">System Prompt</label>
              <input
                type="text"
                disabled={isConnected}
                value={config.system_prompt}
                onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Visualizer + Controls on Left, Transcript on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <VoiceVisualizer
            state={connectionState}
            isMuted={isMuted}
            isSpeaking={isSpeaking}
            agentSpeaking={agentSpeaking}
          />

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            {!isConnected ? (
              <button
                onClick={startCall}
                disabled={connectionState === 'connecting'}
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all duration-150 disabled:opacity-50"
              >
                <Phone className="w-4 h-4" />
                <span>
                  {connectionState === 'connecting' ? 'Connecting...' : 'Start Voice Call'}
                </span>
              </button>
            ) : (
              <>
                <button
                  onClick={toggleMic}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm border transition-all ${
                    isMuted
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                      : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                  }`}
                  title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                  <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>

                <button
                  onClick={disconnectCall}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 transition-all duration-150"
                  title="End current voice session"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Call</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Real-time Transcript */}
        <div className="lg:col-span-7">
          <LiveTranscript transcript={transcript} onDownload={handleDownloadTranscript} />
        </div>
      </div>
    </div>
  );
}
