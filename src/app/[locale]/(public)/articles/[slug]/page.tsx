'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowLeft, Calendar, User, Tag, Eye } from 'lucide-react';
import { where } from 'firebase/firestore';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument } from '@/lib/firebase/firestore';
import type { Article, ArticleCategory } from '@/types';

function toDateSafe(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'object' && val !== null && 'toDate' in val) {
    return (val as { toDate: () => Date }).toDate();
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

const CATEGORY_COLORS: Record<ArticleCategory, string> = {
  sports: 'bg-emerald-100 text-emerald-700',
  arts: 'bg-purple-100 text-purple-700',
  academics: 'bg-blue-100 text-blue-700',
  achievements: 'bg-amber-100 text-amber-700',
  general: 'bg-muted text-muted-foreground',
};

const BYPASS = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const t = useTranslations('articles');
  const locale = useLocale();

  const { data: results, loading } = useCollection<Article>('articles', [
    where('slug', '==', slug),
    where('isPublished', '==', BYPASS ? true : true),
  ]);

  const article = results?.[0];

  // Increment view count once
  useEffect(() => {
    if (!article) return;
    updateDocument('articles', article.id, {
      viewCount: (article.viewCount || 0) + 1,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.id]);

  if (loading) {
    return (
      <div className="py-12">
        <div className="container max-w-3xl space-y-6">
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${80 - i * 5}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="py-24 text-center">
        <p className="mb-4 text-xl font-semibold">Article not found</p>
        <Link href={`/${locale}/articles`} className="text-primary hover:underline">
          {t('backToList')}
        </Link>
      </div>
    );
  }

  const title = locale === 'ne' && article.titleNe ? article.titleNe : article.title;
  const content = locale === 'ne' && article.contentNe ? article.contentNe : article.content;
  const author = locale === 'ne' && article.authorNameNe ? article.authorNameNe : article.authorName;
  const dateObj = toDateSafe(article.publishedDate);
  const dateStr = dateObj
    ? dateObj.toLocaleDateString(locale === 'ne' ? 'ne-NP' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  const colorClass = CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS.general;

  return (
    <div className="py-12">
      <div className="container max-w-3xl">
        {/* Back link */}
        <Link
          href={`/${locale}/articles`}
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToList')}
        </Link>

        {/* Cover image */}
        {article.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImageUrl}
            alt={title}
            className="mb-8 h-72 w-full rounded-xl object-cover shadow-md"
          />
        )}

        {/* Badges */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colorClass}`}>
            <Tag className="mr-1 inline h-3 w-3" />
            {t(`categories.${article.category}`)}
          </span>
          {article.isFeatured && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {t('featured')}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="mb-4 text-4xl font-bold leading-tight">{title}</h1>

        {/* Meta */}
        <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-b pb-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            {t('by')} {author}
          </span>
          {dateStr && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {t('publishedOn')}: {dateStr}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {article.viewCount || 0}
          </span>
        </div>

        {/* Body */}
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}
