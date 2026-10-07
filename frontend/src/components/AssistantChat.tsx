import { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import API from '../api/api';

interface Props {
  user: any;
  /** Called after the assistant has changed data, so the page behind it can reload. */
  onDataChanged?: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  isError?: boolean;
}

interface PendingAction {
  token: string;
  tool: string;
  summary: string;
}

const SUGGESTIONS: Record<string, string[]> = {
  admin: [
    'Give me a summary of the season',
    'Which fields have had no update for 2 weeks?',
    'Are there any open high-severity issues?',
  ],
  field_agent: [
    'Which of my fields need an update?',
    'Summarise my fields',
    'Any pest problems on my fields?',
  ],
};

function errorText(err: any): string {
  return err?.response?.data?.error || 'Something went wrong. Please try again.';
}

export function AssistantChat({ user, onDataChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pending, loading, open]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;

    // Only real conversation turns are sent back as history (never error bubbles).
    const history = messages.filter(m => !m.isError).map(m => ({ role: m.role, text: m.text }));
    setMessages(prev => [...prev, { role: 'user', text: message }]);
    setInput('');
    setPending(null);
    setLoading(true);
    try {
      const res = await API.post('assistant/chat/', { message, history });
      if (res.data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }]);
      }
      setPending(res.data.pending_action ?? null);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: errorText(err), isError: true }]);
    } finally {
      setLoading(false);
    }
  }

  async function respondToPending(approve: boolean) {
    if (!pending || loading) return;
    const { token } = pending;
    setPending(null);
    setLoading(true);
    try {
      const res = await API.post('assistant/confirm/', { token, approve });
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: res.data.reply, isError: res.data.ok === false },
      ]);
      // A confirmed change was saved on the server: refresh the page behind the chat.
      if (approve && res.data.ok) onDataChanged?.();
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: errorText(err), isError: true }]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = SUGGESTIONS[user?.role] ?? SUGGESTIONS.field_agent;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open the SmartSeason assistant"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-green-700 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
      >
        <Sparkles size={18} aria-hidden="true" />
        Ask AI
      </button>
    );
  }

  return (
    <section
      aria-label="SmartSeason assistant"
      className="fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full flex-col bg-white shadow-2xl sm:bottom-5 sm:right-5 sm:h-[34rem] sm:w-[24rem] sm:rounded-2xl sm:border sm:border-[#e8eae4]"
    >
      <header className="flex items-center justify-between rounded-t-2xl bg-green-800 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Sparkles size={18} aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold leading-tight">SmartSeason Assistant</p>
            <p className="text-xs text-green-200 leading-tight">Ask about your fields</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close the assistant"
          className="rounded p-1 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-[#f8fbf9] px-4 py-4" aria-live="polite">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Hi{user?.full_name ? ` ${user.full_name.split(' ')[0]}` : ''}! I can look up your fields, updates and
              issues, and help you log changes. Try one of these:
            </p>
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                className="block w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-left text-sm text-green-900 hover:bg-green-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={
                'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ' +
                (m.role === 'user'
                  ? 'bg-green-700 text-white'
                  : m.isError
                    ? 'border border-red-200 bg-red-50 text-red-800'
                    : 'border border-[#e8eae4] bg-white text-gray-800')
              }
            >
              {m.text}
            </div>
          </div>
        ))}

        {pending && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">Confirm this change?</p>
            <p className="mt-1">{pending.summary}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => respondToPending(true)}
                className="rounded-lg bg-green-700 px-3 py-1.5 font-semibold text-white hover:bg-green-800"
              >
                Confirm
              </button>
              <button
                onClick={() => respondToPending(false)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={e => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-[#e8eae4] bg-white p-3 sm:rounded-b-2xl"
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          maxLength={1000}
          placeholder="Ask about your fields…"
          aria-label="Message the assistant"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send message"
          className="rounded-lg bg-green-700 p-2 text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={18} aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}