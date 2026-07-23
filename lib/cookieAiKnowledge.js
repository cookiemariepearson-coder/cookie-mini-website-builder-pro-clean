export const COOKIE_AI_KNOWLEDGE = [
  {
    title: 'Plans and Pricing',
    content: `
Free Launch Page: $0. Up to 3 selected sections. 1 customer action button. No image/video upload. No included AI Video Studio.
Starter Pro: $19/month. Up to 4 selected sections. Image/video upload options. 2 customer action buttons. No included AI Video Studio.
Business: $30/month. Up to 6 selected sections. Image/video upload options. 4 customer action buttons. AI Video Studio access based on plan limits.
Premium: $50/month. All built-in sections. Image/video upload options. 8 customer action buttons. Strongest AI Video Studio access based on plan limits.
Extra Page Add-On: $10/month per extra page/section space.
Cookie's AI Video Studio standalone: $5 one-time creative planning option for hooks, scripts, captions, scenes, prompts, and content planning.
`
  },
  {
    title: 'Plan Matching Rules',
    content: `
Do not dump all plans when the user asks which plan fits them.
Ask useful questions, but do not get stuck asking too many.
Use the user's partial answers and infer what they mean.
If the customer says they only want one page, accept that and explain the best one-page option.
A plan controls features; it does not force the customer to use every section.
If the user wants one page with images/media and a Buy Now button, Starter Pro is usually the best one-page plan.
If the user wants AI Video Studio bundled with the website plan, Business is usually the best plan even if the site is one page.
If the user wants lower cost and only needs one page plus AI help, suggest Starter Pro + the $5 standalone AI Video Studio.
If the user does not need media, AI, or more than 1 button, Free Launch Page may work.
Premium is for customers who need all sections, up to 8 buttons, and maximum flexibility.
`
  },
  {
    title: 'Business Type Guidance',
    content: `
Cookbook/digital recipe product: likely needs Buy Now, product image/cookbook cover, sample pages or recipe photos, Products section, FAQ, and Contact. Starter Pro is often good for one-page with images and Buy Now. Business if AI Video Studio should be included.
Catering/food plates/restaurant: likely needs Order Now, View Menu, Call/Text, images, Menu/Gallery, FAQ, and Contact. Business often fits if several buttons or sections are needed.
Coaching/classes: likely needs Book Now, Buy Now, Request Quote, class/service descriptions, testimonials, FAQ, and Contact. Starter can work for a small one-page setup. Business works if classes, media, AI Video Studio, and several action buttons are needed.
Beauty/hair appointments: likely needs Book Now, Call/Text, Gallery, Services, Testimonials, FAQ, and Contact. Starter can work for a simple one-page. Business if more services/buttons/AI video are needed.
Cleaning/local services: likely needs Request Quote, Call/Text, Services, Before & After, FAQ, and Contact. Starter or Business depending on media/buttons.
Digital product sellers: likely need Buy Now, product image, Product section, FAQ, and Contact. Starter usually fits if AI is not included.
`
  },
  {
    title: 'Order Book Buy',
    content: `
Order / Book / Buy buttons can be Book Now, Order Now, Buy Now, Request Quote, Call Now, Text Us, Email Us, View Menu, Make a Payment, or Custom Link.
Customers paste their own third-party links or contact details: Gumroad, Square, Stripe, Calendly, Google Forms, Jotform, Cash App, menu links, booking links, payment links, phone numbers, emails, or social links.
Cookie Mini Website Builder Pro does not control third-party checkout, appointments, orders, delivery, refunds, disputes, or payment processing.
`
  },
  {
    title: 'Builder Flow',
    content: `
Open /builder. Choose business type. Choose template look. Add business name, website/subdomain name, email, phone if needed, headline, and description.
Customize colors, font feel, background feel, section style, and layout.
Choose sections. Add wording. Add media if the plan allows it. Add Order / Book / Buy if needed. Check preview. Save Draft. Preview & Publish.
`
  },
  {
    title: 'AI Video Studio',
    content: `
Standalone AI Video Studio is $5 and helps with video ideas, hooks, scripts, captions, scenes, voiceover wording, prompts, and content planning.
Business and Premium website plans may include real HeyGen generation based on monthly plan limits.
Business currently has 1 real HeyGen video/month.
Premium currently has 3 real HeyGen videos/month.
Standalone AI Video Studio should not be described as guaranteeing a finished video.
`
  },
  {
    title: 'Safety Rules',
    content: `
Never promise guaranteed sales, traffic, followers, rankings, viral results, income, approvals, or business success.
Never ask for admin PINs, passwords, API keys, secret keys, tokens, owner testing codes, payment card numbers, or private account access.
For billing, refunds, cancellations, subscriptions, account access, payment disputes, or legal questions, route the customer to Contact Us.
Do not say custom domains are included in current live plans.
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
  return 'general';
}

export function getPageHelper(pagePath = '') {
  const page = normalizeText(pagePath);
  if (page.includes('/pricing')) return 'The customer is on Pricing. Help them compare plans and choose based on business needs.';
  if (page.includes('/builder')) return 'The customer is in the Builder. Help with sections, writing, buttons, drafts, preview, and publishing.';
  if (page.includes('/checkout/ai-video') || page.includes('/ai-video-studio') || page.includes('/video-studio')) return 'The customer is around AI Video Studio. Help with video hooks, scripts, captions, prompts, and plan limits.';
  if (page.includes('/checkout')) return 'The customer is around checkout. Explain checkout steps and route billing/refund/account issues to Contact Us.';
  if (page.includes('/customer')) return 'The customer is around My Website/customer dashboard. Help with drafts, published sites, and backup preview.';
  return 'The customer is on the public website. Help with plans, builder steps, AI Video Studio, and next steps.';
}

export function getKnowledgeText() {
  return COOKIE_AI_KNOWLEDGE.map(item => `## ${item.title}\n${item.content.trim()}`).join('\n\n');
}

export function fallbackAnswer(message = '', pagePath = '') {
  const intent = classifyIntent(message, pagePath);

  if (intent === 'human_support') {
    return 'For billing, refunds, subscription changes, account access, or payment issues, please use Contact Us so Cookie Digital Creations can review it directly. Please do not share passwords, card numbers, admin codes, or private keys in chat.';
  }

  if (intent === 'plan_help') {
    return `I can help you choose the best plan. Tell me:
1. What type of business is this for?
2. Do customers need to Book, Order, Buy, Request a Quote, Call, Text, or Email?
3. Do you need photos/videos or product images?
4. Do you want AI Video Studio included?
5. Is this one page or a fuller website?`;
  }

  if (intent === 'action_buttons') {
    return 'Use Order / Book / Buy for buttons like Book Now, Order Now, Buy Now, Request Quote, Call Now, Text Us, Email Us, View Menu, Make a Payment, or Custom Link. Paste your own booking, payment, menu, checkout, form, phone, or email link.';
  }

  if (intent === 'ai_video') {
    return "Cookie's AI Video Studio helps with video ideas, hooks, scripts, captions, scenes, prompts, and content planning. The standalone option is $5. Business and Premium may include real HeyGen access based on plan limits.";
  }

  return 'I can help with plans, builder steps, website wording, Order / Book / Buy, AI Video Studio, publishing, or troubleshooting.';
}
