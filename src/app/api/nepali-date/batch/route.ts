/**
 * Next.js API route: POST /api/nepali-date/batch
 *
 * Proxies the Hamro Panchanga API /v1/convert/batch endpoint
 * for converting multiple dates in a single round trip.
 */

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEPALI_CALENDAR_API_URL || 'https://us-central1-hamropanchanga.cloudfunctions.net/api';
const API_KEY = process.env.NEPALI_CALENDAR_API_KEY || '';

export async function POST(request: NextRequest) {
  let body: { dates?: string[]; direction?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  const { dates, direction } = body;

  if (!Array.isArray(dates) || dates.length === 0) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'dates must be a non-empty array.' },
      { status: 400 }
    );
  }

  if (dates.length > 100) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Maximum 100 dates per batch.' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${API_URL}/v1/convert/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ dates, direction: direction || 'ad-to-bs' }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Upstream error', message: errorData.message || response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Service unavailable', message: 'Nepali calendar API is unreachable.' },
      { status: 503 }
    );
  }
}
