import { NextResponse } from 'next/server';
import { getVerifiedAdmin } from '../../../../lib/siteOwnerAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function privateResponse(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0' }
  });
}

export async function POST(request) {
  try {
    const admin = await getVerifiedAdmin(request);
    if (!admin.ok) return privateResponse({ ok: false, error: admin.error }, admin.status);

    const pageSize = 1000;
    let page = 1;
    let registeredUsers = 0;
    let exact = false;

    while (page <= 250) {
      const { data, error } = await admin.supabase.auth.admin.listUsers({ page, perPage: pageSize });
      if (error) throw error;

      const users = data?.users || [];
      const reportedTotal = Number(data?.total);
      if (page === 1 && Number.isFinite(reportedTotal) && reportedTotal > 0) {
        registeredUsers = reportedTotal;
        exact = true;
        break;
      }

      registeredUsers += users.length;
      if (users.length < pageSize) {
        exact = true;
        break;
      }
      page += 1;
    }

    console.info('[admin-overview]', {
      event: 'REGISTERED_USER_COUNT_LOADED',
      registeredUsers,
      exact
    });

    return privateResponse({ ok: true, registeredUsers, exact });
  } catch (error) {
    console.error('[admin-overview] user count failed', {
      code: String(error?.code || 'user_count_failed').slice(0, 80)
    });
    return privateResponse({ ok: false, error: 'The registered-user count could not be loaded.' }, 500);
  }
}
