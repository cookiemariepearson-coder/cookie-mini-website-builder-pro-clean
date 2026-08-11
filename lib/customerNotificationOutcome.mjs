function accepted(result) {
  return result?.status === 'fulfilled' && result.value?.accepted === true;
}

function messageId(result) {
  return accepted(result) ? String(result.value?.id || '').slice(0, 250) : null;
}

export function customerNotificationOutcome(adminResult, customerResult) {
  const adminAccepted = accepted(adminResult);
  const customerAccepted = accepted(customerResult);
  const failures = [];
  if (!adminAccepted) failures.push('Owner notification delayed');
  if (!customerAccepted) failures.push('Customer confirmation delayed');

  return {
    adminAccepted,
    customerAccepted,
    notificationStatus: adminAccepted && customerAccepted
      ? 'accepted'
      : adminAccepted || customerAccepted
        ? 'partial'
        : 'rejected',
    adminProviderMessageId: messageId(adminResult),
    customerProviderMessageId: messageId(customerResult),
    notificationError: failures.length ? failures.join('; ') : null
  };
}
