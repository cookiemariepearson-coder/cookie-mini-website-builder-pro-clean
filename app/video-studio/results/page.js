'use client';
import { useMemo, useState } from 'react';
import Nav from '../../../lib/Nav';

function normalizeInput(value) {
  return String(value || '').trim();
}
function videoUrl(job) { return job.video_url || job.videoUrl || ''; }
function thumbnailUrl(job) { return job.thumbnail_url || job.thumbnailUrl || ''; }
function videoId(job) { return job.heygen_video_id || job.videoId || ''; }
function sessionId(job) { return job.heygen_session_id || job.sessionId || ''; }
function statusLabel(job) {
  if (videoUrl(job)) return 'completed';
  const status = String(job.status || 'processing').toLowerCase();
  if (['completed', 'ready', 'done', 'success'].includes(status)) return 'completed';
  if (['failed', 'error'].includes(status)) return 'failed';
  return 'processing';
}
function statusText(job) {
  const status = statusLabel(job);
  if (status === 'completed') return 'Video ready';
  if (status === 'failed') return 'Video failed';
  return 'Needs refresh / processing';
}
function sortJobs(list) {
  return [...list].sort((a, b) => {
    const rank = { completed: 0, processing: 1, failed: 2 };
    const ar = rank[statusLabel(a)] ?? 1;
    const br = rank[statusLabel(b)] ?? 1;
    if (ar !== br) return ar - br;
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
}

export default function VideoResultsPage() {
  const [email, setEmail] = useState('');
  const [slug, setSlug] = useState('');
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState('Enter an email or website/subdomain to find videos created through Cookie AI Video Studio.');
  const [loading, setLoading] = useState(false);
  const [refreshingId, setRefreshingId] = useState('');
  const sortedJobs = useMemo(() => sortJobs(jobs), [jobs]);

  async function searchVideos() {
    const q = new URLSearchParams();
    if (normalizeInput(email)) q.set('email', normalizeInput(email));
    if (normalizeInput(slug)) q.set('slug', normalizeInput(slug));
    if (!q.toString()) { setMessage('Enter an email or website/subdomain first.'); return; }
    setLoading(true);
    setMessage('Loading video results...');
    try {
      const res = await fetch(`/api/heygen/jobs?${q.toString()}`);
      const data = await res.json().catch(() => ({ ok: false, error: 'Could not read server response.' }));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not load videos.');
      setJobs(data.jobs || []);
      setMessage(data.jobs?.length ? `Found ${data.jobs.length} video result(s). Completed videos are shown first.` : 'No HeyGen video results found yet for that email or website.');
    } catch (error) {
      setJobs([]);
      setMessage(error.message || 'Could not load video results.');
    } finally {
      setLoading(false);
    }
  }

  async function refreshJob(job) {
    const key = job.id || sessionId(job) || videoId(job);
    if (!key) return;
    setRefreshingId(key);
    setMessage('Checking HeyGen video status...');
    try {
      const res = await fetch('/api/heygen/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, sessionId: sessionId(job), videoId: videoId(job) })
      });
      const data = await res.json().catch(() => ({ ok: false, error: 'Could not read status response.' }));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not refresh video status.');
      setJobs(current => current.map(item => {
        const itemKey = item.id || sessionId(item) || videoId(item);
        if (itemKey !== key) return item;
        const readyUrl = data.videoUrl || videoUrl(item);
        return {
          ...item,
          status: readyUrl ? 'completed' : (data.status || item.status || 'processing'),
          heygen_session_id: data.sessionId || sessionId(item),
          heygen_video_id: data.videoId || videoId(item),
          video_url: readyUrl,
          thumbnail_url: data.thumbnailUrl || thumbnailUrl(item),
          failure_code: data.failureCode || item.failure_code || null,
          failure_message: data.failureMessage || item.failure_message || null,
          checked_at: new Date().toISOString()
        };
      }));
      setMessage(data.videoUrl ? 'Video is ready and was updated on your site.' : 'Video is still processing. Check again soon.');
    } catch (error) {
      setMessage(error.message || 'Could not refresh video status.');
    } finally {
      setRefreshingId('');
    }
  }

  return <><Nav /><main className="wrap">
    <section className="dashboard">
      <span className="kicker">AI Video Studio</span>
      <h1>Video Results Dashboard</h1>
      <p>Customers can return here to watch, download, and refresh videos created through your website.</p>
      <div className="row">
        <div className="field"><label>Email</label><input value={email} onChange={e => setEmail(e.target.value)} placeholder="customer@email.com" autoComplete="off" /></div>
        <div className="field"><label>Website name or subdomain</label><input value={slug} onChange={e => setSlug(e.target.value)} placeholder="my-business-name" autoComplete="off" /></div>
      </div>
      <div className="navRow"><button className="btn" onClick={searchVideos} disabled={loading}>{loading ? 'Searching...' : 'Find My Videos'}</button><a className="btn dark" href="/video-studio">Create Another Video</a><a className="btn light" href="/customer">My Website</a></div>
      <div className="notice">{message}</div>
    </section>

    <section className="dashboard" style={{ marginTop: 22 }}>
      <h2>Saved HeyGen Videos</h2>
      {sortedJobs.length === 0 && <p>No videos loaded yet.</p>}
      <div className="cardGrid">
        {sortedJobs.map(job => {
          const key = job.id || sessionId(job) || videoId(job) || job.created_at;
          const ready = Boolean(videoUrl(job));
          const thumb = thumbnailUrl(job);
          return <article className="card" key={key}>
            <span className="kicker">{statusText(job)}</span>
            <h3>{job.business_name || 'Video'}</h3>
            <p><strong>Website:</strong> {job.website_slug || 'Not connected'}</p>
            <p><strong>Plan:</strong> {job.plan || '—'} · <strong>Type:</strong> {job.video_type || 'Promo'}</p>
            {!ready && <button className="btn" onClick={() => refreshJob(job)} disabled={refreshingId === key}>{refreshingId === key ? 'Refreshing...' : 'Refresh Video Status'}</button>}
            {thumb && <img src={thumb} alt="Video thumbnail" style={{ width: '100%', borderRadius: 16, margin: '10px 0' }} />}
            {ready ? <div>
              <video src={videoUrl(job)} controls style={{ width: '100%', borderRadius: 16, margin: '10px 0' }} />
              <div className="navRow"><a className="btn" href={videoUrl(job)} target="_blank" rel="noreferrer">Download MP4</a><button className="btn light" onClick={() => navigator.clipboard.writeText(videoUrl(job))}>Copy Video Link</button></div>
            </div> : <p className="notice">This video may still be processing. Click <strong>Refresh Video Status</strong>. If it was created yesterday and still says processing, refresh once to update the saved result.</p>}
            {job.failure_message && <p className="notice danger"><strong>HeyGen message:</strong> {job.failure_message}</p>}
            <small>Created: {job.created_at ? new Date(job.created_at).toLocaleString() : '—'}</small>
            {job.checked_at && <small><br />Last checked: {new Date(job.checked_at).toLocaleString()}</small>}
          </article>;
        })}
      </div>
    </section>
  </main></>;
}
