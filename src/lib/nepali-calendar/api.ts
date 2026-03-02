/**
 * Client-side API service for Nepali Calendar.
 *
 * All calls go through the school website's own Next.js API routes (proxy),
 * which handle caching and hide the Hamro Panchanga API key.
 */

import type {
  BsDateResult,
  BsToAdResult,
  BatchConvertResponse,
  CalendarMonthResponse,
  TodayTithiResponse,
} from './types';

// ─── In-memory session cache ──────────────────────────────────────────────────

const adToBsCache = new Map<string, BsDateResult>();
const bsToAdCache = new Map<string, BsToAdResult>();
const calendarCache = new Map<string, CalendarMonthResponse>();
let todayCache: { value: BsDateResult; cachedAt: number } | null = null;
const TODAY_CACHE_TTL = 60 * 60 * 1000; // 1 hour

// ─── AD → BS ──────────────────────────────────────────────────────────────────

/**
 * Convert a single AD date to BS.
 * Uses the school website's proxy at /api/nepali-date.
 */
export async function convertAdToBs(adDate: string): Promise<BsDateResult> {
  const cached = adToBsCache.get(adDate);
  if (cached) return cached;

  const res = await fetch(`/api/nepali-date?date=${encodeURIComponent(adDate)}`);
  if (!res.ok) {
    throw new Error(`Failed to convert date ${adDate}: ${res.statusText}`);
  }

  const data: BsDateResult = await res.json();
  adToBsCache.set(adDate, data);
  return data;
}

/**
 * Batch convert multiple AD dates to BS.
 * Uses the school website's proxy at /api/nepali-date/batch.
 */
export async function convertBatchAdToBs(dates: string[]): Promise<BsDateResult[]> {
  // Check which dates are already cached
  const uncached: string[] = [];
  const results = new Map<string, BsDateResult>();

  for (const d of dates) {
    const cached = adToBsCache.get(d);
    if (cached) {
      results.set(d, cached);
    } else {
      uncached.push(d);
    }
  }

  // Fetch uncached dates in a batch
  if (uncached.length > 0) {
    const res = await fetch('/api/nepali-date/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dates: uncached, direction: 'ad-to-bs' }),
    });

    if (!res.ok) {
      throw new Error(`Batch conversion failed: ${res.statusText}`);
    }

    const data: BatchConvertResponse = await res.json();
    for (const item of data.results) {
      if ('adDate' in item && !('error' in item)) {
        const bsResult = item as BsDateResult;
        adToBsCache.set(bsResult.adDate, bsResult);
        results.set(bsResult.adDate, bsResult);
      }
    }
  }

  // Return results in the same order as input
  return dates.map((d) => results.get(d)!).filter(Boolean);
}

// ─── BS → AD ──────────────────────────────────────────────────────────────────

/**
 * Convert a BS date to AD.
 * Uses the school website's proxy at /api/nepali-date/bs-to-ad.
 */
export async function convertBsToAd(
  year: number,
  month: number,
  day: number
): Promise<BsToAdResult> {
  const key = `${year}-${month}-${day}`;
  const cached = bsToAdCache.get(key);
  if (cached) return cached;

  const params = new URLSearchParams({ year: String(year), month: String(month), day: String(day) });
  const res = await fetch(`/api/nepali-date/bs-to-ad?${params}`);
  if (!res.ok) {
    throw new Error(`Failed to convert BS date ${key}: ${res.statusText}`);
  }

  const data: BsToAdResult = await res.json();
  bsToAdCache.set(key, data);
  return data;
}

// ─── Today ────────────────────────────────────────────────────────────────────

/**
 * Get today's date in BS.
 * Cached for 1 hour client-side.
 */
export async function getTodayBs(): Promise<BsDateResult> {
  if (todayCache && Date.now() - todayCache.cachedAt < TODAY_CACHE_TTL) {
    return todayCache.value;
  }

  const res = await fetch('/api/nepali-date/today');
  if (!res.ok) {
    throw new Error(`Failed to get today's BS date: ${res.statusText}`);
  }

  const data: BsDateResult = await res.json();
  todayCache = { value: data, cachedAt: Date.now() };
  return data;
}

// ─── Calendar Month ───────────────────────────────────────────────────────────

/**
 * Get full calendar data for a BS month.
 * Cached per year/month (immutable — a month's data never changes).
 */
export async function getCalendarMonth(
  bsYear: number,
  bsMonth: number
): Promise<CalendarMonthResponse> {
  const key = `${bsYear}-${bsMonth}`;
  const cached = calendarCache.get(key);
  if (cached) return cached;

  const params = new URLSearchParams({ year: String(bsYear), month: String(bsMonth) });
  const res = await fetch(`/api/nepali-calendar?${params}`);
  if (!res.ok) {
    throw new Error(`Failed to get calendar for ${key}: ${res.statusText}`);
  }

  const data: CalendarMonthResponse = await res.json();
  calendarCache.set(key, data);
  return data;
}

// ─── Today's Tithi ────────────────────────────────────────────────────────────

/**
 * Get today's active tithi(s).
 */
export async function getTodayTithi(): Promise<TodayTithiResponse> {
  const res = await fetch('/api/nepali-date/today-tithi');
  if (!res.ok) {
    throw new Error(`Failed to get today's tithi: ${res.statusText}`);
  }
  return res.json();
}
