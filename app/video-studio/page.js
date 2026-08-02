'use client';

import { useEffect, useMemo, useState } from 'react';
import Nav from '../../lib/Nav';

function clean(value = '') {
  return String(value || '').trim();
}

function readAccessKind(token = '') {
  try {
    const data = String(token).split('.')[0];
    if (!data) return '';
    const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(window.atob(padded))?.kind || '';
  } catch {
    return '';
  }
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
  const [customerEmail, setCustomerEmail] = useState('');
  const [websiteSlug, setWebsiteSlug] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [smartKit, setSmartKit] = useState(null);
  const [working, setWorking] = useState('');
  const [status, setStatus] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [accessKind, setAccessKind] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [accessMessage, setAccessMessage] = useState('Unlock with your active Business/Premium website or your $5 Gumroad license key.');

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('cookieVideoAccessToken') || '';
      setAccessToken(savedToken);
      setAccessKind(readAccessKind(savedToken));
    } catch {}
  }, []);

  async function activateAccess(mode) {
    setAccessMessage('Verifying access...');
    const response = await fetch('/api/video-access/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mode === 'license' ? { licenseKey } : { email: customerEmail, slug: websiteSlug })
    });
    const data = await response.json();
    if (!data.ok) { setAccessMessage(data.error || 'Access could not be verified.'); return; }
    setAccessToken(data.token);
    setAccessKind(readAccessKind(data.token));
    if (data.email) setCustomerEmail(data.email);
    try { localStorage.setItem('cookieVideoAccessToken', data.token); } catch {}
    setAccessMessage(`Access verified: ${data.access}.`);
  }

  const starterKit = useMemo(
    () => makeKit({ biz, promo, audience, videoType, platform, style, length, voice }),
    [biz, promo, audience, videoType, platform, style, length, voice]
  );
  const kit = smartKit || starterKit;

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

  async function generateSmartKit() {
    if (!accessToken) {
      setStatus('Unlock AI Video Studio before creating the AI-powered Smart Video Kit.');
      return;
    }
    if (!clean(biz) || !clean(promo)) {
      setStatus('Enter the business name and what you are promoting first.');
      return;
    }
    setWorking('kit');
    setStatus('Cookie AI is writing a complete custom video kit...');
    try {
      const response = await fetch('/api/video-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: biz, promo, audience, videoType, platform, style, length, voice, accessToken })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'The smart kit could not be generated.');
      setSmartKit(data.kit);
      setTab('Script');
      setStatus('Your custom AI video planning kit is ready. Review each tab, then copy or download the complete kit.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setWorking('');
    }
  }

  async function generateVideo() {
    if (!clean(biz) || !clean(promo)) {
      setStatus('Enter the business name and what you are promoting first.');
      return;
    }
    if (accessKind === 'standalone' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(customerEmail))) {
      setStatus('Enter the email where you want to find your finished video results.');
      return;
    }
    setWorking('video');
    setStatus('Sending your finished video plan to the AI video generator...');
    try {
      const response = await fetch('/api/heygen/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: biz, promo, audience, videoType, platform, style, length, voice,
          customerEmail, websiteSlug, accessCode,
          accessToken,
          script: kit.Script,
          captions: kit.Captions,
          videoPrompt: kit['Video Prompt']
        })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        if (data.providerCreditRequired) {
          setStatus(data.error);
          return;
        }
        throw new Error(data.error || 'The video could not be started.');
      }
      setStatus(`Video generation started successfully.${data.videoUsage?.remaining !== undefined ? ` Credits remaining: ${data.videoUsage.remaining}.` : ''} Opening your on-site Video Results...`);
      const results = new URLSearchParams();
      if (customerEmail) results.set('email', customerEmail);
      if (!customerEmail && websiteSlug) results.set('slug', websiteSlug);
      setTimeout(() => window.location.assign(`/video-studio/results?${results.toString()}`), 1200);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setWorking('');
    }
  }

  return (
    <>
      <Nav />
      <main className="wrap aiKit videoStudioRefresh">
        <section className="dashboard videoStudioHero">
          <span className="kicker">AI Video Studio</span>
          <h1>Create your business video, step by step.</h1>
          <p>
            Start with a smart script and video plan. Review it, make any changes you want,
            then create a real video if your plan includes video credits.
          </p>
          <div className="notice videoAccessPanel">
            <strong>{accessToken ? '✓ AI Video Studio unlocked' : 'Unlock AI Video Studio'}</strong>
            <p>{accessMessage}</p>
            {accessKind === 'standalone' && <p><strong>$5 standalone access:</strong> Your purchase includes the complete planning kit and one real video generated through this website.</p>}
            {!accessToken && <>
              <div className="row">
                <div className="field"><label>Business/Premium customer email</label><input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Email used for the website plan" /></div>
                <div className="field"><label>Website name or subdomain</label><input value={websiteSlug} onChange={e => setWebsiteSlug(e.target.value)} placeholder="Example: my-business" /></div>
              </div>
              <button className="btn" type="button" onClick={() => activateAccess('plan')}>Verify Website Plan</button>
              <div className="field"><label>$5 Gumroad license key</label><input value={licenseKey} onChange={e => setLicenseKey(e.target.value)} placeholder="Paste the license key from your Gumroad receipt" /></div>
              <button className="btn dark" type="button" onClick={() => activateAccess('license')}>Verify Gumroad Purchase</button>
            </>}
          </div>
          <div className="studioSteps" aria-label="AI Video Studio steps">
            <div><span className="studioStepNumber">1</span><strong>Describe it</strong><span>Tell us about the business and promotion.</span></div>
            <div><span className="studioStepNumber">2</span><strong>Review your kit</strong><span>Check the script, captions, shots, and voiceover.</span></div>
            <div><span className="studioStepNumber">3</span><strong>Make the video</strong><span>Business and Premium customers can use available credits.</span></div>
          </div>
        </section>

        <section className="dashboard studioWorkCard">
          <div className="studioSectionHeading"><span className="studioStepNumber">1</span><div><h2>Describe your video</h2><p>Complete the details below. You can create and download the planning kit without signing in.</p></div></div>
          <div className="studioFormGrid">
            <div className="field">
              <label>Business name</label>
              <input value={biz} onChange={e => setBiz(e.target.value)} placeholder="Example: Cookie's Kitchen" />
            </div>
            <div className="field">
              <label>What are you promoting?</label>
              <input value={promo} onChange={e => setPromo(e.target.value)} placeholder="Example: mini websites, seafood trays, hair services" />
            </div>
            <div className="field">
              <label>Target customer</label>
              <input value={audience} onChange={e => setAudience(e.target.value)} placeholder="Example: small business owners" />
            </div>
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
            <div className="field">
              <label>Voice style</label>
              <select value={voice} onChange={e => setVoice(e.target.value)}>
                {['Warm female voice','Sassy female voice','Professional narrator','Friendly upbeat voice','Luxury commercial voice'].map(item => <option key={item}>{item}</option>)}
              </select>
            </div>
          </div>
          <div className="navRow">
            <button className="btn" type="button" onClick={generateSmartKit} disabled={Boolean(working)}>
              {working === 'kit' ? 'Creating Smart Kit...' : 'Create Smart Video Kit'}
            </button>
          </div>
        </section>

        <section className="dashboard studioWorkCard">
          <div className="studioSectionHeading"><span className="studioStepNumber">2</span><div><h2>Review your video kit</h2><p>Open each tab to review the wording before making your video.</p></div></div>
          <h3>{clean(biz) || 'Your Business'} Promo Kit</h3>

          <div className="pillTabs">
            {tabNames.map(name => (
              <button className={tab === name ? 'active' : ''} onClick={() => setTab(name)} key={name}>
                {name}
              </button>
            ))}
          </div>

          <pre className="studioOutput">
            {kit[tab]}
          </pre>

          {copied && <div className="notice success">{copied}</div>}
          {status && <div className="notice success studioStatus">{status}</div>}

          <div className="navRow">
            <button className="btn" onClick={() => copyText(kit[tab], tab)}>Copy {tab}</button>
            <button className="btn dark" onClick={() => copyText(kitText, 'Full kit')}>Copy Full Kit</button>
            <button className="btn light" onClick={downloadKit}>Download Kit</button>
            <a className="btn light" href="/builder">Build a Website</a>
          </div>

          {accessKind === 'standalone' ? (
            <div className="realVideoBoxFriendly standaloneVideoNotice">
              <div className="studioSectionHeading"><span className="studioStepNumber">3</span><div><h2>Generate your real video</h2><p>Your $5 standalone license includes one real video.</p></div></div>
              <p>Review the planning kit above, then click Generate My Video. Your video will be created in the background and saved to the on-site Video Results page—no HeyGen visit is required.</p>
              <div className="field">
                <label>Email for your saved video results</label>
                <input type="email" name="standalone-video-email" autoComplete="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Email used for your Gumroad purchase" />
              </div>
              <button className="btn videoGenerateBtn" type="button" onClick={generateVideo} disabled={Boolean(working)}>
                {working === 'video' ? 'Starting Video...' : 'Generate My Video'}
              </button>
            </div>
          ) : <div className="realVideoBoxFriendly">
            <div className="studioSectionHeading"><span className="studioStepNumber">3</span><div><h2>Generate the real video</h2><p>This step uses a video credit. The planning kit above does not.</p></div></div>
            <div className="videoAccessExplainer">
              <div><strong>Business or Premium customer?</strong><span>Enter the email or website name connected to your active website plan.</span></div>
              <div><strong>No included video credits?</strong><span>You can still copy or download the complete kit and use it in your preferred video editor.</span></div>
            </div>
            <div className="row">
              <div className="field">
                <label>Email used for your website plan</label>
                <input type="email" name="video-plan-email" autoComplete="off" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Email used for the website plan" />
              </div>
              <div className="field">
                <label>Website name, if you know it</label>
                <input name="video-website-name" autoComplete="off" value={websiteSlug} onChange={e => setWebsiteSlug(e.target.value)} placeholder="Example: my-business" />
              </div>
            </div>
            <details className="ownerAccessDetails">
              <summary>Owner or special-purchase access only</summary>
              <p>Most website-plan customers can leave this closed. Enter a code only if Cookie Digital Creations gave you one.</p>
              <div className="field"><label>Special access code</label><input type="password" value={accessCode} onChange={e => setAccessCode(e.target.value)} autoComplete="off" /></div>
            </details>
            <button className="btn videoGenerateBtn" type="button" onClick={generateVideo} disabled={Boolean(working)}>
              {working === 'video' ? 'Starting Video...' : 'Generate My Video'}
            </button>
          </div>}
        </section>
      </main>
    </>
  );
}
