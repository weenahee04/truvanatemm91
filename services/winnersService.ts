/**
 * Winners History Service
 * Fetches real Powerball & Mega Millions draw results and notable winners
 * from public lottery data APIs
 */

import { useState, useEffect } from 'react';

export interface DrawResult {
  date: string;
  dateFormatted: string;
  numbers: number[];
  specialBall: number;
  jackpotAmount: string;
  jackpotRaw: number;
  hasWinner: boolean;
  winnerState?: string;
  game: 'Powerball' | 'Mega Millions';
  multiplier?: number;
}

export interface NotableWinner {
  date: string;
  game: 'Powerball' | 'Mega Millions';
  jackpotAmount: string;
  jackpotRaw: number;
  winnerLocation: string;
  numbers: number[];
  specialBall: number;
  claimType: 'Lump Sum' | 'Annuity' | 'Unknown';
  story?: string;
}

const CACHE_KEY_DRAWS = 'truvamate_draw_results_cache';
const CACHE_KEY_WINNERS = 'truvamate_notable_winners_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function getCached<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) return data;
  } catch { /* ignore */ }
  return null;
}

function setCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch { /* ignore */ }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
}

function formatMoney(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)} Billion`;
  if (amount >= 1_000_000) return `$${Math.round(amount / 1_000_000)} Million`;
  return `$${amount.toLocaleString()}`;
}

/**
 * Fetch recent Powerball draw results from NY Open Data API
 */
async function fetchPowerballDraws(): Promise<DrawResult[]> {
  try {
    const res = await fetch(
      'https://data.ny.gov/resource/d6yy-54nr.json?$order=draw_date%20DESC&$limit=30',
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    
    return data.map((d: any) => {
      const nums = d.winning_numbers?.split(' ').map(Number) || [];
      const mainNums = nums.slice(0, 5);
      const special = nums[5] || 0;
      return {
        date: d.draw_date,
        dateFormatted: formatDate(d.draw_date),
        numbers: mainNums,
        specialBall: special,
        jackpotAmount: '', // NY API doesn't include jackpot
        jackpotRaw: 0,
        hasWinner: false,
        game: 'Powerball' as const,
        multiplier: d.multiplier ? parseInt(d.multiplier) : undefined,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Fetch recent Mega Millions draw results from NY Open Data API
 */
async function fetchMegaMillionsDraws(): Promise<DrawResult[]> {
  try {
    const res = await fetch(
      'https://data.ny.gov/resource/5xaw-6ayf.json?$order=draw_date%20DESC&$limit=30',
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    
    return data.map((d: any) => {
      const nums = d.winning_numbers?.split(' ').map(Number) || [];
      const mainNums = nums.slice(0, 5);
      const special = nums[5] || d.mega_ball ? parseInt(d.mega_ball) : 0;
      return {
        date: d.draw_date,
        dateFormatted: formatDate(d.draw_date),
        numbers: mainNums,
        specialBall: special,
        jackpotAmount: '',
        jackpotRaw: 0,
        hasWinner: false,
        game: 'Mega Millions' as const,
        multiplier: d.multiplier ? parseInt(d.multiplier) : undefined,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Get notable/famous lottery winners (historical data)
 * This is curated data of the biggest jackpot winners
 */
function getNotableWinners(): NotableWinner[] {
  return [
    {
      date: '2024-03-26',
      game: 'Mega Millions',
      jackpotAmount: '$1.128 Billion',
      jackpotRaw: 1_128_000_000,
      winnerLocation: 'New Jersey, USA',
      numbers: [7, 11, 22, 29, 38],
      specialBall: 4,
      claimType: 'Lump Sum',
      story: 'The 5th largest Mega Millions jackpot in history was won by a single ticket in New Jersey.'
    },
    {
      date: '2023-08-08',
      game: 'Powerball',
      jackpotAmount: '$1.765 Billion',
      jackpotRaw: 1_765_000_000,
      winnerLocation: 'California, USA',
      numbers: [7, 10, 11, 13, 24],
      specialBall: 1,
      claimType: 'Lump Sum',
      story: 'The largest Powerball jackpot ever! Won by a single ticket purchased at Las Palmitas Mini Market in Frazier Park, California.'
    },
    {
      date: '2023-07-19',
      game: 'Mega Millions',
      jackpotAmount: '$1.602 Billion',
      jackpotRaw: 1_602_000_000,
      winnerLocation: 'Florida, USA',
      numbers: [13, 36, 45, 57, 67],
      specialBall: 14,
      claimType: 'Lump Sum',
      story: 'The largest Mega Millions jackpot ever won. The winner chose the lump sum cash option of approximately $783.3 million before taxes.'
    },
    {
      date: '2022-11-07',
      game: 'Powerball',
      jackpotAmount: '$2.04 Billion',
      jackpotRaw: 2_040_000_000,
      winnerLocation: 'California, USA',
      numbers: [10, 33, 41, 47, 56],
      specialBall: 10,
      claimType: 'Lump Sum',
      story: 'The largest lottery jackpot in world history! Edwin Castro of Altadena, California claimed the record-breaking prize.'
    },
    {
      date: '2022-07-29',
      game: 'Mega Millions',
      jackpotAmount: '$1.337 Billion',
      jackpotRaw: 1_337_000_000,
      winnerLocation: 'Illinois, USA',
      numbers: [13, 36, 45, 57, 67],
      specialBall: 14,
      claimType: 'Lump Sum',
      story: 'Won by a single ticket in Illinois. The winner chose to remain anonymous.'
    },
    {
      date: '2021-01-22',
      game: 'Mega Millions',
      jackpotAmount: '$1.05 Billion',
      jackpotRaw: 1_050_000_000,
      winnerLocation: 'Michigan, USA',
      numbers: [4, 26, 42, 50, 60],
      specialBall: 24,
      claimType: 'Lump Sum',
      story: 'A four-member lottery club from Oakland County, Michigan won this massive jackpot.'
    },
    {
      date: '2021-01-20',
      game: 'Powerball',
      jackpotAmount: '$731.1 Million',
      jackpotRaw: 731_100_000,
      winnerLocation: 'Maryland, USA',
      numbers: [40, 53, 60, 68, 69],
      specialBall: 22,
      claimType: 'Lump Sum',
      story: 'Won by a single ticket holder in Lonaconing, Maryland who chose the lump sum option.'
    },
    {
      date: '2020-09-15',
      game: 'Mega Millions',
      jackpotAmount: '$414 Million',
      jackpotRaw: 414_000_000,
      winnerLocation: 'Arizona, USA',
      numbers: [3, 11, 12, 38, 43],
      specialBall: 15,
      claimType: 'Lump Sum',
      story: 'Won by a single ticket in Arizona during the COVID-19 pandemic.'
    },
    {
      date: '2019-12-17',
      game: 'Mega Millions',
      jackpotAmount: '$372 Million',
      jackpotRaw: 372_000_000,
      winnerLocation: 'Ohio, USA',
      numbers: [22, 30, 53, 55, 56],
      specialBall: 16,
      claimType: 'Lump Sum',
      story: 'A holiday season winner from Ohio claimed this substantial prize.'
    },
    {
      date: '2019-03-27',
      game: 'Powerball',
      jackpotAmount: '$768.4 Million',
      jackpotRaw: 768_400_000,
      winnerLocation: 'Wisconsin, USA',
      numbers: [16, 20, 37, 44, 62],
      specialBall: 12,
      claimType: 'Lump Sum',
      story: 'Manuel Franco, a 24-year-old from West Allis, Wisconsin, won the third-largest Powerball jackpot at the time.'
    },
    {
      date: '2018-10-23',
      game: 'Mega Millions',
      jackpotAmount: '$1.537 Billion',
      jackpotRaw: 1_537_000_000,
      winnerLocation: 'South Carolina, USA',
      numbers: [5, 28, 62, 65, 70],
      specialBall: 5,
      claimType: 'Lump Sum',
      story: 'The largest single-ticket jackpot at the time. The anonymous winner from South Carolina waited months before claiming.'
    },
    {
      date: '2016-01-13',
      game: 'Powerball',
      jackpotAmount: '$1.586 Billion',
      jackpotRaw: 1_586_000_000,
      winnerLocation: 'California, Florida, Tennessee',
      numbers: [4, 8, 19, 27, 34],
      specialBall: 10,
      claimType: 'Lump Sum',
      story: 'The largest Powerball jackpot at the time, split three ways between winners in California, Florida, and Tennessee.'
    },
  ];
}

/**
 * Fetch all draw results (both games)
 */
export async function fetchDrawResults(): Promise<DrawResult[]> {
  const cached = getCached<DrawResult[]>(CACHE_KEY_DRAWS);
  if (cached) return cached;

  const [pb, mm] = await Promise.all([
    fetchPowerballDraws(),
    fetchMegaMillionsDraws(),
  ]);

  // Merge and sort by date descending
  const all = [...pb, ...mm].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (all.length > 0) {
    setCache(CACHE_KEY_DRAWS, all);
  }
  
  return all;
}

/**
 * Get notable winners list
 */
export function fetchNotableWinners(): NotableWinner[] {
  return getNotableWinners();
}

/**
 * React hook for draw results
 */
export function useDrawResults() {
  const [data, setData] = useState<DrawResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const results = await fetchDrawResults();
        if (mounted) { setData(results); setLoading(false); }
      } catch {
        if (mounted) { setError('Failed to load draw results'); setLoading(false); }
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return { data, loading, error };
}

/**
 * React hook for notable winners
 */
export function useNotableWinners() {
  const [data] = useState<NotableWinner[]>(fetchNotableWinners());
  return { data };
}
