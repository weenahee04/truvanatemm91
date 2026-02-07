import { db, financeDb } from '../config/firebase';

const FRANKFURTER_URL = 'https://api.frankfurter.app/latest?from=USD&to=THB';

export function getExchangeRateDb(): any {
  return financeDb || db;
}

export async function readMarginTHB(firestore: any): Promise<number> {
  if (!firestore) return 0;
  try {
    const snap = await firestore.collection('settings').doc('lotto-pricing').get();
    const data = snap.exists ? snap.data() : {};
    return Number(data?.marginTHB) || 0;
  } catch {
    return 0;
  }
}

export async function fetchUsdToThbFromFrankfurter(): Promise<{ baseRate: number; apiDate: string }> {
  const res = await fetch(FRANKFURTER_URL);
  const json = (await res.json()) as { rates?: { THB?: number }; date?: string };
  const rate = json?.rates?.THB;
  if (!rate || typeof rate !== 'number') throw new Error('Invalid Frankfurter response');
  return { baseRate: rate, apiDate: json.date || new Date().toISOString().slice(0, 10) };
}

export async function readLatestExchangeRateSnapshot(firestore: any): Promise<{
  baseRate: number;
  marginTHB: number;
  finalRate: number;
  fetchedAt: string;
} | null> {
  if (!firestore) return null;
  try {
    const snap = await firestore.collection('exchange_rate_snapshots').orderBy('fetchedAt', 'desc').limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const d = doc.data();
    return {
      baseRate: Number(d.baseRate) || 35,
      marginTHB: Number(d.marginTHB) || 0,
      finalRate: Number(d.finalRate) || 35,
      fetchedAt: d.fetchedAt || '',
    };
  } catch {
    return null;
  }
}

export async function writeExchangeRateSnapshot(
  firestore: any,
  data: { baseRate: number; marginTHB: number; finalRate: number; fetchedAt: string; source: string; apiDate?: string },
  opts?: { writeLog?: boolean }
): Promise<void> {
  if (!firestore) return;
  await firestore.collection('exchange_rate_snapshots').add(data);
  if (opts?.writeLog !== false) {
    await firestore.collection('exchange_rate_logs').add({
      at: new Date().toISOString(),
      baseRate: data.baseRate,
      marginTHB: data.marginTHB,
      finalRate: data.finalRate,
      source: data.source,
    });
  }
}

export async function writeExchangeRateFailureLog(
  firestore: any,
  errorMessage: string,
  meta?: { logType?: string; reason?: string }
): Promise<void> {
  if (!firestore) return;
  await firestore.collection('exchange_rate_logs').add({
    at: new Date().toISOString(),
    error: errorMessage,
    type: 'failure',
    ...meta,
  });
}

export interface RefreshExchangeRateOptions {
  logType?: string;
  reason?: string;
  byUid?: string | null;
  byRole?: string;
  ip?: string;
  userAgent?: string;
}

export async function refreshAndPersistExchangeRate(opts?: RefreshExchangeRateOptions): Promise<{
  baseRate: number;
  marginTHB: number;
  finalRate: number;
  fetchedAt: string;
}> {
  const firestore = getExchangeRateDb();
  if (!firestore) throw new Error('Database not available');
  const { baseRate, apiDate } = await fetchUsdToThbFromFrankfurter();
  const marginTHB = await readMarginTHB(firestore);
  const finalRate = baseRate + marginTHB;
  const fetchedAt = new Date().toISOString();
  await writeExchangeRateSnapshot(
    firestore,
    { baseRate, marginTHB, finalRate, fetchedAt, source: 'frankfurter.app', apiDate },
    { writeLog: true }
  );
  return { baseRate, marginTHB, finalRate, fetchedAt };
}
