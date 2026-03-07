'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Menu, X } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useDocument } from '@/hooks/useFirestore';
import type { SiteSettings } from '@/types';
import { cn } from '@/lib/utils';

export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch site settings for school name & logo
  const { data: settings, loading: settingsLoading } = useDocument<SiteSettings>('siteSettings', 'main');
  const schoolName = settings
    ? locale === 'ne' && settings.schoolNameNe
      ? settings.schoolNameNe
      : settings.schoolName
    : '';
  const logoUrl = settings?.logoUrl || '';

  // Helper: use navTranslations override when in Nepali, else fall back to i18n
  const navLabel = (key: keyof import('@/types').NavTranslations, fallback: string) =>
    locale === 'ne' && settings?.navTranslations?.[key] ? settings.navTranslations[key]! : fallback;

  const navLinks = [
    { href: `/${locale}`, label: navLabel('home', t('home')) },
    { href: `/${locale}/about`, label: navLabel('about', t('about')) },
    { href: `/${locale}/announcements`, label: navLabel('announcements', t('announcements')) },
    { href: `/${locale}/events`, label: navLabel('events', t('events')) },
    { href: `/${locale}/articles`, label: navLabel('articles', t('articles')) },
    { href: `/${locale}/programs`, label: navLabel('programs', t('programs')) },
    { href: `/${locale}/gallery`, label: navLabel('gallery', t('gallery')) },
    { href: `/${locale}/contact`, label: navLabel('contact', t('contact')) },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center space-x-2">
            {settingsLoading ? (
              /* Skeleton while settings load */
              <>
                <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                <div className="hidden h-5 w-32 animate-pulse rounded bg-muted sm:block" />
              </>
            ) : logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoUrl}
                alt={schoolName || 'School Logo'}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="text-xl font-bold">{(schoolName || 'S')[0]}</span>
              </div>
            )}
            {!settingsLoading && (
              <span className="hidden font-heading text-xl font-bold sm:inline-block">
                {schoolName}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="border-t py-4 md:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
