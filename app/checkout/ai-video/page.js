'use client';

import Nav from '../../../lib/Nav';
import { cleanCheckoutUrl } from '../../../lib/commerceConfig.mjs';

export default function AiVideoCheckoutPage() {
  const checkoutUrl = cleanCheckoutUrl(process.env.NEXT_PUBLIC_AI_VIDEO_CHECKOUT_URL || '');
  return (
    <>
      <Nav />
      <main className="wrap">
        <section className="dashboard aiVideoCheckoutPage">
          <span className="kicker">AI Video Studio</span>
          <h1>AI Video Studio — $5</h1>
          <p>
            Get AI-powered help with video ideas, hooks, scripts, captions, scenes, promo concepts,
            and social media content planning, plus one real AI-generated video after purchase verification,
            without purchasing a website plan.
          </p>

          <div className="notice">
            <strong>What you get:</strong>
            <ul>
              <li>Video ideas for your brand, business, or product</li>
              <li>Hooks and opening lines</li>
              <li>Short-form video scripts</li>
              <li>Scene-by-scene video planning</li>
              <li>Caption and call-to-action help</li>
              <li>One real AI-generated video, subject to provider processing, moderation, and availability</li>
            </ul>
          </div>

          <div className="navRow checkoutSuccessActions">
            {checkoutUrl ? (
              <a className="btn aiStudioSuccessBtn" href={checkoutUrl}>
                Continue to Secure Gumroad Checkout — $5
              </a>
            ) : (
              <div className="notice error">Secure AI Video checkout is temporarily unavailable. Please try again shortly or contact support.</div>
            )}

            <a className="btn dark" href="/video-studio?activate=1">
              Return to AI Video Studio &amp; Verify License
            </a>

            <a className="btn light" href="/pricing">
              View Website Plans
            </a>

            <a className="btn light" href="/builder">
              Build a Website Instead
            </a>
          </div>

          <div className="notice">
            <strong>After purchase:</strong><br />
            Gumroad provides your license key and returns you to Cookie&apos;s confirmation page. Choose Open AI Video Studio &amp; Verify License. Your non-sensitive video plan remains saved in this browser.
          </div>

          <div className="notice gumroadPurchaseHelp" id="purchase-help">
            <strong>Purchase help</strong>
            <p>If Gumroad cannot complete your payment, review your billing country and postal code, turn off any VPN, and try Gumroad in an updated browser. Your unfinished AI Video plan will remain saved.</p>
            <p>Gumroad handles payment processing. Never send payment-card information to Cookies Digital Creations.</p>
            <div className="navRow checkoutSuccessActions">
              <a className="btn light" href="/video-studio">Resume Saved Plan</a>
              <a className="btn light" href="mailto:support@gumroad.com?subject=AI%20Video%20checkout%20payment%20help">Contact Gumroad for Payment Help</a>
              <a className="btn light" href="mailto:hello@cookiesdigitalcreations.com?subject=AI%20Video%20product%20or%20Builder%20help">Contact Cookie Support</a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
