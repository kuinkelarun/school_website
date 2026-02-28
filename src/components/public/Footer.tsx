'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { useDocument } from '@/hooks/useFirestore';
import type { SiteSettings } from '@/types';

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const locale = useLocale();

  const { data: settings, loading: settingsLoading } = useDocument<SiteSettings>('siteSettings', 'main');

  const schoolName = settings
    ? locale === 'ne' && settings.schoolNameNe ? settings.schoolNameNe : settings.schoolName
    : '';
  const address = settings
    ? locale === 'ne' && settings.addressNe ? settings.addressNe : settings.address
    : '';
  const phone = settings?.phone || '';
  const email = settings?.email || '';
  const tagline = settings
    ? locale === 'ne' && settings.taglineNe ? settings.taglineNe : settings.tagline
    : '';

  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: `/${locale}`, label: tNav('home') },
    { href: `/${locale}/about`, label: tNav('about') },
    { href: `/${locale}/announcements`, label: tNav('announcements') },
    { href: `/${locale}/programs`, label: tNav('programs') },
    { href: `/${locale}/events`, label: tNav('events') },
    { href: `/${locale}/contact`, label: tNav('contact') },
  ];

  const socialLinks = [
    settings?.socialMedia?.facebook && { icon: Facebook, href: settings.socialMedia.facebook, label: 'Facebook' },
    settings?.socialMedia?.twitter && { icon: Twitter, href: settings.socialMedia.twitter, label: 'Twitter' },
    settings?.socialMedia?.instagram && { icon: Instagram, href: settings.socialMedia.instagram, label: 'Instagram' },
    settings?.socialMedia?.youtube && { icon: Youtube, href: settings.socialMedia.youtube, label: 'YouTube' },
  ].filter(Boolean) as { icon: React.ElementType; href: string; label: string }[];

  return (
    <footer className="border-t bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* About Section */}
          <div>
            {settingsLoading ? (
              <>
                <div className="mb-4 h-5 w-40 animate-pulse rounded bg-muted-foreground/20" />
                <div className="space-y-2">
                  <div className="h-3 w-full animate-pulse rounded bg-muted-foreground/10" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-muted-foreground/10" />
                </div>
              </>
            ) : (
              <>
                <h3 className="mb-4 font-heading text-lg font-semibold">
                  {schoolName}
                </h3>
                {tagline && (
                  <p className="text-sm text-muted-foreground">
                    {tagline}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-heading text-lg font-semibold">
              {t('quickLinks')}
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 font-heading text-lg font-semibold">
              {t('contactInfo')}
            </h3>
            {settingsLoading ? (
              <div className="space-y-2">
                <div className="h-3 w-48 animate-pulse rounded bg-muted-foreground/10" />
                <div className="h-3 w-32 animate-pulse rounded bg-muted-foreground/10" />
                <div className="h-3 w-44 animate-pulse rounded bg-muted-foreground/10" />
              </div>
            ) : (
              <ul className="space-y-2 text-sm text-muted-foreground">
                {address && (
                  <li className="flex items-start space-x-2">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{address}</span>
                  </li>
                )}
                {phone && (
                  <li className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{phone}</span>
                  </li>
                )}
                {email && (
                  <li className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span>{email}</span>
                  </li>
                )}
              </ul>
            )}
          </div>

            {/* Social Media */}
            {socialLinks.length > 0 && (
              <div>
                <h3 className="mb-4 font-heading text-lg font-semibold">
                  {t('followUs')}
                </h3>
                <div className="flex space-x-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                      aria-label={social.label}
                    >
                      <social.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Bottom Section */}
        <div className="mt-8 border-t border-muted pt-8 text-center text-sm text-muted-foreground">
          <p>© {currentYear} {schoolName || '...'}. All rights reserved.</p>
          <p className="mt-2">{t('poweredBy')}</p>
        </div>
      </div>
    </footer>
  );
}
