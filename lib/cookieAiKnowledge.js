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
Cookie's AI Video Studio is $5 standalone for creative planning without buying a website plan.
Do not promise custom domains as included in the current plans.
Do not promise guaranteed sales, traffic, followers, SEO ranking, income, views, or viral results.
`
  },
  {
    id: 'plan_match',
    title: 'Plan Matching Guide',
    tags: ['choose','recommend','which plan','best plan','business type','compare','fits me','fit me','right plan','one page','1 page'],
    content: `
When the customer asks what plan fits them, ask discovery questions first.
Keep track of each answer instead of repeating the same question.
The plan-picking order is:
1. business type
2. customer action needed
3. photos/videos/media needed
4. AI Video Studio needed
5. small launch page vs fuller website
Then recommend one plan.
If the customer says they only need one page, do not argue or ask why repeatedly.
Explain that one page can still use Starter or Business depending on whether they need media and included AI Video Studio.
If they need AI Video Studio included inside the website plan, Business may still be best even for one page.
If they only need a one-page site with photos and a Buy Now button, Starter Pro is usually best.
If they want AI separately, suggest Starter Pro plus the $5 standalone AI Video Studio as a lower-cost option.
`
  },
  {
    id: 'order_book_buy',
    title: 'Order / Book / Buy Buttons',
    tags: ['order','book','buy','quote','button','buttons','payment','booking','checkout','menu','link'],
    content: `
Order / Book / Buy lets customers add buttons such as Book Now, Order Now, Buy Now, Request Quote, Call Now, Text Us, Email Us, View Menu, Make a Payment, and Custom Link.
The owner pastes their own third-party links or contact details.
Cookie Mini Website Builder Pro does not control third-party checkout, appointments, orders, delivery, refunds, disputes, or payment processing.
`
  },
  {
    id: 'ai_video',
    title: 'AI Video Studio',
    tags: ['ai video','video studio','heygen','video','script','caption','prompt','voiceover','creative kit'],
    content: `
Cookie's AI Video Studio has a $5 standalone option for creative planning: video ideas, hooks, scripts, captions, scenes, voiceover wording, video prompts, and content direction.
Business and Premium website plans may include real HeyGen generation based on monthly plan limits.
Business currently has 1 real HeyGen video/month.
Premium currently has 3 real HeyGen videos/month.
Standalone AI Video Studio should not be described as guaranteeing a finished video.
`
  },
  {
    id: 'publishing',
    title: 'Publishing and Live Sites',
    tags: ['publish','published','live','subdomain','website name','404','backup preview','open published'],
    content: `
Customer websites publish under customername.cookiesdigitalcreations.com.
If Open Published Website does not work, try Open Backup Preview.
If both fail, ask for the website/subdomain name, plan, page, device, browser, and screenshot.
`
  },
  {
    id: 'writing_help',
    title: 'Website Writing Help',
    tags: ['write','headline','about','services','faq','description','bio','copy','wording','content','caption'],
    content: `
