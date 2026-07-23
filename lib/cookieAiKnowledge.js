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
When the customer asks "What plan fits me?", "Which plan should I choose?", "What plan is best?", or another vague plan-fit question, ask discovery questions first.
Do not list every plan first.
Ask what type of business they have, whether they need Book/Order/Buy/Quote buttons, whether they need photos/videos, whether they need AI Video Studio, and whether they want a small launch page or a fuller website.
If the customer answers with short replies like "cooking", "a cookbook", "yes", or "no", keep the plan-matching conversation going and understand that short answer as a reply to the last assistant question.
After enough information is collected, recommend one best plan and mention one backup option if needed.
Free Launch Page: best for testing, simple info pages, or very small launch pages.
Starter Pro: best for a small site with media uploads and up to 2 action buttons, no included AI Video Studio.
Business: best for a fuller small business site with up to 6 sections, 4 action buttons, and AI Video Studio access.
Premium: best for all sections, up to 8 action buttons, strongest AI Video Studio access, and the most flexibility.
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
Cookie AI Assistant can help draft homepage headlines, short descriptions, About sections, service descriptions, product/menu descriptions, FAQ answers, calls to action, video hooks, and captions.
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
  if (/(plan|price|pricing|cost|starter|business|premium|free|choose|fits me|fit me|best for me|right for me|recommend|pick a plan)/.test(text)) return 'plan_help';
  if (/(write|headline|about|description|services|faq|caption|script|wording|copy)/.test(text)) return 'writing_help';
  if (/(order|book|buy|quote|button|booking|payment|menu|checkout link)/.test(text)) return 'action_buttons';
  if (/(ai video|video studio|heygen|video|caption|prompt|voiceover)/.test(text)) return 'ai_video';
  if (/(publish|live|subdomain|404|backup preview|open published)/.test(text)) return 'publishing';
  if (/(error|broken|stuck|freeze|not working|blank|issue|problem)/.test(text)) return 'troubleshooting';
  if (text.includes('/pricing')) return 'plan_help';
  if (text.includes('/builder')) return 'builder_help';
  if (text.includes('/checkout')) return 'checkout_help';
  return 'general';
}

function allMessagesText(history = [], message = '') {
  const pieces = [];
  for (const item of history) {
    pieces.push(`${item.role || 'user'}: ${item.content || item.text || ''}`);
  }
  pieces.push(`user: ${message}`);
  return normalizeText(pieces.join('\n'));
}

function userOnlyText(history = [], message = '') {
  const pieces = [];
  for (const item of history) {
    if ((item.role || 'user') !== 'assistant') pieces.push(item.content || item.text || '');
  }
  pieces.push(message);
  return normalizeText(pieces.join(' '));
}

function lastAssistantText(history = []) {
  const reversed = [...history].reverse();
  const last = reversed.find(item => (item.role || 'user') === 'assistant');
  return normalizeText(last?.content || last?.text || '');
}

function isYes(value = '') {
  return /^(yes|yea|yeah|yep|sure|i do|i need that|need that|include it|with that|correct|right|ok|okay)$/i.test(String(value || '').trim());
}

function isNo(value = '') {
  return /^(no|nope|nah|not now|i don't|dont|don't need|do not need|without it|not needed)$/i.test(String(value || '').trim());
}

function pendingSlot(history = []) {
  const last = lastAssistantText(history);

  if (last.includes('which one are you building this for')) return 'cookingSubtype';
  if (last.includes('buy now') || last.includes('purchase the cookbook') || last.includes('showcase the cookbook')) return 'action';
  if (last.includes('order now') || last.includes('view menu') || last.includes('request a quote') || last.includes('call/text')) return 'action';
  if (last.includes('what action do customers need to take')) return 'action';
  if (last.includes('photos, videos') || last.includes('gallery') || last.includes('product images')) return 'media';
  if (last.includes('ai video studio included') || last.includes('only need the website builder')) return 'ai';
  if (last.includes('small launch page') || last.includes('fuller website')) return 'size';

  return '';
}

