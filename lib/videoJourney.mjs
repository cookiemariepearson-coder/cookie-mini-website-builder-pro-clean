export const VIDEO_JOB_STATE = Object.freeze({
  NONE: 'none',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
});

export const VIDEO_START_STATE = Object.freeze({
  CHECKING: 'checking',
  SIGNED_OUT: 'signed-out',
  ACCESS_CHOICE: 'access-choice',
  LICENSE: 'license',
  WEBSITE_SELECTION: 'website-selection',
  AVAILABLE: 'available',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  USED_CREDIT: 'used-credit',
  NO_CREDIT: 'no-credit',
  WIZARD: 'wizard'
});

function clean(value = '') {
  return String(value || '').trim().toLowerCase();
}

export function videoJobState(job = {}) {
  if (job.video_available || job.videoAvailable || job.video_url) return VIDEO_JOB_STATE.COMPLETED;
  const status = clean(job.status || 'processing');
  if (['completed', 'ready', 'done', 'success'].includes(status)) return VIDEO_JOB_STATE.COMPLETED;
  if (['failed', 'error', 'cancelled', 'canceled'].includes(status)) return VIDEO_JOB_STATE.FAILED;
  return VIDEO_JOB_STATE.PROCESSING;
}

export function summarizeVideoJobs(jobs = []) {
  const rows = Array.isArray(jobs) ? jobs : [];
  const processing = rows.find(job => videoJobState(job) === VIDEO_JOB_STATE.PROCESSING);
  const completed = rows.find(job => videoJobState(job) === VIDEO_JOB_STATE.COMPLETED);
  const failed = rows.find(job => videoJobState(job) === VIDEO_JOB_STATE.FAILED);
  const latest = processing || completed || failed || null;
  const jobState = processing
    ? VIDEO_JOB_STATE.PROCESSING
    : completed
      ? VIDEO_JOB_STATE.COMPLETED
      : failed
        ? VIDEO_JOB_STATE.FAILED
        : VIDEO_JOB_STATE.NONE;

  return {
    jobState,
    hasProcessing: Boolean(processing),
    hasCompleted: Boolean(completed),
    latestJob: latest ? {
      id: latest.id,
      businessName: latest.business_name || latest.businessName || 'Video',
      status: videoJobState(latest),
      videoAvailable: videoJobState(latest) === VIDEO_JOB_STATE.COMPLETED,
      createdAt: latest.created_at || latest.createdAt || null
    } : null
  };
}

export function resolveVideoStartState({
  checking = false,
  signedIn = false,
  verified = false,
  remaining = 0,
  jobState = VIDEO_JOB_STATE.NONE,
  screen = ''
} = {}) {
  if (checking) return VIDEO_START_STATE.CHECKING;
  if (screen === VIDEO_START_STATE.WIZARD) return VIDEO_START_STATE.WIZARD;
  if (screen === VIDEO_START_STATE.LICENSE) return VIDEO_START_STATE.LICENSE;
  if (screen === VIDEO_START_STATE.WEBSITE_SELECTION) return VIDEO_START_STATE.WEBSITE_SELECTION;
  if (screen === VIDEO_START_STATE.ACCESS_CHOICE) return VIDEO_START_STATE.ACCESS_CHOICE;
  if (!verified) return signedIn ? VIDEO_START_STATE.ACCESS_CHOICE : VIDEO_START_STATE.SIGNED_OUT;
  if (jobState === VIDEO_JOB_STATE.PROCESSING) return VIDEO_START_STATE.PROCESSING;
  if (jobState === VIDEO_JOB_STATE.COMPLETED && Number(remaining) <= 0) return VIDEO_START_STATE.USED_CREDIT;
  if (jobState === VIDEO_JOB_STATE.COMPLETED) return VIDEO_START_STATE.COMPLETED;
  if (Number(remaining) > 0) return VIDEO_START_STATE.AVAILABLE;
  return VIDEO_START_STATE.NO_CREDIT;
}
