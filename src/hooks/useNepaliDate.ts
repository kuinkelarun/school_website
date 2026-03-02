/**
 * React hook for converting dates from AD to BS via the Nepali Calendar API.
 *
 * useNepaliDate  — single date
 * useNepaliDates — batch of dates (for list pages)
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import type { BsDateResult } from '@/lib/nepali-calendar/types';
import { convertAdToBs, convertBatchAdToBs } from '@/lib/nepali-calendar/api';
import { toDateSafe, toLocalDateString } from '@/lib/utils';

/**
 * Safely extract a YYYY-MM-DD AD date string from any date-like input.
 * If the value is already a plain YYYY-MM-DD string, it is returned as-is
 * to avoid the UTC-midnight re-parsing trap (new Date("YYYY-MM-DD") = UTC midnight).
 * For full timestamps / Firestore Timestamps, local-timezone extraction is used.
 */
function extractAdDateString(date: unknown): string {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const obj = toDateSafe(date);
  return isNaN(obj.getTime()) ? '' : toLocalDateString(obj);
}

/**
 * Convert a single Firestore Timestamp / Date / string to BS.
 */
export function useNepaliDate(date: unknown): {
  bsDate: BsDateResult | null;
  loading: boolean;
  error: Error | null;
} {
  const [bsDate, setBsDate] = useState<BsDateResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Stabilise the date to YYYY-MM-DD string
  const adDateStr = extractAdDateString(date);

  useEffect(() => {
    if (!adDateStr) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    convertAdToBs(adDateStr)
      .then((result) => {
        if (!cancelled) {
          setBsDate(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [adDateStr]);

  return { bsDate, loading, error };
}

/**
 * Batch-convert multiple Firestore Timestamps / Dates / strings to BS.
 * Ideal for list pages showing multiple dates.
 */
export function useNepaliDates(dates: unknown[]): {
  bsDates: Map<string, BsDateResult>;
  loading: boolean;
  error: Error | null;
} {
  const [bsDates, setBsDates] = useState<Map<string, BsDateResult>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Convert all inputs to YYYY-MM-DD strings, dedup
  const adDateStrs = dates
    .map((d) => extractAdDateString(d))
    .filter(Boolean);

  const uniqueDates = [...new Set(adDateStrs)];
  const datesKey = uniqueDates.join(',');

  // Track if the component is still mounted
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (uniqueDates.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    convertBatchAdToBs(uniqueDates)
      .then((results) => {
        if (!mountedRef.current) return;
        const map = new Map<string, BsDateResult>();
        for (const r of results) {
          if (r?.adDate) map.set(r.adDate, r);
        }
        setBsDates(map);
        setLoading(false);
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        setError(err);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datesKey]);

  return { bsDates, loading, error };
}
