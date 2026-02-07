export const MAX_FAILED_ATTEMPTS = 10;
export const LOCK_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

type LockRecord = {
  failedCount: number;
  firstFailedAt: number; // ms
  lockedUntil?: number; // ms
};

const keyForEmail = (email: string) => `truvamate_login_lock_${email.trim().toLowerCase()}`;

const readRecord = (email: string): LockRecord | null => {
  try {
    const raw = localStorage.getItem(keyForEmail(email));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LockRecord>;
    const failedCount = Number(parsed.failedCount ?? 0);
    const firstFailedAt = Number(parsed.firstFailedAt ?? 0);
    const lockedUntil = parsed.lockedUntil !== undefined ? Number(parsed.lockedUntil) : undefined;

    if (!Number.isFinite(failedCount) || !Number.isFinite(firstFailedAt)) return null;
    if (failedCount < 0 || firstFailedAt <= 0) return null;

    const rec: LockRecord = { failedCount, firstFailedAt };
    if (lockedUntil !== undefined && Number.isFinite(lockedUntil) && lockedUntil > 0) rec.lockedUntil = lockedUntil;
    return rec;
  } catch {
    return null;
  }
};

const writeRecord = (email: string, rec: LockRecord | null) => {
  const k = keyForEmail(email);
  if (!rec) {
    localStorage.removeItem(k);
    return;
  }
  localStorage.setItem(k, JSON.stringify(rec));
};

export function resetLoginLockout(email: string) {
  writeRecord(email, null);
}

export function getLoginLockoutStatus(email: string, now: number = Date.now()) {
  const rec = readRecord(email);
  if (!rec) {
    return {
      locked: false,
      lockedUntil: null as number | null,
      failedCount: 0,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
    };
  }

  // Reset window if first failure was more than 24h ago
  if (rec.firstFailedAt && now - rec.firstFailedAt > LOCK_DURATION_MS) {
    writeRecord(email, null);
    return {
      locked: false,
      lockedUntil: null,
      failedCount: 0,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
    };
  }

  const lockedUntil = rec.lockedUntil ?? null;
  const locked = lockedUntil !== null && now < lockedUntil;
  const failedCount = rec.failedCount || 0;
  const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - failedCount);

  // If lock expired, reset
  if (!locked && lockedUntil !== null && now >= lockedUntil) {
    writeRecord(email, null);
    return {
      locked: false,
      lockedUntil: null,
      failedCount: 0,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
    };
  }

  return { locked, lockedUntil, failedCount, remainingAttempts };
}

export function recordLoginFailure(email: string, now: number = Date.now()) {
  const current = readRecord(email);

  // If no record or window expired, start fresh
  let rec: LockRecord;
  if (!current || (current.firstFailedAt && now - current.firstFailedAt > LOCK_DURATION_MS)) {
    rec = { failedCount: 1, firstFailedAt: now };
  } else if (current.lockedUntil && now < current.lockedUntil) {
    // Already locked
    rec = current;
  } else {
    rec = {
      failedCount: (current.failedCount || 0) + 1,
      firstFailedAt: current.firstFailedAt || now,
    };
  }

  if (rec.failedCount >= MAX_FAILED_ATTEMPTS) {
    rec.lockedUntil = now + LOCK_DURATION_MS;
  }

  writeRecord(email, rec);
  return getLoginLockoutStatus(email, now);
}

export function isStaffEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith('@truvamate.com');
}

