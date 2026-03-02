/**
 * Next.js API route: GET /api/nepali-date?date=YYYY-MM-DD
 *
 * Proxies the Hamro Panchanga API /v1/convert/ad-to-bs endpoint.
 * Caches responses aggressively — an AD→BS mapping never changes.
 */

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEPALI_CALENDAR_API_URL || 'https://us-central1-hamropanchanga.cloudfunctions.net/api';
const API_KEY = process.env.NEPALI_CALENDAR_API_KEY || '';

// In-memory server-side cache (persists across requests within the same serverless instance)
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days — AD→BS is immutable

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date');

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'date query parameter must be YYYY-MM-DD format.' },
      { status: 400 }
    );
  }

  // Check cache
  const cacheKey = `ad-to-bs:${date}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data, {
      headers: { 'X-Cache': 'HIT' },
    });
  }

  try {
    const response = await fetch(`${API_URL}/v1/convert/ad-to-bs?date=${date}`, {
      headers: { 'X-API-Key': API_KEY },
      next: { revalidate: 86400 * 30 }, // Next.js fetch cache: 30 days
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Upstream error', message: errorData.message || response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Store in cache
    cache.set(cacheKey, { data, timestamp: Date.now() });

    return NextResponse.json(data, {
      headers: { 'X-Cache': 'MISS' },
    });
  } catch (error) {
    // If API is down, try to return stale cache
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
