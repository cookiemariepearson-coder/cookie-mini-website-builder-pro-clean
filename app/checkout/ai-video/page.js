'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Nav from '../../../lib/Nav';

function cleanUrl(value) {
  return String(value || '').trim();
}

function isValidCheckoutUrl(value) {
  const url = cleanUrl(value);
  return url.startsWith('https://') || url.startsWith('http://');
}

export default function AiVideoCheckout(){
  const [checkoutUrl, setCheckoutUrl] = useState('');

  useEffect(() => {
    setCheckoutUrl(cleanUrl(process.env.NEXT_PUBLIC_AI_VIDEO_CHECKOUT_URL || ''));
  }, []);

  const validCheckoutUrl = useMemo(() => isValidCheckoutUrl(checkoutUrl), [checkoutUrl]);

  return (
    <>
      <Nav />
      <main className="wrap">
        <section className="dashboard aiVideoCheckoutCard">
          <span className="kicker">AI Video Studio</span>
          <h1>AI Video Studio — $5</h1>
          <p>
            Use this standalone option when you want AI help with video ideas, scripts, hooks, captions,
            scene planning, and promotional content without purchasing a website plan.
          </p>

          {validCheckoutUrl ? (
            <div className="notice success">
              <strong>Ready for checkout.</strong><br />
              Click the button below to continue to secure checkout for Cookie&apos;s AI Video Studio.
              <div className="navRow" style={{ marginTop: 14 }}>
                <a className="btn" href={checkoutUrl}>Continue to AI Video Checkout</a>
              </div>
            </div>
          ) : (
            <div className="notice">
              <strong>Checkout link needs to be connected.</strong><br />
              Add your Gumroad AI Video Studio product link to Vercel as:
              <br /><code>NEXT_PUBLIC_AI_VIDEO_CHECKOUT_URL</code>
              <br />Then redeploy.
            </div>
          )}

          <div className="notice">
            <strong>What happens after purchase?</strong><br />
            After checkout, customers return to the AI Video Studio access page and can start creating their video content workflow.
          </div>

          <div className="navRow">
            <Link className="btn dark" href="/pricing">View Website Plans</Link>
            <Link className="btn light" href="/builder">Build a Website Instead</Link>
            <Link className="btn light" href="/contact">Contact Us</Link>
          </div>
        </section>
      </main>
    </>
  );
}
