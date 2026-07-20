'use client';
import { useMemo, useState } from 'react';
import Nav from '../../lib/Nav';

function safeJson(value) { try { return JSON.parse(value); } catch { return null; } }
function getInitialParams() {
  if (typeof window === 'undefined') return { shouldReturn: false, draftSlug: '' };
  const params = new URLSearchParams(window.location.search);
  return { shouldReturn: params.get('return') === 'builder', draftSlug: params.get('draft') || '' };
}
function download(name, text, type = 'text/plain') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
}
function jobVideoUrl(job) { return job?.videoUrl || job?.video_url || ''; }
function jobThumbnailUrl(job) { return job?.thumbnailUrl || job?.thumbnail_url || ''; }
function jobVideoId(job) { return job?.videoId || job?.heygen_video_id || ''; }
function jobSessionId(job) { return job?.sessionId || job?.heygen_session_id || ''; }

export default function VideoStudio() {
  const initial = getInitialParams();
  const savedDraft = typeof window !== 'undefined' ? localStorage.getItem('cookieDraftSite') : null;
  const draft = savedDraft ? safeJson(savedDraft) : null;
  const savedJob = typeof window !== 'undefined' ? safeJson(localStorage.getItem('cookieHeyGenJob') || 'null') : null;
  const savedCustomer = typeof window !== 'undefined' ? safeJson(localStorage.getItem('cookieVideoCustomer') || 'null') : null;

  const [biz, setBiz] = useState(draft?.businessName || savedCustomer?.businessName || '');
  const [promo, setPromo] = useState('');
  const [aud, setAud] = useState('local customers');
  const [type, setType] = useState('Business Promo');
  const [platform, setPlatform] = useState('TikTok / Reels');
  const [style, setStyle] = useState('Professional');
  const [length, setLength] = useState('15 seconds');
  const [voice, setVoice] = useState('Warm female voice');
  const [customerEmail, setCustomerEmail] = useState(draft?.email || savedCustomer?.email || '');
  const [websiteSlug, setWebsiteSlug] = useState(initial.draftSlug || draft?.slug || savedCustomer?.slug || '');
  const [accessCode, setAccessCode] = useState('');
  const [ownerMode, setOwnerMode] = useState(false);
  const [tab, setTab] = useState('Script');
  const [generateReal, setGenerateReal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState('');
  const [job, setJob] = useState(savedJob || null);

  const tabNames = ['Script', 'Captions', 'Shot List', 'Video Prompt', 'Voiceover', 'Next Steps'];
  const kit = useMemo(() => makeKit({ biz, promo, aud, type, platform, style, length, voice }), [biz, promo, aud, type, platform, style, length, voice]);
  const kitText = Object.entries(kit).map(([k, v]) => `${k}\n${v}`).join('\n\n---\n\n');

  function goBack() {
    window.location.href = websiteSlug ? `/builder?draft=${encodeURIComponent(websiteSlug)}` : '/builder?restore=1';
  }
  function rememberJob(nextJob) {
    setJob(nextJob);
    try { localStorage.setItem('cookieHeyGenJob', JSON.stringify(nextJob)); } catch {}
  }
  function rememberCustomer() {
    try { localStorage.setItem('cookieVideoCustomer', JSON.stringify({ email: customerEmail, slug: websiteSlug, businessName: biz })); } catch {}
  }

  async function createRealVideo() {
    setError('');
    setLoading(true);
    rememberCustomer();
    try {
      const res = await fetch('/api/heygen/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: biz,
          promo,
          audience: aud,
          videoType: type,
          platform,
          style,
          length,
          voice,
          accessCode: ownerMode ? accessCode : '',
          customerEmail,
          websiteSlug
        })
      });
      const data = await res.json().catch(() => ({ ok: false, error: 'Could not read server response.' }));
      if (!res.ok || !data.ok) throw new Error(data.error || 'HeyGen request failed.');
      rememberJob({ ...data, createdAt: new Date().toISOString(), businessName: biz || 'Your Business' });
    } catch (err) {
      setError(err.message || 'Something went wrong creating the video.');
    }
    setLoading(false);
  }

  async function checkStatus() {
    if (!jobSessionId(job) && !jobVideoId(job) && !job?.jobId) {
      setError('No HeyGen job found yet. Generate a real video first.');
      return;
    }
    setError('');
    setStatusLoading(true);
    try {
      const res = await fetch('/api/heygen/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: jobSessionId(job), videoId: jobVideoId(job), jobId: job.jobId || job.id })
      });
      const data = await res.json().catch(() => ({ ok: false, error: 'Could not read status response.' }));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not check HeyGen status.');
      rememberJob({
        ...job,
        ...data,
        status: data.videoUrl ? 'completed' : (data.status || job.status || 'generating'),
        videoUrl: data.videoUrl || jobVideoUrl(job),
        video_url: data.videoUrl || jobVideoUrl(job),
        thumbnailUrl: data.thumbnailUrl || jobThumbnailUrl(job),
        thumbnail_url: data.thumbnailUrl || jobThumbnailUrl(job),
        videoId: data.videoId || jobVideoId(job),
        checkedAt: new Date().toISOString()
      });
    } catch (err) {
      setError(err.message || 'Something went wrong checking the video.');
    }
    setStatusLoading(false);
  }

  const videoUrl = jobVideoUrl(job);
  const thumbUrl = jobThumbnailUrl(job);

  return <><Nav /><main className="wrap aiKit">
    <section className="dashboard">
      <span className="kicker">AI Video Studio</span>
      <h1>Create a Video Kit + Real HeyGen Video</h1>
      <p>Create scripts and captions for any plan. Business and Premium customers can generate real videos based on monthly plan limits.</p>
      {initial.shouldReturn && <div className="notice"><strong>Your website draft was saved before opening AI Video Studio.</strong><br />Use the button below to return to the builder without losing your work.</div>}
      <div className="notice success"><strong>Plan limits:</strong><br />Free: kit only. Starter: kit only. Business: 1 real HeyGen video/month. Premium: 3 real HeyGen videos/month.</div>
      <div className="navRow">
        <button className="btn dark" onClick={goBack}>Back to Website Builder</button>
        <a className="btn light" href="/customer">Open My Website</a>
        <a className="btn light" href="/video-studio/results">Video Results</a>
      </div>
      <div className="row">
        <div className="field"><label>Customer email for plan check</label><input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="customer@email.com" /></div>
        <div className="field"><label>Website name / short subdomain</label><input value={websiteSlug} onChange={e => setWebsiteSlug(e.target.value)} placeholder="my-business-name" /></div>
      </div>
      {[['Business name', biz, setBiz], ['What are they promoting?', promo, setPromo], ['Target customer', aud, setAud]].map(([label, value, setter]) => <div className="field" key={label}><label>{label}</label><textarea value={value} onChange={e => setter(e.target.value)} placeholder={label === 'What are they promoting?' ? 'Example: seafood boil trays, cleaning services, digital cookbook, hair bundles...' : label} /></div>)}
      <div className="row">
        <div className="field"><label>Video type</label><select value={type} onChange={e => setType(e.target.value)}>{['Business Promo', 'Product Ad', 'Restaurant Promo', 'Real Estate Intro', 'Beauty Promo', 'Website Hero Video', 'Grand Opening Promo', 'Sale Announcement'].map(x => <option key={x}>{x}</option>)}</select></div>
        <div className="field"><label>Platform</label><select value={platform} onChange={e => setPlatform(e.target.value)}>{['TikTok / Reels', 'YouTube Short', 'Facebook Ad', 'Website Hero Video', 'Instagram Story'].map(x => <option key={x}>{x}</option>)}</select></div>
      </div>
      <div className="row">
        <div className="field"><label>Style</label><select value={style} onChange={e => setStyle(e.target.value)}>{['Professional', 'Funny', 'Luxury', '3D Modern', 'Cartoon Fun', 'Cinematic', 'Warm & Friendly', 'Bold Sales Ad'].map(x => <option key={x}>{x}</option>)}</select></div>
        <div className="field"><label>Length</label><select value={length} onChange={e => setLength(e.target.value)}>{['15 seconds', '30 seconds', '45 seconds'].map(x => <option key={x}>{x}</option>)}</select></div>
      </div>
      <div className="field"><label>Voice style</label><select value={voice} onChange={e => setVoice(e.target.value)}>{['Warm female voice', 'Sassy female voice', 'Professional narrator', 'Friendly upbeat voice', 'Luxury commercial voice'].map(x => <option key={x}>{x}</option>)}</select></div>
      <label className="checkLine"><input type="checkbox" checked={generateReal} onChange={e => setGenerateReal(e.target.checked)} /> I understand real video generation uses monthly AI video credits.</label>
      <details className="notice" style={{ marginTop: 14 }}>
        <summary><strong>Owner/admin testing only</strong></summary>
        <p>Customers do not need this. Use this only when you want to test HeyGen video creation without using a customer plan limit.</p>
        <label className="checkLine"><input type="checkbox" checked={ownerMode} onChange={e => setOwnerMode(e.target.checked)} /> Use owner test mode for this video</label>
        {ownerMode && <div className="field"><label>Owner AI Video Access Code</label><input value={accessCode} onChange={e => setAccessCode(e.target.value)} placeholder="Owner testing code" type="password" autoComplete="new-password" /></div>}
      </details>
      <button className="btn" disabled={!generateReal || loading} onClick={createRealVideo}>{loading ? 'Checking plan and sending to HeyGen...' : 'Generate Real Video with HeyGen'}</button>
      {error && <div className="notice danger"><strong>Error:</strong> {error}</div>}
    </section>

    <section className="dashboard">
      <span className="kicker">Generated Video Kit</span>
      <h1>{biz || 'Your Business'} Promo Kit</h1>
      <div className="pillTabs">{tabNames.map(t => <button className={tab === t ? 'active' : ''} onClick={() => setTab(t)} key={t}>{t}</button>)}</div>
      <pre style={{ whiteSpace: 'pre-wrap', background: '#160c22', color: 'white', padding: 20, borderRadius: 18 }}>{kit[tab]}</pre>
      <p><button className="btn" onClick={() => navigator.clipboard.writeText(kit[tab])}>Copy {tab}</button> <button className="btn dark" onClick={() => download(`${biz || 'video'}-kit.txt`, kitText)}>Download Text Kit</button> <button className="btn dark" onClick={() => download(`${biz || 'video'}-kit.html`, `<html><body><h1>${biz || 'Video'} Kit</h1><pre>${kitText.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</pre></body></html>`, 'text/html')}>Download Full Kit</button></p>
      <button className="btn" onClick={goBack}>Return to Builder</button>
      <div className="notice"><strong>Creative kit mode is always available.</strong> If a customer is out of real-video credits, they can still download this kit.</div>
    </section>

    <section className="dashboard">
      <span className="kicker">HeyGen Video Job</span>
      <h1>Real Video Status</h1>
      <p><a className="btn light" href="/video-studio/results">Open Video Results Dashboard</a></p>
      {!job && <p>No real HeyGen video has been started in this browser yet.</p>}
      {job && <div>
        <p><strong>Status:</strong> {videoUrl ? 'completed' : (job.status || 'generating')}</p>
        {job.plan && <p><strong>Plan checked:</strong> {job.ownerOverride ? 'Owner override' : job.plan}</p>}
        {job.videoUsage && !job.ownerOverride && <p><strong>Monthly usage:</strong> {job.videoUsage.used} of {job.videoUsage.limit} used. {job.videoUsage.remaining} remaining.</p>}
        {job.usageWarning && <div className="notice danger">{job.usageWarning}</div>}
        {jobSessionId(job) && <p><strong>Session:</strong> {jobSessionId(job)}</p>}
        {jobVideoId(job) && <p><strong>Video ID:</strong> {jobVideoId(job)}</p>}
        <button className="btn" onClick={checkStatus} disabled={statusLoading}>{statusLoading ? 'Refreshing...' : 'Refresh Video Status'}</button>
        {ownerMode && job.heygenSessionUrl && <p className="notice"><strong>Owner troubleshooting:</strong><br /><a className="btn light" href={job.heygenSessionUrl} target="_blank" rel="noreferrer">Open in HeyGen</a></p>}
        {videoUrl && <div className="notice success"><strong>Video ready!</strong><br /><a className="btn" href={videoUrl} target="_blank" rel="noreferrer">Download MP4</a>{thumbUrl && <img src={thumbUrl} alt="Video thumbnail" style={{ width: '100%', marginTop: 14, borderRadius: 18 }} />}<video src={videoUrl} controls style={{ width: '100%', marginTop: 14, borderRadius: 18 }} /></div>}
        {!videoUrl && <div className="notice">Video is processing. Click <strong>Refresh Video Status</strong> until it is ready, or open the Video Results Dashboard later.</div>}
        {job.failureMessage && <div className="notice danger"><strong>HeyGen failed:</strong> {job.failureMessage}</div>}
      </div>}
    </section>
  </main></>;
}

