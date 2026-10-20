'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_AMAZON_AFFILIATE_URL, safeAmazonAffiliateUrl } from '../lib/amazonAffiliate.mjs';

export default function AmazonAffiliateSettingsCard() {
  const [affiliateUrl, setAffiliateUrl] = useState(DEFAULT_AMAZON_AFFILIATE_URL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/landing-settings', { cache: 'no-store' })
      .then(response => response.json())
      .then(result => {
        if (active && result?.ok) setAffiliateUrl(safeAmazonAffiliateUrl(result.amazonAffiliateUrl));
      })
      .catch(() => {
        if (active) setMessage('The current link could not be refreshed. The saved link has not been changed.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/landing-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ amazonAffiliateUrl: affiliateUrl })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || 'The weekly affiliate link was not saved.');
      setAffiliateUrl(safeAmazonAffiliateUrl(result.amazonAffiliateUrl));
      setMessage('Weekly Amazon link saved. The landing-page pick will use the new link.');
    } catch (error) {
      setMessage(error?.message || 'The weekly affiliate link was not saved.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="adminPanel affiliateSettingsCard" aria-labelledby="affiliate-settings-heading">
      <div className="affiliateSettingsHeading">
        <div>
          <span className="kicker">Landing page</span>
          <h2 id="affiliate-settings-heading">Amazon Pick of the Week</h2>
          <p>Change this link whenever you choose a new weekly product. The landing-page button updates from this saved setting.</p>
        </div>
        <span className="affiliateSettingsBadge">Editable</span>
      </div>
      <form onSubmit={save} className="affiliateSettingsForm">
        <div className="field">
          <label htmlFor="weekly-amazon-affiliate-url">Amazon Associates link</label>
          <input
            id="weekly-amazon-affiliate-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            required
            value={affiliateUrl}
            onChange={event => setAffiliateUrl(event.target.value)}
            placeholder="https://amzn.to/your-weekly-link"
          />
          <small>Use an HTTPS amzn.to short link or an Amazon.com product link. The affiliate disclosure remains visible on the landing page.</small>
        </div>
        <div className="affiliateSettingsActions">
          <button className="btn" type="submit" disabled={loading || saving}>
            {loading ? 'Loading saved link…' : saving ? 'Saving…' : 'Save Weekly Link'}
          </button>
          <a className="btn light" href={safeAmazonAffiliateUrl(affiliateUrl)} target="_blank" rel="sponsored nofollow noopener noreferrer">Preview Link</a>
        </div>
      </form>
      {message && <p className="affiliateSettingsMessage" role="status" aria-live="polite">{message}</p>}
    </section>
  );
}
