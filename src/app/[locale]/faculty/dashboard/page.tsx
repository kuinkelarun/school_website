'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { FolderOpen, FileText, HardDrive, Plus } from 'lucide-react';
import { useFacultyAuth } from '@/hooks/useFacultyAuth';
import { useQueryDocuments } from '@/hooks/useFirestore';
import type { FacultyFolder, FacultyFile } from '@/types';
import { FACULTY_STORAGE_LIMIT_MB } from '@/lib/firebase/storage';

export default function FacultyDashboardPage() {
  const locale = useLocale();
  const t = useTranslations('faculty.dashboard');
  const { facultyUser, user } = useFacultyAuth();

  const isReady = !!(user && facultyUser?.isApproved && facultyUser?.isActive);

  const { data: folders } = useQueryDocuments<FacultyFolder>(
    'facultyFolders',
    isReady ? [{ field: 'ownerId', operator: '==', value: user!.uid }] : [],
    undefined,
    'desc'
  );

  const { data: files } = useQueryDocuments<FacultyFile>(
    'facultyFiles',
    isReady ? [{ field: 'ownerId', operator: '==', value: user!.uid }] : [],
    'createdAt',
    'desc',
    5
  );

  const storageUsedMB = (facultyUser?.storageUsed || 0) / (1024 * 1024);
  const storagePercent = Math.min((storageUsedMB / FACULTY_STORAGE_LIMIT_MB) * 100, 100);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('welcome')}, {facultyUser?.fullName}!</h1>
        <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{folders.length}</p>
              <p className="text-sm text-muted-foreground">{t('totalFolders')}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 text-info">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{files.length}</p>
              <p className="text-sm text-muted-foreground">{t('totalFiles')}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatBytes(facultyUser?.storageUsed || 0)}</p>
              <p className="text-sm text-muted-foreground">{t('storageUsed')}</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{storageUsedMB.toFixed(1)} MB</span>
              <span>{FACULTY_STORAGE_LIMIT_MB} MB</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className={`h-2 rounded-full transition-all ${storagePercent > 90 ? 'bg-error' : storagePercent > 70 ? 'bg-warning' : 'bg-success'}`}
                style={{ width: `${storagePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <div className="mb-8">
        <Link
          href={`/${locale}/faculty/folders`}
          className="inline-flex items-center space-x-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
          <span>{t('manageDocuments')}</span>
        </Link>
      </div>

      {/* Recent Files */}
      {files.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-bold">{t('recentFiles')}</h2>
          <div className="rounded-lg border bg-card">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between border-b last:border-0 px-4 py-3">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.originalFileName}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.fileSize)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
