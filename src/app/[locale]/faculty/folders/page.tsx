'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { FolderOpen, Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import { useFacultyAuth } from '@/hooks/useFacultyAuth';
import { useQueryDocuments, useAddDocument, useUpdateDocument, useDeleteDocument } from '@/hooks/useFirestore';
import type { FacultyFolder, FacultyFile } from '@/types';

export default function FacultyFoldersPage() {
  const locale = useLocale();
  const t = useTranslations('faculty.folders');
  const { user, facultyUser } = useFacultyAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FacultyFolder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const isReady = !!(user && facultyUser?.isApproved && facultyUser?.isActive);

  const { data: folders, loading, refetch } = useQueryDocuments<FacultyFolder>(
    'facultyFolders',
    isReady ? [
      { field: 'ownerId', operator: '==', value: user!.uid },
      { field: 'parentFolderId', operator: '==', value: null },
    ] : [],
    'createdAt',
    'desc'
  );

  // Get file counts per folder
  const { data: allFiles } = useQueryDocuments<FacultyFile>(
    'facultyFiles',
    isReady ? [{ field: 'ownerId', operator: '==', value: user!.uid }] : []
  );

  const { mutate: addFolder } = useAddDocument<Partial<FacultyFolder>>('facultyFolders');
  const { mutate: updateFolder } = useUpdateDocument<FacultyFolder>('facultyFolders');
  const { mutate: deleteFolder } = useDeleteDocument('facultyFolders');
  const { mutate: deleteFile } = useDeleteDocument('facultyFiles');

  const getFileCount = (folderId: string) =>
    allFiles.filter((f) => f.folderId === folderId).length;

  const handleCreate = async () => {
    if (!folderName.trim() || !user) return;
    try {
      await addFolder({
        name: folderName.trim(),
        description: folderDescription.trim() || undefined,
        ownerId: user.uid,
        parentFolderId: null,
      });
      setFolderName('');
      setFolderDescription('');
      setShowCreateModal(false);
      refetch();
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleEdit = async () => {
    if (!folderName.trim() || !editingFolder) return;
    try {
      await updateFolder(editingFolder.id, {
        name: folderName.trim(),
        description: folderDescription.trim() || undefined,
      });
      setEditingFolder(null);
      setFolderName('');
      setFolderDescription('');
      refetch();
    } catch (error) {
      console.error('Error updating folder:', error);
    }
  };

  const handleDelete = async (folderId: string) => {
    try {
      // Delete all files in this folder
      const folderFiles = allFiles.filter((f) => f.folderId === folderId);
      for (const file of folderFiles) {
        const { deleteFile: deleteStorageFile } = await import('@/lib/firebase/storage');
        try {
          await deleteStorageFile(file.storagePath);
        } catch { /* file may already be deleted */ }
        await deleteFile(file.id);
      }
      // Delete sub-folders recursively would need more logic;
      // for now delete the folder itself
      await deleteFolder(folderId);
      setDeleteConfirm(null);
      refetch();
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  };

  const openEditModal = (folder: FacultyFolder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderDescription(folder.description || '');
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => { setShowCreateModal(true); setFolderName(''); setFolderDescription(''); }}
          className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          <span>{t('newFolder')}</span>
        </button>
      </div>

      {/* Folders Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      ) : folders.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <FolderOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">{t('noFolders')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('noFoldersHint')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder) => (
            <div key={folder.id} className="group relative rounded-lg border bg-card p-5 transition-shadow hover:shadow-md">
              <Link href={`/${locale}/faculty/folders/${folder.id}`} className="block">
                <div className="flex items-start space-x-3">
                  <FolderOpen className="mt-0.5 h-8 w-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{folder.name}</h3>
                    {folder.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{folder.description}</p>
                    )}
                    <div className="mt-2 flex items-center space-x-3 text-xs text-muted-foreground">
                      <span>{getFileCount(folder.id)} {t('files')}</span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(folder.createdAt)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Actions */}
              <div className="absolute right-3 top-3 flex space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => { e.preventDefault(); openEditModal(folder); }}
                  className="rounded p-1.5 hover:bg-muted"
                  title={t('edit')}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); setDeleteConfirm(folder.id); }}
                  className="rounded p-1.5 hover:bg-error/10 text-error"
                  title={t('delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingFolder) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">
              {editingFolder ? t('editFolder') : t('newFolder')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">{t('folderName')} *</label>
                <input
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('folderNamePlaceholder')}
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">{t('description')}</label>
                <textarea
                  value={folderDescription}
                  onChange={(e) => setFolderDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('descriptionPlaceholder')}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => { setShowCreateModal(false); setEditingFolder(null); }}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {t('cancel')}
              </button>
              <button
                onClick={editingFolder ? handleEdit : handleCreate}
                disabled={!folderName.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {editingFolder ? t('save') : t('create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-card p-6 shadow-lg">
            <h2 className="mb-2 text-lg font-bold">{t('deleteConfirmTitle')}</h2>
            <p className="mb-6 text-sm text-muted-foreground">{t('deleteConfirmMessage')}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white hover:bg-error/90"
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
