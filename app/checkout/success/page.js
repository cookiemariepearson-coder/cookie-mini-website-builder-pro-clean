'use client';

import { useEffect, useMemo, useState } from 'react';
import SitePreview from '../../../lib/SitePreview';
import { slugify, plans, normalizeSelectedPagesForPlan } from '../../../lib/siteDefaults';

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cookiesdigitalcreations.com';
const DRAFT_KEY = 'cookieDraftSite';
const CURRENT_DRAFT_SLUG_KEY = 'cookieBuilderCurrentSlug';
const DRAFTS_INDEX_KEY = 'cookieDraftSitesIndex';

const planSummary = {
  free: 'Free Launch Page — includes up to 3 selected sections and 1 customer action button.',
  starter: 'Starter Pro — includes up to 4 selected sections, 2 customer action buttons, plus image/video upload options.',
  business: 'Business — includes up to 6 selected sections, 4 customer action buttons, image/video upload options, and AI Video Studio access.',
  premium: 'Premium — includes access to all built-in sections, 8 customer action buttons, image/video upload options, and AI Video Studio access.',
  extra: 'Extra Page Add-On — adds extra section/page space to an existing paid website.',
  'ai-video': 'AI Video Studio — one standalone AI video access purchase.'
};

function safeParse(raw) {
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function pickSlug(site) {
  return slugify(site?.slug || site?.draftName || site?.businessName || localStorage.getItem(CURRENT_DRAFT_SLUG_KEY) || 'my-website');
}

function normalizePaidPlan(value, fallback = 'starter') {
  const raw = String(value || '').toLowerCase();
  if (raw === 'ai-video') return 'ai-video';
  if (raw === '1' || raw === 'true') return fallback || 'starter';
  if (['free','starter','business','premium'].includes(raw)) return raw;
  if (raw === 'extra') return fallback && fallback !== 'free' ? fallback : 'starter';
  return fallback || 'starter';
}

function updateLocalDraft(site) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(site));
    localStorage.setItem(CURRENT_DRAFT_SLUG_KEY, site.slug);
    const index = safeParse(localStorage.getItem(DRAFTS_INDEX_KEY)) || {};
    index[site.slug] = { ...site, updatedAt: new Date().toISOString() };
    localStorage.setItem(DRAFTS_INDEX_KEY, JSON.stringify(index));
  } catch {}
}

