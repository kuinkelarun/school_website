/**
 * Next.js API route: GET /api/nepali-date/today
 *
 * Proxies the Hamro Panchanga API /v1/today endpoint.
 * Cached with a shorter TTL since "today" changes daily.
 */

import { NextResponse } from 'next/server';

const API_URL = process.env.NEPALI_CALENDAR_API_URL || 'https://us-central1-hamropanchanga.cloudfunctions.net/api';
const API_KEY = process.env.NEPALI_CALENDAR_API_KEY || '';

let todayCache: { data: unknown; cachedAt: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  if (todayCache && Date.now() - todayCache.cachedAt < CACHE_TTL) {
    return NextResponse.json(todayCache.data, {
      headers: { 'X-Cache': 'HIT' },
    });
  }

  try {
    const response = await fetch(`${API_URL}/v1/today`, {
      headers: { 'X-API-Key': API_KEY },
      next: { revalidate: 3600 }, // 1 hour
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Upstream error', message: errorData.message || response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();
    todayCache = { data, cachedAt: Date.now() };

    return NextResponse.json(data, {
      headers: { 'X-Cache': 'MISS' },
    });
  } catch {
    if (todayCache) {
      return NextResponse.json(todayCache.data, {
        headers: { 'X-Cache': 'STALE' },
      });
    }

    return NextResponse.json(
      { error: 'Service unavailable', message: 'Nepali calendar API is unreachable.' },
      { status: 503 }
    );
  }
}
