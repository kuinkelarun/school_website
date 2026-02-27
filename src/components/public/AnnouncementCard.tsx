'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Calendar, User, ArrowRight } from 'lucide-react';
import type { Announcement } from '@/types';
import { formatDate, truncate, stripHtml, toDateSafe } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AnnouncementCardProps {
  announcement: Announcement;
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const locale = useLocale();
  const t = useTranslations('announcements');
  const tCommon = useTranslations('common');

  const title = locale === 'ne' && announcement.titleNe ? announcement.titleNe : announcement.title;
  const content = locale === 'ne' && announcement.contentNe ? announcement.contentNe : announcement.content;
  const plainContent = stripHtml(content);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'urgent':
        return 'bg-error text-white';
      case 'academic':
        return 'bg-info text-white';
      case 'events':
        return 'bg-warning text-white';
      default:
        return 'bg-muted text-foreground';
    }
  };

  return (
    <div className={cn(
      'group relative overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg',
      announcement.isFeatured && 'ring-2 ring-primary'
    )}>
      {/* Featured Badge */}
      {announcement.isFeatured && (
        <div className="absolute right-0 top-0 z-10">
          <div className="bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            {t('featured')}
          </div>
        </div>
      )}

      {/* Image */}
      {announcement.imageUrl && (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={announcement.imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      <div className="p-6">
        {/* Category Badge */}
        <div className="mb-3">
          <span className={cn('inline-block rounded-full px-3 py-1 text-xs font-semibold', getCategoryColor(announcement.category))}>
            {t(`categories.${announcement.category}`)}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-2 line-clamp-2 text-xl font-semibold transition-colors group-hover:text-primary">
          {title}
        </h3>

        {/* Content Preview */}
        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
          {truncate(plainContent, 150)}
        </p>

        {/* Meta Information */}
        <div className="mb-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>
              {announcement.publishedDate && formatDate(toDateSafe(announcement.publishedDate), locale)}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <User className="h-4 w-4" />
            <span>{announcement.authorName}</span>
          </div>
        </div>

        {/* Read More Link */}
        <Link
          href={`/${locale}/announcements/${announcement.slug}`}
          className="inline-flex items-center space-x-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          <span>{tCommon('readMore')}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
