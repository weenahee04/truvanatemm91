export type NormalizedRole = 'user' | 'seller' | 'super_admin' | 'admin' | 'accounting';

/**
 * Role mapping:
 *   - Super Admin (เต็มสิทธิ์)  -> "super_admin" / "superadmin"
 *   - Admin (จำกัดสิทธิ์)      -> "admin" / "admin_limited"
 *   - Accounting               -> "accounting" / "admin_account"
 */
export function normalizeRole(rawRole: unknown): NormalizedRole {
  const v = String(rawRole ?? '').trim();
  const lower = v.toLowerCase();

  if (!lower) return 'user';

  // Super Admin เท่านั้น (เต็มสิทธิ์ - เห็นทุกอย่าง)
  if (lower === 'super_admin' || lower === 'superadmin' || lower === 'super-admin') {
    return 'super_admin';
  }

  // Admin (จำกัดสิทธิ์ - ไม่เห็น Admin management)
  if (lower === 'admin' || lower === 'admin_limited' || lower === 'admin-limited' || lower === 'limited_admin' || lower === 'limited-admin') {
    return 'admin';
  }

  // Accounting — รวม admin_account ใช้สิทธิ์เดียวกับ accounting
  if (lower === 'accounting' || lower === 'admin_account') return 'accounting';
  if (lower === 'seller') return 'seller';

  // Some parts of the app used 'customer' / BUYER historically
  if (lower === 'customer' || lower === 'buyer') return 'user';

  return 'user';
}

export function isAdminPanelRole(role: unknown): boolean {
  const r = normalizeRole(role);
  return r === 'super_admin' || r === 'admin' || r === 'accounting';
}

export function canAccessTicketPricing(role: unknown): boolean {
  const r = normalizeRole(role);
  return r === 'super_admin' || r === 'accounting';
}

export function canEditTicketPricing(role: unknown): boolean {
  return normalizeRole(role) === 'super_admin';
}

export function canAccessPaymentSettings(role: unknown): boolean {
  const r = normalizeRole(role);
  return r === 'super_admin' || r === 'accounting';
}

export function canEditPaymentSettings(role: unknown): boolean {
  return normalizeRole(role) === 'super_admin';
}

export function canAccessAccountingPages(role: unknown): boolean {
  const r = normalizeRole(role);
  return r === 'super_admin' || r === 'accounting';
}

export function canManageAdmins(role: unknown): boolean {
  return normalizeRole(role) === 'super_admin';
}

export function canRefreshExchangeRate(role: unknown): boolean {
  const r = normalizeRole(role);
  return r === 'super_admin' || r === 'accounting';
}

export function canViewExchangeRateLogs(role: unknown): boolean {
  const r = normalizeRole(role);
  return r === 'super_admin' || r === 'accounting';
}

