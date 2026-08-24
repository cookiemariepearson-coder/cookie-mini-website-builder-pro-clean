export const dynamic = 'force-dynamic';

export default function BuildInfoPage() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA || 'local';
  const rows = [
    ['Environment', process.env.VERCEL_ENV || 'local'],
    ['Fingerprint', commit.slice(0, 12)],
    ['Commit', commit],
    ['Deployment', process.env.VERCEL_DEPLOYMENT_ID || 'local'],
    ['Deployment URL', process.env.VERCEL_URL || 'local'],
    ['Branch', process.env.VERCEL_GIT_COMMIT_REF || 'local']
  ];

  return (
    <main className="legalPage">
      <h1>Cookie Mini Website Builder — Build Information</h1>
      <p>This page identifies the exact protected Preview currently open.</p>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} className="notice">
            <dt><strong>{label}</strong></dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
