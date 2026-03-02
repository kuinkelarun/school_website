/**
 * Nepali Calendar types — used across the school website
 * for displaying BS (Bikram Sambat) dates from the Hamro Panchanga API.
 */

/** Result of an AD → BS date conversion */
export interface BsDateResult {
  adDate: string;           // "2026-02-28"
  bsYear: number;           // 2082
  bsMonth: number;          // 11 (1-indexed: 1=Baishakh)
  bsDay: number;            // 16
  monthName: string;        // "Falgun"
  monthNameNepali: string;  // "फाल्गुन"
  dayOfWeek: string;        // "Saturday"
}

/** Result of a BS → AD date conversion */
export interface BsToAdResult {
  bsYear: number;
  bsMonth: number;
  bsDay: number;
  monthName: string;
  monthNameNepali: string;
  dayOfWeek: string;
  adDate: string;           // "2026-02-28"
}

/** Batch conversion response */
export interface BatchConvertResponse {
  count: number;
  direction: 'ad-to-bs' | 'bs-to-ad';
  results: (BsDateResult | { input: string; error: string })[];
}

/** A single day entry in the calendar month response */
export interface CalendarDayEntry {
  bsDay: number;
  adDate: string;
  dayOfWeek: string;
  tithis: CalendarTithi[];
}

/** Tithi info attached to a calendar day */
export interface CalendarTithi {
  name: string;
  tithiMonth: string;
  paksha: 'Shukla' | 'Krishna' | string;
  tithiName: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  category: string;
}

/** Full month response from the calendar API */
export interface CalendarMonthResponse {
  bsYear: number;
  bsMonth: number;
  monthName: string;
  monthNameNepali: string;
  totalDays: number;
  startAdDate: string;
  endAdDate: string;
  days: CalendarDayEntry[];
}

/** Today's tithi response */
export interface TodayTithiResponse {
  dateNPT: string;
  count: number;
  tithis: {
    id: string;
    name: string;
    paksha: string;
    tithiName: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    category: string;
  }[];
}
