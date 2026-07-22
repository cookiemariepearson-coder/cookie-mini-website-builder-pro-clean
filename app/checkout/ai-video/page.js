'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Nav from '../../../lib/Nav';

export default function AiVideoCheckout(){
  const [checkoutUrl, setCheckoutUrl] = useState('');

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_AI_VIDEO_CHECKOUT_URL || '';
    setCheckoutUrl(url);
    if (url) {
      const timer = setTimeout(() => { window.location.href = url; }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <Nav />
      <main className="wrap">
        <section className="dashboard aiVideoCheckoutCard">
          <span className="kicker">AI Video Studio</span>
          <h1>AI Video Studio — $5</h1>
          <p>Use this option when you want to create a promotional video workflow without purchasing a website plan.</p>

          {checkoutUrl ? (
            <div className="notice success">
              Sending you to secure checkout now. If it does not open, click below.
              <br /><a className="btn" href={checkoutUrl}>Continue to AI Video Checkout</a>
            </div>
          ) : (
            <div className="notice">
              <strong>Checkout link needed:</strong> Add your Gumroad AI Video Studio product link to Vercel as:
              <br /><code>NEXT_PUBLIC_AI_VIDEO_CHECKOUT_URL</code>
              <br />Then redeploy.
            </div>
          )}

          <div className="navRow">
            <Link className="btn dark" href="/pricing">View Website Plans</Link>
            <Link className="btn light" href="/builder">Build a Website Instead</Link>
          </div>
        </section>
      </main>
    </>
  );
}
