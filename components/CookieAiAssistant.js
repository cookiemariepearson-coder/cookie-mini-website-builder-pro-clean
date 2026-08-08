'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const STARTER_MESSAGE = {
  role: 'assistant',
  content: "Hey boo, I’m Cookie AI Assistant. I can help you choose a plan, write your website wording, add Order / Book / Buy buttons, understand AI Video Studio, publish, or troubleshoot."
};

function quickPromptsFor(pathname = '') {
  if (pathname.includes('/builder')) return ['Write my homepage', 'Help me add a button', 'Which sections should I use?'];
  if (pathname.includes('/pricing') || pathname.includes('/done-for-you')) return ['Help me choose a plan', 'Compare my options', 'What is included?'];
  if (pathname.includes('/video-studio')) return ['Write a video hook', 'Create a video script', 'Explain my video access'];
  if (pathname.includes('/customer')) return ['Find my draft', 'Help me publish', 'Explain my saved website'];
  return ['Help me choose a plan', 'Write my homepage', 'Help me add Order / Book / Buy'];
}

function safeLoadMessages() {
  try {
    const saved = localStorage.getItem('cookieAiAssistantV2Messages');
    const parsed = saved ? JSON.parse(saved) : null;
    if (Array.isArray(parsed) && parsed.length) return parsed.slice(-14);
  } catch {}
  return [STARTER_MESSAGE];
}

