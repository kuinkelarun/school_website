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
import type { Event, EventFormData } from '@/types';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations('admin.events');
  const { adminUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<Partial<EventFormData>>();

  const watchTitle = watch('title');
  const watchStartDate = watch('startDate');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await getDocument<Event>('events', id);
        if (data) {
          setEvent(data);

          // Convert Timestamps to datetime-local format
          const startDate = typeof data.startDate === 'object' && 'toDate' in data.startDate
            ? data.startDate.toDate()
            : new Date(data.startDate);
          const endDate = typeof data.endDate === 'object' && 'toDate' in data.endDate
            ? data.endDate.toDate()
            : new Date(data.endDate);

          reset({
            title: data.title,
            titleNe: data.titleNe,
            description: data.description,
            descriptionNe: data.descriptionNe,
            startDate: startDate.toISOString().slice(0, 16) as any,
            endDate: endDate.toISOString().slice(0, 16) as any,
            location: data.location,
            category: data.category,
            isPublished: data.isPublished,
          });
        } else {
          alert('Event not found');
          router.push('/en/admin/events');
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        alert('Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, reset, router]);

  const onSubmit = async (data: Partial<EventFormData>) => {
    setIsSubmitting(true);

    try {
      const slug = slugify(data.title || '', { lower: true, strict: true });

      // Convert date strings to Timestamps
      const startDate = data.startDate ? Timestamp.fromDate(new Date(data.startDate as unknown as string)) : Timestamp.now();
      const endDate = data.endDate ? Timestamp.fromDate(new Date(data.endDate as unknown as string)) : startDate;

      const updateData: Partial<Event> = {
        ...data,
        slug,
        startDate,
        endDate,
        updatedAt: Timestamp.now(),
      };

      await updateDocument('events', id, updateData);
      alert(t('updateSuccess'));
      router.push('/en/admin/events');
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/en/admin/events')}
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
                placeholder="Enter event title in English"
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

            {/* Description (English) */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                {t('descriptionEn')} <span className="text-error">*</span>
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={8}
                className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter event description in English (HTML supported)"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-error">{errors.description.message}</p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                You can use HTML tags for formatting
              </p>
            </div>

            {/* Description (Nepali) */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                {t('descriptionNe')}
              </label>
              <textarea
                {...register('descriptionNe')}
                rows={8}
                className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="विवरण नेपालीमा"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Start Date & Time <span className="text-error">*</span>
                </label>
                <input
                  {...register('startDate', { required: 'Start date is required' })}
                  type="datetime-local"
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-error">{errors.startDate.message}</p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  End Date & Time
                </label>
                <input
                  {...register('endDate')}
                  type="datetime-local"
                  min={watchStartDate}
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Location <span className="text-error">*</span>
              </label>
              <input
                {...register('location', { required: 'Location is required' })}
                type="text"
                className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="School Auditorium, Sports Ground, etc."
              />
              {errors.location && (
                <p className="mt-1 text-sm text-error">{errors.location.message}</p>
              )}
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
                <option value="academic">Academic</option>
                <option value="sports">Sports</option>
                <option value="cultural">Cultural</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Published Checkbox */}
            <div className="space-y-2">
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
            onClick={() => router.push('/en/admin/events')}
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
            <span>{isSubmitting ? 'Updating...' : 'Update Event'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
