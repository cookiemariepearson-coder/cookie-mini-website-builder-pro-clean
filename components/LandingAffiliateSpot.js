'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_AMAZON_AFFILIATE_URL, normalizeAmazonAffiliateUrl } from '../lib/amazonAffiliate.mjs';

export default function LandingAffiliateSpot() {
  const [affiliateUrl, setAffiliateUrl] = useState(DEFAULT_AMAZON_AFFILIATE_URL);

  useEffect(() => {
    let active = true;

    async function loadAffiliateUrl() {
      try {
        const response = await fetch('/api/site/affiliate-link', { cache: 'no-store' });
        const result = await response.json().catch(() => ({}));
        const safeUrl = normalizeAmazonAffiliateUrl(result?.url);
        if (active && response.ok && result?.ok && safeUrl) setAffiliateUrl(safeUrl);
      } catch {
        // Keep the last verified/default link visible if the settings endpoint is temporarily unavailable.
      }
    }

    loadAffiliateUrl();
    return () => { active = false; };
  }, []);

  return (
    <aside className="landingAffiliateSpot" aria-label="Amazon affiliate recommendation">
      <div className="affiliateSpotIcon" aria-hidden="true">✦</div>
      <div className="affiliateSpotCopy">
        <span className="affiliateSpotEyebrow">Cookie’s picks</span>
        <strong>Useful finds for creators and small businesses</strong>
        <small>As an Amazon Associate I earn from qualifying purchases. (paid link)</small>
      </div>
      <a className="affiliateSpotLink" href={affiliateUrl} target="_blank" rel="sponsored nofollow noopener noreferrer">
        Shop my Amazon picks <span aria-hidden="true">↗</span>
      </a>
    </aside>
  );
}
