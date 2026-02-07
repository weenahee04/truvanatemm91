import { logger } from '../utils/logger';
import { getExchangeRateDb, refreshAndPersistExchangeRate, writeExchangeRateFailureLog } from '../services/exchangeRate.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7

function msUntilNextBangkokRun(hour: number, minute: number): number {
  const now = Date.now();
  const bangkokNow = new Date(now + BANGKOK_OFFSET_MS);

  const y = bangkokNow.getUTCFullYear();
  const m = bangkokNow.getUTCMonth();
  const d = bangkokNow.getUTCDate();

  // target in Bangkok "shifted" time, then convert back to real epoch
  let targetEpoch = Date.UTC(y, m, d, hour, minute, 0, 0) - BANGKOK_OFFSET_MS;
  if (targetEpoch <= now) targetEpoch += DAY_MS;
  return targetEpoch - now;
}

export function startExchangeRateScheduler(opts?: { runOnStartup?: boolean }): void {
  const enabled = String(process.env.ENABLE_EXCHANGE_RATE_SCHEDULER ?? 'true').toLowerCase() !== 'false';
  if (!enabled) {
    logger.info('Exchange rate scheduler disabled (ENABLE_EXCHANGE_RATE_SCHEDULER=false)');
    return;
  }

  const db = getExchangeRateDb();
  if (!db) {
    logger.warn('Exchange rate scheduler: database not available, skipping');
    return;
  }

  const run = async (type: 'startup' | 'scheduled') => {
    try {
      const snap = await refreshAndPersistExchangeRate({
        logType: type,
        reason: type === 'startup' ? 'startup_refresh' : 'daily_refresh',
      });
      logger.info(`✅ Exchange rate ${type} refresh: base=${snap.baseRate} margin=${snap.marginTHB} final=${snap.finalRate}`);
    } catch (e: any) {
      const msg = e?.message || String(e);
      logger.error(`❌ Exchange rate ${type} refresh failed:`, msg);
      try {
        await writeExchangeRateFailureLog(db, msg, {
          logType: 'scheduled_failed',
          reason: type === 'startup' ? 'startup_refresh_failed' : 'daily_refresh_failed',
        });
      } catch (logErr: any) {
        logger.warn('Failed to write exchange rate failure log:', logErr?.message || logErr);
      }
    }
  };

  if (opts?.runOnStartup !== false) {
    run('startup').catch(() => undefined);
  }

  // Run daily at 00:05 Bangkok time
  const delay = msUntilNextBangkokRun(0, 5);
  logger.info(`Exchange rate scheduler: next run in ${Math.round(delay / 1000)}s (00:05 Bangkok time)`);

  setTimeout(() => {
    run('scheduled').catch(() => undefined);
    setInterval(() => run('scheduled').catch(() => undefined), DAY_MS);
  }, delay);
}

