'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, MailOpen, Trash2, Reply, ChevronDown, ChevronUp, Phone, Clock } from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument, deleteDocument } from '@/lib/firebase/firestore';
import { orderBy } from 'firebase/firestore';
import type { ContactMessage } from '@/types';
import { NepaliDate } from '@/components/shared/NepaliDate';

export default function MessagesAdminPage() {
  const t = useTranslations('admin.messages');
  const { data: messages, loading, refetch } = useCollection<ContactMessage>('contactMessages', [
    orderBy('createdAt', 'desc'),
  ]);

  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read' | 'replied'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = messages.filter((m) =>
    filterStatus === 'all' ? true : m.status === filterStatus
  );

  const unreadCount = messages.filter((m) => m.status === 'unread').length;

  const filterLabels: Record<typeof filterStatus, string> = {
    all: t('filterAll'),
    unread: t('filterUnread'),
    read: t('filterRead'),
    replied: t('filterReplied'),
  };

  const handleMarkStatus = async (msg: ContactMessage, status: ContactMessage['status']) => {
    try {
      await updateDocument('contactMessages', msg.id, { status });
      refetch();
    } catch {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await deleteDocument('contactMessages', id);
      refetch();
    } catch {
      alert('Failed to delete message');
    }
  };

  const statusBadge = (status: ContactMessage['status']) => {
    if (status === 'unread')
      return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">{t('statusUnread')}</span>;
    if (status === 'replied')
      return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">{t('statusReplied')}</span>;
    return <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{t('statusRead')}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {t('title')}
            {unreadCount > 0 && (
              <span className="rounded-full bg-blue-500 px-2.5 py-0.5 text-sm font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'unread', 'read', 'replied'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              filterStatus === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted'
            }`}
          >
            {filterLabels[s]}
            {s === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-blue-500 px-1.5 py-0.5 text-xs text-white">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-lg border">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse border-b bg-muted/20 last:border-b-0" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <Mail className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            {filterStatus === 'all' ? t('noMessages') : t('noFiltered')}
          </p>
        </div>
      )}

      {/* Message List */}
      {!loading && filtered.length > 0 && (
        <div className="rounded-xl border overflow-hidden divide-y">
          {filtered.map((msg) => {
            const isExpanded = expandedId === msg.id;
            const isUnread = msg.status === 'unread';
            return (
              <div
                key={msg.id}
                className={`transition-colors ${isUnread ? 'bg-blue-50/40 dark:bg-blue-950/20' : 'bg-card'}`}
              >
                {/* Row summary */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40"
                  onClick={() => {
                    setExpandedId(isExpanded ? null : msg.id);
                    if (isUnread) handleMarkStatus(msg, 'read');
                  }}
                >
                  <div className="flex-shrink-0">
                    {isUnread ? (
                      <Mail className="h-5 w-5 text-blue-500" />
                    ) : (
                      <MailOpen className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold text-sm ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {msg.name}
                      </span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">{msg.email}</span>
                      {statusBadge(msg.status)}
                    </div>
                    <p className={`text-sm truncate ${isUnread ? 'font-medium' : 'text-muted-foreground'}`}>
                      {msg.subject}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground hidden md:block">
                      <NepaliDate date={msg.createdAt} locale="en" format="short" showAdWhileLoading />
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 space-y-4 border-t bg-muted/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${msg.email}`} className="hover:underline text-foreground">{msg.email}</a>
                      </div>
                      {msg.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span className="text-foreground">{msg.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <NepaliDate date={msg.createdAt} locale="en" format="long" showAdWhileLoading />
                      </div>
                    </div>

                    <div className="rounded-lg border bg-background p-4 text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.message}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                        onClick={() => handleMarkStatus(msg, 'replied')}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        <Reply className="h-4 w-4" />
                        {t('reply')}
                      </a>
                      {msg.status !== 'read' && msg.status !== 'replied' && (
                        <button
                          onClick={() => handleMarkStatus(msg, 'read')}
                          className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                        >
                          <MailOpen className="h-4 w-4" />
                          {t('markRead')}
                        </button>
                      )}
                      {msg.status === 'read' && (
                        <button
                          onClick={() => handleMarkStatus(msg, 'replied')}
                          className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                        >
                          <Reply className="h-4 w-4" />
                          {t('markReplied')}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 ml-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
