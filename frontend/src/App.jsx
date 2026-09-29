import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import VoiceAgentContainer from './components/VoiceAgent/VoiceAgentContainer';
import ChatContainer from './components/Chat/ChatContainer';
import ImageGeneratorContainer from './components/ImageGenerator/ImageGeneratorContainer';
import { checkHealth } from './services/api';
import { ShieldCheck, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('voice');
  const [backendStatus, setBackendStatus] = useState(null);

  useEffect(() => {
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
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans">
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendStatus={backendStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner if backend in mock mode */}
        {backendStatus?.mock_mode && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-amber-800 text-xs sm:text-sm shadow-2xs">
            <div className="flex items-center gap-2.5">
              <Info className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                <strong>Local Development Mode:</strong> Backend is running in CallMissed Mock Mode.
                To switch to live API calls, set your <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono">CALLMISSED_API_KEY=cm_...</code> in <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono">backend/.env</code>.
              </span>
            </div>
          </div>
        )}

        {/* Tab View Panels */}
        {activeTab === 'voice' && <VoiceAgentContainer backendStatus={backendStatus} />}
        {activeTab === 'chat' && <ChatContainer />}
        {activeTab === 'images' && <ImageGeneratorContainer />}
      </main>

      {/* Security & Architecture Footer */}
      <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur-md py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>
              Secure Architecture: CallMissed API key remains private on FastAPI backend.
            </span>
          </div>

          <div className="flex items-center gap-4 font-medium">
            <a
              href="https://docs.callmissed.com/docs/voice-sessions-api"
              target="_blank"
              rel="noreferrer"
              className="hover:text-indigo-600 transition-colors"
            >
              Voice Session WebRTC
            </a>
            <span>•</span>
            <a
              href="https://docs.callmissed.com/docs/chat-completion"
              target="_blank"
              rel="noreferrer"
              className="hover:text-indigo-600 transition-colors"
            >
              Chat API
            </a>
            <span>•</span>
            <a
              href="https://docs.callmissed.com/docs/image-generation"
              target="_blank"
              rel="noreferrer"
              className="hover:text-indigo-600 transition-colors"
            >
              Image Studio API
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
