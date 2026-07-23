import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SITE_KNOWLEDGE = `
Cookie Mini Website Builder Pro helps customers build mini websites.
Plans:
Free Launch Page: $0, up to 3 selected sections, 1 customer action button, no media upload, no included AI Video Studio.
Starter Pro: $19/month, up to 4 selected sections, media upload options, 2 customer action buttons, no included AI Video Studio.
Business: $30/month, up to 6 selected sections, media upload options, 4 customer action buttons, AI Video Studio access based on plan limits.
Premium: $50/month, all built-in sections, media upload options, 8 customer action buttons, strongest AI Video Studio access based on plan limits.
Extra Page Add-On: $10/month per extra page/section space.
Cookie's AI Video Studio: $5 standalone creative planning option for video ideas, hooks, scripts, captions, scenes, prompts, and content planning.

Builder:
Customers can choose a business type, template look, colors, layout, font feel, background feel, section style, selected sections, wording, media if allowed, customer action buttons, preview, save, and publish.
Sections include Home, About, Services, Menu, Products, Gallery, Portfolio, Projects, Before & After, Testimonials, FAQ, Order / Book / Buy, and Contact.
Order / Book / Buy can add Book Now, Order Now, Buy Now, Request Quote, Call Now, Text Us, Email Us, View Menu, Make a Payment, or Custom Link.
Customers paste their own links like Gumroad, Square, Stripe, Calendly, Google Forms, Jotform, Cash App, menu, booking, payment, phone, email, or social links.

Pages:
Builder: /builder
Pricing: /pricing
My Website: /customer
AI Video Studio checkout: /checkout/ai-video
AI Video Studio: /ai-video-studio
Backup AI route: /video-studio
Contact: /contact
Terms: /legal/terms
Privacy: /legal/privacy

Rules:
Be warm, clear, lightly sassy, and professional.
Never promise guaranteed sales, traffic, followers, rankings, income, business success, or viral results.
Never ask for admin PINs, API keys, owner codes, passwords, payment card numbers, or private credentials.
Do not claim you can edit, publish, or delete websites. You can guide users where to click.
For billing, refunds, subscriptions, account access, or technical issues, send the user to Contact Us.
`;

function clean(value = '', max = 1500) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function fallbackAnswer(question = '') {
  const q = question.toLowerCase();
  if (q.includes('plan') || q.includes('price') || q.includes('pricing')) {
    return `Plan guide:

Free Launch Page: $0, up to 3 sections and 1 customer action button.
Starter Pro: $19/month, up to 4 sections, media uploads, and 2 action buttons.
Business: $30/month, up to 6 sections, media uploads, 4 action buttons, and AI Video Studio access.
Premium: $50/month, all built-in sections, media uploads, 8 action buttons, and strongest AI Video Studio access.

Start here: /pricing`;
  }
  if (q.includes('order') || q.includes('book') || q.includes('buy') || q.includes('quote')) {
    return `To add customer buttons:

1. Open the Builder.
2. Go to Sections & Wording.
3. Select Order / Book / Buy.
4. Add Book Now, Order Now, Buy Now, Request Quote, Call Now, Text Us, Email Us, View Menu, Make a Payment, or Custom Link.
5. Paste your booking, checkout, menu, payment, form, phone, or email link.

Start here: /builder`;
  }
  if (q.includes('ai video') || q.includes('video studio') || q.includes('heygen')) {
    return `Cookie's AI Video Studio has two uses:

The $5 standalone option helps with video ideas, hooks, scripts, captions, scenes, prompts, and content planning.
Business and Premium website plans may include real HeyGen video access based on plan limits.

Open AI Video Studio: /ai-video-studio`;
  }
  if (q.includes('publish') || q.includes('website') || q.includes('live')) {
    return `To publish:

1. Open the Builder.
2. Complete business info, design, sections, and wording.
3. Check the live preview.
4. Click Save Draft.
5. Go to Preview & Publish.
6. Publish the Free Launch Page or continue to checkout for paid plans.
7. After checkout, use Open Published Website or Open Backup Preview.

Start here: /builder`;
  }
  return `I can help with plans, building your mini website, Order / Book / Buy buttons, AI Video Studio, saving drafts, or publishing. For billing, refunds, or account access, please use Contact Us.`;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const userMessage = clean(body.message || body.question || '');
    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
    if (!userMessage) {
      return NextResponse.json({ ok: true, answer: 'Ask me about plans, pricing, the builder, Order / Book / Buy, AI Video Studio, or publishing.' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    if (!apiKey) {
      return NextResponse.json({ ok: true, fallback: true, answer: fallbackAnswer(userMessage) });
    }

    const messages = [
      { role: 'system', content: `You are Cookie AI Assistant for Cookie Mini Website Builder Pro.\n\n${SITE_KNOWLEDGE}` },
      ...history.map(item => ({ role: item.role === 'assistant' ? 'assistant' : 'user', content: clean(item.content || item.text || '', 900) })),
      { role: 'user', content: userMessage }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature: 0.35, max_tokens: 450 })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ ok: true, fallback: true, answer: fallbackAnswer(userMessage) });
    }

    const answer = clean(data?.choices?.[0]?.message?.content || fallbackAnswer(userMessage), 2200);
    return NextResponse.json({ ok: true, answer });
  } catch {
    return NextResponse.json({ ok: true, fallback: true, answer: 'I had trouble connecting, but I can still help with plans, the builder, Order / Book / Buy, AI Video Studio, or publishing. For billing or account access, please use Contact Us.' });
  }
}
