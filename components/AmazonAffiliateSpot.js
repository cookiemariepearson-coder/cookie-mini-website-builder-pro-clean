'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_AMAZON_AFFILIATE_URL, safeAmazonAffiliateUrl } from '../lib/amazonAffiliate.mjs';

export default function AmazonAffiliateSpot({ compact = false } = {}) {
  const [affiliateUrl, setAffiliateUrl] = useState(DEFAULT_AMAZON_AFFILIATE_URL);

  useEffect(() => {
    let active = true;
    fetch('/api/landing-settings', { cache: 'no-store' })
      .then(response => response.json())
      .then(result => {
        if (active && result?.ok) setAffiliateUrl(safeAmazonAffiliateUrl(result.amazonAffiliateUrl));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return (
    <section className={`amazonAffiliateSpot${compact ? " homepageAmazonAffiliateSpot" : ""}`} aria-labelledby="amazon-weekly-pick-heading">
      <div className="amazonAffiliateCopy">
        <span className="amazonAffiliateEyebrow">Cookie’s weekly pick</span>
        <h2 id="amazon-weekly-pick-heading">A little something worth a look.</h2>
        <p>Explore this week’s featured Amazon find. Our pick can change every week.</p>
        <p className="amazonAffiliateDisclosure">As an Amazon Associate, I earn from qualifying purchases.</p>
      </div>
      <div className="amazonBuildAnimation" aria-hidden="true">
        <span className="amazonBuildSpark">✦</span>
        <span className="amazonBuildBox boxOne"></span>
        <span className="amazonBuildBox boxTwo"></span>
        <span className="amazonBuildBox boxThree"></span>
        <span className="amazonBuildBox boxFour"></span>
      </div>
      <a
        className="amazonAffiliateButton"
        href={affiliateUrl}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
        aria-label="Shop Cookie’s Amazon pick of the week in a new tab"
      >
        Shop this week’s pick <span aria-hidden="true">↗</span>
      </a>
    </section>
  );
}
