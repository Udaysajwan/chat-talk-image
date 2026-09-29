import React from 'react';
import { Mic, MicOff, Volume2, Radio } from 'lucide-react';

export default function VoiceVisualizer({ state, isMuted, isSpeaking, agentSpeaking }) {
  const getStatusText = () => {
    switch (state) {
      case 'idle':
        return 'Ready to connect';
      case 'connecting':
        return 'Establishing WebRTC session...';
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
    <div className="flex flex-col items-center justify-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800 relative overflow-hidden">
      {/* Background glow effects */}
      <div
        className={`absolute -inset-10 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
          isConnected ? 'opacity-100' : 'opacity-20'
        }`}
      />

      {/* Main Orb / Pulse */}
      <div className="relative z-10 flex items-center justify-center my-6">
        <div
          className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500 ${
            isConnected
              ? agentSpeaking
                ? 'bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-2xl shadow-purple-500/50 scale-105 animate-voice-ripple'
                : isSpeaking
                ? 'bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-2xl shadow-indigo-500/50 scale-105 animate-voice-ripple'
                : 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-xl shadow-indigo-500/20'
              : state === 'connecting'
              ? 'bg-slate-800 border-2 border-dashed border-indigo-400 animate-spin'
              : 'bg-slate-800/80 border border-slate-700'
          }`}
        >
          {isConnected ? (
            agentSpeaking ? (
              <Volume2 className="w-14 h-14 text-white animate-pulse" />
            ) : isMuted ? (
              <MicOff className="w-12 h-12 text-rose-400" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )
          ) : (
            <Radio className="w-12 h-12 text-slate-500" />
          )}
        </div>

        {/* Pulse ring for active connection */}
        {isConnected && (
          <div
            className={`absolute inset-0 rounded-full border-2 border-indigo-500/40 pointer-events-none ${
              agentSpeaking || isSpeaking ? 'animate-ping' : ''
            }`}
          />
        )}
      </div>

      {/* Equalizer animation bars */}
      <div className="flex items-center gap-1.5 h-8 my-2 z-10">
        {[40, 75, 55, 90, 60, 80, 45, 70, 50].map((heightPercent, idx) => {
          const active = isConnected && (agentSpeaking || isSpeaking);
          return (
            <span
              key={idx}
              className={`w-1.5 rounded-full transition-all duration-200 ${
                active
                  ? agentSpeaking
                    ? 'bg-purple-400'
                    : 'bg-indigo-400'
                  : 'bg-slate-700'
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
        <p className="text-sm font-medium text-slate-200 tracking-wide">
          {getStatusText()}
        </p>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          {isConnected
            ? 'WebRTC Live • STT → LLM → TTS Pipeline Active'
            : 'Click "Start Call" to open a low-latency WebRTC voice channel'}
        </p>
      </div>
    </div>
  );
}
