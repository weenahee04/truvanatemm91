import { Response } from 'express';
import { db, auth } from '../config/firebase';
import { AuthRequest } from '../middleware/auth';
import { logAdminAction, getAdminLogs } from '../utils/adminLogger';

const VALID_ROLES = ['super_admin', 'accounting', 'admin_limited', 'customer', 'seller'];

/** สร้างบัญชีแอดมินใหม่ (email + password) */
export const createAdminUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'email และ password จำเป็น' });
      return;
    }
    const roleLower = (role || 'admin_limited').toLowerCase();
    if (!VALID_ROLES.includes(roleLower)) {
      res.status(400).json({ error: `Invalid role. Use: ${VALID_ROLES.join(', ')}` });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'รหัสผ่านอย่างน้อย 6 ตัวอักษร' });
      return;
    }

    const userRecord = await auth.createUser({
      email: email.trim().toLowerCase(),
      password,
      displayName: name || email.split('@')[0],
      emailVerified: false,
    });

    const uid = userRecord.uid;
    await db.collection('users').doc(uid).set(
      {
        id: uid,
        email: userRecord.email,
        name: name || userRecord.displayName || email.split('@')[0],
        role: roleLower,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    await logAdminAction(req, 'admin_create_user', { email: userRecord.email, role: roleLower, name: name || '' }, { userId: uid, email: userRecord.email });
    res.status(201).json({ success: true, uid, email: userRecord.email, role: roleLower });
  } catch (error: any) {
    console.error('Error creating admin user:', error);
    if (error?.code === 'auth/email-already-exists') {
      res.status(400).json({ error: 'อีเมลนี้มีผู้ใช้งานแล้ว' });
      return;
    }
    res.status(500).json({ error: error?.message || 'สร้างบัญชีไม่สำเร็จ' });
  }
};

/** ตั้งรหัสผ่านใหม่ (reset password) */
export const updateUserPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { password } = req.body;
    if (!userId || !password) {
      res.status(400).json({ error: 'userId และ password จำเป็น' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'รหัสผ่านอย่างน้อย 6 ตัวอักษร' });
      return;
    }

    await auth.updateUser(userId, { password });
    const targetDoc = await db.collection('users').doc(userId).get();
    const targetEmail = targetDoc.exists ? (targetDoc.data() as any)?.email : undefined;
    await logAdminAction(req, 'admin_reset_password', {}, { userId, email: targetEmail });
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating password:', error);
    if (error?.code === 'auth/user-not-found') {
      res.status(404).json({ error: 'ไม่พบผู้ใช้' });
      return;
    }
    res.status(500).json({ error: error?.message || 'ตั้งรหัสผ่านไม่สำเร็จ' });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!userId || !role) {
      res.status(400).json({ error: 'userId and role are required' });
      return;
    }

    const roleLower = String(role).toLowerCase();
    if (!VALID_ROLES.includes(roleLower)) {
      res.status(400).json({ error: `Invalid role. Use: ${VALID_ROLES.join(', ')}` });
      return;
    }

    const userRef = db.collection('users').doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const existing = doc.data() || {};
    const prevRole = (existing as any)?.role;
    await userRef.set(
      {
        ...existing,
        role: roleLower,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    await logAdminAction(req, 'admin_update_role', { fromRole: prevRole, toRole: roleLower }, { userId, email: (existing as any)?.email });
    res.json({ success: true, role: roleLower });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: error?.message || 'Failed to update role' });
  }
};

export const getLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await getAdminLogs(100);
    res.json({ logs });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to get logs' });
  }
};

export const logActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, path, details } = req.body;
    await logAdminAction(req, action || 'page_view', { path, ...(details || {}) });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to log' });
  }
};
