import {
  canAccessAccountingPages,
  canAccessPaymentSettings,
  canAccessTicketPricing,
  canViewExchangeRateLogs,
  isAdminPanelRole,
  normalizeRole,
} from './rbac';

/**
 * กำหนดว่า role นี้เห็นเมนู path นี้หรือไม่
 * ไม่โชว์เมนูที่ role ไม่มีสิทธิ์
 */
export function canSeeAdminNavPath(role: unknown, path: string): boolean {
  // ไม่ใช่ path admin = แสดง (เช่น กลับหน้าหลัก /)
  if (!path.startsWith('/admin')) return true;
  if (path === '/admin/login') return true;

  if (!isAdminPanelRole(role)) return false;
  const r = normalizeRole(role);

  // Admin management — เฉพาะ super_admin
  if (path === '/admin/management' || path === '/admin/admins') {
    return r === 'super_admin';
  }

  // Accounting: เฉพาะ การเงิน + ออกบิล + กลับหน้าหลัก
  if (r === 'accounting') {
    return path === '/admin/payments' || path === '/admin/billing' || path === '/';
  }

  // Admin (จำกัดสิทธิ์): เฉพาะ Order, OCR, ลูกค้า + กลับหน้าหลัก
  if (r === 'admin') {
    return (
      path === '/admin/lotto-orders' ||
      path === '/admin/ocr-scanner' ||
      path === '/admin/users' ||
      path === '/'
    );
  }

  // super_admin เท่านั้น (หรือ accounting ผ่าน block ด้านบนแล้ว)
  if (path === '/admin/ticket-pricing') return canAccessTicketPricing(role);
  if (path === '/admin/payment-settings') return canAccessPaymentSettings(role);
  if (path === '/admin/exchange-rate') return canViewExchangeRateLogs(role);
  if (path === '/admin/payments' || path === '/admin/billing') return canAccessAccountingPages(role);

  // Dashboard, users, sellers, lotto, referrals, location, photos, OCR — เฉพาะ super_admin
  const superAdminOnlyPaths = [
    '/admin/dashboard',
    '/admin/users',
    '/admin/sellers',
    '/admin/lotto-orders',
    '/admin/referrals',
    '/admin/location',
    '/admin/photo-upload',
    '/admin/drive-photos',
    '/admin/ocr-scanner',
  ];
  if (superAdminOnlyPaths.includes(path)) return r === 'super_admin';

  // Hero & Banners (/admin), ตั้งค่าระบบ — เฉพาะ super_admin
  if (path === '/admin' || path === '/admin/settings') {
    return r === 'super_admin';
  }

  // path อื่นที่ยังไม่ได้กำหนด = ไม่โชว์ (deny by default)
  return false;
}
