import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA || 'local';
  const payload = {
    service: 'Cookie Mini Website Builder',
    environment: process.env.VERCEL_ENV || 'local',
    fingerprint: commit.slice(0, 12),
    commit,
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID || 'local',
    deploymentUrl: process.env.VERCEL_URL || 'local',
    branch: process.env.VERCEL_GIT_COMMIT_REF || 'local'
  };

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
  });
}