Cookie AI Assistant can help draft homepage headlines, descriptions, About sections, service descriptions, product/menu descriptions, FAQ answers, calls to action, video hooks, and captions.
Keep writing clear, customer-friendly, and truthful. Do not promise guaranteed results.
`
  }
];

export function normalizeText(value = '') {
  return String(value || '').toLowerCase().trim();
}

export function classifyIntent(message = '', pagePath = '') {
  const text = normalizeText(`${message} ${pagePath}`);

  if (/(refund|billing|cancel|subscription|charge|dispute|account access|payment issue)/.test(text)) return 'human_support';
  if (/(plan|price|pricing|cost|starter|business|premium|free|choose|fits me|fit me|best for me|right for me|recommend|pick a plan|one page|1 page)/.test(text)) return 'plan_help';
  if (/(write|headline|about|description|services|faq|caption|script|wording|copy)/.test(text)) return 'writing_help';
  if (/(order|book|buy|quote|button|booking|payment|menu|checkout link)/.test(text)) return 'action_buttons';
  if (/(ai video|video studio|heygen|video|caption|prompt|voiceover)/.test(text)) return 'ai_video';
  if (/(publish|live|subdomain|404|backup preview|open published)/.test(text)) return 'publishing';
  if (/(error|broken|stuck|freeze|not working|blank|issue|problem)/.test(text)) return 'troubleshooting';
  if (text.includes('/pricing')) return 'plan_help';
  return 'general';
}

export function isPlanStartQuestion(message = '') {
  const text = normalizeText(message);
  return /(what plan fits me|which plan should i choose|what plan should i choose|best plan for me|right plan for me|what plan is best|help me choose|help me pick|what plan fits|recommend a plan|what plan do i need)/.test(text);
}

export function isOnePageRefinement(message = '') {
  const text = normalizeText(message);
  return /(one page|1 page|single page|only need one|only want one|just one page|small launch|smal launch|basic page|simple page)/.test(text);
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
  if (page.includes('/pricing')) return `The user is on Pricing. Help them pick a plan by asking questions first.`;
  if (page.includes('/builder')) return `The user is in the Builder. Help with sections, writing, buttons, drafts, and publishing.`;
  if (page.includes('/checkout/ai-video') || page.includes('/ai-video-studio') || page.includes('/video-studio')) return `The user is around AI Video Studio. Help with creative kits, scripts, captions, and prompts.`;
  if (page.includes('/checkout')) return `The user is around checkout. Explain checkout safely and route billing/refund/account issues to Contact Us.`;
  if (page.includes('/customer')) return `The user is around My Website/customer dashboard. Help with drafts, published websites, and backup preview.`;
  return `The user is on the public website. Help them understand the builder, plans, AI Video Studio, and next steps.`;
}

export function makeFallbackAnswer(message = '', pagePath = '') {
  const intent = classifyIntent(message, pagePath);

  if (intent === 'human_support') {
    return `For billing, refunds, subscription changes, account access, or payment issues, please use Contact Us so Cookie Digital Creations can review it directly. Please do not share passwords, card numbers, admin codes, or private keys in chat.`;
  }

  if (intent === 'writing_help') {
    return `I can help write that. Send me:

1. Your business name
2. What you sell or offer
3. Who it is for
4. The tone you want: professional, luxury, friendly, funny, or sassy`;
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

  if (intent === 'plan_help') {
    return startPlanFlow().answer;
  }

  return `I can help you choose a plan, build your mini website, add Order / Book / Buy buttons, write your website wording, understand AI Video Studio, save drafts, publish, or find the right page. What are you working on today?`;
}

function yes(value = '') {
  return /^(yes|y|yeah|yep|sure|ok|okay|i do|need that|include it|with that)$/i.test(String(value || '').trim());
}

function no(value = '') {
  return /^(no|n|nope|nah|not now|do not|don't|dont|without it|not needed|i do not|i don't)$/i.test(String(value || '').trim());
}

function includesAny(text, words) {
  return words.some(word => text.includes(word));
}

function cleanState(state = {}) {
  const safe = typeof state === 'object' && state ? state : {};
  return {
    active: Boolean(safe.active),
    step: safe.step || '',
    business: safe.business || '',
    cookingSubtype: safe.cookingSubtype || '',
    action: safe.action || '',
    media: safe.media || '',
    ai: safe.ai || '',
    size: safe.size || '',
    lastRecommendation: safe.lastRecommendation || ''
  };
}

export function startPlanFlow() {
  const planState = {
    active: true,
    step: 'business',
    business: '',
    cookingSubtype: '',
    action: '',
    media: '',
    ai: '',
    size: '',
    lastRecommendation: ''
  };

  return {
    planState,
    answer: `I can help you pick the best plan — but first I need to know what you’re building, baby.

What type of business is this for?

