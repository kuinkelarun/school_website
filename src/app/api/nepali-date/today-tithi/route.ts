/**
 * Next.js API route: GET /api/nepali-date/today-tithi
 *
 * Proxies the Hamro Panchanga API /v1/tithi/today endpoint.
 * Cached for 1 hour.
 */

import { NextResponse } from 'next/server';

const API_URL = process.env.NEPALI_CALENDAR_API_URL || 'https://us-central1-hamropanchanga.cloudfunctions.net/api';
const API_KEY = process.env.NEPALI_CALENDAR_API_KEY || '';

let tithiCache: { data: unknown; cachedAt: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  if (tithiCache && Date.now() - tithiCache.cachedAt < CACHE_TTL) {
    return NextResponse.json(tithiCache.data, {
      headers: { 'X-Cache': 'HIT' },
    });
  }

  try {
    const response = await fetch(`${API_URL}/v1/tithi/today`, {
      headers: { 'X-API-Key': API_KEY },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Upstream error', message: errorData.message || response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();
    tithiCache = { data, cachedAt: Date.now() };

    return NextResponse.json(data, {
      headers: { 'X-Cache': 'MISS' },
    });
  } catch {
    if (tithiCache) {
      return NextResponse.json(tithiCache.data, {
        headers: { 'X-Cache': 'STALE' },
      });
    }

    return NextResponse.json(
      { error: 'Service unavailable', message: 'Nepali calendar API is unreachable.' },
      { status: 503 }
    );
  }
}
