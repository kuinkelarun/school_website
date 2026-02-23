'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import {
  Megaphone,
  Calendar,
  GraduationCap,
  Mail,
  TrendingUp,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import type { Announcement, Event, Program, ContactMessage } from '@/types';

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
