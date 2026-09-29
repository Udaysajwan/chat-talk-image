import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Copy, Check, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
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
      content: 'Hello! I am your CallMissed AI Assistant. You can chat with me in English or 22 Indic languages. Ask me anything or select a prompt below!',
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
      // Build API messages payload with system prompt
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
    <div className="flex flex-col h-[750px] bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      {/* Top Header */}
      <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">CallMissed AI Chat</h2>
            <p className="text-[11px] text-slate-400">OpenAI-compatible /v1/chat/completions endpoint</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Model Selector */}
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="sarvam-105b">sarvam-105b (Indic 105B)</option>
            <option value="sarvam-105b-conversations">sarvam-105b-conversations</option>
            <option value="kimi-k2.5">kimi-k2.5 (256k Context)</option>
            <option value="gpt-5.6-luna">gpt-5.6-luna (Low Latency)</option>
          </select>

          <button
            onClick={() => setShowSystemPrompt(!showSystemPrompt)}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800/80 border border-slate-700/50"
            title="Configure System Prompt"
          >
            System Prompt
          </button>

          <button
            onClick={handleClear}
            className="text-xs text-slate-400 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800 transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* System Prompt Bar */}
      {showSystemPrompt && (
        <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center gap-3">
          <label className="text-xs text-slate-400 shrink-0 font-medium">System:</label>
          <input
            type="text"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            placeholder="System prompt directing assistant behavior..."
          />
        </div>
      )}

      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border-b border-rose-500/30 flex items-center justify-between text-rose-300 text-xs px-5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => handleSend()}
            className="flex items-center gap-1 font-semibold text-rose-300 hover:underline"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {/* Chat Messages Body */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={`flex gap-3 text-sm ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-400" />}
              </div>

              <div
                className={`group relative max-w-[80%] rounded-2xl px-4 py-3 ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-none'
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
                  <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-[10px] text-indigo-300/80">
                      {m.model || model}
                    </span>
                    <button
                      onClick={() => handleCopy(m.content, idx)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:text-slate-200"
                      title="Copy response"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400">Copied</span>
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

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Bot className="w-4 h-4 text-indigo-400 animate-pulse" />
            </div>
            <div className="bg-slate-800/90 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-700/60 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-400 ml-1">CallMissed is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sample prompt chips */}
      {messages.length <= 2 && (
        <div className="px-5 py-2 flex items-center gap-2 overflow-x-auto bg-slate-900/40 border-t border-slate-800/60">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <div className="flex gap-2">
            {SAMPLE_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="text-xs whitespace-nowrap px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
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
        className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question or enter a command in English or Indic languages..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-600/30"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
