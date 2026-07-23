export const COOKIE_AI_KNOWLEDGE = [
  {
    id: 'plans',
    title: 'Plans and Pricing',
    tags: ['plan','plans','pricing','price','cost','free','starter','business','premium','extra page'],
    content: `
Free Launch Page is $0. It includes up to 3 selected sections, 1 customer action button, no image/video upload, and no included AI Video Studio.
Starter Pro is $19/month. It includes up to 4 selected sections, image/video upload options, 2 customer action buttons, and no included AI Video Studio.
Business is $30/month. It includes up to 6 selected sections, image/video upload options, 4 customer action buttons, and AI Video Studio access based on plan limits.
Premium is $50/month. It includes all built-in sections, image/video upload options, 8 customer action buttons, and the strongest AI Video Studio access based on plan limits.
Extra Page Add-On is $10/month per extra page/section space.
Do not promise custom domains as included in the current plans.
Do not promise guaranteed sales, traffic, followers, SEO ranking, income, views, or viral results.
`
  },
  {
    id: 'plan_match',
    title: 'Plan Matching Guide',
    tags: ['choose','recommend','which plan','best plan','business type','compare','fits me','fit me','right plan'],
    content: `
When the customer asks "What plan fits me?", "Which plan should I choose?", "What is the best plan?", or another vague plan-fit question, do not list all plans first. Ask discovery questions first.
Ask for:
1. What type of business are you building this for?
2. Do you need booking, ordering, buying, quote requests, or only contact buttons?
3. Do you need photos or videos uploaded?
4. Do you need AI Video Studio?
5. Do you want a small launch page or a fuller website?
After the customer answers, recommend one plan and explain why.
Recommend Free Launch Page when the user wants to test the builder, needs a very small launch page, or only needs a basic online presence.
Recommend Starter Pro when the user needs media uploads, more sections than Free, and up to 2 customer action buttons, but does not need included AI Video Studio.
Recommend Business when the user needs a fuller small business website, up to 6 sections, 4 action buttons, and included AI Video Studio access.
Recommend Premium when the user needs all built-in sections, more buttons, strongest AI Video Studio access, a more complete site, or the most flexibility.
`
  },
  {
    id: 'builder_steps',
    title: 'Builder Steps',
    tags: ['builder','build','start','steps','website','create','draft','save'],
    content: `
Basic builder flow:
1. Open /builder.
2. Choose a business type.
3. Choose a template look.
4. Add business name, website/subdomain name, email, phone if needed, headline, and description.
5. Customize colors, font feel, background feel, section style, and layout.
6. Choose sections.
7. Add wording for the sections.
8. Add media if the plan allows it.
9. Add Order / Book / Buy if needed.
10. Check the preview.
11. Save Draft.
12. Preview & Publish.
13. Use Open Published Website and Open Backup Preview after publishing.
`
  },
  {
    id: 'sections',
    title: 'Sections Guide',
    tags: ['sections','about','services','menu','products','gallery','portfolio','faq','testimonials','before after'],
    content: `
Available sections may include Home, About, Services, Menu, Products, Gallery, Portfolio, Projects, Before & After, Testimonials, FAQ, Order / Book / Buy, and Contact.
Free can use up to 3 selected sections.
Starter can use up to 4 selected sections.
Business can use up to 6 selected sections.
Premium can use all built-in sections.
If a user is not sure what to choose, suggest Home, About, Services or Products/Menu, Order / Book / Buy, FAQ, and Contact based on their plan.
`
  },
  {
    id: 'order_book_buy',
    title: 'Order / Book / Buy Buttons',
    tags: ['order','book','buy','quote','button','buttons','payment','booking','checkout','menu','link','cash app','stripe','square','calendly','jotform','google forms'],
    content: `
Order / Book / Buy lets customers add buttons such as Book Now, Order Now, Buy Now, Request Quote, Call Now, Text Us, Email Us, View Menu, Make a Payment, and Custom Link.
The owner pastes their own third-party links or contact details.
Examples include Gumroad, Square, Stripe, Calendly, Google Forms, Jotform, Cash App, menu links, booking links, payment links, phone numbers, emails, or social links.
Cookie Mini Website Builder Pro does not control third-party services, checkout, appointments, orders, delivery, refunds, disputes, or payment processing.
`
  },
  {
    id: 'ai_video',
    title: 'AI Video Studio',
    tags: ['ai video','video studio','heygen','video','script','caption','prompt','voiceover','creative kit'],
    content: `
Cookie's AI Video Studio has a $5 standalone option for creative planning: video ideas, hooks, scripts, captions, scenes, voiceover wording, video prompts, and content direction.
Standalone AI Video Studio should not be described as guaranteeing a finished video.
Business and Premium website plans may include real HeyGen generation based on monthly plan limits.
Business currently has 1 real HeyGen video/month.
Premium currently has 3 real HeyGen videos/month.
If credits are used, the customer can still use planning/creative kit mode.
Owner Testing Mode is private for the owner only. Never share owner access codes.
AI Video Studio routes: /checkout/ai-video, /ai-video-studio, backup /video-studio.
`
  },
  {
    id: 'publishing',
    title: 'Publishing and Live Sites',
    tags: ['publish','published','live','subdomain','website name','404','backup preview','open published'],
    content: `
Customer websites publish under customername.cookiesdigitalcreations.com.
Customers should use a clean website/subdomain name without https:// or .cookiesdigitalcreations.com.
If Open Published Website does not work, try Open Backup Preview.
If both fail, ask for the website/subdomain name, plan, page, device, browser, and screenshot.
`
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    tags: ['error','not working','broken','freeze','404','stuck','button','upload','blank','issue','problem'],
    content: `
For issues, ask for the page, what button was clicked, plan, website/subdomain name, device, browser, and screenshot.
For billing, refunds, subscriptions, account access, or payment disputes, route to Contact Us.
Do not ask for private passwords, admin PIN, owner testing code, API keys, Gumroad token, Supabase keys, OpenAI key, HeyGen key, or payment card numbers.
`
  },
  {
    id: 'writing_help',
    title: 'Website Writing Help',
    tags: ['write','headline','about','services','faq','description','bio','copy','wording','content','caption'],
    content: `
Cookie AI Assistant can help draft:
- homepage headlines
- short descriptions
- About sections
- service descriptions
- product/menu descriptions
- FAQ answers
- calls to action
- video hooks
- captions
Keep writing clear, customer-friendly, and truthful. Do not promise guaranteed results.
Ask for business type, offer, target customer, and tone when needed.
`
  },
  {
    id: 'legal_safety',
    title: 'Legal and Safety Boundaries',
    tags: ['refund','billing','legal','terms','privacy','tax','account','cancel','subscription','dispute'],
    content: `
For billing, refund requests, subscriptions, account access, disputes, cancellations, or legal questions, the assistant should guide users to Contact Us or the legal pages.
The assistant should not provide legal, tax, medical, financial, or professional advice.
Legal pages include /legal/terms, /legal/privacy, /legal/ai-video, and /legal/customer-content-media.
`
  }
];

