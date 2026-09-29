import React, { useState, useRef, useEffect } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { Phone, PhoneOff, Mic, MicOff, Settings, AlertCircle, ChevronDown, ChevronUp, Sliders } from 'lucide-react';
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

  useEffect(() => {
    return () => {
      disconnectCall();
    };
  }, []);

  const startCall = async () => {
    try {
      setErrorMessage(null);
      setConnectionState('connecting');

      const session = await createVoiceSession({
        system_prompt: config.system_prompt,
        greeting: config.greeting,
        voice: config.voice,
        language: config.language,
        llm_model: config.llm_model,
      });

      setSessionId(session.id);

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

      if (backendStatus?.mock_mode || session.ws_url.includes('demo.livekit.cloud')) {
        setConnectionState('connected');
        setIsMuted(false);
        setAgentSpeaking(true);
        setTimeout(() => setAgentSpeaking(false), 3000);
        return;
      }

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          const element = track.attach();
          audioElementsRef.current.push(element);
          document.body.appendChild(element);
        }
      });

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

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const hasLocal = speakers.some((s) => s.isLocal);
        const hasRemote = speakers.some((s) => !s.isLocal);
        setIsSpeaking(hasLocal);
        setAgentSpeaking(hasRemote);
      });

      room.on(RoomEvent.Disconnected, () => {
        disconnectCall();
      });

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">CallMissed Voice Agent</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium">
              WebRTC Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full-duplex conversational voice agent powered by CallMissed STT, LLM, and TTS pipeline.
          </p>
        </div>

        {/* Animated Options Trigger Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
            showSettings
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-600" />
          <span>Agent Options</span>
          {showSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-rose-800 text-sm animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-700 font-semibold hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Animated Options Drawer / Panel */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showSettings ? 'max-h-96 opacity-100 scale-100' : 'max-h-0 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-600" />
            Voice Agent Configuration
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Language (STT & TTS)</label>
              <select
                disabled={isConnected}
                value={config.language}
                onChange={(e) => setConfig({ ...config, language: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Voice Persona</label>
              <select
                disabled={isConnected}
                value={config.voice}
                onChange={(e) => setConfig({ ...config, voice: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              >
                <option value="shubh">shubh (Natural Indian Accent)</option>
                <option value="maya">maya (Friendly Female)</option>
                <option value="arjun">arjun (Professional Male)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">LLM Model</label>
              <select
                disabled={isConnected}
                value={config.llm_model}
                onChange={(e) => setConfig({ ...config, llm_model: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              >
                <option value="kimi-k2.5">kimi-k2.5 (Fast Reasoning)</option>
                <option value="sarvam-105b">sarvam-105b (Indic 105B)</option>
                <option value="gpt-5.6-luna">gpt-5.6-luna (Low Latency)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Spoken Greeting</label>
              <input
                type="text"
                disabled={isConnected}
                value={config.greeting}
                onChange={(e) => setConfig({ ...config, greeting: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">System Instructions</label>
              <input
                type="text"
                disabled={isConnected}
                value={config.system_prompt}
                onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Visualizer & Controls on Left, Live Transcript on Right */}
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
          <div className="flex items-center justify-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            {!isConnected ? (
              <button
                onClick={startCall}
                disabled={connectionState === 'connecting'}
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                <Phone className="w-4 h-4" />
                <span>
                  {connectionState === 'connecting' ? 'Connecting Call...' : 'Start Voice Call'}
                </span>
              </button>
            ) : (
              <>
                <button
                  onClick={toggleMic}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm border transition-all ${
                    isMuted
                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isMuted ? <MicOff className="w-4 h-4 text-rose-600" /> : <Mic className="w-4 h-4 text-teal-600" />}
                  <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>

                <button
                  onClick={disconnectCall}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-md shadow-rose-600/20 transition-all duration-200 transform hover:-translate-y-0.5"
                  title="End current call"
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
