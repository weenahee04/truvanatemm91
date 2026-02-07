const SESSION_EXPIRES_AT_KEY = 'truvamate_session_expires_at';

export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function setSessionExpiry(durationMs: number = SESSION_DURATION_MS): number {
  const expiresAt = Date.now() + durationMs;
  localStorage.setItem(SESSION_EXPIRES_AT_KEY, String(expiresAt));
  return expiresAt;
}

export function getSessionExpiresAt(): number | null {
  const raw = localStorage.getItem(SESSION_EXPIRES_AT_KEY);
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function clearSessionExpiry(): void {
  localStorage.removeItem(SESSION_EXPIRES_AT_KEY);
}

export function isSessionExpired(now: number = Date.now()): boolean {
  const expiresAt = getSessionExpiresAt();
  if (!expiresAt) return false;
  return now >= expiresAt;
}

export function getSessionRemainingMs(now: number = Date.now()): number | null {
  const expiresAt = getSessionExpiresAt();
  if (!expiresAt) return null;
  return Math.max(0, expiresAt - now);
}

