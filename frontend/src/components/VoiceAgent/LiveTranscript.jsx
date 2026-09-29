import React, { useEffect, useRef } from 'react';
import { User, Bot, FileText, Download } from 'lucide-react';

export default function LiveTranscript({ transcript, onDownload }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Real-time Transcript</h3>
            <span className="text-[11px] text-slate-500">Live speech-to-text turns</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            {transcript.length} {transcript.length === 1 ? 'turn' : 'turns'}
          </span>
          {transcript.length > 0 && (
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 transition-colors px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 font-medium"
              title="Download transcript JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Transcript items */}
      <div className="flex-1 p-5 overflow-y-auto space-y-3.5 min-h-[220px] max-h-[380px]">
        {transcript.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-12">
            <p className="text-sm font-medium text-slate-500">No voice conversation yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Start a call and begin speaking to see real-time speech transcription displayed here.
            </p>
          </div>
        ) : (
          transcript.map((item, index) => {
            const isUser = item.speaker === 'user' || item.speaker === 'You';
            return (
              <div
                key={index}
                className={`flex gap-3 text-sm animate-in fade-in duration-200 ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-teal-50 text-teal-700 border border-teal-200'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-xs ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none'
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
