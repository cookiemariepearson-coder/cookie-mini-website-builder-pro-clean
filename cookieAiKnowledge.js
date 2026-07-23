import { NextResponse } from 'next/server';
import {
  classifyIntent,
  getPageHelper,
  getRelevantKnowledge,
  makeFallbackAnswer
} from '../../../lib/cookieAiKnowledge';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function clean(value = '', max = 2000) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

async function logChat({ message, answer, pagePath, intent, businessName, email, needsHumanHelp }) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) return;

    await fetch(`${supabaseUrl}/rest/v1/cookie_ai_chat_logs`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        message,
        answer,
        page_path: pagePath || null,
        intent: intent || null,
        business_name: businessName || null,
        email: email || null,
        needs_human_help: Boolean(needsHumanHelp)
      })
    }).catch(() => null);
  } catch {}
}

function buildSystemPrompt({ pagePath, relevantKnowledge }) {
  return `
You are Cookie AI Assistant, the support and website-writing chatbot for Cookie Mini Website Builder Pro by Cookie Digital Creations.

Personality:
- Warm, clear, lightly sassy, helpful, and professional.
- Use simple steps.
- Keep answers short unless the customer asks for detail.
- Encourage without overpromising.

Current page context:
${getPageHelper(pagePath)}

Approved knowledge:
${relevantKnowledge}

Hard rules:
- Never promise guaranteed sales, traffic, followers, views, ranking, viral results, income, or business success.
- Never ask for or reveal admin PINs, owner testing codes, passwords, API keys, secret keys, tokens, Supabase keys, HeyGen keys, OpenAI keys, Gumroad tokens, or payment card numbers.
- Do not claim you can directly edit, publish, delete, refund, cancel, or access accounts. Guide users where to click.
- For billing, refunds, subscriptions, account access, payment disputes, legal questions, or private technical account issues, tell the user to use Contact Us.
- Do not provide legal, tax, medical, financial, or professional advice.
- Do not say custom domains are included in current plans.
- Mention third-party link limits when relevant: Cookie Mini Website Builder Pro does not control third-party checkout, appointments, payment, delivery, refunds, disputes, or services.
- Standalone AI Video Studio is creative planning unless the current app flow specifically gives plan-based real HeyGen generation.
`;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const userMessage = clean(body.message || body.question || '');
    const pagePath = clean(body.pagePath || body.pathname || '', 300);
    const businessName = clean(body.businessName || '', 200);
    const email = clean(body.email || '', 250);
    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

    if (!userMessage) {
      return NextResponse.json({
        ok: true,
        answer: makeFallbackAnswer('', pagePath),
        intent: 'general'
      });
    }

    const intent = classifyIntent(userMessage, pagePath);
    const relevantKnowledge = getRelevantKnowledge(userMessage, pagePath, 5);
    const fallback = makeFallbackAnswer(userMessage, pagePath);
    const needsHumanHelp = intent === 'human_support';

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    if (!apiKey || needsHumanHelp) {
      await logChat({ message: userMessage, answer: fallback, pagePath, intent, businessName, email, needsHumanHelp });
      return NextResponse.json({ ok: true, fallback: true, answer: fallback, intent, needsHumanHelp });
    }

    const messages = [
      {
        role: 'system',
        content: buildSystemPrompt({ pagePath, relevantKnowledge })
      },
      ...history.map(item => ({
        role: item.role === 'assistant' ? 'assistant' : 'user',
        content: clean(item.content || item.text || '', 900)
      })),
      {
        role: 'user',
        content: userMessage
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.35,
        max_tokens: 650
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      await logChat({ message: userMessage, answer: fallback, pagePath, intent, businessName, email, needsHumanHelp });
      return NextResponse.json({ ok: true, fallback: true, answer: fallback, intent, needsHumanHelp });
    }

    const answer = clean(data?.choices?.[0]?.message?.content || fallback, 2800) || fallback;

    await logChat({ message: userMessage, answer, pagePath, intent, businessName, email, needsHumanHelp });

    return NextResponse.json({ ok: true, answer, intent, needsHumanHelp });
  } catch {
    return NextResponse.json({
      ok: true,
      fallback: true,
      answer: 'I had trouble connecting, but I can still help with plans, website wording, Order / Book / Buy, AI Video Studio, publishing, or troubleshooting. For billing, refunds, or account access, please use Contact Us.',
      intent: 'troubleshooting'
    });
  }
}
