'use client';

import { useEffect, useMemo, useState } from 'react';
import SitePreview from '../../../lib/SitePreview';
import { slugify } from '../../../lib/siteDefaults';

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cookiesdigitalcreations.com';
const DRAFT_KEY = 'cookieDraftSite';
const CURRENT_DRAFT_SLUG_KEY = 'cookieBuilderCurrentSlug';
const DRAFTS_INDEX_KEY = 'cookieDraftSitesIndex';

function safeParse(raw) {
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function pickSlug(site) {
  return slugify(site?.slug || site?.draftName || site?.businessName || localStorage.getItem(CURRENT_DRAFT_SLUG_KEY) || 'my-website');
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
  const [message, setMessage] = useState('Publishing your website...');
  const [publishedSlug, setPublishedSlug] = useState('');
  const [error, setError] = useState('');
  const [isPublishing, setIsPublishing] = useState(true);

  const siteUrl = useMemo(() => publishedSlug ? `https://${publishedSlug}.${ROOT}` : '', [publishedSlug]);

  useEffect(() => {
    async function publishSavedDraft() {
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

      const params = new URLSearchParams(window.location.search);
      const paidPlan = params.get('paid') || saved.plan || 'starter';
      const slug = pickSlug(saved);
      const finalSite = {
        ...saved,
        slug,
        plan: paidPlan === '1' || paidPlan === 'true' ? (saved.plan || 'starter') : paidPlan,
        status: 'published'
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

    publishSavedDraft();
  }, []);

  return (
    <main className="wrap dashboard">
      <span className="kicker">Checkout Complete</span>
      <h1>Thank you!</h1>
      <p>{message}</p>
      {error && <div className="notice danger">{error}</div>}

      {siteUrl && (
        <div className="notice">
          <strong>Customer website:</strong><br />
          <a href={siteUrl} target="_blank" rel="noreferrer">{publishedSlug}.{ROOT}</a>
        </div>
      )}

      <p className="navRow">
        {siteUrl && <a className="btn" href={siteUrl} target="_blank" rel="noreferrer">Open Published Website</a>}
        {publishedSlug && <a className="btn dark" href={`/site/${publishedSlug}`} target="_blank" rel="noreferrer">Open Backup Preview</a>}
        <a className="btn light" href="/customer">Find My Drafts / Website</a>
        <a className="btn light" href="/builder">Back to Builder</a>
      </p>

      {isPublishing && <div className="notice">Please wait while the website is saved and published.</div>}
      {site && <SitePreview site={site} />}
    </main>
  );
}