export default function CheckoutSuccess() {
  const [site, setSite] = useState(null);
  const [message, setMessage] = useState('Completing checkout...');
  const [publishedSlug, setPublishedSlug] = useState('');
  const [error, setError] = useState('');
  const [isPublishing, setIsPublishing] = useState(true);
  const [aiVideoPurchase, setAiVideoPurchase] = useState(false);

  const siteUrl = useMemo(() => publishedSlug ? `https://${publishedSlug}.${ROOT}` : '', [publishedSlug]);
  const displayedPlan = site?.plan || 'free';
  const completedPurchase = aiVideoPurchase ? 'ai-video' : (site?.completedPurchase || displayedPlan);
  const selectedSections = site?.pages?.length ? site.pages.join(', ') : 'Home';

  useEffect(() => {
    async function completeCheckout() {
      const params = new URLSearchParams(window.location.search);
      const paidParam = params.get('paid') || '';

      if (String(paidParam).toLowerCase() === 'ai-video') {
        try {
          localStorage.setItem('cookieAiVideoStandalonePass', 'true');
          localStorage.setItem('cookieAiVideoStandaloneCredits', '1');
          localStorage.setItem('cookieAiVideoStandalonePurchasedAt', new Date().toISOString());
        } catch {}
        setAiVideoPurchase(true);
        setMessage('AI Video Studio checkout complete. Your video access is ready on this device.');
        setIsPublishing(false);
        return;
      }

      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) {
        setIsPublishing(false);
        setError('No website draft was found in this browser. Open My Website and search by your email to find saved drafts.');
        return;
      }

      const saved = safeParse(raw);
      if (!saved) {
        setIsPublishing(false);
        setError('The saved draft could not be opened. Return to the builder or My Website to continue.');
        return;
      }

      const paidPlan = normalizePaidPlan(paidParam || saved.plan || 'starter', saved.plan || 'starter');
      const slug = pickSlug(saved);
      const finalSite = {
        ...saved,
        slug,
        plan: paidPlan,
        pages: normalizeSelectedPagesForPlan(saved.pages, paidPlan),
        status: 'published',
        completedPurchase: paidParam || paidPlan
      };

      setSite(finalSite);
      setPublishedSlug(slug);
      updateLocalDraft(finalSite);

      try {
        const res = await fetch('/api/site/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ site: finalSite })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'Publishing failed.');
        const returnedSlug = data.slug || slug;
        const updated = { ...finalSite, slug: returnedSlug, status: 'published' };
        setSite(updated);
        setPublishedSlug(returnedSlug);
        updateLocalDraft(updated);
        setMessage('Checkout complete. Your website has been published.');
      } catch (e) {
        setError(e.message || 'Publishing failed.');
        setMessage('Checkout complete, but the website could not publish automatically. Your draft is still saved.');
      } finally {
        setIsPublishing(false);
      }
    }

    completeCheckout();
  }, []);

  function startFreshDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(CURRENT_DRAFT_SLUG_KEY);
    } catch {}
    window.location.href = '/builder';
  }

  if (aiVideoPurchase) {
    return (
      <main className="wrap dashboard checkoutSuccessPage">
        <span className="kicker">Checkout Complete</span>
        <h1>AI Video Studio is ready.</h1>
        <p>{message}</p>

        <div className="notice success">
          <strong>Purchase confirmed:</strong> AI Video Studio — $5<br />
          This standalone option is for customers who want a video workflow without purchasing a website plan.
        </div>

        <div className="navRow checkoutSuccessActions">
          <a className="btn aiStudioSuccessBtn" href="/video-studio?mode=standalone">Open AI Video Studio</a>
          <a className="btn dark" href="/video-studio/results">Open Video Results</a>
          <a className="btn light" href="/pricing">View Website Plans</a>
          <a className="btn light" href="/builder">Build a Website</a>
        </div>

        <div className="notice supportAfterActions">
          <strong>Any issues?</strong> Click Contact Us after trying the buttons above.
          <br /><a className="btn light" href="/contact">Contact Us</a>
        </div>
      </main>
    );
  }

  return (
    <main className="wrap dashboard checkoutSuccessPage">
      <span className="kicker">Checkout Complete</span>
      <h1>Thank you!</h1>
      <p>{message}</p>
      {error && <div className="notice danger">{error}</div>}

      <div className="notice success">
        <strong>{completedPurchase === 'extra' ? 'Purchase completed' : 'Plan confirmed'}:</strong> {completedPurchase === 'extra' ? 'Extra Page Add-On' : (plans[displayedPlan]?.label || displayedPlan)}<br />
        {completedPurchase === 'extra' ? `Website plan remains ${plans[displayedPlan]?.label || displayedPlan}. Extra add-on helps with additional section/page space.` : (planSummary[displayedPlan] || planSummary.starter)}<br />
        <strong>Publishing sections:</strong> {selectedSections}
      </div>

      {siteUrl && (
        <div className="notice">
          <strong>Customer website:</strong><br />
          <a href={siteUrl} target="_blank" rel="noreferrer">{publishedSlug}.{ROOT}</a>
        </div>
      )}

      <div className="navRow checkoutSuccessActions">
        {siteUrl && <a className="btn" href={siteUrl} target="_blank" rel="noreferrer">Open Published Website</a>}
        {publishedSlug && <a className="btn dark" href={`/site/${publishedSlug}`} target="_blank" rel="noreferrer">Open Backup Preview</a>}
        <a className="btn light" href="/customer">Find My Drafts / Website</a>
        {['business','premium'].includes(displayedPlan) && <a className="btn aiStudioSuccessBtn" href={`/video-studio?return=builder&draft=${encodeURIComponent(publishedSlug || '')}`}>Open AI Video Studio</a>}
        <a className="btn light" href="/builder">Back to Builder</a>
        <button className="btn dark" onClick={startFreshDraft}>Start Fresh Draft</button>
      </div>

      <div className="notice supportAfterActions">
        <strong>Any issues?</strong> Click Contact Us after checking the website, drafts, and builder buttons above.
        <br /><a className="btn light" href="/contact">Contact Us</a>
      </div>

      {isPublishing && <div className="notice">Please wait while the website is saved and published.</div>}
      {site && <SitePreview site={site} />}
    </main>
  );
}
