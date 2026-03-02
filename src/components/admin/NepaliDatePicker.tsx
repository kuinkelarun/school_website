'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { convertAdToBs, convertBsToAd, getTodayBs, getCalendarMonth } from '@/lib/nepali-calendar/api';
import { getMonthName, toNepaliNumber, NEPALI_MONTHS, WEEKDAYS_SHORT_NP } from '@/lib/nepali-calendar/constants';
import type { BsDateResult, CalendarMonthResponse } from '@/lib/nepali-calendar/types';

interface NepaliDatePickerProps {
  /** Current value as a datetime-local string (e.g. "2026-02-28T10:00") or ISO string */
  value?: string;
  /** Called with a datetime-local string when the user picks a new date */
  onChange: (dateTimeLocal: string) => void;
  /** Label shown above the picker */
  label?: string;
  /** Whether field is required */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Also include a time input (default: true) */
  showTime?: boolean;
  /** Minimum date in datetime-local format */
  min?: string;
}

export default function NepaliDatePicker({
  value,
  onChange,
  label,
  required,
  error,
  showTime = true,
  min,
}: NepaliDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // BS state
  const [bsYear, setBsYear] = useState(2082);
  const [bsMonth, setBsMonth] = useState(1);
  const [bsDay, setBsDay] = useState(1);
  const [calendarData, setCalendarData] = useState<CalendarMonthResponse | null>(null);

  // Current value's BS equivalent display
  const [currentBs, setCurrentBs] = useState<BsDateResult | null>(null);

  // Time portion (HH:MM)
  const [time, setTime] = useState('10:00');

  // Initialize from current value or today
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        if (value) {
          // Extract date + time from value
          const dateStr = value.slice(0, 10); // "YYYY-MM-DD"
          const timeStr = value.length > 10 ? value.slice(11, 16) : '10:00';
          setTime(timeStr);

          const bs = await convertAdToBs(dateStr);
          setCurrentBs(bs);
          setBsYear(bs.bsYear);
          setBsMonth(bs.bsMonth);
          setBsDay(bs.bsDay);
        } else {
          const today = await getTodayBs();
          setCurrentBs(today);
          setBsYear(today.bsYear);
          setBsMonth(today.bsMonth);
          setBsDay(today.bsDay);
        }
      } catch (e) {
        console.error('NepaliDatePicker init error:', e);
        // Fallback
        setBsYear(2082);
        setBsMonth(1);
        setBsDay(1);
      } finally {
        setLoading(false);
      }
    };
    init();
    // Only run when value changes externally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Load calendar data when year or month changes
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const loadMonth = async () => {
      try {
        const data = await getCalendarMonth(bsYear, bsMonth);
        if (!cancelled) setCalendarData(data);
      } catch (e) {
        console.error('Failed to load calendar month:', e);
      }
    };
    loadMonth();
    return () => { cancelled = true; };
  }, [bsYear, bsMonth, isOpen]);

  const handleDayClick = useCallback(async (day: number) => {
    setBsDay(day);
    try {
      const result = await convertBsToAd(bsYear, bsMonth, day);
      const dateTimeLocal = `${result.adDate}T${time}`;
      onChange(dateTimeLocal);

      // Update display
      const bs = await convertAdToBs(result.adDate);
      setCurrentBs(bs);
      setIsOpen(false);
    } catch (e) {
      console.error('Failed to convert selected date:', e);
    }
  }, [bsYear, bsMonth, time, onChange]);

  const handleTimeChange = useCallback((newTime: string) => {
    setTime(newTime);
    if (value) {
      const dateStr = value.slice(0, 10);
      onChange(`${dateStr}T${newTime}`);
    }
  }, [value, onChange]);

  const goToPrevMonth = () => {
    if (bsMonth === 1) {
      setBsMonth(12);
      setBsYear((y) => y - 1);
    } else {
      setBsMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (bsMonth === 12) {
      setBsMonth(1);
      setBsYear((y) => y + 1);
    } else {
      setBsMonth((m) => m + 1);
    }
  };

  // Build the grid of days
  const daysInMonth = calendarData?.days?.length ?? 30;
  const firstDayOfWeek = calendarData?.days?.[0]?.dayOfWeek;
  const weekdayIndex = firstDayOfWeek
    ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(firstDayOfWeek)
    : 0;

  // Display text
  const displayText = currentBs
    ? `${getMonthName(currentBs.bsMonth, 'ne')} ${toNepaliNumber(currentBs.bsDay)}, ${toNepaliNumber(currentBs.bsYear)}`
    : '';
  const displayTextEn = currentBs
    ? `${currentBs.bsDay} ${getMonthName(currentBs.bsMonth, 'en')} ${currentBs.bsYear} BS`
    : '';

  return (
    <div className="relative">
      {label && (
        <label className="mb-2 block text-sm font-medium">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}

      <div className="flex gap-2">
        {/* Date display / trigger button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-1 items-center gap-2 rounded-lg border bg-background px-4 py-2 text-left focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {loading ? (
            <span className="text-muted-foreground">Loading...</span>
          ) : displayText ? (
            <div>
              <span className="block text-sm font-medium">{displayText}</span>
              <span className="block text-xs text-muted-foreground">{displayTextEn}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select date...</span>
          )}
        </button>

        {/* Time input */}
        {showTime && (
          <input
            type="time"
            value={time}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-28 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        )}
      </div>

      {/* Also keep hidden native input for react-hook-form compatibility */}
      <input type="hidden" value={value || ''} readOnly />

      {error && <p className="mt-1 text-sm text-error">{error}</p>}

      {/* Calendar dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-xl border bg-card p-4 shadow-xl">
          {/* Month/Year navigation */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="rounded-lg p-1.5 hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              {/* Year selector */}
              <select
                value={bsYear}
                onChange={(e) => setBsYear(Number(e.target.value))}
                className="rounded border bg-background px-2 py-1 text-sm"
              >
                {Array.from({ length: 20 }, (_, i) => 2070 + i).map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>

              {/* Month selector */}
              <select
                value={bsMonth}
                onChange={(e) => setBsMonth(Number(e.target.value))}
                className="rounded border bg-background px-2 py-1 text-sm"
              >
                {NEPALI_MONTHS.map((name, i) => (
                  <option key={i} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={goToNextMonth}
              className="rounded-lg p-1.5 hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="mb-1 grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS_SHORT_NP.map((wd) => (
              <div key={wd} className="text-xs font-medium text-muted-foreground py-1">
                {wd}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: weekdayIndex }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const isSelected = day === bsDay;
              const isSaturday = calendarData?.days?.[i]?.dayOfWeek === 'Saturday';

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={`
                    h-8 w-full rounded-md text-sm transition-colors
                    ${isSelected
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'hover:bg-muted'
                    }
                    ${isSaturday && !isSelected ? 'text-red-500' : ''}
                  `}
                >
                  {toNepaliNumber(day)}
                </button>
              );
            })}
          </div>

          {/* Footer with AD date reference */}
          {currentBs && (
            <div className="mt-3 border-t pt-2 text-center text-xs text-muted-foreground">
              AD: {currentBs.adDate} ({currentBs.dayOfWeek})
            </div>
          )}
        </div>
      )}

      {/* Click-outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
