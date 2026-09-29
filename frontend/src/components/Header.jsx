import React from 'react';
import { PhoneCall, MessageSquare, Image as ImageIcon, ExternalLink, Activity } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, backendStatus }) {
  const tabs = [
    { id: 'voice', label: 'Voice Agent', icon: PhoneCall },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'images', label: 'Image Studio', icon: ImageIcon },
  ];

  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand - 2-color mix (Indigo & Teal) */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center shadow-md shadow-indigo-600/15 transition-transform hover:scale-105 duration-200">
              <PhoneCall className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-900 via-indigo-700 to-teal-700 bg-clip-text text-transparent">
                  CallMissed
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Platform
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                WebRTC Voice • LLM Chat • Image Studio
              </p>
            </div>
          </div>

          {/* Animated Navigation Tabs */}
          <nav className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60 scale-[1.02]'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Status Badge & Documentation */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
                backendStatus?.status === 'healthy'
                  ? backendStatus?.mock_mode
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-teal-50 text-teal-800 border-teal-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
              title={
                backendStatus?.mock_mode
                  ? 'FastAPI Connected (Mock Mode)'
                  : 'FastAPI Connected (Live CallMissed Mode)'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus?.status === 'healthy'
                    ? backendStatus?.mock_mode
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-teal-500 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span className="hidden md:inline font-medium">
                {backendStatus?.status === 'healthy'
                  ? backendStatus?.mock_mode
                    ? 'Backend: Mock'
                    : 'Backend: Live'
                  : 'Backend: Offline'}
              </span>
            </div>

            <a
              href="https://docs.callmissed.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-slate-100"
            >
              <span>Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
