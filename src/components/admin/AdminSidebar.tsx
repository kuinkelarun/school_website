'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Image,
  Megaphone,
  Calendar,
  GraduationCap,
  FolderOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Info,
  Images,
  Users,
  Newspaper,
  Mail,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('admin.nav');
  const { signOut, adminUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: `/${locale}/admin/dashboard`, icon: LayoutDashboard, label: t('dashboard') },
    { href: `/${locale}/admin/hero-images`, icon: Image, label: t('heroImages') },
    { href: `/${locale}/admin/announcements`, icon: Megaphone, label: t('announcements') },
    { href: `/${locale}/admin/articles`, icon: Newspaper, label: t('articles') },
    { href: `/${locale}/admin/events`, icon: Calendar, label: t('events') },
    { href: `/${locale}/admin/programs`, icon: GraduationCap, label: t('programs') },
    { href: `/${locale}/admin/faculty`, icon: Users, label: t('faculty') },
    { href: `/${locale}/admin/media`, icon: FolderOpen, label: t('media') },
    { href: `/${locale}/admin/gallery`, icon: Images, label: t('gallery') },
    { href: `/${locale}/admin/about`, icon: Info, label: t('about') },
    { href: `/${locale}/admin/messages`, icon: Mail, label: t('messages') },
    { href: `/${locale}/admin/admin-users`, icon: ShieldCheck, label: t('adminUsers') },
    { href: `/${locale}/admin/faculty-accounts`, icon: UserCheck, label: t('facultyAccounts') },
    { href: `/${locale}/admin/site-settings`, icon: Settings, label: t('siteSettings') },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="border-b p-6">
        <Link href={`/${locale}/admin/dashboard`} className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-xl font-bold">A</span>
          </div>
          <div>
            <p className="font-heading text-lg font-bold">Admin Panel</p>
            <p className="text-xs text-muted-foreground">School Website</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 overflow-y-auto space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t p-4">
        {adminUser && (
          <div className="mb-3 rounded-lg bg-muted p-3">
            <p className="text-sm font-medium">{adminUser.fullName}</p>
            <p className="text-xs text-muted-foreground">{adminUser.email}</p>
            <p className="mt-1 text-xs">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                {adminUser.role.replace('_', ' ')}
              </span>
            </p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-error/10 hover:text-error"
        >
          <LogOut className="h-5 w-5" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-card p-2 shadow-lg lg:hidden"
      >
        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden h-screen w-64 flex-shrink-0 border-r bg-card lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-card transition-transform duration-300 lg:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
