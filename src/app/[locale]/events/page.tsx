'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Calendar, MapPin } from 'lucide-react';
import { useQueryDocuments } from '@/hooks/useFirestore';
import type { Event, EventCategory } from '@/types';
import { formatDate } from '@/lib/utils';

export default function EventsPage() {
  const t = useTranslations('events');
  const locale = useLocale();
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');

  // Fetch upcoming events
  const filters = selectedCategory !== 'all'
    ? [
        { field: 'isPublished', operator: '==' as const, value: true },
        { field: 'category', operator: '==' as const, value: selectedCategory },
        { field: 'startDate', operator: '>=' as const, value: new Date() },
      ]
    : [
        { field: 'isPublished', operator: '==' as const, value: true },
        { field: 'startDate', operator: '>=' as const, value: new Date() },
      ];

  const { data: events, loading } = useQueryDocuments<Event>(
    'events',
    filters,
    'startDate',
    'asc'
  );

  const categories: Array<EventCategory | 'all'> = ['all', 'academic', 'sports', 'cultural', 'other'];

  return (
    <div className="py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold">{t('title')}</h1>
          <p className="text-xl text-muted-foreground">
            Check out our upcoming events and activities
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {t(`categories.${category}`)}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        )}

        {/* Content */}
        {!loading && events.length === 0 && (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">{t('noEvents')}</p>
          </div>
        )}

        {!loading && events.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const title = locale === 'ne' && event.titleNe ? event.titleNe : event.title;
              const description = locale === 'ne' && event.descriptionNe ? event.descriptionNe : event.description;
              const startDate = typeof event.startDate === 'object' && 'toDate' in event.startDate
                ? event.startDate.toDate()
                : event.startDate;
              const endDate = typeof event.endDate === 'object' && 'toDate' in event.endDate
                ? event.endDate.toDate()
                : event.endDate;

              return (
                <div
                  key={event.id}
                  className="group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg"
                >
                  {/* Image */}
                  {event.imageUrl && (
                    <div className="relative h-48 w-full overflow-hidden">
                      <img
                        src={event.imageUrl}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {/* Category Badge on Image */}
                      <div className="absolute right-4 top-4">
                        <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                          {t(`categories.${event.category}`)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Date */}
                    <div className="mb-3 flex items-center space-x-2 text-sm text-primary">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(startDate, locale)}</span>
                      {startDate.toDateString() !== endDate.toDateString() && (
                        <span>- {formatDate(endDate, locale)}</span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="mb-3 text-xl font-semibold group-hover:text-primary">
                      {title}
                    </h3>

                    {/* Description */}
                    <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                      {description}
                    </p>

                    {/* Location */}
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
