'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodayBs, getCalendarMonth } from '@/lib/nepali-calendar/api';
import {
  getMonthName,
  toNepaliNumber,
  WEEKDAYS_SHORT_NP,
  WEEKDAYS_EN,
} from '@/lib/nepali-calendar/constants';
import type { BsDateResult, CalendarMonthResponse } from '@/lib/nepali-calendar/types';

interface NepaliCalendarWidgetProps {
  locale?: string;
}

export function NepaliCalendarWidget({ locale = 'ne' }: NepaliCalendarWidgetProps) {
  const [today, setToday] = useState<BsDateResult | null>(null);
  const [bsYear, setBsYear] = useState(0);
  const [bsMonth, setBsMonth] = useState(0);
  const [calendarData, setCalendarData] = useState<CalendarMonthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Initialize with today's BS date
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const todayBs = await getTodayBs();
        if (cancelled) return;
        setToday(todayBs);
        setBsYear(todayBs.bsYear);
        setBsMonth(todayBs.bsMonth);
      } catch {
        if (!cancelled) setError(true);
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  // Load calendar month data
  useEffect(() => {
    if (!bsYear || !bsMonth) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getCalendarMonth(bsYear, bsMonth);
        if (!cancelled) {
          setCalendarData(data);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [bsYear, bsMonth]);

  const goToPrevMonth = useCallback(() => {
    if (bsMonth === 1) {
      setBsMonth(12);
      setBsYear((y) => y - 1);
    } else {
      setBsMonth((m) => m - 1);
    }
  }, [bsMonth]);

  const goToNextMonth = useCallback(() => {
    if (bsMonth === 12) {
      setBsMonth(1);
      setBsYear((y) => y + 1);
    } else {
      setBsMonth((m) => m + 1);
    }
  }, [bsMonth]);

  const goToToday = useCallback(() => {
    if (today) {
      setBsYear(today.bsYear);
      setBsMonth(today.bsMonth);
    }
  }, [today]);

  // Determine grid offset (which weekday the month starts on)
  const firstDayOfWeek = calendarData?.days?.[0]?.dayOfWeek;
  const weekdayIndex = firstDayOfWeek
    ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(firstDayOfWeek)
    : 0;

  const isNe = locale === 'ne';
  const weekdayHeaders = isNe ? WEEKDAYS_SHORT_NP : WEEKDAYS_EN.map((d) => d.slice(0, 3));

  // Check if currently viewing today's month
  const isCurrentMonth = today && bsYear === today.bsYear && bsMonth === today.bsMonth;

  if (error && !calendarData) {
    return null; // Silently hide widget if API is unavailable
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Header — Today's date highlight */}
      {today && (
        <div className="bg-primary px-4 py-3 text-center text-primary-foreground">
          <p className="text-sm font-medium opacity-90">
            {isNe ? 'आजको मिति' : "Today's Date"}
          </p>
          <p className="text-2xl font-bold">
            {isNe
              ? `${toNepaliNumber(today.bsDay)} ${getMonthName(today.bsMonth, 'ne')} ${toNepaliNumber(today.bsYear)}`
              : `${today.bsDay} ${getMonthName(today.bsMonth, 'en')} ${today.bsYear}`}
          </p>
          <p className="text-xs opacity-75">
            {today.dayOfWeek}, {today.adDate}
          </p>
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <button
          onClick={goToPrevMonth}
          className="rounded-lg p-1.5 hover:bg-muted"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={goToToday}
          className="text-sm font-semibold hover:text-primary"
        >
          {isNe
            ? `${getMonthName(bsMonth, 'ne')} ${toNepaliNumber(bsYear)}`
            : `${getMonthName(bsMonth, 'en')} ${bsYear}`}
        </button>

        <button
          onClick={goToNextMonth}
          className="rounded-lg p-1.5 hover:bg-muted"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="p-3">
        {loading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-muted/30" />
            ))}
          </div>
        ) : (
          <>
            {/* Weekday headers */}
            <div className="mb-1 grid grid-cols-7 gap-1 text-center">
              {weekdayHeaders.map((wd, i) => (
                <div
                  key={wd}
                  className={`py-1 text-xs font-semibold ${
                    i === 6 ? 'text-red-500' : 'text-muted-foreground'
                  }`}
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty offset cells */}
              {Array.from({ length: weekdayIndex }, (_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}

              {/* Day cells */}
              {calendarData?.days?.map((dayEntry) => {
                const isToday = isCurrentMonth && dayEntry.bsDay === today?.bsDay;
                const isSaturday = dayEntry.dayOfWeek === 'Saturday';
                const hasTithi = dayEntry.tithis && dayEntry.tithis.length > 0;

                return (
                  <div
                    key={dayEntry.bsDay}
                    className={`
                      relative flex h-8 items-center justify-center rounded-md text-sm
                      ${isToday
                        ? 'bg-primary font-bold text-primary-foreground'
                        : isSaturday
                          ? 'text-red-500'
                          : ''
                      }
                    `}
                    title={
                      hasTithi
                        ? dayEntry.tithis.map((t) => t.tithiName || t.name).join(', ')
                        : `AD: ${dayEntry.adDate}`
                    }
                  >
                    {isNe ? toNepaliNumber(dayEntry.bsDay) : dayEntry.bsDay}
                    {hasTithi && !isToday && (
                      <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary/60" />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
