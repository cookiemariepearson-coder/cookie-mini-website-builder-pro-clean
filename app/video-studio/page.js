'use client';

import { useMemo, useState } from 'react';
import Nav from '../../lib/Nav';

function clean(value = '') {
  return String(value || '').trim();
}

function makeKit({ biz, promo, audience, videoType, platform, style, length, voice }) {
  const business = clean(biz) || 'Your Business';
  const offer = clean(promo) || 'your offer';
  const target = clean(audience) || 'your customers';

  return {
    Script: `HOOK:
Stop scrolling — ${business} has something made for you.

SCENE 1:
Show the business, product, service, or website with a bold opening shot.

VOICEOVER:
Looking for ${offer}? ${business} is here to help.

SCENE 2:
Show the main benefit for ${target}. Keep it clear, quick, and easy to understand.

VOICEOVER:
Whether you need help today or you are planning ahead, this makes it simple to get started.

SCENE 3:
Show proof, services, products, menu items, booking options, or the website.

VOICEOVER:
Choose what you need, tap the button, and connect with ${business}.

CTA:
Visit the website, book now, order now, buy now, or request a quote today.`,

    Captions: `${business} is ready to help with ${offer}.

Clear. Simple. Easy to start.

Tap the website button to book, order, buy, or request a quote today.`,

    'Shot List': `1. Opening logo or website shot
2. Product, service, menu, or offer close-up
3. Customer benefit text on screen
4. Website preview or action button close-up
5. Final call-to-action screen`,

    'Video Prompt': `Create a ${length} ${videoType} for ${business}.
Main promotion: ${offer}.
Target audience: ${target}.
Platform: ${platform}.
Visual style: ${style}.
Voice style: ${voice}.
Use clean branding, clear captions, smooth transitions, and a strong call to action.
Do not use copyrighted logos, celebrities, or protected brand assets.`,

    Voiceover: `Looking for ${offer}? ${business} makes it easy to get started. Visit the website, choose the option that fits you, and tap Book Now, Order Now, Buy Now, or Request a Quote today.`,

    'Next Steps': `1. Copy the script.
2. Paste it into HeyGen, CapCut, Canva, TikTok, Instagram, Facebook, or YouTube Shorts.
3. Add your real business photos, website screenshots, product images, or service clips.
4. Add captions.
5. End with your website or customer action button.`
  };
}

export default function VideoStudioPage() {
  const [biz, setBiz] = useState('');
  const [promo, setPromo] = useState('');
  const [audience, setAudience] = useState('local customers');
  const [videoType, setVideoType] = useState('Business Promo');
  const [platform, setPlatform] = useState('TikTok / Reels');
  const [style, setStyle] = useState('Professional');
  const [length, setLength] = useState('15 seconds');
  const [voice, setVoice] = useState('Warm female voice');
  const [tab, setTab] = useState('Script');
  const [copied, setCopied] = useState('');

  const kit = useMemo(
    () => makeKit({ biz, promo, audience, videoType, platform, style, length, voice }),
    [biz, promo, audience, videoType, platform, style, length, voice]
  );

  const tabNames = Object.keys(kit);
  const kitText = tabNames.map(name => `${name}\n${kit[name]}`).join('\n\n---\n\n');

  function copyText(value, label) {
    navigator.clipboard.writeText(value);
    setCopied(`${label} copied.`);
    setTimeout(() => setCopied(''), 1800);
  }

  function downloadKit() {
    const blob = new Blob([kitText], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${clean(biz) || 'ai-video'}-studio-kit.txt`;
    a.click();
  }

  return (
    <>
      <Nav />
      <main className="wrap aiKit">
        <section className="dashboard">
          <span className="kicker">AI Video Studio</span>
          <h1>Cookie&apos;s AI Video Studio</h1>
          <p>
            Create video ideas, hooks, captions, scripts, shot lists, voiceover wording,
            and video prompts for your business or product.
          </p>

          <div className="notice success">
            <strong>Studio is open.</strong><br />
            Use this page to create your content plan. Business/Premium website plans may also
            use real HeyGen generation from the full website workflow when credits are available.
          </div>

          <div className="row">
            <div className="field">
              <label>Business name</label>
              <input value={biz} onChange={e => setBiz(e.target.value)} placeholder="Example: Cookie's Kitchen" />
            </div>
            <div className="field">
              <label>What are you promoting?</label>
              <input value={promo} onChange={e => setPromo(e.target.value)} placeholder="Example: mini websites, seafood trays, hair services" />
            </div>
          </div>

          <div className="field">
            <label>Target customer</label>
            <input value={audience} onChange={e => setAudience(e.target.value)} placeholder="Example: small business owners" />
          </div>

          <div className="row">
            <div className="field">
              <label>Video type</label>
              <select value={videoType} onChange={e => setVideoType(e.target.value)}>
                {['Business Promo','Product Ad','Restaurant Promo','Beauty Promo','Real Estate Intro','Grand Opening Promo','Sale Announcement','Website Hero Video'].map(item => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Platform</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)}>
                {['TikTok / Reels','YouTube Short','Facebook Ad','Instagram Story','Website Hero Video'].map(item => <option key={item}>{item}</option>)}
              </select>
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Style</label>
              <select value={style} onChange={e => setStyle(e.target.value)}>
                {['Professional','Funny','Luxury','3D Modern','Cartoon Fun','Cinematic','Warm & Friendly','Bold Sales Ad'].map(item => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Length</label>
              <select value={length} onChange={e => setLength(e.target.value)}>
                {['15 seconds','30 seconds','45 seconds','60 seconds'].map(item => <option key={item}>{item}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Voice style</label>
            <select value={voice} onChange={e => setVoice(e.target.value)}>
              {['Warm female voice','Sassy female voice','Professional narrator','Friendly upbeat voice','Luxury commercial voice'].map(item => <option key={item}>{item}</option>)}
            </select>
          </div>
        </section>

        <section className="dashboard">
          <span className="kicker">Generated Video Kit</span>
          <h1>{clean(biz) || 'Your Business'} Promo Kit</h1>

          <div className="pillTabs">
            {tabNames.map(name => (
              <button className={tab === name ? 'active' : ''} onClick={() => setTab(name)} key={name}>
                {name}
              </button>
            ))}
          </div>

          <pre style={{ whiteSpace: 'pre-wrap', background: '#160c22', color: 'white', padding: 20, borderRadius: 18 }}>
            {kit[tab]}
          </pre>

          {copied && <div className="notice success">{copied}</div>}

          <div className="navRow">
            <button className="btn" onClick={() => copyText(kit[tab], tab)}>Copy {tab}</button>
            <button className="btn dark" onClick={() => copyText(kitText, 'Full kit')}>Copy Full Kit</button>
            <button className="btn light" onClick={downloadKit}>Download Kit</button>
            <a className="btn light" href="/builder">Build a Website</a>
          </div>
        </section>
      </main>
    </>
  );
}
