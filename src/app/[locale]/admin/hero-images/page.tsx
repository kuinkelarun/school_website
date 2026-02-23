'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Eye, EyeOff, Pencil, Trash2, Upload, X, ImageIcon } from 'lucide-react';
import { useCollection, useUpdateDocument, useDeleteDocument, useAddDocument } from '@/hooks/useFirestore';
import { orderBy } from 'firebase/firestore';
import type { HeroImage } from '@/types';
import { deleteFile, uploadFile } from '@/lib/firebase/storage';

// ─── Bypass mode helpers ───────────────────────────────────────────────────
const BYPASS = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';
const LS_KEY = 'bypass_hero_images';

function loadBypassImages(): HeroImage[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBypassImages(images: HeroImage[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(images));
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
// ──────────────────────────────────────────────────────────────────────────

export default function HeroImagesPage() {
  const t = useTranslations('admin.heroImages');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingImage, setEditingImage] = useState<HeroImage | null>(null);

  // ── Bypass mode state ──────────────────────────────────────────────────
  const [bypassImages, setBypassImages] = useState<HeroImage[]>([]);
  useEffect(() => {
    if (BYPASS) setBypassImages(loadBypassImages());
  }, []);

  // ── Firebase hooks (skipped in bypass mode) ───────────────────────────
  const { data: firebaseImages, loading, refetch } = useCollection<HeroImage>(
    'heroImages',
    BYPASS ? [] : [orderBy('displayOrder', 'asc')]
  );
  const { mutate: updateImage } = useUpdateDocument<HeroImage>('heroImages');
  const { mutate: deleteImage } = useDeleteDocument('heroImages');
  const { mutate: addImage } = useAddDocument<Omit<HeroImage, 'id'>>('heroImages');

  const heroImages = BYPASS ? bypassImages : firebaseImages;

  // ── Upload state ───────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [form, setForm] = useState({
    altText: '',
    overlayText: '',
    displayOrder: 1,
    displayDuration: 5,
    isActive: true,
  });

  // Edit form state
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [editForm, setEditForm] = useState({
    altText: '',
    overlayText: '',
    displayOrder: 1,
    displayDuration: 5,
    isActive: true,
  });

  function openEdit(image: HeroImage) {
    setEditingImage(image);
    setEditForm({
      altText: image.altText,
      overlayText: image.overlayText ?? '',
      displayOrder: image.displayOrder,
      displayDuration: image.displayDuration,
      isActive: image.isActive,
    });
    setEditPreviewUrl(image.imageUrl);
    setEditSelectedFile(null);
  }

  function closeUpload() {
    setShowUploadModal(false);
    setPreviewUrl(null);
    setSelectedFile(null);
    setUploadError(null);
    setForm({ altText: '', overlayText: '', displayOrder: 1, displayDuration: 5, isActive: true });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function closeEdit() {
    setEditingImage(null);
    setEditPreviewUrl(null);
    setEditSelectedFile(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, mode: 'upload' | 'edit') {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (JPEG, PNG, WebP, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File must be under 10 MB');
      return;
    }
    setUploadError(null);
    const url = URL.createObjectURL(file);
    if (mode === 'upload') {
      setSelectedFile(file);
      setPreviewUrl(url);
    } else {
      setEditSelectedFile(file);
      setEditPreviewUrl(url);
    }
  }

  // ── Upload submit ──────────────────────────────────────────────────────
  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) { setUploadError('Please select an image'); return; }
    if (!form.altText.trim()) { setUploadError('Alt text is required'); return; }
    setUploading(true);
    setUploadError(null);
    try {
      let imageUrl: string;
      if (BYPASS) {
        imageUrl = await fileToBase64(selectedFile);
        const newImage: HeroImage = {
          id: `bypass_${Date.now()}`,
          imageUrl,
          altText: form.altText,
          overlayText: form.overlayText || undefined,
          displayOrder: form.displayOrder,
          displayDuration: form.displayDuration,
          isActive: form.isActive,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const updated = [...bypassImages, newImage].sort((a, b) => a.displayOrder - b.displayOrder);
        saveBypassImages(updated);
        setBypassImages(updated);
      } else {
        imageUrl = await uploadFile(selectedFile, `heroImages/${Date.now()}_${selectedFile.name}`);
        await addImage({
          imageUrl,
          altText: form.altText,
          overlayText: form.overlayText || undefined,
          displayOrder: form.displayOrder,
          displayDuration: form.displayDuration,
          isActive: form.isActive,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        refetch();
      }
      closeUpload();
    } catch (err: any) {
      setUploadError(err.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  // ── Edit submit ────────────────────────────────────────────────────────
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingImage) return;
    if (!editForm.altText.trim()) return;
    setUploading(true);
    try {
      let imageUrl = editingImage.imageUrl;
      if (editSelectedFile) {
        imageUrl = BYPASS
          ? await fileToBase64(editSelectedFile)
          : await uploadFile(editSelectedFile, `heroImages/${Date.now()}_${editSelectedFile.name}`);
      }
      if (BYPASS) {
        const updated = bypassImages.map((img) =>
          img.id === editingImage.id
            ? { ...img, ...editForm, imageUrl, overlayText: editForm.overlayText || undefined, updatedAt: new Date() }
            : img
        ).sort((a, b) => a.displayOrder - b.displayOrder);
        saveBypassImages(updated);
        setBypassImages(updated);
      } else {
        await updateImage(editingImage.id, { ...editForm, imageUrl, overlayText: editForm.overlayText || undefined, updatedAt: new Date() });
        refetch();
      }
      closeEdit();
    } catch (err: any) {
      alert('Failed to update: ' + (err.message ?? err));
    } finally {
      setUploading(false);
    }
  }

  // ── Toggle / Delete ────────────────────────────────────────────────────
  const handleToggleActive = async (image: HeroImage) => {
    try {
      if (BYPASS) {
        const updated = bypassImages.map((img) =>
          img.id === image.id ? { ...img, isActive: !img.isActive } : img
        );
        saveBypassImages(updated);
        setBypassImages(updated);
      } else {
        await updateImage(image.id, { isActive: !image.isActive });
        refetch();
      }
    } catch {
      alert('Failed to update image');
    }
  };

  const handleDelete = async (image: HeroImage) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      if (BYPASS) {
        const updated = bypassImages.filter((img) => img.id !== image.id);
        saveBypassImages(updated);
        setBypassImages(updated);
      } else {
        await deleteFile(image.imageUrl);
        await deleteImage(image.id);
        refetch();
      }
    } catch {
      alert('Failed to delete image');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('reorder')}</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
          <span>{t('uploadNew')}</span>
        </button>
      </div>

      {/* Loading */}
      {!BYPASS && loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {/* Empty */}
      {heroImages.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="mb-4 text-muted-foreground">No hero images yet. Upload your first image!</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
          >
            <Plus className="h-5 w-5" />
            <span>{t('uploadNew')}</span>
          </button>
        </div>
      )}

      {/* Images Grid */}
      {heroImages.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {heroImages.map((image) => (
            <div
              key={image.id}
              className={`group relative overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg ${!image.isActive && 'opacity-60'}`}
            >
              <div className="relative h-48 w-full">
                <img src={image.imageUrl} alt={image.altText} className="h-full w-full object-cover" />
                {image.overlayText && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <p className="px-4 text-center text-sm font-semibold text-white">{image.overlayText}</p>
                  </div>
                )}
                <div className="absolute right-2 top-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${image.isActive ? 'bg-success text-white' : 'bg-muted text-muted-foreground'}`}>
                    {image.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="mb-2 text-sm font-medium">{image.altText}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Order: {image.displayOrder}</span>
                  <span>{image.displayDuration}s</span>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button onClick={() => handleToggleActive(image)} className="flex flex-1 items-center justify-center space-x-1 rounded-lg bg-muted px-3 py-2 text-sm transition-colors hover:bg-muted/80">
                    {image.isActive ? <><EyeOff className="h-4 w-4" /><span>Hide</span></> : <><Eye className="h-4 w-4" /><span>Show</span></>}
                  </button>
                  <button onClick={() => openEdit(image)} className="rounded-lg bg-primary/10 p-2 text-primary transition-colors hover:bg-primary/20">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(image)} className="rounded-lg bg-error/10 p-2 text-error transition-colors hover:bg-error/20">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Upload Modal ─────────────────────────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-card p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Upload Hero Image</h2>
              <button onClick={closeUpload} className="rounded-lg p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-5">
              {/* File picker */}
              <div>
                <label className="mb-2 block text-sm font-medium">Image File <span className="text-error">*</span></label>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'upload')} />
                {previewUrl ? (
                  <div className="relative">
                    <img src={previewUrl} alt="preview" className="h-48 w-full rounded-lg object-cover" />
                    <button type="button" onClick={() => { setPreviewUrl(null); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 transition-colors hover:border-primary hover:bg-primary/5">
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to select an image</span>
                    <span className="text-xs text-muted-foreground">JPEG, PNG, WebP — max 10 MB</span>
                  </button>
                )}
              </div>

              {/* Alt Text */}
              <div>
                <label className="mb-1 block text-sm font-medium">Alt Text <span className="text-error">*</span></label>
                <input type="text" value={form.altText} onChange={(e) => setForm({ ...form, altText: e.target.value })} className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Describe the image" />
              </div>

              {/* Overlay Text */}
              <div>
                <label className="mb-1 block text-sm font-medium">Overlay Text <span className="text-muted-foreground text-xs">(optional)</span></label>
                <input type="text" value={form.overlayText} onChange={(e) => setForm({ ...form, overlayText: e.target.value })} className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Text shown on top of the image" />
              </div>

              {/* Order & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Display Order</label>
                  <input type="number" min={1} value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Duration (seconds)</label>
                  <input type="number" min={1} max={30} value={form.displayDuration} onChange={(e) => setForm({ ...form, displayDuration: Number(e.target.value) })} className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                <span className="text-sm font-medium">Active (show in carousel)</span>
              </label>

              {uploadError && <p className="text-sm text-error">{uploadError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeUpload} className="rounded-lg bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/80">Cancel</button>
                <button type="submit" disabled={uploading} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading…' : 'Upload Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ───────────────────────────────────────────────── */}
      {editingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-card p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Edit Hero Image</h2>
              <button onClick={closeEdit} className="rounded-lg p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5">
              {/* Image preview / change */}
              <div>
                <label className="mb-2 block text-sm font-medium">Image</label>
                <input ref={editFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'edit')} />
                <div className="relative">
                  {editPreviewUrl && <img src={editPreviewUrl} alt="preview" className="h-48 w-full rounded-lg object-cover" />}
                  <button type="button" onClick={() => editFileInputRef.current?.click()} className="mt-2 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
                    <ImageIcon className="h-4 w-4" /> Change image
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Alt Text <span className="text-error">*</span></label>
                <input type="text" value={editForm.altText} onChange={(e) => setEditForm({ ...editForm, altText: e.target.value })} className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Overlay Text <span className="text-muted-foreground text-xs">(optional)</span></label>
                <input type="text" value={editForm.overlayText} onChange={(e) => setEditForm({ ...editForm, overlayText: e.target.value })} className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Display Order</label>
                  <input type="number" min={1} value={editForm.displayOrder} onChange={(e) => setEditForm({ ...editForm, displayOrder: Number(e.target.value) })} className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Duration (seconds)</label>
                  <input type="number" min={1} max={30} value={editForm.displayDuration} onChange={(e) => setEditForm({ ...editForm, displayDuration: Number(e.target.value) })} className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                <span className="text-sm font-medium">Active (show in carousel)</span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeEdit} className="rounded-lg bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/80">Cancel</button>
                <button type="submit" disabled={uploading} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {uploading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
