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
        <section className="dashboard aiVideoCheckoutCard brandAiVideoCheckout">
          <span className="kicker">AI Video Studio</span>
          <h1>AI Video Studio — $5</h1>
          <p>
            Get AI-powered help with video ideas, hooks, scripts, captions, scenes,
            promo concepts, and social media content planning without purchasing a website plan.
          </p>

          <div className="notice success">
            <strong>What you get:</strong>
            <ul style={{ marginTop: 10 }}>
              <li>Video ideas for your brand, business, or product</li>
              <li>Hooks and opening lines</li>
              <li>Short-form video scripts</li>
              <li>Scene-by-scene video planning</li>
              <li>Caption and call-to-action help</li>
            </ul>
          </div>

          {validCheckoutUrl ? (
            <div className="navRow" style={{ marginTop: 18 }}>
              <a className="btn" href={checkoutUrl}>Continue to Checkout</a>
            </div>
          ) : (
            <div className="notice">
              <strong>Checkout is being prepared.</strong><br />
              Please check back shortly or contact Cookie&apos;s Digital Creations for help getting access.
              <div className="navRow" style={{ marginTop: 14 }}>
                <Link className="btn" href="/contact">Contact Us</Link>
              </div>
            </div>
          )}

          <div className="notice">
            <strong>After purchase:</strong><br />
            You will be sent back to Cookie&apos;s AI Video Studio so you can start creating your video content plan.
          </div>

          <div className="navRow">
            <Link className="btn dark" href="/pricing">View Website Plans</Link>
            <Link className="btn light" href="/builder">Build a Website Instead</Link>
          </div>
        </section>
      </main>
    </>
  );
}
