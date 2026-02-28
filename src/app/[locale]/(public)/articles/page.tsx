'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { PenLine, Search } from 'lucide-react';
import { useQueryDocuments } from '@/hooks/useFirestore';
import { ArticleCard } from '@/components/public/ArticleCard';
import type { Article, ArticleCategory } from '@/types';

const CATEGORIES: { value: ArticleCategory | 'all'; labelKey: string }[] = [
  { value: 'all', labelKey: 'all' },
  { value: 'sports', labelKey: 'sports' },
  { value: 'arts', labelKey: 'arts' },
  { value: 'academics', labelKey: 'academics' },
  { value: 'achievements', labelKey: 'achievements' },
  { value: 'general', labelKey: 'general' },
];

export default function ArticlesPage() {
  const t = useTranslations('articles');
  const locale = useLocale();
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: articles, loading } = useQueryDocuments<Article>(
    'articles',
    [{ field: 'isPublished', operator: '==', value: true }],
    'publishedDate',
    'desc'
  );

  const filtered = (articles || []).filter((a) => {
    const catMatch = selectedCategory === 'all' || a.category === selectedCategory;
    if (!catMatch) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const title = (locale === 'ne' && a.titleNe ? a.titleNe : a.title).toLowerCase();
    return title.includes(q);
  });

  const featured = filtered.filter((a) => a.isFeatured);
  const regular = filtered.filter((a) => !a.isFeatured);

  return (
    <div className="py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-4xl font-bold">{t('title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
          </div>
          <Link
            href={`/${locale}/articles/submit`}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <PenLine className="h-4 w-4" />
            {t('submitArticle')}
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Category buttons */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ value, labelKey }) => (
              <button
                key={value}
                onClick={() => setSelectedCategory(value)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  selectedCategory === value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {t(`categories.${labelKey}`)}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('title')  + '...'}
              className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed p-16 text-center">
            <p className="text-muted-foreground">{t('noArticles')}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Featured */}
            {featured.length > 0 && (
              <section>
                <h2 className="mb-5 text-xl font-semibold">{t('featured')}</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map((a) => <ArticleCard key={a.id} article={a} />)}
                </div>
              </section>
            )}
            {/* All (or remainder) */}
            {regular.length > 0 && (
              <section>
                {featured.length > 0 && (
                  <h2 className="mb-5 text-xl font-semibold">
                    {t(`categories.${selectedCategory === 'all' ? 'all' : selectedCategory}`)}
                  </h2>
                )}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {regular.map((a) => <ArticleCard key={a.id} article={a} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
