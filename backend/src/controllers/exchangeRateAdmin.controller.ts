import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getExchangeRateDb, refreshAndPersistExchangeRate } from '../services/exchangeRate.service';
import { logger } from '../utils/logger';

export const refreshExchangeRateNow = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const db = getExchangeRateDb();
    if (!db) return res.status(503).json({ error: 'Database not available' });

    const snap = await refreshAndPersistExchangeRate({
      logType: 'manual',
      reason: 'manual_refresh',
      byUid: req.user?.uid || null,
      byRole: String(req.user?.role || ''),
      ip: req.ip,
      userAgent: req.headers['user-agent'] || '',
    });

    return res.json({ success: true, data: snap });
  } catch (error) {
    logger.error('Error refreshing exchange rate:', error);
    return next(error);
  }
};

export const getExchangeRateLogs = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const db = getExchangeRateDb();
    if (!db) return res.status(503).json({ error: 'Database not available' });

    const snapshot = await db.collection('exchange_rate_logs').orderBy('at', 'desc').limit(200).get();
    const logs = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    return res.json({ success: true, logs });
  } catch (error) {
    logger.error('Error reading exchange rate logs:', error);
    return next(error);
  }
};

