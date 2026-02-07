import { Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { AuthRequest } from '../middleware/auth';

const DOC_PATH = 'payment_settings';
const DOC_ID = 'payment_settings';

export const getPaymentSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    const doc = await db.collection(DOC_PATH).doc(DOC_ID).get();
    const settings = doc.exists ? doc.data() : null;
    return res.json({ success: true, settings: settings || {} });
  } catch (error) {
    next(error);
  }
};

export const updatePaymentSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    const { settings } = req.body;
    if (!settings) return res.status(400).json({ error: 'Settings object required' });
    await db.collection(DOC_PATH).doc(DOC_ID).set(
      { ...settings, updatedAt: new Date().toISOString(), updatedBy: req.user?.uid },
      { merge: true }
    );
    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