Examples:
- cookbook or digital recipes
- catering or food plates
- beauty or hair appointments
- cleaning or local services
- coaching or classes
- digital products`
  };
}

function parseBusiness(text) {
  if (includesAny(text, ['cookbook', 'recipe book', 'digital recipes', 'recipes', 'ebook', 'e-book'])) return { business: 'cookbook / digital recipes', cookingSubtype: 'cookbook' };
  if (includesAny(text, ['cooking', 'food'])) return { business: 'cooking / food', cookingSubtype: '' };
  if (includesAny(text, ['catering', 'food plates', 'plates', 'meal prep', 'restaurant', 'menu', 'bakery', 'food truck'])) return { business: 'food service', cookingSubtype: 'food service' };
  if (includesAny(text, ['hair', 'beauty', 'salon', 'lashes', 'nails', 'barber', 'makeup', 'spa'])) return { business: 'beauty / appointment business', cookingSubtype: '' };
  if (includesAny(text, ['cleaning', 'lawn', 'repair', 'handyman', 'service'])) return { business: 'local service business', cookingSubtype: '' };
  if (includesAny(text, ['coach', 'coaching', 'course', 'class', 'training'])) return { business: 'coach / education business', cookingSubtype: '' };
  if (includesAny(text, ['digital product', 'product seller', 'download'])) return { business: 'digital product seller', cookingSubtype: '' };
  return { business: text || '', cookingSubtype: '' };
}

function parseAction(text, state) {
  if (includesAny(text, ['buy', 'sell', 'purchase', 'checkout', 'gumroad', 'payment'])) return 'buy';
  if (includesAny(text, ['order', 'menu', 'food plates', 'meal prep', 'catering'])) return 'order';
  if (includesAny(text, ['book', 'booking', 'appointment', 'class', 'calendar', 'calendly'])) return 'book';
  if (includesAny(text, ['quote', 'estimate'])) return 'quote';
  if (includesAny(text, ['call', 'text', 'email', 'contact'])) return 'contact';
  if (yes(text)) {
    if ((state.business || '').includes('cookbook') || state.cookingSubtype === 'cookbook') return 'buy';
    if ((state.business || '').includes('food')) return 'order';
    if ((state.business || '').includes('beauty')) return 'book';
    return 'contact';
  }
  if (no(text)) return 'none';
  return '';
}

function nextMissingStep(state) {
  if (!state.business) return 'business';
  if (state.business === 'cooking / food' && !state.cookingSubtype) return 'cookingSubtype';
  if (!state.action) return 'action';
  if (!state.media) return 'media';
  if (!state.ai) return 'ai';
  if (!state.size) return 'size';
  return 'recommend';
}

function questionForStep(state) {
  const step = nextMissingStep(state);

  if (step === 'business') {
    return `What type of business is this for?

Examples:
- cookbook or digital recipes
- catering or food plates
- beauty or hair appointments
- cleaning or local services
- coaching or classes
- digital products`;
  }

  if (step === 'cookingSubtype') {
    return `Okay, cooking/food — now we’re getting somewhere.

Which one are you building this for?

1. Selling a cookbook or recipes
2. Selling food plates, catering, or meal prep
3. Showing a restaurant/menu
4. Booking cooking classes
5. Sharing cooking content only`;
  }

  if (step === 'action') {
    if ((state.business || '').includes('cookbook') || state.cookingSubtype === 'cookbook') {
      return `Perfect — a cookbook/recipe product.

Will customers need a **Buy Now** button to purchase the cookbook, or is this only to showcase the cookbook for now?`;
    }
    if ((state.business || '').includes('food')) {
      return `For food service, do customers need to **Order Now**, **View Menu**, **Request a Quote**, or **Call/Text** you?`;
    }
    if ((state.business || '').includes('beauty')) {
      return `For a beauty business, do customers need to **Book Now**, **Call/Text**, or **Request a Quote**?`;
    }
    return `What action do customers need to take?

Choose one or more:
Book, Order, Buy, Request a Quote, Call, Text, or Email.`;
  }

  if (step === 'media') {
    return `Do you need photos, videos, a gallery, or product images on the site?

