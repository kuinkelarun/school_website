'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useDocument } from '@/hooks/useFirestore';
import type { SiteSettings } from '@/types';

export default function AboutPage() {
  const t = useTranslations('about');
  const locale = useLocale();

  // Fetch site settings
  const { data: settings, loading } = useDocument<SiteSettings>('siteSettings', 'main');

  const schoolName = settings
    ? locale === 'ne' && settings.schoolNameNe
      ? settings.schoolNameNe
      : settings.schoolName
    : 'School Name';

  const aboutContent = settings
    ? locale === 'ne' && settings.aboutContentNe
      ? settings.aboutContentNe
      : settings.aboutContent
    : '';

  const missionVision = settings
    ? locale === 'ne' && settings.missionVisionNe
      ? settings.missionVisionNe
      : settings.missionVision
    : '';

  return (
    <div className="py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">{t('title')}</h1>
          <p className="text-xl text-muted-foreground">{schoolName}</p>
        </div>

        {loading ? (
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-12">
            {/* About Section */}
            {aboutContent && (
              <section>
                <h2 className="mb-4 text-2xl font-bold">{t('history')}</h2>
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: aboutContent }}
                />
              </section>
            )}

            {/* Mission & Vision */}
            {missionVision && (
              <section>
                <h2 className="mb-4 text-2xl font-bold">{t('mission')} & {t('vision')}</h2>
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: missionVision }}
                />
              </section>
            )}

            {/* Default content if no data */}
            {!aboutContent && !missionVision && (
              <div className="rounded-lg border border-dashed p-12 text-center">
                <p className="text-muted-foreground">
                  About information will be available soon.
                </p>
              </div>
            )}

            {/* Placeholder sections */}
            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border p-6">
                <h3 className="mb-3 text-xl font-semibold">{t('leadership')}</h3>
                <p className="text-muted-foreground">
                  Our dedicated leadership team is committed to excellence in education.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="mb-3 text-xl font-semibold">{t('achievements')}</h3>
                <p className="text-muted-foreground">
                  We take pride in our students' accomplishments and academic success.
                </p>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
