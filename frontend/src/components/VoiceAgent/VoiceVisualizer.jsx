import React from 'react';
import { Mic, MicOff, Volume2, Radio } from 'lucide-react';

export default function VoiceVisualizer({ state, isMuted, isSpeaking, agentSpeaking }) {
  const getStatusText = () => {
    switch (state) {
      case 'idle':
        return 'Ready to connect';
      case 'connecting':
        return 'Connecting WebRTC audio session...';
      case 'connected':
        if (agentSpeaking) return 'Voice Agent is speaking...';
        if (isSpeaking) return 'Listening to you...';
        if (isMuted) return 'Microphone muted';
        return 'Listening for speech...';
      case 'error':
        return 'Call disconnected';
      default:
        return 'Standby';
    }
  };

  const isConnected = state === 'connected';

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
      {/* Background ambient 2-color aura (Indigo & Teal) */}
      <div
        className={`absolute -inset-10 bg-gradient-to-r from-indigo-500/10 via-teal-500/10 to-indigo-500/10 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
          isConnected ? 'opacity-100' : 'opacity-30'
        }`}
      />

      {/* Main Orb / Pulse */}
      <div className="relative z-10 flex items-center justify-center my-6">
        <div
          className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500 ${
            isConnected
              ? agentSpeaking
                ? 'bg-gradient-to-tr from-teal-500 to-emerald-600 shadow-xl shadow-teal-500/30 scale-105 animate-voice-ripple'
                : isSpeaking
                ? 'bg-gradient-to-tr from-indigo-600 to-teal-500 shadow-xl shadow-indigo-600/30 scale-105 animate-voice-ripple'
                : 'bg-gradient-to-tr from-indigo-600 to-indigo-700 shadow-md shadow-indigo-600/20'
              : state === 'connecting'
              ? 'bg-slate-100 border-2 border-dashed border-indigo-500 animate-spin'
              : 'bg-slate-100 border border-slate-200'
          }`}
        >
          {isConnected ? (
            agentSpeaking ? (
              <Volume2 className="w-14 h-14 text-white animate-pulse" />
            ) : isMuted ? (
              <MicOff className="w-12 h-12 text-rose-300" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )
          ) : (
            <Radio className="w-12 h-12 text-slate-400" />
          )}
        </div>

        {/* Pulse ring for active connection */}
        {isConnected && (
          <div
            className={`absolute inset-0 rounded-full border-2 border-indigo-400/40 pointer-events-none ${
              agentSpeaking || isSpeaking ? 'animate-ping' : ''
            }`}
          />
        )}
      </div>

      {/* Equalizer animation bars in dual-color (Indigo & Teal) */}
      <div className="flex items-center gap-1.5 h-8 my-2 z-10">
        {[40, 75, 55, 90, 60, 80, 45, 70, 50].map((heightPercent, idx) => {
          const active = isConnected && (agentSpeaking || isSpeaking);
          const isTealBar = idx % 2 === 0;
          return (
            <span
              key={idx}
              className={`w-1.5 rounded-full transition-all duration-200 ${
                active
                  ? isTealBar
                    ? 'bg-teal-500'
                    : 'bg-indigo-600'
                  : 'bg-slate-200'
              }`}
              style={{
                height: active
                  ? `${Math.max(15, Math.floor(heightPercent * (0.6 + Math.random() * 0.5)))}%`
                  : '20%',
              }}
            />
          );
        })}
      </div>

      {/* Status label */}
      <div className="z-10 text-center mt-3">
        <p className="text-sm font-semibold text-slate-800 tracking-tight">
          {getStatusText()}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {isConnected
            ? 'WebRTC Live • STT → LLM → TTS Pipeline Active'
            : 'Click "Start Voice Call" to initiate bi-directional conversation'}
        </p>
      </div>
    </div>
  );
}