For a cookbook, this could be the cookbook cover, recipe photos, sample pages, or promo images.`;
  }

  if (step === 'ai') {
    return `Do you want AI Video Studio included with the website plan, or do you only need the website builder?

AI Video Studio helps with video ideas, hooks, scripts, captions, scenes, and prompts.`;
  }

  if (step === 'size') {
    return `Last thing: do you want a small launch page, or a fuller website with more sections like About, Products/Menu, Gallery, FAQ, Testimonials, and Contact?`;
  }

  return recommendPlan(state).answer;
}

export function continuePlanFlow(message = '', previousState = {}) {
  const current = normalizeText(message);
  let state = cleanState(previousState);

  if (!state.active) {
    return handlePlanRefinement(message, state);
  }

  if (state.step === 'business') {
    const parsed = parseBusiness(current);
    state.business = parsed.business;
    state.cookingSubtype = parsed.cookingSubtype;
  } else if (state.step === 'cookingSubtype') {
    if (includesAny(current, ['cookbook', 'recipe', 'recipes', 'digital'])) {
      state.business = 'cookbook / digital recipes';
      state.cookingSubtype = 'cookbook';
    } else if (includesAny(current, ['plates', 'catering', 'meal prep', 'restaurant', 'menu'])) {
      state.business = 'food service';
      state.cookingSubtype = 'food service';
    } else if (includesAny(current, ['class', 'classes', 'booking'])) {
      state.business = 'cooking classes';
      state.cookingSubtype = 'classes';
    } else if (includesAny(current, ['content', 'sharing', 'blog'])) {
      state.business = 'cooking content';
      state.cookingSubtype = 'content';
    }
  } else if (state.step === 'action') {
    state.action = parseAction(current, state);
  } else if (state.step === 'media') {
    if (yes(current) || includesAny(current, ['photo', 'photos', 'video', 'videos', 'gallery', 'images', 'cover', 'sample pages', 'product'])) state.media = 'yes';
    else if (no(current)) state.media = 'no';
  } else if (state.step === 'ai') {
    if (yes(current) || includesAny(current, ['ai video', 'video studio', 'heygen', 'scripts', 'captions', 'prompts'])) state.ai = 'yes';
    else if (no(current) || includesAny(current, ['only website', 'website only', 'no ai'])) state.ai = 'no';
  } else if (state.step === 'size') {
    if (includesAny(current, ['small', 'smal', 'simple', 'one page', '1 page', 'single page', 'launch', 'basic', 'test'])) state.size = 'small';
    else if (includesAny(current, ['full', 'fuller', 'complete', 'more sections', 'all sections'])) state.size = 'fuller';
    else if (yes(current)) state.size = 'fuller';
    else if (no(current)) state.size = 'small';
  }

  if (state.step === nextMissingStep(state)) {
    return {
      planState: state,
      answer: `I want to make sure I understand that right.\n\n${questionForStep(state)}`
    };
  }

  const nextStep = nextMissingStep(state);

  if (nextStep === 'recommend') {
    return recommendPlan(state);
  }

  state.step = nextStep;

  return {
    planState: state,
    answer: questionForStep(state)
  };
}

export function handlePlanRefinement(message = '', previousState = {}) {
  const current = normalizeText(message);
  let state = cleanState(previousState);

  if (isOnePageRefinement(current)) {
    state.size = 'small';
    state.active = false;
    state.step = 'complete';

    if (state.ai === 'yes') {
      return {
        planState: state,
        answer: `Got it — you only need **one page**. You do **not** need a fuller website.

Because you also said you want **AI Video Studio included**, I’d still recommend **Business** if you want the AI access bundled with the website plan.

But here’s the cheaper one-page option:
**Starter Pro + the $5 standalone AI Video Studio**

That gives you:
- one clean cookbook sales page
- media uploads for your cover, recipe photos, or sample pages
- up to 2 action buttons like **Buy Now** and **Email Us**
- AI Video Studio separately for scripts, captions, hooks, and prompts

So the better answer is:

