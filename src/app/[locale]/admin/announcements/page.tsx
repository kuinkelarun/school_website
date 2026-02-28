'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, Eye, Star, ToggleLeft, ToggleRight } from 'lucide-react';
import { useCollection, useDeleteDocument } from '@/hooks/useFirestore';
import { updateDocument } from '@/lib/firebase/firestore';
import { orderBy } from 'firebase/firestore';
import type { Announcement } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AnnouncementsAdminPage() {
  const router = useRouter();
  const t = useTranslations('admin.announcements');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch announcements
  const { data: announcements, loading, refetch } = useCollection<Announcement>(
    'announcements',
    [orderBy('createdAt', 'desc')]
  );

  const { mutate: deleteAnnouncement } = useDeleteDocument('announcements');

  // Filter announcements
  const filteredAnnouncements = announcements.filter((announcement) => {
    if (filterCategory !== 'all' && announcement.category !== filterCategory) return false;
    if (filterStatus === 'published' && !announcement.isPublished) return false;
    if (filterStatus === 'draft' && announcement.isPublished) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;

    try {
      await deleteAnnouncement(id);
      alert(t('deleteSuccess'));
      refetch();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement');
    }
  };

  const handleTogglePublish = async (announcement: Announcement) => {
    try {
      const newPublished = !announcement.isPublished;
      await updateDocument('announcements', announcement.id, {
        isPublished: newPublished,
        ...(newPublished && !announcement.publishedDate
          ? { publishedDate: new Date().toISOString() }
          : {}),
      });
      refetch();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      alert('Failed to update announcement');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-1 text-muted-foreground">
            Manage all announcements and news
          </p>
        </div>
        <button
          onClick={() => router.push('/en/admin/announcements/new')}
          className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
          <span>{t('createNew')}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border bg-background px-4 py-2"
        >
          <option value="all">All Categories</option>
          <option value="general">General</option>
          <option value="academic">Academic</option>
          <option value="events">Events</option>
          <option value="urgent">Urgent</option>
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border bg-background px-4 py-2"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-lg border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse border-b bg-muted/20 last:border-b-0" />
          ))}
        </div>
      )}

      {/* No Announcements */}
      {!loading && filteredAnnouncements.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="mb-4 text-muted-foreground">
            {announcements.length === 0
              ? 'No announcements yet. Create your first announcement!'
              : 'No announcements match your filters.'}
          </p>
          {announcements.length === 0 && (
            <button
              onClick={() => router.push('/en/admin/announcements/new')}
              className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
            >
              <Plus className="h-5 w-5" />
              <span>{t('createNew')}</span>
            </button>
          )}
        </div>
      )}

      {/* Announcements Table */}
      {!loading && filteredAnnouncements.length > 0 && (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnnouncements.map((announcement) => (
                  <tr key={announcement.id} className="border-b last:border-b-0 hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {announcement.isFeatured && (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        )}
                        <span className="font-medium">{announcement.title}</span>
                      </div>
                      {announcement.titleNe && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {announcement.titleNe}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                        {announcement.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          announcement.isPublished
                            ? 'bg-success/10 text-success'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {announcement.isPublished ? t('published') : t('draft')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(
                        typeof announcement.createdAt === 'object' && 'toDate' in announcement.createdAt
                          ? announcement.createdAt.toDate()
                          : announcement.createdAt,
                        'en'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleTogglePublish(announcement)}
                          className={`rounded-lg p-2 transition-colors ${
                            announcement.isPublished
                              ? 'bg-success/10 text-success hover:bg-success/20'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                          title={announcement.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {announcement.isPublished ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => window.open(`/en/announcements/${announcement.slug}`, '_blank')}
                          className="rounded-lg bg-muted p-2 transition-colors hover:bg-muted/80"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/en/admin/announcements/${announcement.id}/edit`)}
                          className="rounded-lg bg-primary/10 p-2 text-primary transition-colors hover:bg-primary/20"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="rounded-lg bg-error/10 p-2 text-error transition-colors hover:bg-error/20"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
