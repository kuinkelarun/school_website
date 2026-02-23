'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import slugify from 'slugify';
import type { Announcement, AnnouncementFormData } from '@/types';

export default function EditAnnouncementPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations('admin.announcements');
  const { adminUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<Partial<AnnouncementFormData>>();

  const watchTitle = watch('title');

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const data = await getDocument<Announcement>('announcements', id);
        if (data) {
          setAnnouncement(data);
          reset({
            title: data.title,
            titleNe: data.titleNe,
            content: data.content,
            contentNe: data.contentNe,
            category: data.category,
            isFeatured: data.isFeatured,
            isPublished: data.isPublished,
          });
        } else {
          alert('Announcement not found');
          router.push('/en/admin/announcements');
        }
      } catch (error) {
        console.error('Error fetching announcement:', error);
        alert('Failed to load announcement');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [id, reset, router]);

  const onSubmit = async (data: Partial<AnnouncementFormData>) => {
    setIsSubmitting(true);

    try {
      const slug = slugify(data.title || '', { lower: true, strict: true });

      const updateData: Partial<Announcement> = {
        ...data,
        slug,
        updatedAt: Timestamp.now(),
      };

      // Update publishedDate if changing from draft to published
      if (data.isPublished && !announcement?.isPublished) {
        updateData.publishedDate = Timestamp.now();
      }

      await updateDocument('announcements', id, updateData);
      alert(t('updateSuccess'));
      router.push('/en/admin/announcements');
    } catch (error) {
      console.error('Error updating announcement:', error);
      alert('Failed to update announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading announcement...</p>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/en/admin/announcements')}
            className="rounded-lg p-2 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold">{t('edit')}</h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border bg-card p-6">
          <div className="space-y-4">
            {/* Title (English) */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                {t('titleEn')} <span className="text-error">*</span>
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                type="text"
                className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter announcement title in English"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-error">{errors.title.message}</p>
              )}
              {watchTitle && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Slug: {slugify(watchTitle, { lower: true, strict: true })}
                </p>
              )}
            </div>

            {/* Title (Nepali) */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                {t('titleNe')}
              </label>
              <input
                {...register('titleNe')}
                type="text"
                className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="शीर्षक नेपालीमा"
              />
            </div>

            {/* Content (English) */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                {t('contentEn')} <span className="text-error">*</span>
              </label>
              <textarea
                {...register('content', { required: 'Content is required' })}
                rows={10}
                className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter announcement content in English (HTML supported)"
              />
              {errors.content && (
                <p className="mt-1 text-sm text-error">{errors.content.message}</p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                You can use HTML tags for formatting
              </p>
            </div>

            {/* Content (Nepali) */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                {t('contentNe')}
              </label>
              <textarea
                {...register('contentNe')}
                rows={10}
                className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="सामग्री नेपालीमा"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                {t('category')} <span className="text-error">*</span>
              </label>
              <select
                {...register('category')}
                className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="general">General</option>
                <option value="academic">Academic</option>
                <option value="events">Events</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  {...register('isFeatured')}
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm">{t('featured')}</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  {...register('isPublished')}
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm">{t('published')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/en/admin/announcements')}
            className="rounded-lg border px-6 py-2 font-semibold hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center space-x-2 rounded-lg bg-primary px-6 py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            <span>{isSubmitting ? 'Updating...' : 'Update Announcement'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
