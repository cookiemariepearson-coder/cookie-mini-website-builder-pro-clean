'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const STARTER_MESSAGE = {
  role: 'assistant',
  content: "Hey boo, I’m Cookie AI Assistant. I can help you choose a plan, write your website wording, add Order / Book / Buy buttons, understand AI Video Studio, publish, or troubleshoot."
};

const QUICK_PROMPTS = [
  'Which plan should I choose?',
  'Write my homepage headline',
  'How do I add Order / Book / Buy?',
  'How does AI Video Studio work?',
  'How do I publish?'
];

function safeLoadMessages() {
  try {
    const saved = localStorage.getItem('cookieAiAssistantV2Messages');
    const parsed = saved ? JSON.parse(saved) : null;
    if (Array.isArray(parsed) && parsed.length) return parsed.slice(-14);
  } catch {}
  return [STARTER_MESSAGE];
}

function pageGreeting(pathname = '') {
  if (pathname.includes('/pricing')) return "Looks like you’re comparing plans. Tell me your business type and I’ll help you pick the best fit.";
  if (pathname.includes('/builder')) return "Looks like you’re building a website. I can help write your wording, choose sections, or explain the buttons.";
  if (pathname.includes('/ai-video-studio') || pathname.includes('/video-studio') || pathname.includes('/checkout/ai-video')) return "Looks like you’re working with AI Video Studio. I can help with hooks, scripts, captions, or video prompts.";
  if (pathname.includes('/customer')) return "Looks like you’re checking your website dashboard. I can help with drafts, publishing, and preview links.";
  if (pathname.includes('/checkout')) return "Looks like you’re around checkout. I can explain the plan steps, but billing or refund issues should go through Contact Us.";
  return STARTER_MESSAGE.content;
}

export default function CookieAiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([STARTER_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [pagePath, setPagePath] = useState('');
  const [copied, setCopied] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    const pathname = window.location.pathname || '/';
    setPagePath(pathname);
    const saved = safeLoadMessages();
    if (saved.length === 1 && saved[0]?.content === STARTER_MESSAGE.content) {
      setMessages([{ role: 'assistant', content: pageGreeting(pathname) }]);
    } else {
      setMessages(saved);
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem('cookieAiAssistantV2Messages', JSON.stringify(messages.slice(-14))); } catch {}
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
        body: JSON.stringify({ message: question, history: lastMessages, pagePath, businessName, email })
      });

      const data = await res.json().catch(() => ({}));
      setMessages(current => [
        ...current,
        {
          role: 'assistant',
          content: data.answer || 'I can help with plans, website wording, Order / Book / Buy, AI Video Studio, publishing, or troubleshooting.'
        }
      ]);
    } catch {
      setMessages(current => [
        ...current,
        {
          role: 'assistant',
          content: 'I had trouble connecting. Try asking about plans, website wording, publishing, Order / Book / Buy, or AI Video Studio.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    const fresh = [{ role: 'assistant', content: pageGreeting(pagePath) }];
    setMessages(fresh);
    try { localStorage.setItem('cookieAiAssistantV2Messages', JSON.stringify(fresh)); } catch {}
  }

  function copyLastAnswer() {
    const lastAnswer = [...messages].reverse().find(message => message.role === 'assistant')?.content || '';
    if (!lastAnswer) return;
    navigator.clipboard.writeText(lastAnswer);
    setCopied('Copied.');
    setTimeout(() => setCopied(''), 1500);
  }

  return (
    <div className={`cookieAiAssistant cookieAiV2 ${open ? 'open' : ''}`}>
      {open && (
        <section className="cookieAiPanel" aria-label="Cookie AI Assistant chat">
          <header className="cookieAiHeader">
            <div>
              <strong>Cookie AI Assistant</strong>
              <span>Smart site help + writing helper</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close Cookie AI Assistant">×</button>
          </header>

          <div className="cookieAiLeadFields">
            <input value={businessName} onChange={event => setBusinessName(event.target.value)} placeholder="Business name optional" aria-label="Business name optional" />
            <input value={email} onChange={event => setEmail(event.target.value)} placeholder="Email optional" aria-label="Email optional" />
          </div>

          <div className="cookieAiQuick">
            {QUICK_PROMPTS.map(prompt => (
              <button type="button" key={prompt} onClick={() => ask(prompt)} disabled={loading}>
                {prompt}
              </button>
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

          <form
            className="cookieAiForm"
            onSubmit={event => {
              event.preventDefault();
              ask();
            }}
          >
            <input
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder="Ask Cookie AI..."
              aria-label="Ask Cookie AI"
            />
            <button type="submit" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>

          <footer className="cookieAiFooter">
            <span>May make mistakes. Use Contact Us for billing, refunds, or account access.</span>
            <div>
              {copied && <em>{copied}</em>}
              <button type="button" onClick={copyLastAnswer}>Copy</button>
              <button type="button" onClick={clearChat}>Clear</button>
            </div>
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
