'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const STARTER_MESSAGE = {
  role: 'assistant',
  content: "Hey boo, I’m Cookie AI Assistant. I can help you choose a plan, build your mini website, add Order / Book / Buy buttons, understand AI Video Studio, or find the right page."
};

const QUICK_PROMPTS = [
  'Which plan should I choose?',
  'How do I add Order / Book / Buy?',
  'How does AI Video Studio work?',
  'How do I publish my website?'
];

function safeLoadMessages() {
  try {
    const saved = localStorage.getItem('cookieAiAssistantMessages');
    const parsed = saved ? JSON.parse(saved) : null;
    if (Array.isArray(parsed) && parsed.length) return parsed.slice(-12);
  } catch {}
  return [STARTER_MESSAGE];
}

export default function CookieAiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([STARTER_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { setMessages(safeLoadMessages()); }, []);

  useEffect(() => {
    try { localStorage.setItem('cookieAiAssistantMessages', JSON.stringify(messages.slice(-12))); } catch {}
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const lastMessages = useMemo(() => messages.slice(-8), [messages]);

  async function ask(messageText) {
    const question = String(messageText || input || '').trim();
    if (!question || loading) return;
    const userMessage = { role: 'user', content: question };
    setMessages(current => [...current, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/cookie-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, history: lastMessages })
      });
      const data = await res.json().catch(() => ({}));
      setMessages(current => [...current, { role: 'assistant', content: data.answer || 'I can help with plans, the builder, Order / Book / Buy, AI Video Studio, or publishing.' }]);
    } catch {
      setMessages(current => [...current, { role: 'assistant', content: 'I had trouble connecting. Try asking about plans, publishing, Order / Book / Buy, or AI Video Studio.' }]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    const fresh = [STARTER_MESSAGE];
    setMessages(fresh);
    try { localStorage.setItem('cookieAiAssistantMessages', JSON.stringify(fresh)); } catch {}
  }

  return (
    <div className={`cookieAiAssistant ${open ? 'open' : ''}`}>
      {open && (
        <section className="cookieAiPanel" aria-label="Cookie AI Assistant chat">
          <header className="cookieAiHeader">
            <div>
              <strong>Cookie AI Assistant</strong>
              <span>Website builder help</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close Cookie AI Assistant">×</button>
          </header>

          <div className="cookieAiQuick">
            {QUICK_PROMPTS.map(prompt => (
              <button type="button" key={prompt} onClick={() => ask(prompt)} disabled={loading}>{prompt}</button>
            ))}
          </div>

          <div className="cookieAiMessages" ref={scrollRef}>
            {messages.map((message, index) => (
              <div className={`cookieAiBubble ${message.role === 'assistant' ? 'assistant' : 'user'}`} key={`${message.role}-${index}`}>
                {message.content}
              </div>
            ))}
            {loading && <div className="cookieAiBubble assistant">Thinking...</div>}
          </div>

          <form className="cookieAiForm" onSubmit={event => { event.preventDefault(); ask(); }}>
            <input value={input} onChange={event => setInput(event.target.value)} placeholder="Ask Cookie AI..." aria-label="Ask Cookie AI" />
            <button type="submit" disabled={loading || !input.trim()}>Send</button>
          </form>

          <footer className="cookieAiFooter">
            <span>May make mistakes. Use Contact Us for billing, refunds, or account access.</span>
            <button type="button" onClick={clearChat}>Clear</button>
          </footer>
        </section>
      )}

      <button className="cookieAiLauncher" type="button" onClick={() => setOpen(value => !value)} aria-label="Open Cookie AI Assistant">
        <span>💬</span>
        <strong>Ask Cookie AI</strong>
      </button>
    </div>
  );
}
