'use client';
import { useState } from 'react';
import Nav from '../../../lib/Nav';

function normalizeInput(value) {
  return String(value || '').trim();
}

function statusLabel(job) {
  return job.video_url ? 'ready' : (job.status || 'processing');
}

export default function VideoResultsPage() {
  const [email, setEmail] = useState('');
  const [slug, setSlug] = useState('');
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState('Enter an email or website/subdomain to find videos created through Cookie AI Video Studio.');
  const [loading, setLoading] = useState(false);

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
      setMessage(data.jobs?.length ? `Found ${data.jobs.length} video result(s).` : 'No HeyGen video results found yet for that email or website.');
    } catch (error) {
      setJobs([]);
      setMessage(error.message || 'Could not load video results.');
    } finally {
      setLoading(false);
    }
  }

  return <><Nav/><main className="wrap">
    <section className="dashboard">
      <span className="kicker">AI Video Studio</span>
      <h1>Video Results Dashboard</h1>
      <p>Customers can return here to see videos created from your website instead of hunting through HeyGen.</p>
      <div className="row">
        <div className="field"><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="customer@email.com" autoComplete="off" /></div>
        <div className="field"><label>Website name or subdomain</label><input value={slug} onChange={e=>setSlug(e.target.value)} placeholder="my-business-name" autoComplete="off" /></div>
      </div>
      <div className="navRow"><button className="btn" onClick={searchVideos} disabled={loading}>{loading ? 'Searching...' : 'Find My Videos'}</button><a className="btn dark" href="/video-studio">Create Another Video</a><a className="btn light" href="/customer">My Website</a></div>
      <div className="notice">{message}</div>
    </section>

    <section className="dashboard" style={{marginTop:22}}>
      <h2>Saved HeyGen Videos</h2>
      {jobs.length === 0 && <p>No videos loaded yet.</p>}
      <div className="cardGrid">
        {jobs.map(job => <article className="card" key={job.id || job.heygen_session_id || job.created_at}>
          <span className="kicker">{statusLabel(job)}</span>
          <h3>{job.business_name || 'Video'} </h3>
          <p><strong>Website:</strong> {job.website_slug || 'Not connected'}</p>
          <p><strong>Plan:</strong> {job.plan || '—'} · <strong>Type:</strong> {job.video_type || 'Promo'}</p>
          {job.thumbnail_url && <img src={job.thumbnail_url} alt="Video thumbnail" style={{width:'100%',borderRadius:16,margin:'10px 0'}}/>}
          {job.video_url ? <div>
            <video src={job.video_url} controls style={{width:'100%',borderRadius:16,margin:'10px 0'}} />
            <a className="btn" href={job.video_url} target="_blank" rel="noreferrer">Open / Download Video</a>
          </div> : <p className="notice">Video is still processing. Open AI Video Studio and check status again, or refresh later.</p>}
          {job.failure_message && <p className="notice error">{job.failure_message}</p>}
          <small>Created: {job.created_at ? new Date(job.created_at).toLocaleString() : '—'}</small>
        </article>)}
      </div>
    </section>
  </main></>;
}
