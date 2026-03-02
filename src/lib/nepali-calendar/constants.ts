/**
 * Nepali Calendar constants — pure static data that never changes.
 * Month names, weekday names, and numeral conversion.
 */

export const NEPALI_MONTHS = [
  'Baishakh', 'Jestha', 'Ashadh', 'Shrawan',
  'Bhadra', 'Ashwin', 'Kartik', 'Mangsir',
  'Poush', 'Magh', 'Falgun', 'Chaitra',
] as const;

export const NEPALI_MONTHS_NP = [
  'वैशाख', 'ज्येष्ठ', 'आषाढ', 'श्रावण',
  'भाद्र', 'आश्विन', 'कार्तिक', 'मार्गशीर्ष',
  'पौष', 'माघ', 'फाल्गुन', 'चैत्र',
] as const;

export const WEEKDAYS_EN = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
] as const;

export const WEEKDAYS_NP = [
  'आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार',
  'बिहिबार', 'शुक्रबार', 'शनिबार',
] as const;

export const WEEKDAYS_SHORT_NP = [
  'आइत', 'सोम', 'मंगल', 'बुध',
  'बिहि', 'शुक्र', 'शनि',
] as const;

const NEPALI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'] as const;

/**
 * Convert a number (or numeric string) into Nepali (Devanagari) numerals.
 * e.g. 2082 → "२०८२", "16" → "१६"
 */
export function toNepaliNumber(num: number | string): string {
  return String(num)
    .split('')
    .map((ch) => {
      const digit = parseInt(ch, 10);
      return isNaN(digit) ? ch : NEPALI_DIGITS[digit];
    })
    .join('');
}

/**
 * Get month name in the specified locale.
 * @param month 1-indexed (1=Baishakh)
 */
export function getMonthName(month: number, locale: string = 'en'): string {
  const idx = month - 1;
  if (idx < 0 || idx > 11) return '';
  return locale === 'ne' ? NEPALI_MONTHS_NP[idx] : NEPALI_MONTHS[idx];
}

/**
 * Get weekday name in the specified locale.
 * @param dayOfWeek English name e.g. "Sunday"
 */
export function getWeekdayName(dayOfWeek: string, locale: string = 'en'): string {
  const idx = WEEKDAYS_EN.indexOf(dayOfWeek as typeof WEEKDAYS_EN[number]);
  if (idx === -1) return dayOfWeek;
  return locale === 'ne' ? WEEKDAYS_NP[idx] : WEEKDAYS_EN[idx];
}
