'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAccountModal } from '../../../components/AccountModalProvider';
import Nav from '../../../lib/Nav';

const VIDEO_ACCESS_TOKEN_KEY = 'cookieVideoAccessToken';

function statusLabel(job = {}) {
  if (job.video_available || job.videoAvailable) return 'completed';
  const status = String(job.status || 'processing').toLowerCase();
  if (['completed', 'ready', 'done', 'success'].includes(status)) return 'completed';
  if (['failed', 'error'].includes(status)) return 'failed';
  return 'processing';
}

function statusText(job) {
  const status = statusLabel(job);
  if (status === 'completed') return 'Video ready';
  if (status === 'failed') return 'Video needs attention';
  return 'Video is being created';
}

function sortJobs(list) {
  return [...list].sort((a, b) => {
    const rank = { completed: 0, processing: 1, failed: 2 };
    const difference = (rank[statusLabel(a)] ?? 1) - (rank[statusLabel(b)] ?? 1);
    return difference || new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
}

export default function VideoResultsPage() {
  const { accountState, openAccountModal } = useAccountModal();
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState('Loading your protected video results…');
  const [loading, setLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [remaining, setRemaining] = useState(null);
  const [mediaUrls, setMediaUrls] = useState({});
  const [loadingMediaId, setLoadingMediaId] = useState('');
  const sortedJobs = useMemo(() => sortJobs(jobs), [jobs]);
  const processingJob = jobs.find(job => statusLabel(job) === 'processing');
  const completedJobs = sortedJobs.filter(job => statusLabel(job) === 'completed');
  const pageState = processingJob ? 'processing' : completedJobs.length ? 'completed' : loading ? 'loading' : 'empty';

  function ownerHeaders(token) {
    return { 'X-Video-Access-Token': token };
  }

  async function searchVideos(token) {
    if (!token) {
      setJobs([]);
      setMessage('Open AI Video Studio to buy or claim a video.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [jobsResponse, statusResponse] = await Promise.all([
        fetch('/api/heygen/jobs', { headers: ownerHeaders(token), cache: 'no-store' }),
        fetch('/api/video-access/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: token })
        })
      ]);
      const jobsData = await jobsResponse.json().catch(() => ({}));
      const statusData = await statusResponse.json().catch(() => ({}));
      if (!jobsResponse.ok || !jobsData.ok) throw new Error(jobsData.error || 'Your videos could not be loaded.');
      Object.values(mediaUrls).forEach(url => URL.revokeObjectURL(url));
      setMediaUrls({});
      setJobs(jobsData.jobs || []);
      if (statusResponse.ok && statusData.ok) setRemaining(Math.max(0, Number(statusData.remaining || 0)));
      setMessage(jobsData.jobs?.length ? 'Your protected videos are ready below.' : 'No submitted videos were found for this access.');
    } catch (error) {
      setJobs([]);
      setMessage(error.message || 'Your videos could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (accountState === 'checking') return;
    if (accountState !== 'signed-in') {
      setJobs([]);
      setAccessToken('');
      setMessage('Create an account or sign in to access your AI videos.');
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/video-access/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'account' })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok) throw new Error(data.error || 'Your video account could not be opened.');
        if (data.purchaseRequired || !data.token) {
          localStorage.removeItem(VIDEO_ACCESS_TOKEN_KEY);
          setAccessToken('');
          setJobs([]);
          setMessage('No videos are connected to this account yet.');
          setLoading(false);
          return;
        }
        localStorage.setItem(VIDEO_ACCESS_TOKEN_KEY, data.token);
        setAccessToken(data.token);
        await searchVideos(data.token);
      } catch (error) {
        setJobs([]);
        setMessage(error.message || 'Your videos could not be loaded.');
        setLoading(false);
      }
    })();
  }, [accountState]);

  function mediaHeaders() {
    return ownerHeaders(accessToken);
  }

  async function fetchVideoBlob(job) {
    const response = await fetch(`/api/heygen/media?jobId=${encodeURIComponent(job.id)}`, { headers: mediaHeaders(), cache: 'no-store' });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'The video could not be loaded.');
    }
    return response.blob();
  }

  async function viewVideo(job) {
    if (!job.id || mediaUrls[job.id]) return;
    setLoadingMediaId(job.id);
    setMessage('Loading your protected video…');
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
    setMessage('Preparing your protected MP4 download…');
    try {
      const blob = await fetchVideoBlob(job);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `cookie-video-${job.id}.mp4`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setMessage('Your MP4 download is ready.');
    } catch (error) {
      setMessage(error.message || 'The MP4 could not be downloaded.');
    } finally {
      setLoadingMediaId('');
    }
  }

  async function refreshJob(job) {
    if (!job.id) return;
    setRefreshingId(job.id);
    setMessage('Checking video status…');
    try {
      const response = await fetch('/api/heygen/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...mediaHeaders() },
        body: JSON.stringify({ jobId: job.id })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'Video status could not be refreshed.');
      setJobs(current => current.map(item => item.id === job.id ? {
        ...item,
        status: data.videoAvailable ? 'completed' : (data.status || item.status || 'processing'),
        video_available: Boolean(data.videoAvailable || item.video_available),
        thumbnail_available: Boolean(data.thumbnailAvailable || item.thumbnail_available),
        failure_code: data.failureCode || item.failure_code || null,
        failure_message: data.failureMessage || item.failure_message || null,
        checked_at: new Date().toISOString()
      } : item));
      setMessage(data.videoAvailable ? 'Your video is ready.' : 'Your video is still being created. Check again soon.');
    } catch (error) {
      setMessage(error.message || 'Video status could not be refreshed.');
    } finally {
      setRefreshingId('');
    }
  }

  return <>
    <Nav />
    <main className="wrap videoResultsRefresh">
      <section className="dashboard videoResultsHero">
        <span className="kicker">AI Video Studio · Results</span>
        <h1>{pageState === 'processing' ? 'Your video is being created' : pageState === 'completed' ? 'Your video is ready' : pageState === 'loading' ? 'Loading your video…' : 'Your Video Results'}</h1>
        <p>{pageState === 'processing' ? 'You can safely leave this page and come back later.' : pageState === 'completed' ? 'Watch or download your protected video below.' : 'Videos created with your verified access appear here.'}</p>
        {pageState === 'processing' && <button className="btn dark" type="button" onClick={() => refreshJob(processingJob)} disabled={refreshingId === processingJob.id}>{refreshingId === processingJob.id ? 'Checking Status…' : 'Check Video Status'}</button>}
        <p className={/could not|unlock|no submitted/i.test(message) ? 'videoInlineError' : 'videoInlineNote'} role="status" aria-live="polite">{message}</p>
        {accountState === 'signed-out' && <div className="videoPrimaryActions">
          <button className="btn dark" type="button" onClick={() => openAccountModal({ mode: 'create', destination: '/video-studio/results' })}>Create My Account</button>
          <button className="btn light" type="button" onClick={() => openAccountModal({ mode: 'signin', destination: '/video-studio/results' })}>Sign In</button>
        </div>}
        {accountState === 'signed-in' && !accessToken && <Link className="btn dark" href="/video-studio?intent=purchase">Buy One Video — $5</Link>}
      </section>

      {sortedJobs.length > 0 && <section className="dashboard videoResultsList">
        <h2>My Videos</h2>
        <div className="cardGrid">
          {sortedJobs.map(job => {
            const ready = statusLabel(job) === 'completed';
            return <article className="card videoResultCard" key={job.id || job.created_at}>
              <span className="kicker">{statusText(job)}</span>
              <h3>{job.business_name || 'Business Video'}</h3>
              <p>{job.video_type || 'Promo'} · {job.platform || 'Video'}</p>
              {!ready && <button className="btn dark" type="button" onClick={() => refreshJob(job)} disabled={refreshingId === job.id}>{refreshingId === job.id ? 'Checking Status…' : 'Check Video Status'}</button>}
              {ready && <>
                {mediaUrls[job.id] && <video src={mediaUrls[job.id]} controls className="protectedVideoPlayer" aria-label={`${job.business_name || 'Business'} video`} />}
                <div className="videoPrimaryActions">
                  {!mediaUrls[job.id] && <button className="btn dark" type="button" onClick={() => viewVideo(job)} disabled={loadingMediaId === job.id}>{loadingMediaId === job.id ? 'Loading Video…' : 'Watch My Video'}</button>}
                  <button className="btn light" type="button" onClick={() => downloadVideo(job)} disabled={loadingMediaId === job.id}>Download My Video</button>
                </div>
              </>}
              {job.failure_message && <p className="videoInlineError" role="alert">The video could not be completed. Please contact support if checking again does not help.</p>}
              <small>Created {job.created_at ? new Date(job.created_at).toLocaleString() : 'recently'}</small>
            </article>;
          })}
        </div>
        {!processingJob && <div className="videoResultsSecondary"><Link className="videoTextButton" href={remaining === 0 ? '/video-studio?intent=purchase' : '/video-studio'}>Create Another Video</Link></div>}
      </section>}
    </main>
  </>;
}
