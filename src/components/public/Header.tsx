'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Menu, X, LogIn, ChevronDown } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useDocument } from '@/hooks/useFirestore';
import type { SiteSettings } from '@/types';
import { cn } from '@/lib/utils';

export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLoginDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch site settings for school name & logo
  const { data: settings, loading: settingsLoading } = useDocument<SiteSettings>('siteSettings', 'main');
  const schoolName = settings
    ? locale === 'ne' && settings.schoolNameNe
      ? settings.schoolNameNe
      : settings.schoolName
    : '';
  const logoUrl = settings?.logoUrl || '';

  const navLinks = [
    { href: `/${locale}`, label: t('home') },
    { href: `/${locale}/about`, label: t('about') },
    { href: `/${locale}/announcements`, label: t('announcements') },
    { href: `/${locale}/events`, label: t('events') },
    { href: `/${locale}/articles`, label: t('articles') },
    { href: `/${locale}/programs`, label: t('programs') },
    { href: `/${locale}/gallery`, label: t('gallery') },
    { href: `/${locale}/contact`, label: t('contact') },
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

            {/* Login Dropdown */}
            <div className="relative hidden md:block" ref={dropdownRef}>
              <button
                onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                className="flex items-center space-x-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                <LogIn className="h-4 w-4" />
                <span>{t('login')}</span>
                <ChevronDown className={cn('h-3 w-3 transition-transform', loginDropdownOpen && 'rotate-180')} />
              </button>
              {loginDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-card shadow-lg">
                  <Link
                    href={`/${locale}/login`}
                    className="block px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted rounded-t-lg"
                    onClick={() => setLoginDropdownOpen(false)}
                  >
                    {t('adminLogin')}
                  </Link>
                  <Link
                    href={`/${locale}/faculty-login`}
                    className="block px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted rounded-b-lg"
                    onClick={() => setLoginDropdownOpen(false)}
                  >
                    {t('facultyLogin')}
                  </Link>
                </div>
              )}
            </div>

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
            <div className="mt-2 border-t pt-2">
              <Link
                href={`/${locale}/login`}
                className="block px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('adminLogin')}
              </Link>
              <Link
                href={`/${locale}/faculty-login`}
                className="block px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('facultyLogin')}
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
