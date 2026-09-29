import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Copy, Check, Sparkles, AlertCircle, RefreshCw, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import { sendChatMessage } from '../../services/api';

const SAMPLE_PROMPTS = [
  'What are the core capabilities of CallMissed voice agents?',
  'Translate this sentence into Hindi and Tamil: "Welcome to our AI platform"',
  'How do I configure WebRTC live audio with CallMissed in React?',
  'Write a short python snippet to call CallMissed chat completion',
];

export default function ChatContainer() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your CallMissed AI Assistant. You can chat with me in English or 22 Indic languages. Ask me anything or click a sample prompt below!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('sarvam-105b');
  const [errorMessage, setErrorMessage] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful, professional, and knowledgeable AI assistant.');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || isLoading) return;

    setInput('');
    setErrorMessage(null);

    const newMessages = [
      ...messages,
      {
        role: 'user',
        content: promptText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    setMessages(newMessages);
    setIsLoading(true);

    try {
      const apiPayload = [
        { role: 'system', content: systemPrompt },
        ...newMessages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const response = await sendChatMessage({
        messages: apiPayload,
        model,
        temperature: 0.7,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.message.content,
          model: response.model,
          usage: response.usage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || 'Failed to receive response from CallMissed Chat API');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content, index) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversation cleared. How can I assist you now?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setErrorMessage(null);
  };

  return (
    <div className="flex flex-col h-[750px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Top Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
            <Bot className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">CallMissed AI Chat</h2>
            <p className="text-[11px] text-slate-500">OpenAI-compatible /v1/chat/completions endpoint</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Model Selector */}
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs font-medium cursor-pointer"
          >
            <option value="sarvam-105b">sarvam-105b (Indic 105B)</option>
            <option value="sarvam-105b-conversations">sarvam-105b-conversations</option>
            <option value="kimi-k2.5">kimi-k2.5 (256k Context)</option>
            <option value="gpt-5.6-luna">gpt-5.6-luna (Low Latency)</option>
          </select>

          {/* Animated Options Trigger */}
          <button
            onClick={() => setShowSystemPrompt(!showSystemPrompt)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all duration-200 ${
              showSystemPrompt
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-3 h-3 text-indigo-600" />
            <span>Options</span>
            {showSystemPrompt ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={handleClear}
            className="text-xs text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Animated Options / System Prompt Drawer */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showSystemPrompt ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <label className="text-xs text-slate-600 shrink-0 font-semibold">System Prompt:</label>
          <input
            type="text"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs"
            placeholder="Direct the assistant's persona and instructions..."
          />
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border-b border-rose-200 flex items-center justify-between text-rose-800 text-xs px-5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => handleSend()}
            className="flex items-center gap-1 font-semibold text-rose-700 hover:underline"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/30">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={`flex gap-3 text-sm animate-in fade-in duration-200 ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-indigo-600 border border-slate-200'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`group relative max-w-[80%] rounded-2xl px-4 py-3 shadow-xs ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] mb-1 opacity-70">
                  <span className="font-semibold">{isUser ? 'You' : 'CallMissed AI'}</span>
                  <span>{m.timestamp}</span>
                </div>

                <div className="leading-relaxed whitespace-pre-wrap font-sans text-sm">
                  {m.content}
                </div>

                {/* Footer details for assistant responses */}
                {!isUser && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-[10px] text-indigo-600 font-medium">
                      {m.model || model}
                    </span>
                    <button
                      onClick={() => handleCopy(m.content, idx)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:text-slate-700"
                      title="Copy response"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-teal-600" />
                          <span className="text-[10px] text-teal-600 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span className="text-[10px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Animated Dots */}
        {isLoading && (
          <div className="flex gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4 text-indigo-600 animate-pulse" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 border border-slate-200 shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-500 ml-1">CallMissed is generating response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sample Prompt Chips with Hover Animation */}
      {messages.length <= 2 && (
        <div className="px-5 py-2.5 flex items-center gap-2 overflow-x-auto bg-slate-50 border-t border-slate-100">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <div className="flex gap-2">
            {SAMPLE_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="text-xs whitespace-nowrap px-3 py-1 rounded-full bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 transition-all duration-150 transform hover:-translate-y-0.5 shadow-2xs font-medium"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-4 bg-white border-t border-slate-200 flex items-center gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question or enter a prompt in English or Indic languages..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white disabled:opacity-40 shadow-sm shadow-indigo-600/20 transition-all duration-150 transform hover:scale-105 active:scale-95"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
