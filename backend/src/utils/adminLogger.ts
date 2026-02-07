import { Request } from 'express';
import { db } from '../config/firebase';
import { AuthRequest } from '../middleware/auth';

export interface AdminLogEntry {
  adminUid: string;
  adminEmail?: string;
  adminRole?: string;
  action: string;
  details?: Record<string, unknown>;
  targetUserId?: string;
  targetEmail?: string;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}

export async function logAdminAction(
  req: AuthRequest | Request,
  action: string,
  details?: Record<string, unknown>,
  target?: { userId?: string; email?: string }
): Promise<void> {
  try {
    if (!db) return;
    const ar = req as AuthRequest;
    const ip = ar.ip || (ar.headers && (ar.headers['x-forwarded-for'] as string)) || (ar.headers && (ar.headers['x-real-ip'] as string));
    const entry: AdminLogEntry = {
      adminUid: ar.user?.uid || 'unknown',
      adminEmail: ar.user?.email,
      adminRole: ar.user?.role,
      action,
      details: details || {},
      targetUserId: target?.userId,
      targetEmail: target?.email,
      ip: ip || undefined,
      userAgent: ar.get?.('user-agent') || (ar.headers && ar.headers['user-agent'] as string),
      timestamp: new Date().toISOString(),
    };
    await db.collection('admin_logs').add(entry);
  } catch (e) {
    console.error('[adminLogger] Failed to log:', e);
  }
}

export async function getAdminLogs(limit = 100): Promise<AdminLogEntry[]> {
  try {
    if (!db) return [];
    const snapshot = await db.collection('admin_logs')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as AdminLogEntry & { id: string }));
  } catch (e) {
    console.error('[adminLogger] Failed to get logs:', e);
    return [];
  }
}
