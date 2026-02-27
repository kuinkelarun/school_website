'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { X, ChevronLeft, ChevronRight, ZoomIn, Film, FileText, Download, ImageIcon } from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { where, orderBy } from 'firebase/firestore';
import type { GalleryItem } from '@/types';

// ─── Bypass helpers ─────────────────────────────────────────────────────────
const BYPASS = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';
const BP_KEY = 'bypass_gallery';

function bpLoad(): GalleryItem[] {
  try { return JSON.parse(localStorage.getItem(BP_KEY) || '[]'); } catch { return []; }
}
// ────────────────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'image' | 'video' | 'document';

export default function GalleryPage() {
  const t = useTranslations('gallery');
  const locale = useLocale();

  const [filter, setFilter] = useState<FilterType>('all');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // ── Bypass state ───────────────────────────────────────────────────────
  const [bypassItems, setBypassItems] = useState<GalleryItem[]>([]);
  useEffect(() => {
    if (BYPASS) {
      setBypassItems(bpLoad().filter((i) => i.isPublished));
    }
  }, []);

  // ── Firebase ────────────────────────────────────────────────────────────
  const { data: fbItems, loading } = useCollection<GalleryItem>(
    'gallery',
    BYPASS
      ? []
      : [where('isPublished', '==', true), orderBy('displayOrder', 'desc')]
  );

  const allItems = BYPASS ? bypassItems : fbItems;

  const filtered: GalleryItem[] =
    filter === 'all' ? allItems : allItems.filter((i) => i.type === filter);

  // Only images & videos go into the lightbox viewer
  const lightboxItems = filtered.filter((i) => i.type === 'image' || i.type === 'video');

  // ── Lightbox keyboard nav ────────────────────────────────────────────────
  const closeLightbox = useCallback(() => setLightboxIdx(null), []);
  const prevItem = useCallback(() => {
    setLightboxIdx((idx) => (idx === null ? null : (idx - 1 + lightboxItems.length) % lightboxItems.length));
  }, [lightboxItems.length]);
  const nextItem = useCallback(() => {
    setLightboxIdx((idx) => (idx === null ? null : (idx + 1) % lightboxItems.length));
  }, [lightboxItems.length]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevItem();
      if (e.key === 'ArrowRight') nextItem();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIdx, closeLightbox, prevItem, nextItem]);

  // ── Open lightbox ─────────────────────────────────────────────────────────
  const openLightbox = (item: GalleryItem) => {
    if (item.type === 'document') return; // documents open in new tab
    const idx = lightboxItems.findIndex((i) => i.id === item.id);
    if (idx !== -1) setLightboxIdx(idx);
  };

  const currentLightboxItem = lightboxIdx !== null ? lightboxItems[lightboxIdx] : null;

  return (
    <div className="py-12">
      <div className="container">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold">{t('title')}</h1>
          <p className="text-xl text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Type Filter Tabs */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {(['all', 'image', 'video', 'document'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {f === 'image' && <ImageIcon className="h-4 w-4" />}
              {f === 'video' && <Film className="h-4 w-4" />}
              {f === 'document' && <FileText className="h-4 w-4" />}
              {t(`filter.${f}`)}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="rounded-lg border border-dashed p-16 text-center">
            <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">{t('empty')}</p>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((item) => {
              const title = locale === 'ne' && item.titleNe ? item.titleNe : item.title;
              const description = locale === 'ne' && item.descriptionNe ? item.descriptionNe : item.description;
              const isLightboxable = item.type === 'image' || item.type === 'video';

              return (
                <div
                  key={item.id}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-lg"
                  onClick={() => isLightboxable ? openLightbox(item) : window.open(item.url, '_blank')}
                >
                  {/* Media preview */}
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {item.type === 'image' && (
                      <img
                        src={item.url}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    )}
                    {item.type === 'video' && (
                      <video
                        src={item.url}
                        className="h-full w-full object-cover"
                        muted
                        preload="metadata"
                      />
                    )}
                    {item.type === 'document' && (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <FileText className="h-16 w-16 text-muted-foreground/40" />
                      </div>
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/40">
                      {isLightboxable && (
                        <ZoomIn className="h-8 w-8 scale-0 text-white transition-transform duration-300 group-hover:scale-100" />
                      )}
                      {item.type === 'document' && (
                        <Download className="h-8 w-8 scale-0 text-white transition-transform duration-300 group-hover:scale-100" />
                      )}
                      {item.type === 'video' && (
                        <div className="absolute left-2 top-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white">
                            <Film className="h-3 w-3" /> Video
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Caption */}
                  {(title || description) && (
                    <div className="p-3">
                      {title && (
                        <p className="truncate text-sm font-medium" title={title}>{title}</p>
                      )}
                      {description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{description}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      {currentLightboxItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Prev */}
          {lightboxItems.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevItem(); }}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
              aria-label="Previous"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Media */}
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {currentLightboxItem.type === 'image' ? (
              <img
                src={currentLightboxItem.url}
                alt={currentLightboxItem.title}
                className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain shadow-2xl"
              />
            ) : (
              <video
                src={currentLightboxItem.url}
                controls
                autoPlay
                className="max-h-[85vh] max-w-[85vw] rounded-lg shadow-2xl"
              />
            )}

            {/* Caption */}
            {(currentLightboxItem.title || currentLightboxItem.description) && (
              <div className="mt-3 text-center text-white">
                <p className="font-semibold">{currentLightboxItem.title}</p>
                {currentLightboxItem.description && (
                  <p className="mt-1 text-sm text-white/70">{currentLightboxItem.description}</p>
                )}
              </div>
            )}

            {/* Counter */}
            {lightboxItems.length > 1 && (
              <p className="mt-2 text-center text-sm text-white/50">
                {(lightboxIdx ?? 0) + 1} / {lightboxItems.length}
              </p>
            )}
          </div>

          {/* Next */}
          {lightboxItems.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextItem(); }}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
              aria-label="Next"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
