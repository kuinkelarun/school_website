'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { GraduationCap, Calendar, Phone, FileText } from 'lucide-react';

export function QuickLinks() {
  const locale = useLocale();
  const t = useTranslations('nav');

  const links = [
    {
      href: `/${locale}/programs`,
      icon: GraduationCap,
      title: t('programs'),
      description: 'Explore our academic programs',
      color: 'from-blue-500 to-blue-600',
    },
    {
      href: `/${locale}/events`,
      icon: Calendar,
      title: t('events'),
      description: 'Check upcoming events',
      color: 'from-green-500 to-green-600',
    },
    {
      href: `/${locale}/announcements`,
      icon: FileText,
      title: t('announcements'),
      description: 'Latest news and updates',
      color: 'from-purple-500 to-purple-600',
    },
    {
      href: `/${locale}/contact`,
      icon: Phone,
      title: t('contact'),
      description: 'Get in touch with us',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="group relative overflow-hidden rounded-lg border bg-card p-6 transition-all hover:shadow-lg"
        >
          {/* Gradient Background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 transition-opacity group-hover:opacity-5`} />

          {/* Content */}
          <div className="relative">
            <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${link.color} text-white`}>
              <link.icon className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold group-hover:text-primary">
              {link.title}
            </h3>
            <p className="text-sm text-muted-foreground">{link.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
