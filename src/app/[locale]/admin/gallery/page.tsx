'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Upload,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  X,
  ImageIcon,
  Film,
  FileText,
  Plus,
  Loader2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useCollection, useDeleteDocument, useUpdateDocument, useAddDocument } from '@/hooks/useFirestore';
import { orderBy } from 'firebase/firestore';
import { uploadFile } from '@/lib/firebase/storage';
import { formatFileSize } from '@/lib/utils';
import type { GalleryItem } from '@/types';

// ─── Bypass helpers ────────────────────────────────────────────────────────
const BYPASS = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';
const BP_KEY = 'bypass_gallery';

function bpLoad(): GalleryItem[] {
  try { return JSON.parse(localStorage.getItem(BP_KEY) || '[]'); } catch { return []; }
}
function bpSave(items: GalleryItem[]) {
  localStorage.setItem(BP_KEY, JSON.stringify(items));
}
function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
// ──────────────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'image' | 'video' | 'document';

function itemTypeFromMime(mime: string): 'image' | 'video' | 'document' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return 'document';
}

function TypeIcon({ type, className }: { type: string; className?: string }) {
  if (type === 'image') return <ImageIcon className={className} />;
  if (type === 'video') return <Film className={className} />;
  return <FileText className={className} />;
}

interface UploadingFile {
  file: File;
  preview: string;
  type: 'image' | 'video' | 'document';
  title: string;
  description: string;
  progress: number;
  error?: string;
  done: boolean;
}

