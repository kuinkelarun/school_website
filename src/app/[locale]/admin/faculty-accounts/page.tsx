'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CheckCircle, XCircle, ToggleLeft, ToggleRight, Loader2, Users, Clock, Trash2, AlertTriangle,
} from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument } from '@/lib/firebase/firestore';
import { functions } from '@/lib/firebase/config';
import type { FacultyUser } from '@/types';

type FilterTab = 'all' | 'pending' | 'approved' | 'inactive';

export default function FacultyAccountsPage() {
  const t = useTranslations('admin.facultyAccounts');
  const { data: accounts, loading, refetch } = useCollection<FacultyUser>('facultyUsers');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [deleteConfirmAccount, setDeleteConfirmAccount] = useState<FacultyUser | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleApprove = async (id: string) => {
    try {
      await updateDocument('facultyUsers', id, { isApproved: true });
      showStatus(t('approved'));
      refetch();
    } catch (err) {
      console.error('Error approving account:', err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateDocument('facultyUsers', id, { isApproved: false, isActive: false });
      showStatus(t('rejected'));
      refetch();
    } catch (err) {
      console.error('Error rejecting account:', err);
    }
  };

  const handleToggleActive = async (account: FacultyUser) => {
    try {
      await updateDocument('facultyUsers', account.id, { isActive: !account.isActive });
      showStatus(account.isActive ? t('deactivated') : t('activated'));
      refetch();
    } catch (err) {
      console.error('Error toggling account:', err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmAccount) return;
    const accountId = deleteConfirmAccount.id;
    setDeletingAccountId(accountId);
    setDeleteConfirmAccount(null);
    try {
      const deleteFacultyMember = httpsCallable(functions, 'deleteFacultyMember');
      await deleteFacultyMember({ userId: accountId });
      showStatus(t('deleted'));
      refetch();
    } catch (err) {
      console.error('Error deleting faculty member:', err);
      showStatus(t('deleteFailed'));
    } finally {
      setDeletingAccountId(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const filtered = accounts.filter((a) => {
    switch (filter) {
      case 'pending': return !a.isApproved && a.isActive;
      case 'approved': return a.isApproved && a.isActive;
      case 'inactive': return !a.isActive;
      default: return true;
    }
  });

  const pendingCount = accounts.filter((a) => !a.isApproved && a.isActive).length;

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: t('tabs.all'), count: accounts.length },
    { key: 'pending', label: t('tabs.pending'), count: pendingCount },
    { key: 'approved', label: t('tabs.approved') },
    { key: 'inactive', label: t('tabs.inactive') },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('title')}</h1>

      {statusMessage && (
        <div className="rounded-lg border bg-muted/50 p-3 text-sm">{statusMessage}</div>
      )}

      {/* Filter tabs */}
      <div className="flex space-x-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Users className="mb-2 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{t('noAccounts')}</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          {/* Table header */}
          <div className="hidden border-b px-4 py-3 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-12 sm:gap-4">
            <span className="col-span-3">{t('name')}</span>
            <span className="col-span-3">{t('email')}</span>
            <span className="col-span-2">{t('status')}</span>
            <span className="col-span-2">{t('storage')}</span>
            <span className="col-span-2 text-right">{t('actions')}</span>
          </div>
          {filtered.map((account) => (
            <div
              key={account.id}
              className="flex flex-col border-b last:border-0 px-4 py-3 sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center"
            >
              <div className="col-span-3 font-medium text-sm">{account.fullName}</div>
              <div className="col-span-3 text-sm text-muted-foreground truncate">{account.email}</div>
              <div className="col-span-2 mt-1 sm:mt-0">
                {!account.isActive ? (
                  <span className="inline-flex items-center space-x-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    <XCircle className="h-3 w-3" />
                    <span>{t('inactive')}</span>
                  </span>
                ) : account.isApproved ? (
                  <span className="inline-flex items-center space-x-1 rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
                    <CheckCircle className="h-3 w-3" />
                    <span>{t('active')}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">
                    <Clock className="h-3 w-3" />
                    <span>{t('pending')}</span>
                  </span>
                )}
              </div>
              <div className="col-span-2 text-xs text-muted-foreground mt-1 sm:mt-0">
                {formatBytes(account.storageUsed || 0)}
              </div>
              <div className="col-span-2 flex items-center justify-end space-x-1 mt-2 sm:mt-0">
                {!account.isApproved && account.isActive && (
                  <>
                    <button
                      onClick={() => handleApprove(account.id)}
                      className="rounded px-2 py-1 text-xs font-medium bg-success/10 text-success hover:bg-success/20"
                      title={t('approve')}
                    >
                      {t('approve')}
                    </button>
                    <button
                      onClick={() => handleReject(account.id)}
                      className="rounded px-2 py-1 text-xs font-medium bg-error/10 text-error hover:bg-error/20"
                      title={t('reject')}
                    >
                      {t('reject')}
                    </button>
                  </>
                )}
                {account.isApproved && (
                  <button
                    onClick={() => handleToggleActive(account)}
                    className="rounded p-1.5 hover:bg-muted"
                    title={account.isActive ? t('deactivate') : t('activate')}
                  >
                    {account.isActive ? (
                      <ToggleRight className="h-5 w-5 text-success" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => setDeleteConfirmAccount(account)}
                  disabled={deletingAccountId === account.id}
                  className="rounded p-1.5 hover:bg-error/10 text-muted-foreground hover:text-error disabled:opacity-50"
                  title={t('delete')}
                >
                  {deletingAccountId === account.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center space-x-3 text-error">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-bold">{t('deleteConfirmTitle')}</h3>
            </div>
            <p className="mb-2 text-sm font-medium">{deleteConfirmAccount.fullName} ({deleteConfirmAccount.email})</p>
            <p className="mb-6 text-sm text-muted-foreground">{t('deleteConfirmMessage')}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmAccount(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="rounded-lg bg-error px-4 py-2 text-sm font-medium text-error-foreground hover:bg-error/90"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
