import React, { useEffect, useRef } from 'react';
import { User, Bot, FileText, Download } from 'lucide-react';

export default function LiveTranscript({ transcript, onDownload }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-200">Real-time Transcript</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {transcript.length} {transcript.length === 1 ? 'turn' : 'turns'}
          </span>
        </div>

        {transcript.length > 0 && (
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50"
            title="Download transcript JSON"
          >
            <Download className="w-3 h-3" />
            <span>Export</span>
          </button>
        )}
      </div>

      {/* Transcript items */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[220px] max-h-[360px]">
        {transcript.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-10">
            <p className="text-sm">No spoken audio yet.</p>
            <p className="text-xs text-slate-600 mt-1">
              Start a call and speak to see live speech-to-text transcriptions here.
            </p>
          </div>
        ) : (
          transcript.map((item, index) => {
            const isUser = item.speaker === 'user' || item.speaker === 'You';
            return (
              <div
                key={index}
                className={`flex gap-3 text-sm ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                      : 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/50 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] mb-1 opacity-70">
                    <span className="font-semibold">{isUser ? 'You' : 'Agent'}</span>
                    {item.time && <span>{item.time}</span>}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
