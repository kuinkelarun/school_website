import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely convert any date-like value to a JS Date.
 * Handles: real Firestore Timestamp (.toDate()), serialised Timestamp ({seconds, nanoseconds}),
 * ISO strings, plain Date objects, and ms-since-epoch numbers.
 */
export function toDateSafe(value: any): Date {
  if (!value) return new Date(NaN);
  if (typeof value.toDate === 'function') return value.toDate();                // real Firestore Timestamp
  if (typeof value === 'object' && 'seconds' in value)
    return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1e6);    // serialised Timestamp
  if (value instanceof Date) return value;
  return new Date(value);                                                        // string or number
}

/**
 * Extract a YYYY-MM-DD date string using the browser's LOCAL timezone.
 * Use this instead of toISOString().slice(0,10) to avoid UTC-vs-local off-by-one
 * errors for users in timezones ahead of UTC (e.g. Nepal UTC+5:45).
 */
export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns today's date as YYYY-MM-DD in Nepal Standard Time (UTC+5:45).
 * Timezone-independent — works correctly on any server or browser timezone.
 * Use this when storing a publishedDate so the Nepal calendar date is always correct.
 */
export function toNepalDateString(date?: Date): string {
  const now = date ?? new Date();
  // Nepal Standard Time = UTC+5:45 = 345 minutes ahead of UTC
  const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;
  const nepalNow = new Date(now.getTime() + NEPAL_OFFSET_MS);
  const y = nepalNow.getUTCFullYear();
  const m = String(nepalNow.getUTCMonth() + 1).padStart(2, '0');
  const d = String(nepalNow.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format date to locale string
 */
export function formatDate(
  date: any,
  locale: string = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = toDateSafe(date);

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: any, locale: string = 'en'): string {
  const dateObj = toDateSafe(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (diffInSeconds < 604800) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 604800), 'week');
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
}

/**
 * Truncate text to specified length
 */
export function truncate(str: string, length: number = 100, suffix: string = '...'): string {
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate a random ID
 */
export function generateId(length: number = 10): string {
  return Math.random()
    .toString(36)
    .substring(2, length + 2);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if string is valid URL
 */
export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Extract plain text from HTML
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}
