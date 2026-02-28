'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Search } from 'lucide-react';
import { useQueryDocuments } from '@/hooks/useFirestore';
import { AnnouncementCard } from '@/components/public/AnnouncementCard';
import type { Announcement, AnnouncementCategory } from '@/types';

export default function AnnouncementsPage() {
  const t = useTranslations('announcements');
  const locale = useLocale();
  const [selectedCategory, setSelectedCategory] = useState<AnnouncementCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch announcements
  const filters = selectedCategory !== 'all'
    ? [
        { field: 'isPublished', operator: '==' as const, value: true },
        { field: 'category', operator: '==' as const, value: selectedCategory },
      ]
    : [{ field: 'isPublished', operator: '==' as const, value: true }];

  const { data: announcements, loading, error } = useQueryDocuments<Announcement>(
    'announcements',
    filters,
    'publishedDate',
    'desc'
  );

  // Filter by search query (client-side)
  const filteredAnnouncements = announcements.filter((announcement) => {
    if (!searchQuery) return true;
    const title = locale === 'ne' && announcement.titleNe ? announcement.titleNe : announcement.title;
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Separate featured and regular announcements
  const featuredAnnouncements = filteredAnnouncements.filter((a) => a.isFeatured);
  const regularAnnouncements = filteredAnnouncements.filter((a) => !a.isFeatured);

  const categories: Array<AnnouncementCategory | 'all'> = ['all', 'general', 'academic', 'events', 'urgent'];

  return (
    <div className="py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold">{t('title')}</h1>
          <p className="text-xl text-muted-foreground">
            Stay updated with our latest news and announcements
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
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

          {/* Search Bar */}
          <div className="mx-auto max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('title')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border bg-background px-10 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-lg border border-error/50 bg-error/5 p-6 text-center">
            <p className="text-error">Failed to load announcements: {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        )}

        {/* Content */}
        {!loading && filteredAnnouncements.length === 0 && (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">{t('noAnnouncements')}</p>
          </div>
        )}

        {!loading && filteredAnnouncements.length > 0 && (
          <div className="space-y-8">
            {/* Featured Announcements */}
            {featuredAnnouncements.length > 0 && (
              <div>
                <h2 className="mb-4 text-2xl font-bold">{t('featured')}</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {featuredAnnouncements.map((announcement) => (
                    <AnnouncementCard key={announcement.id} announcement={announcement} />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Announcements */}
            {regularAnnouncements.length > 0 && (
              <div>
                {featuredAnnouncements.length > 0 && (
                  <h2 className="mb-4 text-2xl font-bold">More Announcements</h2>
                )}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {regularAnnouncements.map((announcement) => (
                    <AnnouncementCard key={announcement.id} announcement={announcement} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
