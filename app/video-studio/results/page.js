'use client';
import { useEffect, useMemo, useState } from 'react';
import Nav from '../../../lib/Nav';

const VIDEO_ACCESS_TOKEN_KEY = 'cookieVideoAccessToken';
const SITE_OWNER_TOKEN_KEY = 'cookieSiteOwnerAccessToken';

function normalizeInput(value) {
  return String(value || '').trim();
}
function thumbnailUrl(job) { return job.thumbnail_url || job.thumbnailUrl || ''; }
function videoId(job) { return job.heygen_video_id || job.videoId || ''; }
function sessionId(job) { return job.heygen_session_id || job.sessionId || ''; }
function statusLabel(job) {
  if (job.video_available || job.videoAvailable) return 'completed';
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
  const [accessToken, setAccessToken] = useState('');
  const [mediaUrls, setMediaUrls] = useState({});
  const [loadingMediaId, setLoadingMediaId] = useState('');
  const sortedJobs = useMemo(() => sortJobs(jobs), [jobs]);

  async function searchVideos(inputEmail = email, inputSlug = slug, token = accessToken) {
    const q = new URLSearchParams();
    if (normalizeInput(inputEmail)) q.set('email', normalizeInput(inputEmail));
    if (normalizeInput(inputSlug)) q.set('slug', normalizeInput(inputSlug));
    if (!q.toString()) { setMessage('Enter an email or website/subdomain first.'); return; }
    setLoading(true);
    setMessage('Loading video results...');
    try {
      const res = await fetch(`/api/heygen/jobs?${q.toString()}`, {
        headers: {
          'X-Video-Access-Token': token,
          Authorization: `Bearer ${localStorage.getItem(SITE_OWNER_TOKEN_KEY) || ''}`
        }
      });
      const data = await res.json().catch(() => ({ ok: false, error: 'Could not read server response.' }));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not load videos.');
      Object.values(mediaUrls).forEach(url => URL.revokeObjectURL(url));
      setMediaUrls({});
      setJobs(data.jobs || []);
      setMessage(data.jobs?.length ? `Found ${data.jobs.length} video result(s). Completed videos are shown first.` : 'No videos found for this verified access.');
    } catch (error) {
      setJobs([]);
      setMessage(error.message || 'Could not load video results.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setAccessToken(localStorage.getItem(VIDEO_ACCESS_TOKEN_KEY) || '');
    const q = new URLSearchParams(window.location.search);
    const initialEmail = q.get('email') || '';
    const initialSlug = q.get('slug') || '';
    if (initialEmail) setEmail(initialEmail);
    if (initialSlug) setSlug(initialSlug);
    if (initialEmail || initialSlug) {
      const token = localStorage.getItem(VIDEO_ACCESS_TOKEN_KEY) || '';
      setAccessToken(token);
      searchVideos(initialEmail, initialSlug, token);
    }
  }, []);

  function mediaHeaders() {
    return {
      'X-Video-Access-Token': accessToken,
      Authorization: `Bearer ${localStorage.getItem(SITE_OWNER_TOKEN_KEY) || ''}`
    };
  }

  async function fetchVideoBlob(job) {
    const response = await fetch(`/api/heygen/media?jobId=${encodeURIComponent(job.id)}`, { headers: mediaHeaders() });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'The video could not be loaded.');
    }
    return response.blob();
  }

  async function viewVideo(job) {
    if (!job.id || mediaUrls[job.id]) return;
    setLoadingMediaId(job.id);
    setMessage('Loading your protected video...');
    try {
      const blob = await fetchVideoBlob(job);
      const objectUrl = URL.createObjectURL(blob);
      setMediaUrls(current => ({ ...current, [job.id]: objectUrl }));
      setMessage('Your video is ready to watch or download.');
    } catch (error) {
      setMessage(error.message || 'The video could not be loaded.');
    } finally {
      setLoadingMediaId('');
    }
  }

  async function downloadVideo(job) {
    setLoadingMediaId(job.id);
    setMessage('Preparing your protected MP4 download...');
    try {
      const blob = await fetchVideoBlob(job);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `cookie-video-${job.id}.mp4`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setMessage('Your MP4 download is ready.');
    } catch (error) {
      setMessage(error.message || 'The MP4 could not be downloaded.');
    } finally {
      setLoadingMediaId('');
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
        headers: {
          'Content-Type': 'application/json',
          'X-Video-Access-Token': accessToken,
          Authorization: `Bearer ${localStorage.getItem(SITE_OWNER_TOKEN_KEY) || ''}`
        },
        body: JSON.stringify({ jobId: job.id, sessionId: sessionId(job), videoId: videoId(job) })
      });
      const data = await res.json().catch(() => ({ ok: false, error: 'Could not read status response.' }));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not refresh video status.');
      setJobs(current => current.map(item => {
        const itemKey = item.id || sessionId(item) || videoId(item);
        if (itemKey !== key) return item;
        return {
          ...item,
          status: data.videoAvailable ? 'completed' : (data.status || item.status || 'processing'),
          video_available: Boolean(data.videoAvailable || item.video_available),
          thumbnail_available: Boolean(data.thumbnailAvailable || item.thumbnail_available),
          failure_code: data.failureCode || item.failure_code || null,
          failure_message: data.failureMessage || item.failure_message || null,
          checked_at: new Date().toISOString()
        };
      }));
      setMessage(data.videoAvailable ? 'Video is ready and was updated on your site.' : 'Video is still processing. Check again soon.');
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
      <div className="navRow"><button className="btn" onClick={() => searchVideos()} disabled={loading}>{loading ? 'Searching...' : 'Find My Videos'}</button><a className="btn dark" href="/video-studio">Create Another Video</a><a className="btn light" href="/customer">My Website</a></div>
      <div className="notice" role="status" aria-live="polite">{message}</div>
    </section>

    <section className="dashboard" style={{ marginTop: 22 }}>
      <h2>Saved HeyGen Videos</h2>
      {sortedJobs.length === 0 && <p>No videos loaded yet.</p>}
      <div className="cardGrid">
        {sortedJobs.map(job => {
          const key = job.id || sessionId(job) || videoId(job) || job.created_at;
          const ready = Boolean(job.video_available || job.videoAvailable);
          const thumb = thumbnailUrl(job);
          return <article className="card" key={key}>
            <span className="kicker">{statusText(job)}</span>
            <h3>{job.business_name || 'Video'}</h3>
            <p><strong>Website:</strong> {job.website_slug || 'Not connected'}</p>
            <p><strong>Plan:</strong> {job.plan || '—'} · <strong>Type:</strong> {job.video_type || 'Promo'}</p>
            {!ready && <button className="btn" onClick={() => refreshJob(job)} disabled={refreshingId === key}>{refreshingId === key ? 'Refreshing...' : 'Refresh Video Status'}</button>}
            {thumb && <img src={thumb} alt="Video thumbnail" style={{ width: '100%', borderRadius: 16, margin: '10px 0' }} />}
            {ready ? <div>
              {mediaUrls[job.id] ? <video src={mediaUrls[job.id]} controls style={{ width: '100%', borderRadius: 16, margin: '10px 0' }} /> : <button className="btn" type="button" onClick={() => viewVideo(job)} disabled={loadingMediaId === job.id}>{loadingMediaId === job.id ? 'Loading Video...' : 'View Video'}</button>}
              <div className="navRow"><button className="btn" type="button" onClick={() => downloadVideo(job)} disabled={loadingMediaId === job.id}>Download MP4</button></div>
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
