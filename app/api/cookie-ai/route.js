import { NextResponse } from 'next/server';
import {
  classifyIntent,
  fallbackAnswer,
  getKnowledgeText,
  getPageHelper
} from '../../../lib/cookieAiKnowledge';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function clean(value = '', max = 3000) {
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

function buildSystemPrompt(pagePath = '') {
  return `
You are Cookie AI Assistant for Cookie Mini Website Builder Pro by Cookie Digital Creations.

Your job:
Help customers choose a website plan, understand the builder, write website wording, use Order / Book / Buy buttons, understand AI Video Studio, publish, and troubleshoot.

Tone:
Warm, simple, helpful, lightly sassy, and professional.

Current page:
${getPageHelper(pagePath)}

Approved business knowledge:
${getKnowledgeText()}

Very important behavior:
- Be a smart advisor, not a rigid form.
- Use the whole conversation.
- Do not repeat the same question if the customer already answered it.
- If the customer gives a short answer like "yes", "no", "coaching", "cookbook", or "one page", infer what it answers based on the last question.
- If the customer repeats your question back to you, say "No problem — choose one of these..." and ask once more in simpler words.
- If the customer says "I only want one page", accept it immediately. Do not ask why repeatedly.
- If the user asks which plan fits them, ask only the missing questions needed to recommend a plan.
- Once there is enough info, recommend one plan and explain why.
- Mention a lower-cost option when helpful.

Plan recommendation logic:
- Free Launch Page: small/simple page, no media uploads, no AI Video Studio included, only 1 action button.
- Starter Pro: one-page or small site with media uploads and up to 2 action buttons, no included AI Video Studio.
- Business: fuller site or several buttons, or AI Video Studio bundled with the website plan.
- Premium: all sections, up to 8 buttons, most flexibility.
- For one-page cookbook/digital product with images and Buy Now: Starter Pro is usually best.
- For one-page cookbook/digital product with AI bundled: Business is the bundled plan, but Starter Pro + $5 standalone AI Video Studio is the lower-cost one-page option.
- For coaching/classes: Starter works for a simple one-page with booking/buy button and media. Business works if they need AI bundled, more sections, or several buttons.

Hard safety rules:
- Never promise guaranteed sales, traffic, followers, rankings, viral results, income, approvals, or business success.
- Never ask for admin PINs, passwords, API keys, secret keys, tokens, owner testing codes, payment card numbers, or private account access.
- For billing, refunds, cancellations, subscriptions, account access, payment disputes, or legal questions, route the customer to Contact Us.
- Do not say custom domains are included in current live plans.
`;
}

async function callOpenAI({ apiKey, model, messages }) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 700
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return { ok: false, error: data };
  }

  return {
    ok: true,
    answer: clean(data?.choices?.[0]?.message?.content || '', 3200)
  };
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const userMessage = clean(body.message || body.question || '');
    const pagePath = clean(body.pagePath || body.pathname || '', 300);
    const businessName = clean(body.businessName || '', 200);
    const email = clean(body.email || '', 250);
    const history = Array.isArray(body.history) ? body.history.slice(-12) : [];

    if (!userMessage) {
      return NextResponse.json({
        ok: true,
        answer: 'Ask me about plans, pricing, the builder, Order / Book / Buy, AI Video Studio, writing help, or publishing.',
        intent: 'general',
        planState: null
      });
    }

    const intent = classifyIntent(userMessage, pagePath);
    const needsHumanHelp = intent === 'human_support';
    const fallback = fallbackAnswer(userMessage, pagePath);

    if (needsHumanHelp) {
      await logChat({ message: userMessage, answer: fallback, pagePath, intent, businessName, email, needsHumanHelp });
      return NextResponse.json({ ok: true, answer: fallback, intent, needsHumanHelp, planState: null });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const requestedModel = process.env.OPENAI_MODEL || 'gpt-5.1';
    const backupModels = ['gpt-5.1', 'gpt-4.1', 'gpt-4o'];

    if (!apiKey) {
      await logChat({ message: userMessage, answer: fallback, pagePath, intent, businessName, email, needsHumanHelp: false });
      return NextResponse.json({ ok: true, fallback: true, answer: fallback, intent, needsHumanHelp: false, planState: null });
    }

    const messages = [
      { role: 'system', content: buildSystemPrompt(pagePath) },
      ...history.map(item => ({
        role: item.role === 'assistant' ? 'assistant' : 'user',
        content: clean(item.content || item.text || '', 1200)
      })),
      { role: 'user', content: userMessage }
    ];

    const modelList = Array.from(new Set([requestedModel, ...backupModels].filter(Boolean)));

    let answer = '';
    let modelUsed = '';

    for (const model of modelList) {
      const result = await callOpenAI({ apiKey, model, messages });
      if (result.ok && result.answer) {
        answer = result.answer;
        modelUsed = model;
        break;
      }
    }

    if (!answer) {
      answer = fallback;
    }

    await logChat({ message: userMessage, answer, pagePath, intent, businessName, email, needsHumanHelp: false });

    return NextResponse.json({
      ok: true,
      answer,
      intent,
      needsHumanHelp: false,
      modelUsed,
      planState: null
    });
  } catch {
    return NextResponse.json({
      ok: true,
      fallback: true,
      answer: 'I had trouble connecting, but I can still help with plans, website wording, Order / Book / Buy, AI Video Studio, publishing, or troubleshooting. For billing, refunds, or account access, please use Contact Us.',
      intent: 'troubleshooting',
      planState: null
    });
  }
}
