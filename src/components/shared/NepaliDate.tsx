/**
 * <NepaliDate /> — Renders a BS (Bikram Sambat) date from any AD date value.
 *
 * Handles async API conversion with a loading skeleton and error fallback.
 * Usage: <NepaliDate date={event.startDate} locale={locale} />
 */

'use client';

import { useNepaliDate } from '@/hooks/useNepaliDate';
import { formatBsDate } from '@/lib/nepali-calendar/format';
import { toDateSafe, formatDate } from '@/lib/utils';

interface NepaliDateProps {
  /** Any date-like value: Firestore Timestamp, Date, ISO string, epoch ms */
  date: unknown;
  /** 'en' or 'ne' — controls month name language and numeral style */
  locale?: string;
  /** 'long' = "16 Falgun 2082" | 'short' = "16 Fal 2082" */
  format?: 'long' | 'short';
  /** Optional CSS class for the outer span */
  className?: string;
  /** If true, show AD date as fallback while loading (instead of skeleton) */
  showAdWhileLoading?: boolean;
}

export function NepaliDate({
  date,
  locale = 'en',
  format = 'long',
  className,
  showAdWhileLoading = false,
}: NepaliDateProps) {
  const { bsDate, loading, error } = useNepaliDate(date);

  // Loading state
  if (loading) {
    if (showAdWhileLoading) {
      const dateObj = toDateSafe(date);
      if (!isNaN(dateObj.getTime())) {
        return <span className={className}>{formatDate(dateObj, locale)}</span>;
      }
    }
    return (
      <span className={`inline-block h-4 w-24 animate-pulse rounded bg-muted ${className || ''}`} />
    );
  }

  // Error or no result — fall back to AD date
  if (error || !bsDate) {
    const dateObj = toDateSafe(date);
    if (!isNaN(dateObj.getTime())) {
      return <span className={className}>{formatDate(dateObj, locale)}</span>;
    }
    return null;
  }

  return <span className={className}>{formatBsDate(bsDate, locale, format)}</span>;
}
