'use client';

import Nav from '../../../lib/Nav';

export default function AiVideoCheckoutPage() {
  const checkoutUrl = process.env.NEXT_PUBLIC_AI_VIDEO_CHECKOUT_URL || '';
  return (
    <>
      <Nav />
      <main className="wrap">
        <section className="dashboard aiVideoCheckoutPage">
          <span className="kicker">AI Video Studio</span>
          <h1>AI Video Studio — $5</h1>
          <p>
            Get AI-powered help with video ideas, hooks, scripts, captions, scenes, promo concepts,
            and social media content planning without purchasing a website plan.
          </p>

          <div className="notice">
            <strong>What you get:</strong>
            <ul>
              <li>Video ideas for your brand, business, or product</li>
              <li>Hooks and opening lines</li>
              <li>Short-form video scripts</li>
              <li>Scene-by-scene video planning</li>
              <li>Caption and call-to-action help</li>
            </ul>
          </div>

          <div className="navRow checkoutSuccessActions">
            {checkoutUrl ? (
              <a className="btn aiStudioSuccessBtn" href={checkoutUrl} target="_blank" rel="noreferrer">
                Continue to Secure Gumroad Checkout — $5
              </a>
            ) : (
              <div className="notice error">The $5 Gumroad checkout link still needs to be added in Vercel as <strong>NEXT_PUBLIC_AI_VIDEO_CHECKOUT_URL</strong>.</div>
            )}

            <a className="btn dark" href="/video-studio">
              Already Purchased / Open Studio
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
            You should be sent back to Cookie&apos;s AI Video Studio so you can start creating your video content plan.
          </div>
        </section>
      </main>
    </>
  );
}
