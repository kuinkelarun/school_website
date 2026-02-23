'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, GripVertical, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { useCollection, useUpdateDocument, useDeleteDocument } from '@/hooks/useFirestore';
import { orderBy } from 'firebase/firestore';
import type { HeroImage } from '@/types';
import { deleteFile } from '@/lib/firebase/storage';

export default function HeroImagesPage() {
  const t = useTranslations('admin.heroImages');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingImage, setEditingImage] = useState<HeroImage | null>(null);

  // Fetch hero images
  const { data: heroImages, loading, refetch } = useCollection<HeroImage>('heroImages', [
    orderBy('displayOrder', 'asc'),
  ]);

  const { mutate: updateImage } = useUpdateDocument<HeroImage>('heroImages');
  const { mutate: deleteImage } = useDeleteDocument('heroImages');

  const handleToggleActive = async (image: HeroImage) => {
    try {
      await updateImage(image.id, { isActive: !image.isActive });
      refetch();
    } catch (error) {
      console.error('Error toggling image:', error);
      alert('Failed to update image');
    }
  };

  const handleDelete = async (image: HeroImage) => {
    if (!confirm(t('confirmDelete'))) return;

    try {
      // Delete image from storage
      await deleteFile(image.imageUrl);

      // Delete document from Firestore
      await deleteImage(image.id);

      alert(t('deleteSuccess'));
      refetch();
    } catch (error) {
      console.error('Error deleting image:', error);
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

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {/* No Images */}
      {!loading && heroImages.length === 0 && (
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
      {!loading && heroImages.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {heroImages.map((image) => (
            <div
              key={image.id}
              className={`group relative overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg ${
                !image.isActive && 'opacity-60'
              }`}
            >
              {/* Image */}
              <div className="relative h-48 w-full">
                <img
                  src={image.imageUrl}
                  alt={image.altText}
                  className="h-full w-full object-cover"
                />

                {/* Overlay Text Preview */}
                {image.overlayText && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <p className="px-4 text-center text-sm font-semibold text-white">
                      {image.overlayText}
                    </p>
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute right-2 top-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      image.isActive
                        ? 'bg-success text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {image.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="p-4">
                <p className="mb-2 text-sm font-medium">{image.altText}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Order: {image.displayOrder}</span>
                  <span>{image.displayDuration}s</span>
                </div>

                {/* Actions */}
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleToggleActive(image)}
                    className="flex flex-1 items-center justify-center space-x-1 rounded-lg bg-muted px-3 py-2 text-sm transition-colors hover:bg-muted/80"
                  >
                    {image.isActive ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        <span>Show</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setEditingImage(image)}
                    className="rounded-lg bg-primary/10 p-2 text-primary transition-colors hover:bg-primary/20"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(image)}
                    className="rounded-lg bg-error/10 p-2 text-error transition-colors hover:bg-error/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal - Placeholder */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-card p-6">
            <h2 className="mb-4 text-2xl font-bold">Upload Hero Image</h2>
            <p className="text-muted-foreground">
              Upload form will be implemented with image uploader component.
            </p>
            <button
              onClick={() => setShowUploadModal(false)}
              className="mt-4 rounded-lg bg-muted px-4 py-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal - Placeholder */}
      {editingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-card p-6">
            <h2 className="mb-4 text-2xl font-bold">Edit Hero Image</h2>
            <p className="text-muted-foreground">
              Edit form will be implemented. Editing: {editingImage.altText}
            </p>
            <button
              onClick={() => setEditingImage(null)}
              className="mt-4 rounded-lg bg-muted px-4 py-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
