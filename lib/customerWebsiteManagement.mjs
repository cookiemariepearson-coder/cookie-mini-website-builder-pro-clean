const clean = value => String(value || '').trim();
const lower = value => clean(value).toLowerCase();

export function websiteDisplayName(site = {}) {
  return clean(site.business_name || site.site?.businessName || site.slug || 'Website');
}

export function websiteConfirmationValue(value = '') {
  return clean(value).replace(/\s+/g, ' ').toLocaleLowerCase('en-US');
}

export function websiteDeletionConfirmationMatches(site = {}, confirmation = '') {
  const expected = websiteConfirmationValue(websiteDisplayName(site));
  return Boolean(expected && websiteConfirmationValue(confirmation) === expected);
}

export function isCustomerDeletedWebsite(site = {}) {
  return lower(site.status) === 'deleted' || Boolean(site.customer_deleted_at);
}

export function unpublishedWebsiteUpdate(site = {}, changedAt = new Date().toISOString()) {
  const savedSite = site.site && typeof site.site === 'object' ? site.site : {};
  return {
    status: 'draft',
    site: { ...savedSite, status: 'draft' },
    customer_unpublished_at: changedAt,
    updated_at: changedAt
  };
}

export function deletedWebsiteUpdate(site = {}, changedAt = new Date().toISOString()) {
  const savedSite = site.site && typeof site.site === 'object' ? site.site : {};
  return {
    status: 'deleted',
    site: { ...savedSite, status: 'deleted' },
    customer_deleted_at: changedAt,
    updated_at: changedAt
  };
}

export function customerWebsiteStatus(site = {}) {
  const status = lower(site.status || site.site?.status || 'draft');
  const access = lower(site.access_status || 'active');
  return status === 'published' && access === 'active' ? 'published' : 'unpublished';
}
