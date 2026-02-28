'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Calendar, User, Tag } from 'lucide-react';
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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + '…';
}

const CATEGORY_COLORS: Record<ArticleCategory, string> = {
  sports: 'bg-emerald-100 text-emerald-700',
  arts: 'bg-purple-100 text-purple-700',
  academics: 'bg-blue-100 text-blue-700',
  achievements: 'bg-amber-100 text-amber-700',
  general: 'bg-muted text-muted-foreground',
};

interface Props {
  article: Article;
}

export function ArticleCard({ article }: Props) {
  const locale = useLocale();
  const t = useTranslations('articles');

  const title = locale === 'ne' && article.titleNe ? article.titleNe : article.title;
  const excerpt =
    locale === 'ne' && article.excerptNe
      ? article.excerptNe
      : article.excerpt ||
        truncate(stripHtml(locale === 'ne' && article.contentNe ? article.contentNe : article.content), 160);
  const author =
    locale === 'ne' && article.authorNameNe ? article.authorNameNe : article.authorName;
  const dateObj = toDateSafe(article.publishedDate);
  const dateStr = dateObj
    ? dateObj.toLocaleDateString(locale === 'ne' ? 'ne-NP' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  const categoryLabel = t(`categories.${article.category}`);
  const colorClass = CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS.general;

  return (
    <Link
      href={`/${locale}/articles/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Cover image */}
      {article.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.coverImageUrl}
          alt={title}
          className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-muted/60">
          <Tag className="h-12 w-12 text-muted-foreground/30" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        {/* Category + featured badges */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}>
            {categoryLabel}
          </span>
          {article.isFeatured && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {t('featured')}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-snug transition-colors group-hover:text-primary">
          {title}
        </h3>

        {/* Excerpt */}
        <p className="mb-4 line-clamp-3 flex-1 text-sm text-muted-foreground">{excerpt}</p>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {author}
          </span>
          {dateStr && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {dateStr}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
