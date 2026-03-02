'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import { HeroCarousel } from '@/components/public/HeroCarousel';
import { AnnouncementCard } from '@/components/public/AnnouncementCard';
import { ArticleCard } from '@/components/public/ArticleCard';
import { QuickLinks } from '@/components/public/QuickLinks';
import { NepaliDate } from '@/components/shared/NepaliDate';
import { NepaliCalendarWidget } from '@/components/public/NepaliCalendarWidget';
import { useQueryDocuments } from '@/hooks/useFirestore';
import type { Announcement, Article, Event } from '@/types';

export default function HomePage() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  // Stabilise the "now" value so it doesn't change on every render
  const now = useMemo(() => new Date(), []);

  // Fetch latest announcements
  const { data: announcements, loading: announcementsLoading, error: announcementsError } = useQueryDocuments<Announcement>(
    'announcements',
    [
      { field: 'isPublished', operator: '==', value: true },
    ],
    'publishedDate',
    'desc',
    6
  );

  // Fetch latest articles
  const { data: articles, loading: articlesLoading, error: articlesError } = useQueryDocuments<Article>(
    'articles',
    [{ field: 'isPublished', operator: '==', value: true }],
    'publishedDate',
    'desc',
    3
  );

  // Sort announcements: featured first, then by date
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.isFeatured === b.isFeatured) return 0;
    return a.isFeatured ? -1 : 1;
  });

  // Fetch upcoming events
  const { data: events, loading: eventsLoading, error: eventsError } = useQueryDocuments<Event>(
    'events',
    [
      { field: 'isPublished', operator: '==', value: true },
      { field: 'startDate', operator: '>=', value: now },
    ],
    'startDate',
    'asc',
    3
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
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            <QuickLinks />
            <aside className="hidden lg:block">
              <NepaliCalendarWidget locale={locale} />
            </aside>
          </div>
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
          ) : announcementsError ? (
            <div className="rounded-lg border border-error/50 bg-error/5 p-6 text-center">
              <p className="text-error">Failed to load announcements: {announcementsError}</p>
            </div>
          ) : sortedAnnouncements.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedAnnouncements.map((announcement) => (
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
          ) : eventsError ? (
            <div className="rounded-lg border border-error/50 bg-error/5 p-6 text-center">
              <p className="text-error">Failed to load events: {eventsError}</p>
            </div>
          ) : events.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {events.map((event) => {
                const title = locale === 'ne' && event.titleNe ? event.titleNe : event.title;

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
                        <NepaliDate date={event.startDate} locale={locale} showAdWhileLoading />
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

      {/* Latest Articles Section */}
      <section className="bg-muted/50 py-12 md:py-16">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold">{t('latestArticles')}</h2>
            <Link
              href={`/${locale}/articles`}
              className="inline-flex items-center space-x-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              <span>{tCommon('viewAll')}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {articlesLoading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : articlesError ? (
            <div className="rounded-lg border border-error/50 bg-error/5 p-6 text-center">
              <p className="text-error">Failed to load articles: {articlesError}</p>
            </div>
          ) : articles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-muted-foreground">No articles published yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="py-12 md:py-16">
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
