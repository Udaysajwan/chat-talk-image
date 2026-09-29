import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import VoiceAgentContainer from './components/VoiceAgent/VoiceAgentContainer';
import ChatContainer from './components/Chat/ChatContainer';
import ImageGeneratorContainer from './components/ImageGenerator/ImageGeneratorContainer';
import { checkHealth } from './services/api';
import { ShieldCheck, Info, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('voice');
  const [backendStatus, setBackendStatus] = useState(null);

  useEffect(() => {
    // Initial health check
    const verifyBackend = async () => {
      try {
        const health = await checkHealth();
        setBackendStatus(health);
      } catch (err) {
        console.warn('Backend currently unreachable:', err);
        setBackendStatus({ status: 'unreachable', mock_mode: false });
      }
    };

    verifyBackend();
    const interval = setInterval(verifyBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendStatus={backendStatus}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner if backend in mock mode */}
        {backendStatus?.mock_mode && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-amber-300 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <Info className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                <strong>Local Development Mode:</strong> Backend is running with CallMissed Mock Mode.
                To switch to live API calls, set your <code className="bg-amber-950/60 px-1.5 py-0.5 rounded text-amber-200">CALLMISSED_API_KEY=cm_...</code> in <code className="bg-amber-950/60 px-1.5 py-0.5 rounded text-amber-200">backend/.env</code>.
              </span>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'voice' && <VoiceAgentContainer backendStatus={backendStatus} />}
        {activeTab === 'chat' && <ChatContainer />}
        {activeTab === 'images' && <ImageGeneratorContainer />}
      </main>

      {/* Security & Architecture Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              Secure Architecture: CallMissed API key remains private on FastAPI backend.
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://docs.callmissed.com/docs/voice-sessions-api"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-400 transition-colors"
            >
              Voice Session WebRTC
            </a>
            <span>•</span>
            <a
              href="https://docs.callmissed.com/docs/chat-completion"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-400 transition-colors"
            >
              Chat API
            </a>
            <span>•</span>
            <a
              href="https://docs.callmissed.com/docs/image-generation"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-400 transition-colors"
            >
              Image API
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
