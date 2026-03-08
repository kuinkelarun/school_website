'use client';

import { GraduationCap } from 'lucide-react';
import { useDocument } from '@/hooks/useFirestore';
import type { SiteSettings } from '@/types';

export function PublicLoadingGate({ children }: { children: React.ReactNode }) {
  const { data: settings, loading } = useDocument<SiteSettings>('siteSettings', 'main');

  return (
    <>
      {children}
      {loading && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8 bg-background">

          {/* Spinner + logo stack */}
          <div className="relative flex items-center justify-center">
            {/* Outer slow-pulse ring */}
            <span className="absolute h-28 w-28 animate-ping rounded-full bg-primary/10" style={{ animationDuration: '1.8s' }} />

            {/* Spinning arc */}
            <span className="absolute h-24 w-24 animate-spin rounded-full border-4 border-primary/20 border-t-primary" style={{ animationDuration: '1s' }} />

            {/* Logo or icon */}
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
              {settings?.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={settings.logoUrl}
                  alt="logo"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <GraduationCap className="h-8 w-8 text-primary-foreground" />
              )}
            </div>
          </div>

          {/* School name */}
          {settings?.schoolName && (
            <p className="text-lg font-semibold tracking-wide text-foreground">
              {settings.schoolName}
            </p>
          )}

          {/* Animated dots label */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Loading</span>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
                style={{ animationDelay: `${i * 0.18}s`, animationDuration: '0.9s' }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