export function normalizeText(value = '') {
  return String(value || '').toLowerCase();
}

export function classifyIntent(message = '', pagePath = '') {
  const text = normalizeText(`${message} ${pagePath}`);

  if (/(refund|billing|cancel|subscription|charge|dispute|account access|payment issue)/.test(text)) return 'human_support';
  if (/(write|headline|about|description|services|faq|caption|script|wording|copy)/.test(text)) return 'writing_help';
  if (/(plan|price|pricing|cost|starter|business|premium|free|choose|fits me|fit me|best for me|right for me)/.test(text)) return 'plan_help';
  if (/(order|book|buy|quote|button|booking|payment|menu|checkout link)/.test(text)) return 'action_buttons';
  if (/(ai video|video studio|heygen|video|caption|prompt|voiceover)/.test(text)) return 'ai_video';
  if (/(publish|live|subdomain|404|backup preview|open published)/.test(text)) return 'publishing';
  if (/(error|broken|stuck|freeze|not working|blank|issue|problem)/.test(text)) return 'troubleshooting';
  if (text.includes('/builder')) return 'builder_help';
  if (text.includes('/pricing')) return 'plan_help';
  if (text.includes('/checkout')) return 'checkout_help';
  return 'general';
}

export function isVaguePlanFitQuestion(message = '', pagePath = '') {
  const text = normalizeText(`${message} ${pagePath}`);

  const asksForFit = /(what plan fits me|which plan should i choose|what plan should i choose|best plan for me|right plan for me|what plan is best|help me choose|help me pick|what plan fits|recommend a plan|what plan do i need)/.test(text);

  if (!asksForFit) return false;

  const hasBusinessDetails = /(hair|beauty|salon|barber|lashes|nails|food|catering|restaurant|cleaning|real estate|realtor|coach|coaching|nonprofit|church|portfolio|artist|creator|digital product|course|consulting|wellness|fitness|photography|event|party|boutique|store|service|business is|i sell|i offer|i need|need booking|need order|need buy|photos|videos|gallery|menu|products|appointments|quotes|payment|ai video)/.test(text);

  return !hasBusinessDetails;
}

export function makePlanDiscoveryAnswer() {
  return `I can help you pick the best plan — but first I need to know what you’re building, baby.

Answer these quick questions:

1. What type of business is this for?
2. Do you need people to Book, Order, Buy, Request a Quote, Call, Text, or Email?
3. Do you need photos or videos on the site?
4. Do you need AI Video Studio included?
5. Do you want a small launch page or a fuller website?

Once you answer, I’ll recommend the best plan instead of just throwing all the plans at you.`;
}

