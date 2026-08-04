import { NextResponse } from 'next/server';
import { getVerifiedSiteOwner } from '../../../../../lib/siteOwnerAuth';

export async function GET(req) {
  const owner = await getVerifiedSiteOwner(req);
  if (!owner.ok) {
    return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });
  }

  return NextResponse.json({ ok: true, email: owner.email });
}
