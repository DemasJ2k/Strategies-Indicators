import React, { useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const result = useAgentStore((s) => s.result);
  const setError = useAgentStore((s) => s.setError);

  async function sendMessage() {
    if (!input.trim()) return;

    const newMsg: ChatMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    setLoading(true);

    try {
      const body: any = {
        message: newMsg.content,
        includeSignals: true,
        includeTrades: true,
        includePortfolio: false, // you can wire this later
      };

      // Pass latest analysis if available
      if (result) {
        body.latestAnalysis = result;
      }

      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Request failed');
      }

      const json = await res.json();
      const reply: ChatMessage = {
        role: 'assistant',
        content: json.reply || '',
      };

      setMessages((prev) => [...prev, reply]);
    } catch (err: any) {
      setError(err.message || 'Assistant error');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading) sendMessage();
    }
  }

  return (
    <div className="p-4 bg-[#11131a] rounded flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-2">Flowrex AI Assistant</h2>
      <p className="text-xs text-gray-400 mb-3">
        Ask about your setups, playbooks, recent trades, or what the agent is seeing right now.
      </p>

      <div className="flex-1 overflow-auto bg-black/40 rounded p-2 mb-3 space-y-2 text-sm">
        {messages.length === 0 && (
          <p className="text-xs text-gray-500">
            Example: "Explain why the last signal chose NBB instead of JadeCap." or
            "Summarize my recent performance and risks."
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={
              'max-w-[85%] px-2 py-1 rounded ' +
              (m.role === 'user'
                ? 'ml-auto bg-blue-600/40 text-blue-50'
                : 'mr-auto bg-gray-700/60 text-gray-50')
            }
          >
            {m.content}
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <textarea
          className="w-full bg-black border border-gray-700 rounded px-2 py-2 text-sm text-gray-200 resize-none h-20"
          placeholder="Ask Flowrex something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-1 bg-emerald-600 rounded text-sm disabled:opacity-50"
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
