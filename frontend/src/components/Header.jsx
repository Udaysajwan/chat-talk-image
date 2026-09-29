import React, { useState } from 'react';
import { PhoneCall, MessageSquare, Image as ImageIcon, ExternalLink, Settings2, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, getDefaultTunnelUrl } from '../services/api';

export default function Header({ activeTab, setActiveTab, backendStatus, onRefreshBackend }) {
  const [showConfig, setShowConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(() => getApiBaseUrl());
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const tabs = [
    { id: 'voice', label: 'Voice Agent', icon: PhoneCall },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'images', label: 'Image Studio', icon: ImageIcon },
  ];

  const handleTestAndSave = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      const cleanUrl = customUrl.trim().replace(/\/+$/, '');
      const health = await onRefreshBackend(cleanUrl);
      if (health?.status === 'healthy') {
        setApiBaseUrl(cleanUrl);
        setFeedback({ success: true, message: 'Connected successfully to backend!' });
      } else {
        setFeedback({ success: false, message: 'Backend unreachable at this URL.' });
      }
    } catch (err) {
      setFeedback({ success: false, message: err.message || 'Connection failed.' });
    } finally {
      setTesting(false);
    }
  };

  const handleApplyPreset = (url) => {
    setCustomUrl(url);
  };

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

          {/* Status Badge & Server Settings */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-all hover:shadow-xs cursor-pointer ${
                backendStatus?.status === 'healthy'
                  ? backendStatus?.mock_mode
                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70'
                    : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100/70'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/70'
              }`}
              title="Click to configure backend API URL"
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
              <Settings2 className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

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

      {/* Backend Server Configuration Modal / Drawer */}
      {showConfig && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Backend Server Configuration</h3>
              </div>
              <button
                onClick={() => setShowConfig(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              When using the hosted web app, connect to the secure FastAPI proxy to run Chat, Image Generation, and Voice WebRTC sessions.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">API Endpoint URL</label>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px]">Presets:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset(getDefaultTunnelUrl())}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium transition-colors border border-indigo-200/60"
              >
                Live Cloud Tunnel
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('http://localhost:8000')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors border border-slate-200"
              >
                Localhost (8000)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors border border-slate-200"
              >
                Relative Path (Same Host)
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  feedback.success
                    ? 'bg-teal-50 text-teal-800 border border-teal-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {feedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleTestAndSave}
                disabled={testing}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {testing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>{testing ? 'Testing...' : 'Test & Save'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
