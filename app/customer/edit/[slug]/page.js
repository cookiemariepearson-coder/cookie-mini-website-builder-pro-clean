import { redirect } from 'next/navigation';

function safeSlug(value = '') {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60);
}

export default async function LegacyEditorRedirect({ params }) {
  const resolved = await params;
  const slug = safeSlug(resolved?.slug);
  redirect(slug ? `/builder?draft=${encodeURIComponent(slug)}&convert=legacy` : '/customer');
}
