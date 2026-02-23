'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useCollection } from '@/hooks/useFirestore';
import { where, orderBy } from 'firebase/firestore';
import type { HeroImage } from '@/types';
import { cn } from '@/lib/utils';

const BYPASS = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';
const LS_KEY = 'bypass_hero_images';

function loadBypassImages(): HeroImage[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const all: HeroImage[] = raw ? JSON.parse(raw) : [];
    return all.filter((img) => img.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
  } catch {
    return [];
  }
}

export function HeroCarousel() {
  const locale = useLocale();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [bypassImages, setBypassImages] = useState<HeroImage[]>([]);

  // Load bypass images from localStorage on mount
  useEffect(() => {
    if (BYPASS) setBypassImages(loadBypassImages());
  }, []);

  // Firestore (only used when NOT in bypass mode)
  const { data: firestoreImages, loading } = useCollection<HeroImage>(
    'heroImages',
    BYPASS ? [] : [where('isActive', '==', true), orderBy('displayOrder', 'asc')]
  );

  const heroImages = BYPASS ? bypassImages : firestoreImages;

  const currentImage = heroImages[currentIndex];

  // Auto-rotation
  useEffect(() => {
    if (!heroImages.length || isPaused) return;

    const duration = currentImage?.displayDuration || 5;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, duration * 1000);

    return () => clearInterval(interval);
  }, [currentIndex, heroImages, isPaused, currentImage]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  }, [heroImages.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroImages.length);
  }, [heroImages.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  if (!BYPASS && loading) {
    return (
      <div className="relative h-[400px] w-full animate-pulse bg-muted md:h-[500px] lg:h-[600px]" />
    );
  }

  if (!heroImages.length) {
    return (
      <div className="relative flex h-[400px] w-full items-center justify-center bg-gradient-to-r from-primary to-secondary md:h-[500px] lg:h-[600px]">
        <div className="text-center text-white">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl lg:text-6xl">
            Welcome to Our School
          </h1>
          <p className="text-xl md:text-2xl">Quality Education for a Brighter Future</p>
        </div>
      </div>
    );
  }

  const overlayText = locale === 'ne' ? currentImage?.overlayTextNe : currentImage?.overlayText;
  const altText = locale === 'ne' ? currentImage?.altTextNe : currentImage?.altText;

  return (
    <div
      className="relative h-[400px] w-full overflow-hidden md:h-[500px] lg:h-[600px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Images */}
      {heroImages.map((image, index) => (
        <div
          key={image.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-1000',
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          )}
        >
          <img
            src={image.imageUrl}
            alt={locale === 'ne' ? image.altTextNe || image.altText : image.altText}
            className="h-full w-full object-cover"
          />

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Overlay Text */}
          {(image.overlayText || image.overlayTextNe) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="container px-4 text-center">
                <h2 className="text-3xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl">
                  {locale === 'ne' ? image.overlayTextNe || image.overlayText : image.overlayText}
                </h2>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Navigation Arrows */}
      {heroImages.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/75"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/75"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {heroImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'h-3 w-3 rounded-full transition-all',
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'bg-white/50 hover:bg-white/75'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
