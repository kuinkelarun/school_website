'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import { HeroCarousel } from '@/components/public/HeroCarousel';
import { AnnouncementCard } from '@/components/public/AnnouncementCard';
import { QuickLinks } from '@/components/public/QuickLinks';
import { useCollection } from '@/hooks/useFirestore';
import { where, orderBy, limit } from 'firebase/firestore';
import type { Announcement, Event } from '@/types';
import { formatDate } from '@/lib/utils';

export default function HomePage() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  // Stabilise the "now" value so it doesn't change on every render
  const now = useMemo(() => new Date(), []);

  // Fetch latest announcements
  const { data: announcements, loading: announcementsLoading } = useCollection<Announcement>(
    'announcements',
    [
      where('isPublished', '==', true),
      orderBy('publishedDate', 'desc'),
      limit(6),
    ]
  );

  // Fetch upcoming events
  const { data: events, loading: eventsLoading } = useCollection<Event>(
    'events',
    [
      where('isPublished', '==', true),
      where('startDate', '>=', now),
      orderBy('startDate', 'asc'),
      limit(3),
    ]
  );

  return (
    <div>
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Quick Links Section */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold">{t('quickLinks')}</h2>
          </div>
          <QuickLinks />
        </div>
      </section>

      {/* Latest Announcements Section */}
      <section className="bg-muted/50 py-12 md:py-16">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold">{t('latestAnnouncements')}</h2>
            <Link
              href={`/${locale}/announcements`}
              className="inline-flex items-center space-x-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              <span>{tCommon('viewAll')}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {announcementsLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-96 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : announcements.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {announcements.map((announcement) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-muted-foreground">No announcements available at this time.</p>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold">{t('upcomingEvents')}</h2>
            <Link
              href={`/${locale}/events`}
              className="inline-flex items-center space-x-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              <span>{tCommon('viewAll')}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {eventsLoading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {events.map((event) => {
                const title = locale === 'ne' && event.titleNe ? event.titleNe : event.title;
                const eventDate = typeof event.startDate === 'object' && 'toDate' in event.startDate
                  ? event.startDate.toDate()
                  : event.startDate;

                return (
                  <Link
                    key={event.id}
                    href={`/${locale}/events`}
                    className="group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg"
                  >
                    {event.imageUrl && (
                      <div className="relative h-48 w-full overflow-hidden">
                        <img
                          src={event.imageUrl}
                          alt={title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="mb-3 flex items-center space-x-2 text-sm text-primary">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(eventDate, locale)}</span>
                      </div>
                      <h3 className="mb-2 line-clamp-2 text-lg font-semibold group-hover:text-primary">
                        {title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-muted-foreground">No upcoming events at this time.</p>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="bg-muted/50 py-12 md:py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold">{t('aboutUs')}</h2>
            <p className="mb-6 text-lg text-muted-foreground">
              We are committed to providing quality education and fostering a nurturing environment
              where every student can excel academically, socially, and personally.
            </p>
            <Link
              href={`/${locale}/about`}
              className="inline-flex items-center space-x-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <span>{tCommon('learnMore')}</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
