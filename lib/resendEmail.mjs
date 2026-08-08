function safeLogValue(value = '', max = 120) {
  return String(value || '').replace(/[\r\n<>]/g, '').trim().slice(0, max);
}

export async function sendResendEmail({ apiKey, from, to, subject, html, replyTo, notification, requestId, idempotencyKey }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {})
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {})
    })
  });
  const data = await response.json().catch(() => ({}));
  const logContext = {
    provider: 'resend',
    notification: safeLogValue(notification),
    requestId: safeLogValue(requestId),
    status: response.status,
    providerMessageId: safeLogValue(data?.id)
  };

  if (!response.ok) {
    console.error(JSON.stringify({
      level: 'error',
      event: 'email_provider_rejected',
      ...logContext,
      providerCode: safeLogValue(data?.name || data?.code)
    }));
    throw new Error(`Email provider rejected ${notification || 'notification'} (${response.status}).`);
  }

  console.log(JSON.stringify({ level: 'info', event: 'email_provider_accepted', ...logContext }));
  return { accepted: true, id: data?.id || '' };
}
