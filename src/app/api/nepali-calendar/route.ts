/**
 * Next.js API route: GET /api/nepali-calendar?year=&month=
 *
 * Proxies the Hamro Panchanga API /v1/calendar/:year/:month endpoint.
 * Caches per BS year/month — a month's calendar data is immutable
 * (once populated in Firestore, day mappings don't change).
 */

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEPALI_CALENDAR_API_URL || 'https://us-central1-hamropanchanga.cloudfunctions.net/api';
const API_KEY = process.env.NEPALI_CALENDAR_API_KEY || '';

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days (tithis can be updated)

export async function GET(request: NextRequest) {
  const year = request.nextUrl.searchParams.get('year');
  const month = request.nextUrl.searchParams.get('month');

  if (!year || !month) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'year and month query parameters are required.' },
      { status: 400 }
    );
  }

  const cacheKey = `calendar:${year}-${month}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data, {
      headers: { 'X-Cache': 'HIT' },
    });
  }

  try {
    const response = await fetch(`${API_URL}/v1/calendar/${year}/${month}`, {
      headers: { 'X-API-Key': API_KEY },
      next: { revalidate: 86400 }, // 1 day
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Upstream error', message: errorData.message || response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();
    cache.set(cacheKey, { data, timestamp: Date.now() });

    return NextResponse.json(data, {
      headers: { 'X-Cache': 'MISS' },
    });
  } catch {
    if (cached) {
      return NextResponse.json(cached.data, {
        headers: { 'X-Cache': 'STALE' },
      });
    }

    return NextResponse.json(
      { error: 'Service unavailable', message: 'Nepali calendar API is unreachable.' },
      { status: 503 }
    );
  }
}
