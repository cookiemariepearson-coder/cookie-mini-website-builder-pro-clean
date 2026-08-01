function clean(value = '') {
  return String(value || '').replace(/[<>]/g, '').slice(0, 500);
}

export async function sendAdminNotification({ subject, event, slug, businessName, customerEmail, details }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  const from = process.env.ADMIN_NOTIFICATION_FROM_EMAIL;
  if (!apiKey || !to || !from) return { sent: false, reason: 'Email alerts are not configured.' };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: clean(subject || `Cookie Builder: ${event}`),
        html: `<h2>${clean(event)}</h2><p><strong>Website:</strong> ${clean(businessName || slug)}</p><p><strong>Slug:</strong> ${clean(slug)}</p><p><strong>Customer:</strong> ${clean(customerEmail || 'Not supplied')}</p>${details ? `<p>${clean(details)}</p>` : ''}<p>Open your private Admin dashboard to review it.</p>`
      })
    });
    return { sent: response.ok };
  } catch (error) {
    console.error('Admin email notification failed', error);
    return { sent: false, reason: error.message };
  }
}