export function getRelevantKnowledge(message = '', pagePath = '', limit = 4) {
  const text = normalizeText(`${message} ${pagePath}`);
  const words = text.split(/[^a-z0-9$]+/).filter(Boolean);

  const scored = COOKIE_AI_KNOWLEDGE.map(chunk => {
    const tagScore = chunk.tags.reduce((sum, tag) => sum + (text.includes(normalizeText(tag)) ? 8 : 0), 0);
    const wordScore = words.reduce((sum, word) => {
      if (word.length < 4) return sum;
      return sum + (normalizeText(chunk.content).includes(word) ? 1 : 0);
    }, 0);
    return { ...chunk, score: tagScore + wordScore };
  })
    .filter(chunk => chunk.score > 0)
    .sort((a, b) => b.score - a.score);

  const selected = scored.length ? scored.slice(0, limit) : COOKIE_AI_KNOWLEDGE.slice(0, limit);

  return selected.map(chunk => `## ${chunk.title}\n${chunk.content.trim()}`).join('\n\n');
}

export function getPageHelper(pagePath = '') {
  const page = normalizeText(pagePath);

  if (page.includes('/pricing')) {
    return `The user is on Pricing. If they ask what plan fits them and they did not describe their business, ask discovery questions first instead of listing every plan.`;
  }
  if (page.includes('/builder')) {
    return `The user is in the Builder. Help with choosing sections, writing content, design choices, customer action buttons, saving drafts, and publishing.`;
  }
  if (page.includes('/checkout/ai-video') || page.includes('/ai-video-studio') || page.includes('/video-studio')) {
    return `The user is around AI Video Studio. Help with the $5 standalone studio, creative kits, scripts, captions, prompts, and plan-based HeyGen limits.`;
  }
  if (page.includes('/checkout')) {
    return `The user is around checkout. Explain checkout steps safely and route billing/refund/account problems to Contact Us.`;
  }
  if (page.includes('/customer')) {
    return `The user is around My Website/customer dashboard. Help with drafts, published websites, backup preview, and where to check their site.`;
  }
  return `The user is on the public website. Help them understand the builder, plans, AI Video Studio, and next steps.`;
}

export function makeFallbackAnswer(message = '', pagePath = '') {
  const intent = classifyIntent(message, pagePath);

  if (intent === 'human_support') {
    return `For billing, refunds, subscription changes, account access, or payment issues, please use Contact Us so Cookie Digital Creations can review it directly. Please do not share passwords, card numbers, admin codes, or private keys in chat.`;
  }

  if (intent === 'plan_help' && isVaguePlanFitQuestion(message, pagePath)) {
    return makePlanDiscoveryAnswer();
  }

  if (intent === 'writing_help') {
    return `I can help write that. Send me:

1. Your business name
2. What you sell or offer
3. Who it is for
4. The tone you want: professional, luxury, friendly, funny, or sassy

Example:
“Write a homepage headline for a beauty salon that does silk presses, wigs, and lashes. Make it luxury and friendly.”`;
  }

  if (intent === 'plan_help') {
    return `I can help you choose. Tell me what kind of business you have, whether you need booking/order/buy/quote buttons, whether you need photos or videos, and whether you want AI Video Studio included.

General guide:
Free is best for a simple test page.
Starter is best for a small site with media and 2 buttons.
Business is best for a fuller small business site with 4 buttons and AI Video Studio.
Premium is best when you need all sections, 8 buttons, and the most flexibility.`;
  }

  if (intent === 'action_buttons') {
    return `To add Order / Book / Buy:

1. Open the Builder.
2. Go to Sections & Wording.
3. Select Order / Book / Buy.
4. Add a button like Book Now, Order Now, Buy Now, Request Quote, Call Now, Text Us, Email Us, View Menu, Make a Payment, or Custom Link.
5. Paste your booking, payment, menu, checkout, form, phone, or email link.

Cookie Mini Website Builder Pro does not control third-party checkout, orders, appointments, refunds, delivery, or disputes.`;
  }

  if (intent === 'ai_video') {
    return `Cookie’s AI Video Studio can help with video ideas, hooks, scripts, captions, scenes, prompts, and content planning.

The $5 standalone option is for creative planning.
Business and Premium plans may include real HeyGen video generation based on monthly plan limits.

Open AI Video Studio: /ai-video-studio`;
  }

  if (intent === 'publishing') {
    return `To publish:

1. Complete your business info, design, sections, and wording.
2. Check the preview.
3. Click Save Draft.
4. Go to Preview & Publish.
5. Publish or complete checkout for paid plans.
6. Use Open Published Website or Open Backup Preview.

Your live site should use your website name as a subdomain, like yourname.cookiesdigitalcreations.com.`;
  }

  if (intent === 'troubleshooting') {
    return `I can help narrow that down. Please send:

1. What page you were on
2. What button you clicked
3. Your plan
4. Your website/subdomain name
5. Your device and browser
6. A screenshot if possible

For billing, refunds, or account access, please use Contact Us.`;
  }

  return `I can help you choose a plan, build your mini website, add Order / Book / Buy buttons, write your website wording, understand AI Video Studio, save drafts, publish, or find the right page. What are you working on today?`;
}
