import { NextResponse } from 'next/server';
import { getVerifiedAdmin } from '../../../../lib/siteOwnerAuth';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 1000;
const MAX_PAGES = 100;

function response(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0' }
  });
}

export async function GET(request) {
  const admin = await getVerifiedAdmin(request);
  if (!admin.ok) return response({ ok: false, error: admin.error }, admin.status);

  try {
    let count = 0;
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const { data, error } = await admin.supabase.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
      if (error) throw error;
      const users = data?.users || [];
      count += users.length;
      if (users.length < PAGE_SIZE) return response({ ok: true, userCount: count, exact: true });
    }

    return response({ ok: true, userCount: count, exact: false });
  } catch (error) {
    console.error('[admin-user-count] load failed', { code: String(error?.code || 'user_count_failed').slice(0, 80) });
    return response({ ok: false, error: 'The registered-user count is temporarily unavailable.' }, 500);
  }
}