export function isVaguePlanFitQuestion(message = '', pagePath = '') {
  const text = normalizeText(`${message} ${pagePath}`);

  const asksForFit = /(what plan fits me|which plan should i choose|what plan should i choose|best plan for me|right plan for me|what plan is best|help me choose|help me pick|what plan fits|recommend a plan|what plan do i need)/.test(text);

  if (!asksForFit) return false;

  const hasBusinessDetails = /(hair|beauty|salon|barber|lashes|nails|food|catering|restaurant|cleaning|real estate|realtor|coach|coaching|nonprofit|church|portfolio|artist|creator|digital product|course|consulting|wellness|fitness|photography|event|party|boutique|store|service|business is|i sell|i offer|i need|need booking|need order|need buy|photos|videos|gallery|menu|products|appointments|quotes|payment|ai video|cookbook|cooking|recipe|recipes)/.test(text);

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

export function isActivePlanConsultation(message = '', history = []) {
  const combined = allMessagesText(history, message);
  const current = normalizeText(message);
  const shortReply = current.split(/\s+/).filter(Boolean).length <= 7;
  const slot = pendingSlot(history);

  const hasPlanStart =
    /(what plan fits me|which plan should i choose|what plan should i choose|best plan for me|right plan for me|help me pick|recommend a plan|what plan do i need)/.test(combined) ||
    combined.includes('answer these quick questions') ||
    combined.includes('what type of business is this for');

  const looksLikePlanDetail =
    /(cooking|cookbook|recipe|recipes|digital recipes|food|hair|beauty|salon|cleaning|catering|restaurant|coach|course|digital product|book|ebook|photos|videos|book now|buy now|order|quote|ai video|small launch|fuller website|full website|yes|no|yep|nope)/.test(current);

  const unrelated =
    /(refund|billing|cancel|admin|password|api key|terms|privacy|legal|open published|404|not working|error|freeze)/.test(current);

  return hasPlanStart && !unrelated && (Boolean(slot) || shortReply || looksLikePlanDetail || classifyIntent(current) === 'plan_help');
}

export function getPlanProfile(message = '', history = []) {
  const current = normalizeText(message);
  const text = userOnlyText(history, message);
  const slot = pendingSlot(history);
  const yes = isYes(message);
  const no = isNo(message);

  let business = '';
  let needsClarification = false;

  if (/(cookbook|recipe book|ebook|e-book|digital cookbook|digital recipes|recipes)/.test(text)) {
    business = 'cookbook / recipe product';
  } else if (/(cooking|food)/.test(text)) {
    business = 'cooking / food';
    needsClarification = true;
  } else if (/(catering|seafood|restaurant|menu|plates|meal prep|food truck|bakery)/.test(text)) {
    business = 'food service';
  } else if (/(hair|beauty|salon|barber|lashes|nails|makeup|spa)/.test(text)) {
    business = 'beauty / appointment business';
  } else if (/(cleaning|lawn|repair|handyman|service)/.test(text)) {
    business = 'local service business';
  } else if (/(coach|consulting|course|class|training)/.test(text)) {
    business = 'coach / education business';
  } else if (/(nonprofit|church|community)/.test(text)) {
    business = 'nonprofit / community';
  } else if (/(portfolio|artist|creator|photography|film|music)/.test(text)) {
    business = 'portfolio / creator';
  }

  let needsBuy = /(buy now|buy button|purchase|sell|selling|gumroad|checkout|payment link|product checkout)/.test(text);
  let needsOrder = /(order now|food order|take orders|menu order|plates|catering order|meal prep order)/.test(text);
  let needsBook = /(book now|booking|appointment|calendar|calendly|class booking|consultation|hair appointment|salon appointment)/.test(text);
  let needsQuote = /(quote|estimate|request quote)/.test(text);
  let needsContact = /(call|text|email|contact)/.test(text);

  // Interpret short yes/no answers based on the last question Cookie AI asked.
  if (slot === 'action' && yes) {
    if (business.includes('cookbook')) needsBuy = true;
    else if (business.includes('food service')) needsOrder = true;
    else if (business.includes('beauty')) needsBook = true;
    else needsContact = true;
  }
  if (slot === 'action' && no) {
    needsBuy = false;
    needsOrder = false;
    needsBook = false;
    needsQuote = false;
    needsContact = false;
  }

  const mentionsAction = needsBuy || needsOrder || needsBook || needsQuote || needsContact || (slot === 'action' && (yes || no));

  let mediaYes = /(photo|photos|image|images|gallery|video|videos|media|cover|pictures|sample pages|product images)/.test(text);
  let mediaNo = /(no photo|no photos|no video|no videos|no media|do not need photos|don't need photos|without photos|without videos)/.test(text);

  if (slot === 'media' && yes) mediaYes = true;
  if (slot === 'media' && no) mediaNo = true;

  const mediaKnown = mediaYes || mediaNo;

  let aiYes = /(ai video|video studio|heygen|need ai|want ai|included ai|include ai)/.test(text);
  let aiNo = /(no ai|do not need ai|don't need ai|without ai|not ai|only need the website builder)/.test(text);

  if (slot === 'ai' && yes) aiYes = true;
  if (slot === 'ai' && no) aiNo = true;

  const aiKnown = aiYes || aiNo;

  let small = /(small|simple|launch page|basic|test page|quick page)/.test(text);
  let full = /(full|fuller|complete|all sections|more sections|full website|website hub)/.test(text);

  if (slot === 'size') {
    if (/(small|simple|launch|basic|test)/.test(current) || yes && lastAssistantText(history).includes('small launch page')) small = true;
    if (/(full|fuller|complete|more|all sections)/.test(current)) full = true;
  }

  const sizeKnown = small || full;

  return {
    business,
    needsClarification,
    actions: { needsBuy, needsOrder, needsBook, needsQuote, needsContact, mentionsAction },
    media: { mediaYes, mediaNo, mediaKnown },
    ai: { aiYes, aiNo, aiKnown },
    size: { small, full, sizeKnown },
    raw: text,
    pending: slot
  };
}

export function makePlanConsultationAnswer(message = '', history = []) {
  const profile = getPlanProfile(message, history);

  if (!profile.business) {
    return `Got it. What type of business is this for?

For example:
- cookbook or digital recipes
- catering or food plates
- beauty or hair appointments
- cleaning or local services
- coaching or classes
- digital products`;
  }

  if (profile.business === 'cooking / food' && profile.needsClarification) {
    return `Okay, cooking/food — now we’re getting somewhere.

Which one are you building this for?

1. Selling a cookbook or recipes
2. Selling food plates, catering, or meal prep
3. Showing a restaurant/menu
4. Booking cooking classes
5. Sharing cooking content only`;
  }

  if (!profile.actions.mentionsAction) {
    if (profile.business.includes('cookbook')) {
      return `Perfect — a cookbook/recipe product.

Will customers need to tap a **Buy Now** button to purchase the cookbook, or is this only to showcase the cookbook for now?`;
    }
    if (profile.business.includes('food service')) {
      return `For food service, do customers need to **Order Now**, **View Menu**, **Request a Quote**, or **Call/Text** you?`;
    }
    if (profile.business.includes('beauty')) {
      return `For a beauty business, do customers need to **Book Now**, **Call/Text**, or **Request a Quote**?`;
    }
    return `What action do customers need to take?

Choose one or more:
Book, Order, Buy, Request a Quote, Call, Text, or Email.`;
  }

  if (!profile.media.mediaKnown) {
    return `Do you need photos, videos, a gallery, or product images on the site?

For a cookbook, this could be the cookbook cover, recipe photos, sample pages, or promo images.`;
  }

  if (!profile.ai.aiKnown) {
    return `Do you want AI Video Studio included with the website plan, or do you only need the website builder?

AI Video Studio helps with video ideas, hooks, scripts, captions, scenes, and prompts.`;
  }

  if (!profile.size.sizeKnown) {
    return `Last thing: do you want a small launch page, or a fuller website with more sections like About, Products/Menu, Gallery, FAQ, Testimonials, and Contact?`;
  }

  return recommendPlanFromProfile(profile);
}

export function recommendPlanFromProfile(profile) {
  const { business, actions, media, ai, size } = profile;

  if (size.small && !media.mediaYes && !ai.aiYes) {
    return `Based on what you told me, I’d recommend the **Free Launch Page** to start.

Why:
- You want a small/simple page
- You do not need media uploads
- You do not need AI Video Studio included
- You can still use 1 customer action button

Good starter setup:
Home, About/Product, Contact or Order / Book / Buy.`;
  }

  if (business.includes('cookbook')) {
    if (ai.aiYes || size.full) {
      return `Based on what you told me, I’d recommend **Business** for your cookbook.

Why:
- A cookbook usually needs product details, images, FAQs, and a clear Buy Now button
- Business gives you up to 6 sections
- You get up to 4 action buttons
- AI Video Studio is included based on plan limits for promo scripts, captions, and video ideas

Best setup:
Home, About the Cookbook, Products, Gallery, FAQ, and Order / Book / Buy.

Upgrade to **Premium** only if you want all sections, more buttons, and the most flexibility.`;
    }

    if (media.mediaYes && !ai.aiYes) {
      return `Based on what you told me, I’d recommend **Starter Pro** for your cookbook.

Why:
- You can upload cookbook images, cover photos, recipe previews, or promo graphics
- You get up to 4 selected sections
- You get up to 2 customer action buttons, such as **Buy Now** and **Email Us**
- You do not need the higher plan unless you want AI Video Studio or more sections

Best setup:
Home, About the Cookbook, Products, and Order / Book / Buy.`;
    }
  }

  if (ai.aiYes) {
    return `Based on what you told me, I’d recommend the **Business plan**.

Why:
- It gives you up to 6 selected sections
- It allows media uploads for photos/videos
- It gives you up to 4 customer action buttons
- It includes AI Video Studio access based on plan limits

Upgrade to **Premium** only if you want all sections, more buttons, and the most flexibility.`;
  }

  if (media.mediaYes && !ai.aiYes && !size.full) {
    return `Based on what you told me, I’d recommend **Starter Pro**.

Why:
- You need media uploads
- You need a small professional site
- You get up to 4 sections
- You get up to 2 customer action buttons

Choose **Business** instead if you need more sections, more buttons, or AI Video Studio included.`;
  }

  if (size.full || actions.needsOrder || actions.needsBook || actions.needsQuote) {
    return `Based on what you told me, I’d recommend **Business**.

Why:
- You need a fuller business website
- You may need multiple action buttons
- You get up to 6 selected sections
- You get media uploads
- AI Video Studio access is included based on plan limits

Upgrade to **Premium** if you need all sections or up to 8 action buttons.`;
  }

  return `Based on what you told me, I’d recommend **Starter Pro** as the safest starting plan.

Why:
- It gives you more room than Free
- It allows media uploads
- It includes up to 4 selected sections
- It gives you 2 customer action buttons

Choose **Business** if you want AI Video Studio included or need a fuller site.`;
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
    return `I can help you choose. Tell me what kind of business you have, whether you need booking/order/buy/quote buttons, whether you need photos or videos, and whether you want AI Video Studio included.`;
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
6. Use Open Published Website or Open Backup Preview.`;
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
