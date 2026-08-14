'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAccountModal } from '../../components/AccountModalProvider';
import Nav from '../../lib/Nav';
import { VIDEO_ENTITLEMENT_STATE, generationIsAuthorized } from '../../lib/videoEntitlement.mjs';
import { VIDEO_JOB_STATE, VIDEO_START_STATE, resolveVideoStartState } from '../../lib/videoJourney.mjs';

const VIDEO_ACCESS_TOKEN_KEY = 'cookieVideoAccessToken';
const VIDEO_PLAN_KEY = 'cookiePendingVideoPlan';
const RESUME_AFTER_SIGN_IN_KEY = 'cookieVideoResumeAfterSignIn';
const WIZARD_ACTIVE_KEY = 'cookieVideoWizardActive';

const PROGRESS_STEPS = ['Get Started', 'Plan', 'Review', 'Create', 'Results'];
const DEFAULT_ENTITLEMENT = {
  serverVerified: false,
  state: VIDEO_ENTITLEMENT_STATE.PLANNING,
  generationAllowed: false,
  remaining: 0,
  limit: 0,
  used: 0,
  kind: '',
  plan: ''
};

function clean(value = '') {
  return String(value || '').trim();
}

function makeKit({ biz, promo, audience, videoType, platform, style, length, voice, details }) {
  const business = clean(biz) || 'Your Business';
  const offer = clean(promo) || 'your offer';
  const target = clean(audience) || 'your customers';
  const notes = clean(details) ? ` Include these accurate details: ${clean(details)}.` : '';
  return {
    Script: `HOOK:\nStop scrolling — ${business} has something made for you.\n\nSCENE 1:\nShow the business, product, service, or website with a bold opening shot.\n\nVOICEOVER:\nLooking for ${offer}? ${business} is here to help.\n\nSCENE 2:\nShow the main benefit for ${target}. Keep it clear, quick, and easy to understand.${notes}\n\nVOICEOVER:\nWhether you need help today or you are planning ahead, this makes it simple to get started.\n\nSCENE 3:\nShow proof, services, products, menu items, booking options, or the website.\n\nVOICEOVER:\nChoose what you need, tap the button, and connect with ${business}.\n\nCTA:\nVisit the website, book now, order now, buy now, or request a quote today.`,
    Captions: `${business} is ready to help with ${offer}.\n\nClear. Simple. Easy to start.\n\nTap the website button to book, order, buy, or request a quote today.`,
    'Shot List': '1. Opening logo or website shot\n2. Product, service, menu, or offer close-up\n3. Customer benefit text on screen\n4. Website preview or action button close-up\n5. Final call-to-action screen',
    'Video Prompt': `Create a ${length} ${videoType} for ${business}. Main promotion: ${offer}. Target audience: ${target}. Platform: ${platform}. Visual style: ${style}. Voice style: ${voice}.${notes} Use clean branding, clear captions, smooth transitions, and a strong call to action. Do not use copyrighted logos, celebrities, or protected brand assets.`,
    Voiceover: `Looking for ${offer}? ${business} makes it easy to get started. Visit the website, choose the option that fits you, and tap Book Now, Order Now, Buy Now, or Request a Quote today.`,
    'Next Steps': '1. Review the script.\n2. Add your real business photos, website screenshots, product images, or service clips.\n3. Check every claim and detail.\n4. Add captions.\n5. End with your website or customer action button.'
  };
}

function serverEntitlement(data = {}) {
  return {
    serverVerified: data.verified === true,
    state: data.state || VIDEO_ENTITLEMENT_STATE.INVALID,
    generationAllowed: data.generationAllowed === true,
    remaining: Math.max(0, Number(data.remaining || 0)),
    limit: Math.max(0, Number(data.limit || 0)),
    used: Math.max(0, Number(data.used || 0)),
    plan: data.plan || '',
    kind: data.kind || ''
  };
}