function safeLoadPlanState() {
  try {
    const saved = localStorage.getItem('cookieAiAssistantPlanState');
    const parsed = saved ? JSON.parse(saved) : null;
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {}
  return null;
}

function safeLoadBuilderContext() {
  try {
    const parsed = JSON.parse(localStorage.getItem('cookieDraftSite') || '{}');
    return {
      businessName: String(parsed.businessName || '').slice(0, 160),
      businessType: String(parsed.typeKey || '').slice(0, 80),
      headline: String(parsed.headline || '').slice(0, 300),
      description: String(parsed.description || '').slice(0, 700),
      sections: parsed.sections && typeof parsed.sections === 'object' ? parsed.sections : {},
      customerActions: Array.isArray(parsed.customerActions) ? parsed.customerActions.slice(0, 8) : [],
      pages: Array.isArray(parsed.pages) ? parsed.pages.slice(0, 20) : [],
      plan: String(parsed.plan || '').slice(0, 40)
    };
  } catch {
    return {};
  }
}

function pageGreeting(pathname = '') {
  if (pathname.includes('/pricing')) return "Looks like you’re comparing plans. Tell me your business type and I’ll help you pick the best fit.";
  if (pathname.includes('/builder')) return "Looks like you’re building a website. I can help write your wording, choose sections, or explain the buttons.";
  if (pathname.includes('/ai-video-studio') || pathname.includes('/video-studio') || pathname.includes('/checkout/ai-video')) return "Looks like you’re working with AI Video Studio. I can help with hooks, scripts, captions, or video prompts.";
  if (pathname.includes('/customer')) return "Looks like you’re checking your website dashboard. I can help with drafts, publishing, and preview links.";
  if (pathname.includes('/checkout')) return "Looks like you’re around checkout. I can explain the plan steps, but billing or refund issues should go through Contact Us.";
  return STARTER_MESSAGE.content;
}

function dedupeMessages(messages) {
  const output = [];
  for (const msg of messages) {
    const prev = output[output.length - 1];
    if (prev && prev.role === msg.role && prev.content === msg.content) continue;
    output.push(msg);
  }
  return output;
}

export default function CookieAiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([STARTER_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [pagePath, setPagePath] = useState('');
  const [planState, setPlanState] = useState(null);
  const [copied, setCopied] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const scrollRef = useRef(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    const pathname = window.location.pathname || '/';
    setPagePath(pathname);
    setPlanState(safeLoadPlanState());

    const saved = safeLoadMessages();
    if (saved.length === 1 && saved[0]?.content === STARTER_MESSAGE.content) {
      setMessages([{ role: 'assistant', content: pageGreeting(pathname) }]);
    } else {
      setMessages(dedupeMessages(saved));
    }
  }, []);

  useEffect(() => {
    function openFromPage(event) {
      const prompt = String(event.detail?.prompt || '').trim();
      setOpen(true);
      if (prompt) setInput(prompt);
    }
    function handlePageClick(event) {
      const button = event.target.closest('[data-cookie-ai-open]');
      if (!button) return;
      openFromPage({ detail: { prompt: button.getAttribute('data-cookie-ai-open') } });
    }
    window.addEventListener('open-cookie-ai', openFromPage);
    document.addEventListener('click', handlePageClick);
    return () => {
      window.removeEventListener('open-cookie-ai', openFromPage);
      document.removeEventListener('click', handlePageClick);
    };
  }, []);

  useEffect(() => {
    try { localStorage.setItem('cookieAiAssistantV2Messages', JSON.stringify(dedupeMessages(messages).slice(-14))); } catch {}
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    try {
      if (planState) localStorage.setItem('cookieAiAssistantPlanState', JSON.stringify(planState));
      else localStorage.removeItem('cookieAiAssistantPlanState');
    } catch {}
  }, [planState]);

  const lastMessages = useMemo(() => dedupeMessages(messages).slice(-8), [messages]);
  const quickPrompts = useMemo(() => quickPromptsFor(pagePath), [pagePath]);

  async function ask(messageText) {
    const question = String(messageText || input || '').trim();
    if (!question || loading || pendingRef.current) return;

    pendingRef.current = true;
    const userMessage = { role: 'user', content: question };
    setMessages(current => dedupeMessages([...current, userMessage]));
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/cookie-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          history: lastMessages,
          pagePath,
          businessName,
          email,
          planState,
          siteContext: pagePath.includes('/builder') ? safeLoadBuilderContext() : null
        })
      });

      const data = await res.json().catch(() => ({}));
      const answer = data.answer || 'I can help with plans, website wording, Order / Book / Buy, AI Video Studio, publishing, or troubleshooting.';

      if (data.planState) setPlanState(data.planState);
      else if (data.intent !== 'plan_help') setPlanState(null);

      setMessages(current => {
        const next = [...current, { role: 'assistant', content: answer }];
        return dedupeMessages(next).slice(-14);
      });
    } catch {
      setMessages(current => dedupeMessages([
        ...current,
        {
          role: 'assistant',
          content: 'I had trouble connecting. Try asking about plans, website wording, publishing, Order / Book / Buy, or AI Video Studio.'
        }
      ]).slice(-14));
    } finally {
      setLoading(false);
      pendingRef.current = false;
    }
  }

  function clearChat() {
    const fresh = [{ role: 'assistant', content: pageGreeting(pagePath) }];
    setMessages(fresh);
    setPlanState(null);
    try {
      localStorage.setItem('cookieAiAssistantV2Messages', JSON.stringify(fresh));
      localStorage.removeItem('cookieAiAssistantPlanState');
    } catch {}
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
              <span className="cookieAiEyebrow">Cookie Digital Creations</span>
              <strong>Ask Cookie AI</strong>
              <span>Your website helper</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close Cookie AI Assistant">×</button>
          </header>

          <div className="cookieAiWelcome">
            <strong>What are you working on?</strong>
            <span>Ask naturally. I can help with the next step, wording, plans, or buttons.</span>
          </div>

          <button className="cookieAiDetailsToggle" type="button" aria-expanded={showDetails} onClick={() => setShowDetails(value => !value)}>
            {showDetails ? 'Hide details' : 'Add business details for better answers'}
          </button>
          {showDetails && <div className="cookieAiLeadFields">
            <input value={businessName} onChange={event => setBusinessName(event.target.value)} placeholder="Business name" aria-label="Business name optional" />
            <input value={email} onChange={event => setEmail(event.target.value)} placeholder="Email" aria-label="Email optional" />
          </div>}

          <div className="cookieAiQuick">
            {quickPrompts.map(prompt => (
              <button type="button" key={prompt} onClick={() => ask(prompt)} disabled={loading}>
                {prompt}
              </button>
            ))}
          </div>

          <div className="cookieAiMessages" ref={scrollRef} role="log" aria-live="polite" aria-relevant="additions text">
            {messages.map((message, index) => (
              <div className={`cookieAiBubble ${message.role === 'assistant' ? 'assistant' : 'user'}`} key={`${message.role}-${index}`}>
                {message.content}
              </div>
            ))}
            {loading && <div className="cookieAiBubble assistant cookieAiThinking"><i /><i /><i />Cookie is thinking…</div>}
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
              placeholder="Type your question here..."
              aria-label="Ask Cookie AI"
            />
            <button type="submit" disabled={loading || !input.trim()}>
              <span aria-hidden="true">➜</span><span className="srOnly">Send</span>
            </button>
          </form>

          <footer className="cookieAiFooter">
            <span>For billing or account help, use Contact Us.</span>
            <div>
              {copied && <em role="status" aria-live="polite">{copied}</em>}
              <button type="button" onClick={copyLastAnswer}>Copy</button>
              <button type="button" onClick={clearChat}>Clear</button>
            </div>
          </footer>
        </section>
      )}

      <button className="cookieAiLauncher" type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label={open ? 'Close Cookie AI Assistant' : 'Open Cookie AI Assistant'}>
        <span>💬</span>
        <strong>Ask Cookie AI</strong>
      </button>
    </div>
  );
}
