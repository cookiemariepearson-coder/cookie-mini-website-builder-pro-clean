'use client';

import Nav from '../../../lib/Nav';

const checkoutUrl = process.env.NEXT_PUBLIC_AI_VIDEO_CHECKOUT_URL || '';

export default function AiVideoCheckoutPage() {
  const hasCheckout = Boolean(String(checkoutUrl || '').trim());

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

          <div className="notice success">
            <strong>Start here:</strong><br />
            {hasCheckout ? (
              <>
                Click the checkout button below to purchase AI Video Studio for $5. After checkout,
                you will be sent back to open the studio.
              </>
            ) : (
              <>
                The checkout link is not connected yet, but the studio route is available for owner
                testing and soft-launch review.
              </>
            )}
          </div>

          <div className="navRow checkoutSuccessActions">
            {hasCheckout ? (
              <a className="btn aiStudioSuccessBtn" href={checkoutUrl}>
                Start AI Video Studio — $5
              </a>
            ) : (
              <a className="btn aiStudioSuccessBtn" href="/video-studio?mode=standalone">
                Open AI Video Studio
              </a>
            )}

            <a className="btn dark" href="/video-studio?mode=standalone">
              Already Purchased / Open Studio
            </a>

            <a className="btn light" href="/pricing">
              View Website Plans
            </a>

            <a className="btn light" href="/builder">
              Build a Website Instead
            </a>
          </div>

          {!hasCheckout && (
            <div className="notice">
              <strong>Owner note:</strong><br />
              To turn on the real $5 checkout button later, add this Vercel Environment Variable:
              <br />
              <code>NEXT_PUBLIC_AI_VIDEO_CHECKOUT_URL</code>
              <br />
              Use the Gumroad AI Video Studio checkout link as the value, then redeploy.
            </div>
          )}

          <div className="notice">
            <strong>After purchase:</strong><br />
            You should be sent back to Cookie&apos;s AI Video Studio so you can start creating your
            video content plan.
          </div>
        </section>
      </main>
    </>
  );
}
