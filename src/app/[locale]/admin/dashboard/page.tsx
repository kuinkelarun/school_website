'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useDocument } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import {
  Megaphone,
  Calendar,
  GraduationCap,
  Mail,
  TrendingUp,
  Plus,
  HardDrive,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import type { Announcement, Event, Program, ContactMessage, GalleryItem } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const BYPASS = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';
const DEFAULT_LIMIT = 4.5 * 1024 * 1024 * 1024; // 4.5 GB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const t = useTranslations('admin.dashboard');
  const { adminUser } = useAuth();

  // Fetch statistics
  const { data: announcements } = useCollection<Announcement>('announcements', []);
  const { data: events } = useCollection<Event>('events', []);
  const { data: programs } = useCollection<Program>('programs', []);
  const { data: messages } = useCollection<ContactMessage>('contactMessages', [
    where('status', '==', 'unread'),
  ]);

  // Storage usage – Cloud Function writes to siteSettings/storageUsage.
  // In bypass mode or before any upload has been tracked, we fall back to
  // calculating from client-side gallery data.
  const { data: storageUsageDoc } = useDocument<{
    id: string;
    totalBytes: number;
    limitBytes: number;
  }>('siteSettings', 'storageUsage');

  const { data: galleryItems } = useCollection<GalleryItem>('gallery', []);

  // Calculate storage: prefer the Cloud Function document; fall back to
  // summing gallery items' fileSize on the client (bypass / first deploy).
  const clientBytes = galleryItems.reduce((sum, g) => sum + (g.fileSize || 0), 0);
  const totalBytes = storageUsageDoc?.totalBytes ?? clientBytes;
  const limitBytes = storageUsageDoc?.limitBytes ?? DEFAULT_LIMIT;
  const pct = limitBytes > 0 ? totalBytes / limitBytes : 0;

  const stats = [
    {
      title: t('totalAnnouncements'),
      value: announcements.length,
      icon: Megaphone,
      color: 'from-blue-500 to-blue-600',
      href: '/en/admin/announcements',
    },
    {
      title: t('totalEvents'),
      value: events.length,
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      href: '/en/admin/events',
    },
    {
      title: t('totalPrograms'),
      value: programs.length,
      icon: GraduationCap,
      color: 'from-purple-500 to-purple-600',
      href: '/en/admin/programs',
    },
    {
      title: t('unreadMessages'),
      value: messages.length,
      icon: Mail,
      color: 'from-orange-500 to-orange-600',
      href: '/en/admin/messages',
    },
  ];

  const quickActions = [
    {
      title: 'Create Announcement',
      href: '/en/admin/announcements/new',
      icon: Megaphone,
      color: 'bg-blue-500',
    },
    {
      title: 'Add Event',
      href: '/en/admin/events/new',
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      title: 'Add Program',
      href: '/en/admin/programs/new',
      icon: GraduationCap,
      color: 'bg-purple-500',
    },
    {
      title: 'Upload Media',
      href: '/en/admin/media',
      icon: Plus,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('welcome')}, {adminUser?.fullName}!
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${stat.color} text-white`}
                >
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Storage Usage Meter */}
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t('storageUsage')}</h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {formatBytes(totalBytes)} / {formatBytes(limitBytes)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pct >= 0.9
                ? 'bg-destructive'
                : pct >= 0.7
                  ? 'bg-yellow-500'
                  : 'bg-primary'
            }`}
            style={{ width: `${Math.min(pct * 100, 100)}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t('storageUsed')}: {formatBytes(totalBytes)}
          </span>
          <span className="text-muted-foreground">
            {t('storageFree')}: {formatBytes(Math.max(limitBytes - totalBytes, 0))}
          </span>
        </div>

        {/* Warning banners */}
        {pct >= 0.9 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {t('storageDanger')}
          </div>
        )}
        {pct >= 0.7 && pct < 0.9 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {t('storageWarning')}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-xl font-bold">{t('quickActions')}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group flex items-center space-x-3 rounded-lg border bg-card p-4 transition-all hover:shadow-lg"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color} text-white`}
              >
                <action.icon className="h-5 w-5" />
              </div>
              <span className="font-medium group-hover:text-primary">
                {action.title}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Announcements */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Recent Announcements</h3>
          <div className="space-y-3">
            {announcements.slice(0, 5).map((announcement) => (
              <div key={announcement.id} className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{announcement.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {announcement.isPublished ? 'Published' : 'Draft'}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    announcement.isFeatured
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {announcement.isFeatured ? 'Featured' : 'Regular'}
                </span>
              </div>
            ))}
            {announcements.length === 0 && (
              <p className="text-sm text-muted-foreground">No announcements yet</p>
            )}
          </div>
        </div>

        {/* Recent Events */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Upcoming Events</h3>
          <div className="space-y-3">
            {events.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(
                    typeof event.startDate === 'object' && 'toDate' in event.startDate
                      ? event.startDate.toDate()
                      : event.startDate
                  ).toLocaleDateString()}
                </span>
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-sm text-muted-foreground">No events scheduled</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
