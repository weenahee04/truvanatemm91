export function isNonEmptyString(v: unknown, maxLen = 500): v is string {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= maxLen;
}

export function sanitizePlainText(v: unknown, maxLen = 500): string {
  const s = String(v ?? '');
  // Remove any HTML tags and angle brackets to reduce stored XSS risk
  const noTags = s.replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
  // Remove control chars
  const clean = noTags.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  return clean.length > maxLen ? clean.slice(0, maxLen) : clean;
}

export function isSafeUrl(urlRaw: unknown): boolean {
  if (!isNonEmptyString(urlRaw, 2000)) return false;
  try {
    const u = new URL(urlRaw);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isAllowedRedirectUrl(urlRaw: unknown, allowedOrigins: string[]): boolean {
  if (!isSafeUrl(urlRaw)) return false;
  const u = new URL(String(urlRaw));
  const origin = u.origin.toLowerCase();
  return allowedOrigins.map((o) => o.toLowerCase()).includes(origin);
}

export function toInt(v: unknown, fallback: number, min?: number, max?: number): number {
  const n = Number(v);
  const i = Number.isFinite(n) ? Math.floor(n) : fallback;
  if (min !== undefined && i < min) return min;
  if (max !== undefined && i > max) return max;
  return i;
}

