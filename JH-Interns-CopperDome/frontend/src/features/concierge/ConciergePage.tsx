import { useRef, useState } from 'react';
import { askConcierge } from '../../lib/api';
import { useSession } from '../../lib/session';
import ScreenHeader from '../../components/ScreenHeader';
import { IconBot, IconSparkles } from '../../components/icons';
import type { ConciergeChatMessage } from '../../lib/types';

const SUGGESTIONS = [
  'What do you recommend tonight?',
  'What pairs well with the chowder?',
  'Anything gluten-free?',
];

export default function ConciergePage() {
  const { session } = useSession();
  const [messages, setMessages] = useState<ConciergeChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !session || isSending) return;

    setError(null);
    const nextMessages: ConciergeChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const reply = await askConcierge(session.sessionId, trimmed, messages);
      setMessages([...nextMessages, { role: 'assistant', content: reply }]);
    } catch {
      setError("The concierge couldn't respond just now. Please ask your server, or try again.");
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight;
        }
      });
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    send(input);
  };

  return (
    <section className="screen screen--no-nav" style={{ paddingBottom: 110 }}>
      <ScreenHeader title="AI Concierge" showBack />

      <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
        {messages.length === 0 && (
          <div className="card card-body" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <IconBot color="var(--color-primary-container)" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p className="body-md">
                Ask me about tonight's menu -- recommendations, pairings, or dietary questions across all three
                kitchens.
              </p>
              <div className="chip-row">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="chip"
                    style={{ cursor: 'pointer' }}
                    onClick={() => send(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={message.role === 'user' ? 'card card-body' : 'card card-body'}
            style={{
              alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background:
                message.role === 'user' ? 'var(--color-surface-container-high)' : 'var(--color-surface-container)',
            }}
          >
            <p className="body-md" style={{ color: 'var(--color-on-surface)', whiteSpace: 'pre-wrap' }}>
              {message.content}
            </p>
          </div>
        ))}

        {isSending && (
          <div className="card card-body" style={{ alignSelf: 'flex-start', display: 'flex', gap: 8, alignItems: 'center' }}>
            <IconSparkles width={16} height={16} color="var(--color-primary-container)" />
            <span className="label-sm">Thinking...</span>
          </div>
        )}

        {error && <p className="body-md" style={{ color: 'var(--color-error)' }}>{error}</p>}
      </div>

      <form
        onSubmit={handleSubmit}
        className="sticky-footer"
        style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}
      >
        <input
          className="input"
          placeholder="Ask about the menu..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isSending}
        />
        <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '14px 20px' }} disabled={isSending || !input.trim()}>
          Ask
        </button>
      </form>
    </section>
  );
}
