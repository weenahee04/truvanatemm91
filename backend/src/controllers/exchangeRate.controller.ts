import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { getExchangeRateDb, readLatestExchangeRateSnapshot, readMarginTHB, fetchUsdToThbFromFrankfurter, writeExchangeRateSnapshot } from '../services/exchangeRate.service';

/**
 * Get current exchange rate with margin
 * GET /api/exchange-rate
 */
export const getExchangeRate = async (req: Request, res: Response) => {
  try {
    const db = getExchangeRateDb();
    if (!db) {
      return res.status(503).json({ success: false, error: 'Database not available' });
    }

    // 1) Try live API
    try {
      const { baseRate, apiDate } = await fetchUsdToThbFromFrankfurter();
      const marginTHB = await readMarginTHB(db);
      const finalRate = baseRate + marginTHB;
      const fetchedAt = new Date().toISOString();

      // Cache latest snapshot (no log here to avoid spamming; daily scheduler writes logs)
      await writeExchangeRateSnapshot(
        db,
        { baseRate, marginTHB, finalRate, fetchedAt, source: 'frankfurter.app', apiDate },
        { writeLog: false }
      );

      return res.json({
        success: true,
        data: {
          baseRate,
          marginTHB,
          finalRate,
          lastUpdated: fetchedAt,
          source: 'frankfurter.app',
          stale: false,
        },
      });
    } catch (apiErr: any) {
      const apiError = apiErr?.message || String(apiErr);
      logger.warn('Exchange rate API failed, falling back to cached snapshot:', apiError);

      // 2) Fallback: cached snapshot
      const cached = await readLatestExchangeRateSnapshot(db);
      if (!cached) {
        return res.status(503).json({
          success: false,
          error: 'Failed to fetch exchange rate and no cached rate is available',
          message: apiError,
        });
      }

      return res.json({
        success: true,
        data: {
          baseRate: cached.baseRate,
          marginTHB: cached.marginTHB,
          finalRate: cached.finalRate,
          lastUpdated: cached.fetchedAt,
          source: 'cache',
          stale: true,
          fallbackReason: apiError,
        },
      });
    }
  } catch (error: any) {
    logger.error('Error fetching exchange rate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch exchange rate',
      message: error.message,
    });
  }
};
