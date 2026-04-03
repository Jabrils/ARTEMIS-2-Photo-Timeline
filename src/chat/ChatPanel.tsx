import { useState, useRef, useEffect } from 'react';
import { useMissionStore } from '../store/mission-store';
import { useChat } from '../hooks/useChat';
import ChatMessage, { TypingIndicator } from './ChatMessage';
import QuickAnswers from './QuickAnswers';

export default function ChatPanel() {
  const chatOpen = useMissionStore((s) => s.chatOpen);
  const toggleChat = useMissionStore((s) => s.toggleChat);
  const { messages, isLoading, sendMessage, askQuickAnswer } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[rgba(0,212,255,0.15)] border border-hud-blue text-hud-blue flex items-center justify-center hover:bg-[rgba(0,212,255,0.25)] transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)] pointer-events-auto"
        title="Ask ARTEMIS AI"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {chatOpen ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </>
          )}
        </svg>
      </button>

      {/* Chat panel */}
      {chatOpen && (
        <div className="fixed right-6 bottom-20 z-40 w-[360px] h-[500px] bg-[rgba(10,10,26,0.95)] backdrop-blur-md border border-[rgba(0,212,255,0.2)] rounded-xl flex flex-col overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] pointer-events-auto">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[rgba(0,212,255,0.1)] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_6px_rgba(0,255,136,0.5)]" />
            <span className="text-sm font-bold text-white">ARTEMIS AI</span>
            <span className="text-[10px] text-gray-500 uppercase">Mission Assistant</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <QuickAnswers onSelect={askQuickAnswer} />
            ) : (
              <>
                {messages.map((msg, i) => (
                  <ChatMessage key={i} message={msg} />
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-[rgba(0,212,255,0.1)]">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Artemis II..."
                disabled={isLoading}
                className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-hud-blue transition-colors"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-3 py-2 bg-[rgba(0,212,255,0.15)] border border-hud-blue text-hud-blue rounded-lg text-sm hover:bg-[rgba(0,212,255,0.25)] disabled:opacity-30 transition-all"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
