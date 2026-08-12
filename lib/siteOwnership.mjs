function normalizedEmail(value = '') {
  return String(value || '').trim().toLowerCase();
}

export function siteBelongsToEmail(row = {}, email = '') {
  const savedEmail = normalizedEmail(
    row.customer_email ||
    row.site?.customerEmail ||
    row.site?.email ||
    ''
  );

  return Boolean(savedEmail && savedEmail === normalizedEmail(email));
}

export function siteBelongsToOwner(row = {}, owner = {}) {
  const rowOwnerId = String(row.owner_id || '').trim();
  const ownerId = String(owner.user?.id || owner.id || '').trim();
  if (rowOwnerId) return Boolean(ownerId && rowOwnerId === ownerId);
  return siteBelongsToEmail(row, owner.email || '');
}
