'use client';

import { FormEvent, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from 'lucide-react';

type Message = {
  id: number;
  role: 'assistant' | 'user';
  text: string;
};

const quickPrompts = ['Show overdue maintenance', 'Find an AC by serial number', 'How many units are offline?'];

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      text: 'Hello! I can help you explore AC assets, maintenance, and campus activity.',
    },
  ]);

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), role: 'user', text },
      {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'I can help with that. I am checking the latest campus asset data now.',
      },
    ]);
    setDraft('');
  }

  function handlePrompt(prompt: string) {
    setDraft(prompt);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <section
          aria-label="AC Command Assistant"
          className="flex h-[min(620px,calc(100vh-120px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_-20px_rgba(15,23,42,0.35)]"
        >
          <header className="relative overflow-hidden bg-[#0f766e] px-5 pb-5 pt-4 text-white">
            <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full border-[18px] border-white/10" />
            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm">
                  <Bot size={24} strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight">Command Assistant</h2>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-teal-50">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    Online · Campus data connected
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close assistant"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-white/75 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="relative mt-4 flex items-center gap-2 rounded-lg bg-black/10 px-3 py-2 text-[11px] text-teal-50">
              <Sparkles size={14} />
              Ask about assets, work orders, or campus trends.
            </div>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/80 px-4 py-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'items-start gap-2'}`}>
                {message.role === 'assistant' && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                    <Bot size={15} />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-5 ${
                    message.role === 'user'
                      ? 'rounded-br-md bg-blue-600 text-white shadow-sm'
                      : 'rounded-tl-md border border-slate-200 bg-white text-slate-700 shadow-sm'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {messages.length === 1 && (
              <div className="pt-1">
                <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Try asking</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handlePrompt(prompt)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-[11px] font-medium text-slate-600 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <form onSubmit={sendMessage} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 transition-colors focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask the assistant..."
                aria-label="Message the assistant"
                className="min-w-0 flex-1 bg-transparent px-2 text-xs text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                aria-label="Send message"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!draft.trim()}
              >
                <Send size={15} />
              </button>
            </form>
            <p className="mt-2 text-center text-[10px] text-slate-400">Assistant responses are based on your connected campus dataset.</p>
          </div>
        </section>
      )}

      {!open && (
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-lg sm:flex">
          <CheckCircle2 size={14} className="text-emerald-500" />
          Need a quick answer?
        </div>
      )}
      <button
        type="button"
        aria-label={open ? 'Close command assistant' : 'Open command assistant'}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_12px_28px_-8px_rgba(37,99,235,0.75)] transition-all hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
      >
        <span className="absolute inset-1 rounded-full border border-white/20" />
        {open ? <ChevronDown size={23} /> : <MessageCircle size={25} />}
        {!open && <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-blue-600 bg-emerald-400" />}
      </button>
    </div>
  );
}