**Best bundled plan:** Business  
**Best lower-cost one-page setup:** Starter Pro + $5 AI Video Studio`;
      };
    }

    if (state.media === 'yes' || state.action === 'buy') {
      return {
        planState: state,
        answer: `Got it — you only need **one page**.

For a one-page cookbook or digital recipe product with photos/images and a Buy Now button, I’d recommend **Starter Pro**, not Business.

Why:
- You can keep it as one page
- You can upload cookbook images, cover photos, recipe previews, or promo graphics
- You get up to 2 customer action buttons, such as **Buy Now** and **Email Us**
- You do not need Business unless you want AI Video Studio included or more buttons/sections

Best one-page setup:
Home/Product intro + cookbook image + short description + Buy Now button + Contact.`;
      };
    }

    return {
      planState: state,
      answer: `Got it — you only need **one page**.

If you do not need media uploads or AI Video Studio included, the **Free Launch Page** can work.

Choose **Starter Pro** instead if you need cookbook images, product photos, a gallery, or 2 action buttons.`;
    };
  }

  return {
    planState: state,
    answer: `Got it. Based on your earlier answers, ${state.lastRecommendation || 'Starter Pro or Business may fit depending on whether you want AI Video Studio included.'}

For a one-page site, you can keep the site simple even on a paid plan. The plan controls features, not how many pages you are forced to build.`
  };
}

export function recommendPlan(state = {}) {
  const s = cleanState(state);
  const needsMedia = s.media === 'yes';
  const wantsAi = s.ai === 'yes';
  const small = s.size === 'small';
  const fuller = s.size === 'fuller';
  const action = s.action || 'contact';
  const businessLabel = s.business || 'your business';

  let answer = '';

  if (small && wantsAi) {
    answer = `Based on what you told me, I’d recommend **Business** only if you want AI Video Studio included with the website plan.

Why:
- You only need a small/one-page site
- You need media upload options
- You need a customer action button like Buy Now
- You also said you want AI Video Studio included

Important: Business does **not** mean you have to build 6 pages. You can still keep it as one page.

Cheaper option:
If you only need AI Video Studio separately, use **Starter Pro + the $5 standalone AI Video Studio**.`;
  } else if (small && !needsMedia && !wantsAi && (action === 'none' || action === 'contact')) {
    answer = `Based on what you told me, I’d recommend the **Free Launch Page** for ${businessLabel}.

Why:
- You want a small/simple page
- You do not need media uploads
- You do not need AI Video Studio included
- You only need 1 basic customer action button`;
  } else if (businessLabel.includes('cookbook') && needsMedia && !wantsAi) {
    answer = `Based on what you told me, I’d recommend **Starter Pro** for ${businessLabel}.

Why:
- You can keep it as one page
- You can upload cookbook images, cover photos, recipe previews, or promo graphics
- You get up to 4 selected sections
- You get up to 2 customer action buttons, like **Buy Now** and **Email Us**

Choose **Business** only if you want AI Video Studio included, more sections, or more action buttons.`;
  } else if (wantsAi || fuller || ['order','book','quote'].includes(action)) {
    answer = `Based on what you told me, I’d recommend the **Business plan** for ${businessLabel}.

Why:
- You get up to 6 selected sections
- You get media upload options
- You get up to 4 customer action buttons
- AI Video Studio access is included based on plan limits

You can still keep it to one page if that is all you need.`;
  } else if (needsMedia || action === 'buy') {
    answer = `Based on what you told me, I’d recommend **Starter Pro** for ${businessLabel}.

Why:
- It works well for a clean one-page product or service site
- It allows media uploads
- It includes up to 4 selected sections
- It gives you up to 2 customer action buttons`;
  } else {
    answer = `Based on what you told me, I’d recommend **Starter Pro** as the safest starting plan.

Choose **Business** if you want AI Video Studio included or need more buttons/sections.`;
  }

  const finalState = {
    ...s,
    active: false,
    step: 'complete',
    lastRecommendation: answer
  };

  return {
    planState: finalState,
    answer
  };
}
