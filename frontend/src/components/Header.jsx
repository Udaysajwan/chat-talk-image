import React from 'react';
import { PhoneCall, MessageSquare, Image as ImageIcon, Activity, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, backendStatus }) {
  const tabs = [
    { id: 'voice', label: 'Voice Agent', icon: PhoneCall, highlight: true },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'images', label: 'Image Studio', icon: ImageIcon },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <PhoneCall className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  CallMissed
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Platform
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                WebRTC Voice • LLM Chat • Image Generation
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Status Badge & Docs */}
          <div className="flex items-center gap-3">
            {/* Backend status indicator */}
            <div
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                backendStatus?.status === 'healthy'
                  ? backendStatus?.mock_mode
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}
              title={
                backendStatus?.mock_mode
                  ? 'FastAPI Connected (Mock Mode: using simulated CallMissed responses)'
                  : 'FastAPI Connected (Live CallMissed API mode)'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus?.status === 'healthy'
                    ? backendStatus?.mock_mode
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-emerald-400 animate-pulse'
                    : 'bg-rose-400'
                }`}
              />
              <span className="hidden md:inline font-mono">
                {backendStatus?.status === 'healthy'
                  ? backendStatus?.mock_mode
                    ? 'Backend: Mock'
                    : 'Backend: Live'
                  : 'Backend: Disconnected'}
              </span>
            </div>

            <a
              href="https://docs.callmissed.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-slate-800/50"
            >
              <span>API Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
