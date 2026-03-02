/**
 * Pure formatting functions for BS (Bikram Sambat) dates.
 * These take already-converted BsDateResult objects and produce display strings.
 * No API calls — just string formatting.
 */

import type { BsDateResult } from './types';
import { toNepaliNumber, NEPALI_MONTHS, NEPALI_MONTHS_NP } from './constants';

/**
 * Format a BS date result for display.
 *
 * locale='en': "16 Falgun 2082"
 * locale='ne': "१६ फाल्गुन २०८२"
 *
 * format='short': uses abbreviated month (first 3 chars for English)
 */
export function formatBsDate(
  bsDate: BsDateResult,
  locale: string = 'en',
  format: 'long' | 'short' = 'long'
): string {
  const { bsDay, bsMonth, bsYear } = bsDate;

  if (locale === 'ne') {
    const monthName = NEPALI_MONTHS_NP[bsMonth - 1] || '';
    return `${toNepaliNumber(bsDay)} ${monthName} ${toNepaliNumber(bsYear)}`;
  }

  const monthName = NEPALI_MONTHS[bsMonth - 1] || '';
  const displayMonth = format === 'short' ? monthName.slice(0, 3) : monthName;
  return `${bsDay} ${displayMonth} ${bsYear}`;
}

/**
 * Format a BS date as "YYYY-MM-DD" string (English digits).
 */
export function formatBsDateISO(bsDate: BsDateResult): string {
  const { bsYear, bsMonth, bsDay } = bsDate;
  return `${bsYear}-${String(bsMonth).padStart(2, '0')}-${String(bsDay).padStart(2, '0')}`;
}

/**
 * Format a BS date as "YYYY-MM-DD" string with Nepali numerals.
 */
export function formatBsDateISONepali(bsDate: BsDateResult): string {
  return toNepaliNumber(formatBsDateISO(bsDate));
}