export default function AdminGalleryPage() {
  const t = useTranslations('admin.gallery');

  // ── Bypass state ──────────────────────────────────────────────────────
  const [bypassItems, setBypassItems] = useState<GalleryItem[]>([]);
  useEffect(() => { if (BYPASS) setBypassItems(bpLoad()); }, []);

  // ── Firebase hooks ─────────────────────────────────────────────────────
  const { data: fbItems, loading, refetch } = useCollection<GalleryItem>(
    'gallery',
    BYPASS ? [] : [orderBy('displayOrder', 'desc')]
  );
  const { mutate: deleteItem } = useDeleteDocument('gallery');
  const { mutate: updateItem } = useUpdateDocument<GalleryItem>('gallery');
  const { mutate: addItem } = useAddDocument<Omit<GalleryItem, 'id'>>('gallery');

  const allItems = BYPASS ? bypassItems : fbItems;

  // ── UI state ──────────────────────────────────────────────────────────
  const [filter, setFilter] = useState<FilterType>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Upload queue
  const [queue, setQueue] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = filter === 'all' ? allItems : allItems.filter(i => i.type === filter);

  // ── File selection ────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newQueue: UploadingFile[] = await Promise.all(
      files.map(async (file) => {
        const type = itemTypeFromMime(file.type);
        let preview = '';
        if (type === 'image') {
          preview = URL.createObjectURL(file);
        } else if (type === 'video') {
          preview = URL.createObjectURL(file);
        }
        return {
          file,
          preview,
          type,
          title: file.name.replace(/\.[^/.]+$/, ''), // strip extension
          description: '',
          progress: 0,
          done: false,
        };
      })
    );

    setQueue(newQueue);
    if (e.target) e.target.value = '';
  };

  // ── Upload all queued files ───────────────────────────────────────────
  const handleUploadAll = async () => {
    if (queue.length === 0) return;
    setUploading(true);

    // Use a local accumulator so each loop iteration sees all previously added items
    let currentBypassItems = [...bypassItems];

    for (let i = 0; i < queue.length; i++) {
      const q = queue[i];
      if (q.done) continue;

      try {
        let url = '';
        if (BYPASS) {
          url = await fileToBase64(q.file);
        } else {
          url = await uploadFile(
            q.file,
            `gallery/${Date.now()}_${q.file.name}`,
            (progress) => {
              setQueue((prev) =>
                prev.map((item, idx) => (idx === i ? { ...item, progress } : item))
              );
            }
          );
        }

        const newItem: Omit<GalleryItem, 'id'> = {
          type: q.type,
          url,
          title: q.title || q.file.name,
          description: q.description || undefined,
          mimeType: q.file.type,
          fileSize: q.file.size,
          fileName: q.file.name,
          isPublished: true,
          displayOrder: Date.now(),
          uploadedBy: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        if (BYPASS) {
          const id = `bp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          currentBypassItems = [{ ...newItem, id }, ...currentBypassItems];
          bpSave(currentBypassItems);
          setBypassItems(currentBypassItems);
        } else {
          await addItem(newItem);
        }

        setQueue((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, done: true, progress: 100 } : item))
        );
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, error: err.message || 'Upload failed' } : item
          )
        );
      }
    }

    if (!BYPASS) refetch();
    setUploading(false);

    // Close after a short delay if all succeeded
    const allDone = queue.every((q) => q.done);
    if (allDone) {
      setTimeout(() => {
        setShowUploadModal(false);
        setQueue([]);
      }, 800);
    }
  };

  // ── Toggle published ──────────────────────────────────────────────────
  const handleTogglePublished = async (item: GalleryItem) => {
    try {
      if (BYPASS) {
        const updated = bypassItems.map((i) =>
          i.id === item.id ? { ...i, isPublished: !i.isPublished } : i
        );
        bpSave(updated);
        setBypassItems(updated);
      } else {
        await updateItem(item.id, { isPublished: !item.isPublished });
        refetch();
      }
    } catch { alert('Failed to update'); }
  };

  // ── Delete single ─────────────────────────────────────────────────────
  const handleDelete = async (item: GalleryItem) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      if (BYPASS) {
        const updated = bypassItems.filter((i) => i.id !== item.id);
        bpSave(updated);
        setBypassItems(updated);
      } else {
        await deleteItem(item.id);
        refetch();
      }
    } catch { alert('Failed to delete'); }
  };

  // ── Bulk delete ───────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    if (!selected.size || !confirm(`Delete ${selected.size} item(s)?`)) return;
    try {
      if (BYPASS) {
        const updated = bypassItems.filter((i) => !selected.has(i.id));
        bpSave(updated);
        setBypassItems(updated);
      } else {
        await Promise.all(Array.from(selected).map((id) => deleteItem(id)));
        refetch();
      }
      setSelected(new Set());
    } catch { alert('Bulk delete failed'); }
  };

  // ── Edit submit ───────────────────────────────────────────────────────
  const [editForm, setEditForm] = useState({ title: '', titleNe: '', description: '', descriptionNe: '' });

  function openEdit(item: GalleryItem) {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      titleNe: item.titleNe || '',
      description: item.description || '',
      descriptionNe: item.descriptionNe || '',
    });
  }

  const handleEditSave = async () => {
    if (!editingItem) return;
    try {
      const updates = {
        title: editForm.title,
        titleNe: editForm.titleNe || undefined,
        description: editForm.description || undefined,
        descriptionNe: editForm.descriptionNe || undefined,
      };
      if (BYPASS) {
        const updated = bypassItems.map((i) =>
          i.id === editingItem.id ? { ...i, ...updates } : i
        );
        bpSave(updated);
        setBypassItems(updated);
      } else {
        await updateItem(editingItem.id, updates);
        refetch();
      }
      setEditingItem(null);
    } catch { alert('Failed to save'); }
  };

  // ── Selection helpers ─────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((i) => i.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {allItems.length} {t('items')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4" />
              {t('deleteSelected')} ({selected.size})
            </button>
          )}
          <button
            onClick={() => { setShowUploadModal(true); setQueue([]); }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-5 w-5" />
            {t('uploadNew')}
          </button>
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'image', 'video', 'document'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {t(`filter.${f}`)}
          </button>
        ))}
      </div>

      {/* Select all row */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <button onClick={toggleSelectAll} className="flex items-center gap-2 hover:text-foreground">
            {selected.size === filtered.length && filtered.length > 0
              ? <CheckSquare className="h-4 w-4" />
              : <Square className="h-4 w-4" />}
            {selected.size === filtered.length && filtered.length > 0 ? t('deselectAll') : t('selectAll')}
          </button>
          {selected.size > 0 && <span>{selected.size} {t('selected')}</span>}
        </div>
      )}

      {/* Loading */}
      {!BYPASS && loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="rounded-lg border border-dashed p-16 text-center">
          <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="mb-4 text-muted-foreground">{t('empty')}</p>
          <button
            onClick={() => { setShowUploadModal(true); setQueue([]); }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Upload className="h-4 w-4" />
            {t('uploadNew')}
          </button>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`group relative overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg ${
                !item.isPublished && 'opacity-60'
              } ${selected.has(item.id) ? 'ring-2 ring-primary' : ''}`}
            >
              {/* Selection checkbox */}
              <button
                onClick={() => toggleSelect(item.id)}
                className="absolute left-2 top-2 z-10 rounded bg-black/50 p-1 text-white"
              >
                {selected.has(item.id)
                  ? <CheckSquare className="h-4 w-4" />
                  : <Square className="h-4 w-4" />}
              </button>

              {/* Preview */}
              <div className="relative h-48 w-full overflow-hidden bg-muted">
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : item.type === 'video' ? (
                  <video
                    src={item.url}
                    className="h-full w-full object-cover"
                    muted
                    preload="metadata"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <FileText className="h-14 w-14 text-muted-foreground/40" />
                  </div>
                )}
                {/* Type badge */}
                <div className="absolute bottom-2 left-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                    <TypeIcon type={item.type} className="h-3 w-3" />
                    {item.type}
                  </span>
                </div>
                {/* Published badge */}
                <div className="absolute right-2 top-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      item.isPublished
                        ? 'bg-green-500/90 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {item.isPublished ? t('published') : t('draft')}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="p-3">
                <p className="mb-1 truncate text-sm font-medium" title={item.title}>
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">{formatFileSize(item.fileSize)}</p>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleTogglePublished(item)}
                    title={item.isPublished ? t('hide') : t('show')}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-muted px-2 py-1.5 text-xs transition-colors hover:bg-muted/80"
                  >
                    {item.isPublished
                      ? <><EyeOff className="h-3.5 w-3.5" />{t('hide')}</>
                      : <><Eye className="h-3.5 w-3.5" />{t('show')}</>}
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="rounded-lg bg-primary/10 p-1.5 text-primary hover:bg-primary/20"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="rounded-lg bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Upload Modal ─────────────────────────────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-8">
          <div className="w-full max-w-3xl rounded-xl bg-card shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-bold">{t('uploadModal.title')}</h2>
              <button
                onClick={() => { setShowUploadModal(false); setQueue([]); }}
                className="rounded-lg p-1 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Drop zone */}
              {queue.length === 0 ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 py-16 text-center transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-muted-foreground">{t('uploadModal.dropzone')}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t('uploadModal.supportedFormats')}
                      </p>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  {/* Queue list */}
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    {queue.map((q, i) => (
                      <div key={i} className="rounded-lg border bg-background p-4">
                        <div className="flex gap-4">
                          {/* Preview */}
                          <div className="flex-shrink-0 h-20 w-20 overflow-hidden rounded-lg bg-muted">
                            {q.type === 'image' && q.preview ? (
                              <img src={q.preview} alt="" className="h-full w-full object-cover" />
                            ) : q.type === 'video' ? (
                              <video src={q.preview} className="h-full w-full object-cover" muted />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <FileText className="h-8 w-8 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>

                          {/* Fields */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={q.title}
                                  onChange={(e) =>
                                    setQueue((prev) =>
                                      prev.map((item, idx) =>
                                        idx === i ? { ...item, title: e.target.value } : item
                                      )
                                    )
                                  }
                                  placeholder={t('uploadModal.titlePlaceholder')}
                                  className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                  disabled={q.done}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => setQueue((prev) => prev.filter((_, idx) => idx !== i))}
                                disabled={q.done || uploading}
                                className="flex-shrink-0 rounded p-1 hover:bg-muted disabled:opacity-30"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={q.description}
                              onChange={(e) =>
                                setQueue((prev) =>
                                  prev.map((item, idx) =>
                                    idx === i ? { ...item, description: e.target.value } : item
                                  )
                                )
                              }
                              placeholder={t('uploadModal.descriptionPlaceholder')}
                              className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              disabled={q.done}
                            />
                            <div className="flex items-center gap-3">
                              <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs">
                                <TypeIcon type={q.type} className="h-3 w-3" />
                                {q.type}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(q.file.size)}
                              </span>
                              {q.done && (
                                <span className="text-xs font-medium text-green-600">✓ {t('uploadModal.done')}</span>
                              )}
                              {q.error && (
                                <span className="text-xs text-destructive">{q.error}</span>
                              )}
                            </div>
                            {/* Progress bar */}
                            {q.progress > 0 && !q.done && (
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${q.progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add more */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="text-sm text-primary hover:underline disabled:opacity-50"
                    >
                      + {t('uploadModal.addMore')}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {queue.length > 0 && (
              <div className="flex items-center justify-between border-t px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  {queue.filter((q) => q.done).length}/{queue.length} {t('uploadModal.filesReady')}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowUploadModal(false); setQueue([]); }}
                    disabled={uploading}
                    className="rounded-lg bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/80 disabled:opacity-50"
                  >
                    {t('uploadModal.cancel')}
                  </button>
                  <button
                    onClick={handleUploadAll}
                    disabled={uploading || queue.every((q) => q.done)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? t('uploadModal.uploading') : t('uploadModal.uploadAll')} ({queue.filter((q) => !q.done).length})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Modal ──────────────────────────────────────────────────── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-bold">{t('editModal.title')}</h2>
              <button onClick={() => setEditingItem(null)} className="rounded-lg p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium">{t('editModal.titleEn')} <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t('editModal.titleNe')}</label>
                <input
                  type="text"
                  value={editForm.titleNe}
                  onChange={(e) => setEditForm({ ...editForm, titleNe: e.target.value })}
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t('editModal.descriptionEn')}</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t('editModal.descriptionNe')}</label>
                <textarea
                  value={editForm.descriptionNe}
                  onChange={(e) => setEditForm({ ...editForm, descriptionNe: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button onClick={() => setEditingItem(null)} className="rounded-lg bg-muted px-4 py-2 text-sm hover:bg-muted/80">
                {t('editModal.cancel')}
              </button>
              <button
                onClick={handleEditSave}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {t('editModal.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
