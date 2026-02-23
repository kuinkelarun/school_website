'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Download, GraduationCap } from 'lucide-react';
import { useQueryDocuments } from '@/hooks/useFirestore';
import type { Program, ProgramCategory } from '@/types';

export default function ProgramsPage() {
  const t = useTranslations('programs');
  const locale = useLocale();
  const [selectedCategory, setSelectedCategory] = useState<ProgramCategory | 'all'>('all');

  // Fetch programs
  const filters = selectedCategory !== 'all'
    ? [
        { field: 'isPublished', operator: '==' as const, value: true },
        { field: 'category', operator: '==' as const, value: selectedCategory },
      ]
    : [{ field: 'isPublished', operator: '==' as const, value: true }];

  const { data: programs, loading } = useQueryDocuments<Program>(
    'programs',
    filters,
    'displayOrder',
    'asc'
  );

  const categories: Array<ProgramCategory | 'all'> = ['all', 'science', 'commerce', 'arts', 'other'];

  return (
    <div className="py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold">{t('title')}</h1>
          <p className="text-xl text-muted-foreground">
            Explore our comprehensive academic programs
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
        {!loading && programs.length === 0 && (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">No programs available at this time.</p>
          </div>
        )}

        {!loading && programs.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => {
              const title = locale === 'ne' && program.titleNe ? program.titleNe : program.title;
              const description = locale === 'ne' && program.descriptionNe ? program.descriptionNe : program.description;
              const objectives = locale === 'ne' && program.objectivesNe ? program.objectivesNe : program.objectives;

              return (
                <div
                  key={program.id}
                  className="group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg"
                >
                  {/* Image */}
                  {program.imageUrl ? (
                    <div className="relative h-48 w-full overflow-hidden">
                      <img
                        src={program.imageUrl}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-primary to-secondary">
                      <GraduationCap className="h-16 w-16 text-white" />
                    </div>
                  )}

                  <div className="p-6">
                    {/* Category */}
                    <div className="mb-3">
                      <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {t(`categories.${program.category}`)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="mb-3 text-xl font-semibold">{title}</h3>

                    {/* Description */}
                    <div
                      className="prose prose-sm mb-4 line-clamp-3 max-w-none"
                      dangerouslySetInnerHTML={{ __html: description }}
                    />

                    {/* Objectives */}
                    {objectives && (
                      <div className="mb-4">
                        <h4 className="mb-2 text-sm font-semibold">{t('objectives')}:</h4>
                        <div
                          className="prose prose-sm line-clamp-2 max-w-none text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: objectives }}
                        />
                      </div>
                    )}

                    {/* Curriculum Download */}
                    {program.curriculumPdfUrl && (
                      <a
                        href={program.curriculumPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-sm font-semibold text-primary hover:text-primary/80"
                      >
                        <Download className="h-4 w-4" />
                        <span>{t('downloadCurriculum')}</span>
                      </a>
                    )}
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