export default function VideoStudioPage() {
  const { accountState, openAccountModal } = useAccountModal();
  const [biz, setBiz] = useState('');
  const [promo, setPromo] = useState('');
  const [audience, setAudience] = useState('local customers');
  const [videoType, setVideoType] = useState('Business Promo');
  const [platform, setPlatform] = useState('TikTok / Reels');
  const [style, setStyle] = useState('Professional');
  const [length, setLength] = useState('15 seconds');
  const [voice, setVoice] = useState('Warm female voice');
  const [details, setDetails] = useState('');
  const [wizardStep, setWizardStep] = useState(1);
  const [tab, setTab] = useState('Script');
  const [smartKit, setSmartKit] = useState(null);
  const [copied, setCopied] = useState('');
  const [status, setStatus] = useState('');
  const [working, setWorking] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [websiteSlug, setWebsiteSlug] = useState('');
  const [eligibleWebsites, setEligibleWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState('');
  const [entitlement, setEntitlement] = useState(DEFAULT_ENTITLEMENT);
  const [accessToken, setAccessToken] = useState('');
  const [jobState, setJobState] = useState(VIDEO_JOB_STATE.NONE);
  const [screen, setScreen] = useState('');
  const [checking, setChecking] = useState(true);
  const [storageReady, setStorageReady] = useState(false);
  const [initialToken, setInitialToken] = useState('');
  const [purchaseReturn, setPurchaseReturn] = useState(false);
  const [resumeWizard, setResumeWizard] = useState(false);
  const initializedRef = useRef(false);
  const licenseInputRef = useRef(null);
  const stepHeadingRef = useRef(null);
  const kitRequestedRef = useRef(false);
  const generationRequestRef = useRef('');
  const submissionInFlightRef = useRef(false);

  const canGenerate = Boolean(accessToken) && generationIsAuthorized(entitlement);
  const hasSavedPlan = Boolean(clean(biz) || clean(promo) || clean(details));
  const startState = resolveVideoStartState({
    checking,
    signedIn: accountState === 'signed-in',
    verified: entitlement.serverVerified,
    remaining: entitlement.remaining,
    jobState,
    screen
  });
  const progressIndex = startState === VIDEO_START_STATE.WIZARD
    ? wizardStep <= 5 ? 1 : wizardStep === 6 ? 2 : 3
    : [VIDEO_START_STATE.PROCESSING, VIDEO_START_STATE.COMPLETED, VIDEO_START_STATE.USED_CREDIT].includes(startState) ? 4 : 0;

  const starterKit = useMemo(
    () => makeKit({ biz, promo, audience, videoType, platform, style, length, voice, details }),
    [biz, promo, audience, videoType, platform, style, length, voice, details]
  );
  const kit = smartKit || starterKit;
  const tabNames = Object.keys(kit);
  const kitText = tabNames.map(name => `${name}\n${kit[name]}`).join('\n\n---\n\n');

  useEffect(() => {
    try {
      setInitialToken(localStorage.getItem(VIDEO_ACCESS_TOKEN_KEY) || '');
      setResumeWizard(localStorage.getItem(WIZARD_ACTIVE_KEY) === '1');
      let savedPlan = null;
      try { savedPlan = JSON.parse(localStorage.getItem(VIDEO_PLAN_KEY) || 'null'); } catch {}
      if (savedPlan && typeof savedPlan === 'object') {
        setBiz(clean(savedPlan.biz));
        setPromo(clean(savedPlan.promo));
        setAudience(clean(savedPlan.audience) || 'local customers');
        setVideoType(clean(savedPlan.videoType) || 'Business Promo');
        setPlatform(clean(savedPlan.platform) || 'TikTok / Reels');
        setStyle(clean(savedPlan.style) || 'Professional');
        setLength(clean(savedPlan.length) || '15 seconds');
        setVoice(clean(savedPlan.voice) || 'Warm female voice');
        setDetails(clean(savedPlan.details));
        setWizardStep(Math.min(7, Math.max(1, Number(savedPlan.wizardStep || 1))));
      }
      const params = new URLSearchParams(window.location.search);
      setPurchaseReturn(params.get('claim') === '1' || params.get('activate') === '1');
    } catch {}
    finally { setStorageReady(true); }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try {
      localStorage.setItem(VIDEO_PLAN_KEY, JSON.stringify({
        biz, promo, audience, videoType, platform, style, length, voice, details, wizardStep, savedAt: Date.now()
      }));
    } catch {}
  }, [storageReady, biz, promo, audience, videoType, platform, style, length, voice, details, wizardStep]);

  useEffect(() => {
    if (startState !== VIDEO_START_STATE.WIZARD) return;
    window.requestAnimationFrame(() => stepHeadingRef.current?.focus());
  }, [startState, wizardStep]);

  useEffect(() => {
    if (startState !== VIDEO_START_STATE.LICENSE) return;
    window.requestAnimationFrame(() => licenseInputRef.current?.focus());
  }, [startState]);

  async function checkStoredAccess(token, { autoContinue = false } = {}) {
    if (!token) return false;
    setChecking(true);
    try {
      const response = await fetch('/api/video-access/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        localStorage.removeItem(VIDEO_ACCESS_TOKEN_KEY);
        setAccessToken('');
        setEntitlement(DEFAULT_ENTITLEMENT);
        setJobState(VIDEO_JOB_STATE.NONE);
        setStatus(data.error || 'Unlock access to continue.');
        return false;
      }
      const nextEntitlement = serverEntitlement(data);
      setEntitlement(nextEntitlement);
      setAccessToken(token);
      setJobState(data.jobState || VIDEO_JOB_STATE.NONE);
      setStatus('');

      if (data.jobState === VIDEO_JOB_STATE.PROCESSING || (data.jobState === VIDEO_JOB_STATE.COMPLETED && nextEntitlement.remaining > 0)) {
        localStorage.removeItem(WIZARD_ACTIVE_KEY);
        window.location.replace('/video-studio/results');
        return true;
      }
      if (autoContinue && generationIsAuthorized(nextEntitlement)) setScreen(VIDEO_START_STATE.WIZARD);
      else setScreen('');
      return true;
    } catch {
      setStatus('Video access could not be checked right now. Your saved plan is still available.');
      return false;
    } finally {
      setChecking(false);
    }
  }

  async function activateAccount(slug = '', autoContinue = false, preferWebsite = false) {
    setChecking(true);
    setStatus('Checking your video account…');
    try {
      const response = await fetch('/api/video-access/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: preferWebsite ? 'website' : 'account', slug })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'Website access could not be checked.');
      if (data.selectionRequired) {
        setEligibleWebsites(data.websites || []);
        setSelectedWebsite(data.websites?.[0]?.slug || '');
        setScreen(VIDEO_START_STATE.WEBSITE_SELECTION);
        setStatus('');
        return true;
      }
      if (data.purchaseRequired) {
        localStorage.removeItem(VIDEO_ACCESS_TOKEN_KEY);
        setAccessToken('');
        setEntitlement(DEFAULT_ENTITLEMENT);
        setScreen(VIDEO_START_STATE.NO_CREDIT);
        setStatus('');
        return true;
      }
      localStorage.setItem(VIDEO_ACCESS_TOKEN_KEY, data.token);
      setWebsiteSlug(data.website?.slug || '');
      return await checkStoredAccess(data.token, { autoContinue });
    } catch (error) {
      setEntitlement(DEFAULT_ENTITLEMENT);
      setScreen(VIDEO_START_STATE.NO_CREDIT);
      setStatus(error.message || 'Website access could not be checked.');
      return false;
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    if (!storageReady || accountState === 'checking' || initializedRef.current) return;
    initializedRef.current = true;
    void (async () => {
      if (accountState !== 'signed-in') {
        setScreen('');
        setChecking(false);
        return;
      }
      if (purchaseReturn) {
        setScreen(VIDEO_START_STATE.LICENSE);
        setStatus('Purchase complete. Enter the license key from your Gumroad receipt.');
        setChecking(false);
        return;
      }
      if (initialToken && await checkStoredAccess(initialToken, { autoContinue: resumeWizard })) return;
      let autoContinue = false;
      try {
        autoContinue = sessionStorage.getItem(RESUME_AFTER_SIGN_IN_KEY) === '1';
        sessionStorage.removeItem(RESUME_AFTER_SIGN_IN_KEY);
      } catch {}
      await activateAccount('', autoContinue);
    })();
  }, [accountState, initialToken, purchaseReturn, resumeWizard, storageReady]);

  async function activateLicense() {
    if (!clean(licenseKey)) {
      setStatus('Enter the license key from your Gumroad receipt.');
      return;
    }
    setWorking('license');
    setStatus('Checking your purchase…');
    try {
      const response = await fetch('/api/video-access/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'That purchase could not be verified.');
      localStorage.setItem(VIDEO_ACCESS_TOKEN_KEY, data.token);
      setLicenseKey('');
      window.history.replaceState({}, '', '/video-studio');
      await checkStoredAccess(data.token, { autoContinue: true });
    } catch (error) {
      setStatus(error.message || 'That purchase could not be verified.');
    } finally {
      setWorking('');
    }
  }

  function accountDestination() {
    return purchaseReturn ? '/video-studio?claim=1' : '/video-studio?intent=purchase';
  }

  function signInForVideo(mode = 'signin') {
    try { sessionStorage.setItem(RESUME_AFTER_SIGN_IN_KEY, '1'); } catch {}
    openAccountModal({ mode, destination: accountDestination() });
  }

  function startWizard() {
    try { localStorage.setItem(WIZARD_ACTIVE_KEY, '1'); } catch {}
    setStatus('');
    setScreen(VIDEO_START_STATE.WIZARD);
    setWizardStep(hasSavedPlan ? Math.min(7, Math.max(1, wizardStep)) : 1);
  }

  function stepError() {
    if (wizardStep === 1 && (!clean(biz) || !clean(promo))) return 'Enter the business or product name and what you want to promote.';
    if (wizardStep === 3 && !clean(audience)) return 'Tell us who should see this video.';
    return '';
  }

  function nextStep() {
    const error = stepError();
    if (error) {
      setStatus(error);
      return;
    }
    setStatus('');
    setWizardStep(current => Math.min(7, current + 1));
  }

  function previousStep() {
    setStatus('');
    if (wizardStep === 1) {
      try { localStorage.removeItem(WIZARD_ACTIVE_KEY); } catch {}
      setScreen('');
    }
    else setWizardStep(current => Math.max(1, current - 1));
  }

  async function generateSmartKit() {
    if (!clean(biz) || !clean(promo)) return;
    setWorking('kit');
    setStatus('Preparing your video plan…');
    try {
      const response = await fetch('/api/video-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: biz, promo, audience, videoType, platform, style, length, voice, details, accessToken })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'Your custom plan could not be prepared.');
      setSmartKit(data.kit);
      setTab('Script');
      setStatus('Your video plan is ready to review.');
    } catch (error) {
      setStatus(`${error.message || 'Your custom plan could not be prepared.'} A saved starter plan is shown below.`);
    } finally {
      setWorking('');
    }
  }

  useEffect(() => {
    if (startState !== VIDEO_START_STATE.WIZARD || wizardStep < 6 || smartKit || kitRequestedRef.current || !clean(biz) || !clean(promo)) return;
    kitRequestedRef.current = true;
    void generateSmartKit();
  }, [startState, wizardStep, smartKit, biz, promo]);

  function copyText(value, label) {
    void navigator.clipboard.writeText(value);
    setCopied(`${label} copied.`);
    window.setTimeout(() => setCopied(''), 1800);
  }

  function downloadKit() {
    const blob = new Blob([kitText], { type: 'text/plain' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `${clean(biz) || 'ai-video'}-studio-kit.txt`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  async function generateVideo() {
    if (submissionInFlightRef.current) return;
    if (!canGenerate) {
      setStatus('A verified video credit is required before creating the video.');
      setScreen('');
      return;
    }
    submissionInFlightRef.current = true;
    setWorking('video');
    if (!generationRequestRef.current) generationRequestRef.current = window.crypto.randomUUID();
    setStatus('Starting your video securely…');
    try {
      const response = await fetch('/api/heygen/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: biz,
          promo,
          audience,
          videoType,
          platform,
          style,
          length,
          voice,
          details,
          websiteSlug,
          accessToken,
          requestId: generationRequestRef.current,
          script: kit.Script,
          captions: kit.Captions,
          videoPrompt: kit['Video Prompt']
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        if (data.generationNotStarted) generationRequestRef.current = '';
        if (response.status === 401 || response.status === 403) {
          setEntitlement(current => ({
            ...current,
            state: Number(data.remaining) === 0 && current.serverVerified ? VIDEO_ENTITLEMENT_STATE.NO_CREDIT : VIDEO_ENTITLEMENT_STATE.INVALID,
            generationAllowed: false,
            remaining: Math.max(0, Number(data.remaining || 0))
          }));
          setScreen('');
        }
        throw new Error(data.error || 'The video could not be started.');
      }
      setStatus('Your video is being created. Opening Video Results…');
      localStorage.removeItem(WIZARD_ACTIVE_KEY);
      window.setTimeout(() => window.location.replace('/video-studio/results'), 700);
    } catch (error) {
      setStatus(error.message || 'The video could not be started. Your saved plan is still here.');
    } finally {
      submissionInFlightRef.current = false;
      setWorking('');
    }
  }

  function startPanel() {
    if (startState === VIDEO_START_STATE.CHECKING) {
      return <div className="videoStateCard" aria-busy="true"><h2>Checking your video access…</h2><p>This will only take a moment.</p></div>;
    }
    if (startState === VIDEO_START_STATE.SIGNED_OUT) {
      return <div className="videoStateCard">
        <h2>Start with your account</h2>
        <p>Create an account or sign in to purchase, create, and access your AI videos.</p>
        <div className="videoPrimaryActions">
          <button className="btn dark" type="button" onClick={() => signInForVideo('create')}>Create My Account</button>
          <button className="btn light" type="button" onClick={() => signInForVideo('signin')}>Sign In</button>
        </div>
      </div>;
    }
    if (startState === VIDEO_START_STATE.LICENSE) {
      return <div className="videoStateCard">
        <h2>Unlock your video</h2>
        {status && <p className={purchaseReturn && !status.toLowerCase().includes('could not') ? 'videoInlineNote' : 'videoInlineError'} role="status" aria-live="polite">{status}</p>}
        <div className="field videoSingleField">
          <label htmlFor="video-license-key">Enter the license key from your Gumroad receipt.</label>
          <input ref={licenseInputRef} id="video-license-key" value={licenseKey} onChange={event => setLicenseKey(event.target.value)} autoComplete="off" />
        </div>
        <div className="videoPrimaryActions">
          <button className="btn dark" type="button" onClick={activateLicense} disabled={working === 'license'}>{working === 'license' ? 'Checking Purchase…' : 'Unlock My Video'}</button>
          <button className="btn light" type="button" onClick={() => { setStatus(''); setScreen(VIDEO_START_STATE.NO_CREDIT); }}>Back</button>
        </div>
      </div>;
    }
    if (startState === VIDEO_START_STATE.WEBSITE_SELECTION) {
      return <div className="videoStateCard">
        <h2>Choose the website for this video</h2>
        <div className="field videoSingleField">
          <label htmlFor="eligible-video-website">Eligible Business or Premium website</label>
          <select id="eligible-video-website" value={selectedWebsite} onChange={event => setSelectedWebsite(event.target.value)}>
            {eligibleWebsites.map(site => <option value={site.slug} key={site.slug}>{site.businessName} — {site.plan} ({site.remaining} credit{site.remaining === 1 ? '' : 's'})</option>)}
          </select>
        </div>
        <button className="btn dark" type="button" onClick={() => activateAccount(selectedWebsite, true)}>Continue</button>
      </div>;
    }
    if (startState === VIDEO_START_STATE.AVAILABLE) {
      return <div className="videoStateCard videoStateSuccess">
        <span className="videoStateLabel">Access ready</span>
        <h2>{entitlement.remaining} video credit{entitlement.remaining === 1 ? '' : 's'} available</h2>
        <p>{hasSavedPlan ? 'Your saved plan is ready to continue.' : 'Answer a few short questions to plan your video.'}</p>
        <button className="btn dark" type="button" onClick={startWizard}>{hasSavedPlan ? 'Continue My Video' : 'Start My Video'}</button>
      </div>;
    }
    if (startState === VIDEO_START_STATE.PROCESSING) {
      return <div className="videoStateCard"><h2>Your video is being created</h2><Link className="btn dark" href="/video-studio/results">Check Video Status</Link></div>;
    }
    if (startState === VIDEO_START_STATE.COMPLETED) {
      return <div className="videoStateCard"><h2>Your video is ready</h2><div className="videoPrimaryActions"><Link className="btn dark" href="/video-studio/results">Watch My Video</Link><Link className="btn light" href="/video-studio/results">Download My Video</Link></div></div>;
    }
    if (startState === VIDEO_START_STATE.USED_CREDIT) {
      return <div className="videoStateCard videoUsedCreditState">
        <h2>You have used your video credit.</h2>
        <div className="videoPrimaryActions">
          <Link className="btn dark" href="/checkout/ai-video">Buy Another Video — $5</Link>
          <Link className="btn light" href="/video-studio/results">View My Video</Link>
        </div>
        {hasSavedPlan && <button className="videoTextButton" type="button" onClick={() => { setScreen(VIDEO_START_STATE.WIZARD); setWizardStep(Math.min(6, Math.max(1, wizardStep))); }}>View My Saved Plan</button>}
      </div>;
    }
    return <div className="videoStateCard">
      <h2>No video credits are available.</h2>
      {status && <p className="videoInlineError" role="alert">{status}</p>}
      <div className="videoPrimaryActions"><Link className="btn dark" href="/checkout/ai-video">Buy One Video — $5</Link>{hasSavedPlan && <button className="btn light" type="button" onClick={startWizard}>View My Saved Plan</button>}</div>
    </div>;
  }

  function wizardPanel() {
    return <section className="dashboard videoWizardCard" aria-labelledby="video-wizard-heading">
      <p className="videoSavedNote" role="status">✓ Your progress is saved.</p>
      {wizardStep === 1 && <div>
        <span className="kicker">Plan · 1 of 5</span>
        <h2 id="video-wizard-heading" ref={stepHeadingRef} tabIndex="-1">What is this video about?</h2>
        <div className="field"><label htmlFor="video-business">Business or product name</label><input id="video-business" value={biz} onChange={event => setBiz(event.target.value)} placeholder="Example: Cookie's Kitchen" /></div>
        <div className="field"><label htmlFor="video-promotion">What do you want to promote?</label><textarea id="video-promotion" value={promo} onChange={event => setPromo(event.target.value)} placeholder="Example: catering orders for weekend events" /></div>
      </div>}
      {wizardStep === 2 && <div>
        <span className="kicker">Plan · 2 of 5</span>
        <h2 id="video-wizard-heading" ref={stepHeadingRef} tabIndex="-1">What should this video do?</h2>
        <div className="field"><label htmlFor="video-goal">Video goal</label><select id="video-goal" value={videoType} onChange={event => setVideoType(event.target.value)}>{['Business Promo','Product Ad','Restaurant Promo','Beauty Promo','Real Estate Intro','Grand Opening Promo','Sale Announcement','Website Hero Video'].map(item => <option key={item}>{item}</option>)}</select></div>
        <div className="field"><label htmlFor="video-platform">Where will you share it?</label><select id="video-platform" value={platform} onChange={event => setPlatform(event.target.value)}>{['TikTok / Reels','YouTube Short','Facebook Ad','Instagram Story','Website Hero Video'].map(item => <option key={item}>{item}</option>)}</select></div>
      </div>}
      {wizardStep === 3 && <div>
        <span className="kicker">Plan · 3 of 5</span>
        <h2 id="video-wizard-heading" ref={stepHeadingRef} tabIndex="-1">Who should see it?</h2>
        <div className="field"><label htmlFor="video-audience">Audience</label><textarea id="video-audience" value={audience} onChange={event => setAudience(event.target.value)} placeholder="Example: local families planning celebrations" /></div>
      </div>}
      {wizardStep === 4 && <div>
        <span className="kicker">Plan · 4 of 5</span>
        <h2 id="video-wizard-heading" ref={stepHeadingRef} tabIndex="-1">Choose the style and tone</h2>
        <div className="studioFormGrid">
          <div className="field"><label htmlFor="video-style">Visual style</label><select id="video-style" value={style} onChange={event => setStyle(event.target.value)}>{['Professional','Funny','Luxury','3D Modern','Cartoon Fun','Cinematic','Warm & Friendly','Bold Sales Ad'].map(item => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label htmlFor="video-voice">Voice</label><select id="video-voice" value={voice} onChange={event => setVoice(event.target.value)}>{['Warm female voice','Sassy female voice','Professional narrator','Friendly upbeat voice','Luxury commercial voice'].map(item => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label htmlFor="video-length">Length</label><select id="video-length" value={length} onChange={event => setLength(event.target.value)}>{['15 seconds','30 seconds','45 seconds','60 seconds'].map(item => <option key={item}>{item}</option>)}</select></div>
        </div>
      </div>}
      {wizardStep === 5 && <div>
        <span className="kicker">Plan · 5 of 5</span>
        <h2 id="video-wizard-heading" ref={stepHeadingRef} tabIndex="-1">Add important details</h2>
        <p>Include only facts you want the video to use. You can leave this blank.</p>
        <div className="field"><label htmlFor="video-details">Prices, dates, location, call to action, or must-use wording</label><textarea id="video-details" value={details} onChange={event => setDetails(event.target.value)} placeholder="Example: Order by Friday. Pickup in Baltimore. Call 555-0100." /></div>
      </div>}
      {wizardStep === 6 && <div>
        <span className="kicker">Review</span>
        <h2 id="video-wizard-heading" ref={stepHeadingRef} tabIndex="-1">Review your video plan</h2>
        <dl className="videoPlanSummary">
          <div><dt>Business or product</dt><dd>{biz}</dd><button type="button" onClick={() => setWizardStep(1)}>Edit</button></div>
          <div><dt>Goal</dt><dd>{videoType} for {platform}</dd><button type="button" onClick={() => setWizardStep(2)}>Edit</button></div>
          <div><dt>Audience</dt><dd>{audience}</dd><button type="button" onClick={() => setWizardStep(3)}>Edit</button></div>
          <div><dt>Style and tone</dt><dd>{style}, {voice}, {length}</dd><button type="button" onClick={() => setWizardStep(4)}>Edit</button></div>
          <div><dt>Important details</dt><dd>{details || 'None added'}</dd><button type="button" onClick={() => setWizardStep(5)}>Edit</button></div>
        </dl>
        <div className="pillTabs" aria-label="Video plan sections">{tabNames.map(name => <button className={tab === name ? 'active' : ''} onClick={() => setTab(name)} type="button" key={name}>{name}</button>)}</div>
        <pre className="studioOutput">{kit[tab]}</pre>
        <div className="videoUtilityActions"><button className="videoTextButton" type="button" onClick={() => copyText(kit[tab], tab)}>Copy {tab}</button><button className="videoTextButton" type="button" onClick={downloadKit}>Download Plan</button></div>
      </div>}
      {wizardStep === 7 && <div>
        <span className="kicker">Create</span>
        <h2 id="video-wizard-heading" ref={stepHeadingRef} tabIndex="-1">Ready to create your video?</h2>
        <div className="videoCreditConfirmation"><strong>This will use one video credit.</strong><p>Your plan is saved. Select the button once, then you can follow progress on Video Results.</p></div>
      </div>}
      {(status || copied) && <p className={status && /could not|required|enter|failed/i.test(status) ? 'videoInlineError' : 'videoInlineNote'} role="status" aria-live="polite">{status || copied}</p>}
      <div className="videoWizardActions">
        <button className="btn light" type="button" onClick={previousStep} disabled={Boolean(working)}>Back</button>
        {wizardStep < 6 && <button className="btn dark" type="button" onClick={nextStep}>Continue</button>}
        {wizardStep === 6 && <button className="btn dark" type="button" onClick={nextStep} disabled={working === 'kit'}>{working === 'kit' ? 'Preparing Plan…' : 'Continue to Create'}</button>}
        {wizardStep === 7 && canGenerate && <button className="btn dark videoGenerateBtn" type="button" onClick={generateVideo} disabled={working === 'video'} aria-disabled={working === 'video'}>{working === 'video' ? 'Starting Video…' : 'Create My Video'}</button>}
        {wizardStep === 7 && !canGenerate && <Link className="btn dark" href="/checkout/ai-video">Buy Another Video — $5</Link>}
      </div>
    </section>;
  }

  return <>
    <Nav />
    <main className="wrap aiKit videoStudioRefresh">
      <section className="dashboard videoStudioHero">
        <span className="kicker">AI Video Studio</span>
        <h1>Create Your AI Video</h1>
        <p>We’ll guide you from a few simple questions to a finished business video.</p>
        <ol className="studioSteps" aria-label="AI Video progress">
          {PROGRESS_STEPS.map((label, index) => <li className={index === progressIndex ? 'active' : index < progressIndex ? 'complete' : ''} aria-current={index === progressIndex ? 'step' : undefined} key={label}><span>{index + 1}</span><strong>{label}</strong></li>)}
        </ol>
      </section>
      {startState === VIDEO_START_STATE.WIZARD ? wizardPanel() : <section className="dashboard studioWorkCard">{startPanel()}<details className="videoHelp"><summary>Need Help?</summary><p>Your saved plan stays on this device.</p>{accountState === 'signed-in' && <div className="videoHelpActions"><button className="videoTextButton" type="button" onClick={() => { setStatus('Enter the license key from your Gumroad receipt.'); setScreen(VIDEO_START_STATE.LICENSE); }}>I already purchased a $5 video</button><button className="videoTextButton" type="button" onClick={() => activateAccount('', true, true)}>Check my Business/Premium access</button></div>}<p>For account or purchase help, contact <a href="mailto:hello@cookiesdigitalcreations.com">hello@cookiesdigitalcreations.com</a>.</p></details></section>}
    </main>
  </>;
}
