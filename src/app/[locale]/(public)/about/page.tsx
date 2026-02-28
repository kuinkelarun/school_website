'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { X, ChevronDown } from 'lucide-react';
import { useDocument, useQueryDocuments } from '@/hooks/useFirestore';
import type { SiteSettings, FacultyMember, FacultyCategory } from '@/types';

const CATEGORY_ORDER: FacultyCategory[] = ['principal', 'teacher', 'staff'];

const CATEGORY_LABELS: Record<FacultyCategory, { en: string; ne: string }> = {
  principal: { en: 'Principal & Management', ne: 'प्रधानाध्यापक तथा व्यवस्थापन' },
  teacher: { en: 'Teachers', ne: 'शिक्षकहरू' },
  staff: { en: 'Staff', ne: 'कर्मचारीहरू' },
};

const BIO_CHAR_LIMIT = 280;

interface BioModalState {
  name: string;
  bio: string;
}

function MemberCard({
  m, locale, onReadMore,
}: {
  m: FacultyMember;
  locale: string;
  onReadMore: (s: BioModalState) => void;
}) {
  const t = useTranslations('about');
  const displayName = locale === 'ne' && m.nameNe ? m.nameNe : m.name;
  const displayRole = locale === 'ne' && m.roleNe ? m.roleNe : m.role;
  const displayBio  = locale === 'ne' && m.bioNe  ? m.bioNe  : m.bio;
  const isLongBio   = (displayBio?.length ?? 0) > BIO_CHAR_LIMIT;

  return (
    <div className="flex flex-col items-center rounded-lg border bg-card p-6 text-center shadow-sm">
      {m.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.photoUrl} alt={displayName} className="mb-4 h-24 w-24 rounded-full object-cover shadow" />
      ) : (
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
          {displayName[0]}
        </div>
      )}
      <p className="font-semibold">{displayName}</p>
      {displayRole && <p className="mt-1 text-sm text-muted-foreground">{displayRole}</p>}
      {displayBio && (
        <div className="mt-3 w-full">
          <p className={`text-sm text-muted-foreground text-left ${isLongBio ? 'line-clamp-5' : ''}`}>
            {displayBio}
          </p>
          {isLongBio && (
            <button
              onClick={() => onReadMore({ name: displayName, bio: displayBio })}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <ChevronDown className="h-3 w-3" />
              {t('readFullBio')}
            </button>
          )}
        </div>
      )}
      {m.email && (
        <a href={`mailto:${m.email}`} className="mt-2 text-xs text-primary hover:underline">
          {m.email}
        </a>
      )}
    </div>
  );
}

function CategoryGroup({
  cat, members, locale, onReadMore,
}: {
  cat: FacultyCategory;
  members: FacultyMember[];
  locale: string;
  onReadMore: (s: BioModalState) => void;
}) {
  if (members.length === 0) return null;
  const label = locale === 'ne' ? CATEGORY_LABELS[cat].ne : CATEGORY_LABELS[cat].en;
  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-muted-foreground">{label}</h3>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {members.map((m) => (
          <MemberCard key={m.id} m={m} locale={locale} onReadMore={onReadMore} />
        ))}
      </div>
    </div>
  );
}

export default function AboutPage() {
  const t = useTranslations('about');
  const locale = useLocale();
  const [bioModal, setBioModal] = useState<BioModalState | null>(null);

  const { data: settings, loading } = useDocument<SiteSettings>('siteSettings', 'main');
  const { data: allFaculty } = useQueryDocuments<FacultyMember>(
    'faculty',
    [{ field: 'isPublished', operator: '==', value: true }],
    'displayOrder',
    'asc'
  );

  const schoolName = settings
    ? locale === 'ne' && settings.schoolNameNe ? settings.schoolNameNe : settings.schoolName
    : '';

  const aboutContent = settings
    ? locale === 'ne' && settings.aboutContentNe ? settings.aboutContentNe : settings.aboutContent
    : '';

  const missionVision = settings
    ? locale === 'ne' && settings.missionVisionNe ? settings.missionVisionNe : settings.missionVision
    : '';

  const facultyMembers = (allFaculty || []).filter((m) => (m.memberType ?? 'faculty') === 'faculty');
  const formerMembers  = (allFaculty || []).filter((m) => m.memberType === 'former');
  const boardMembers   = (allFaculty || []).filter((m) => m.memberType === 'board');

  const groupByCategory = (list: FacultyMember[]) =>
    CATEGORY_ORDER.reduce<Record<FacultyCategory, FacultyMember[]>>(
      (acc, cat) => {
        acc[cat] = list.filter((m) => m.category === cat).sort((a, b) => a.displayOrder - b.displayOrder);
        return acc;
      },
      { principal: [], teacher: [], staff: [] }
    );

  const facultyByCategory = groupByCategory(facultyMembers);
  const formerByCategory  = groupByCategory(formerMembers);

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
            {/* About / History */}
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

            {/* Placeholder when no text content */}
            {!aboutContent && !missionVision && (
              <div className="rounded-lg border border-dashed p-12 text-center">
                <p className="text-muted-foreground">About information will be available soon.</p>
              </div>
            )}

            {/* Faculty Members */}
            {facultyMembers.length > 0 && (
              <section>
                <h2 className="mb-8 text-2xl font-bold">{t('facultyMembers')}</h2>
                <div className="space-y-10">
                  {CATEGORY_ORDER.map((cat) => (
                    <CategoryGroup
                      key={cat}
                      cat={cat}
                      members={facultyByCategory[cat]}
                      locale={locale}
                      onReadMore={setBioModal}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Former Faculty */}
            {formerMembers.length > 0 && (
              <section>
                <h2 className="mb-8 text-2xl font-bold">{t('formerFaculty')}</h2>
                <div className="space-y-10">
                  {CATEGORY_ORDER.map((cat) => (
                    <CategoryGroup
                      key={cat}
                      cat={cat}
                      members={formerByCategory[cat]}
                      locale={locale}
                      onReadMore={setBioModal}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* School Board of Advisers */}
            {boardMembers.length > 0 && (
              <section>
                <h2 className="mb-8 text-2xl font-bold">{t('boardOfAdvisers')}</h2>
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {[...boardMembers]
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((m) => (
                      <MemberCard key={m.id} m={m} locale={locale} onReadMore={setBioModal} />
                    ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Bio popup modal */}
      {bioModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setBioModal(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setBioModal(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-1 pr-8 text-lg font-semibold">
              {t('bioOf')} {bioModal.name}
            </h3>
            <div className="mt-4 max-h-[60vh] overflow-y-auto">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {bioModal.bio}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


