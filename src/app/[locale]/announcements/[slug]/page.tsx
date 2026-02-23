'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Calendar, User, ArrowLeft, Download } from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import type { Announcement } from '@/types';
import { formatDate } from '@/lib/utils';
import { updateDocument } from '@/lib/firebase/firestore';

export default function AnnouncementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('announcements');
  const locale = useLocale();
  const slug = params.slug as string;

  // Fetch announcement by slug
  const { data: announcements, loading } = useCollection<Announcement>('announcements', [
    where('slug', '==', slug),
    where('isPublished', '==', true),
  ]);

  const announcement = announcements[0];

  // Increment view count
  useEffect(() => {
    if (announcement) {
      updateDocument('announcements', announcement.id, {
        viewCount: (announcement.viewCount || 0) + 1,
      }).catch(console.error);
    }
  }, [announcement]);

  if (loading) {
    return (
      <div className="py-12">
        <div className="container">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="h-12 animate-pulse rounded bg-muted" />
            <div className="h-96 animate-pulse rounded-lg bg-muted" />
            <div className="h-64 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="py-12">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-4 text-3xl font-bold">Announcement Not Found</h1>
            <p className="mb-6 text-muted-foreground">
              The announcement you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.push(`/${locale}/announcements`)}
              className="inline-flex items-center space-x-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>{t('backToList')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const title = locale === 'ne' && announcement.titleNe ? announcement.titleNe : announcement.title;
  const content = locale === 'ne' && announcement.contentNe ? announcement.contentNe : announcement.content;

  return (
    <div className="py-12">
      <div className="container">
        <div className="mx-auto max-w-4xl">
          {/* Back Button */}
          <button
            onClick={() => router.push(`/${locale}/announcements`)}
            className="mb-6 inline-flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('backToList')}</span>
          </button>

          {/* Category Badge */}
          <div className="mb-4">
            <span className="inline-block rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
              {t(`categories.${announcement.category}`)}
            </span>
          </div>

          {/* Title */}
          <h1 className="mb-6 text-4xl font-bold">{title}</h1>

          {/* Meta Information */}
          <div className="mb-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>
                {t('publishedOn')}{' '}
                {announcement.publishedDate &&
                  formatDate(
                    typeof announcement.publishedDate === 'object' && 'toDate' in announcement.publishedDate
                      ? announcement.publishedDate.toDate()
                      : announcement.publishedDate,
                    locale
                  )}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>
                {t('by')} {announcement.authorName}
              </span>
            </div>
          </div>

          {/* Featured Image */}
          {announcement.imageUrl && (
            <div className="mb-8 overflow-hidden rounded-lg">
              <img
                src={announcement.imageUrl}
                alt={title}
                className="h-auto w-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* Attachments */}
          {announcement.attachments && announcement.attachments.length > 0 && (
            <div className="mt-8 rounded-lg border p-6">
              <h3 className="mb-4 text-lg font-semibold">{t('attachments')}</h3>
              <div className="space-y-3">
                {announcement.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg bg-muted p-4 transition-colors hover:bg-muted/80"
                  >
                    <div className="flex items-center space-x-3">
                      <Download className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{attachment.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {(attachment.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