function makeKit({ biz, promo, aud, type, platform, style, length, voice }) {
  const b = biz || 'your business';
  const p = promo || 'your offer';
  return {
    Script: `HOOK: Looking for ${p}?\nSCENE 1: Show ${b} with bold text and ${style} visuals.\nSCENE 2: Explain the main benefit for ${aud}.\nSCENE 3: Show proof, services, products, or results.\nCTA: Visit our website today.`,
    Captions: `${b} is here to help with ${p}.\nClear. Simple. Professional.\nVisit our website today.`,
    'Shot List': `1. Opening logo/title card\n2. Product/service close-up\n3. Three benefit text overlays\n4. Customer trust/review moment\n5. Call-to-action screen`,
    'Video Prompt': `Create a ${length} vertical 9:16 ${type} for ${b}. Promote: ${p}. Style: ${style}. Platform: ${platform}. Use clean motion graphics, bold captions, smooth transitions, and a strong call to action. No copyrighted logos or celebrity likenesses.`,
    Voiceover: `Use a ${voice}. Say: Need ${p}? ${b} makes it simple. We help ${aud} get what they need with a clear, professional experience. Visit our website today.`,
    'Next Steps': `Copy the script, captions, and prompt, or use the protected HeyGen button to create a real video. Business includes 1 real video per month. Premium includes 3 real videos per month. Owner testing is hidden inside Owner/Admin testing only.`
  };
}
