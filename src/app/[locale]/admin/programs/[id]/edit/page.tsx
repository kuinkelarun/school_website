'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save } from 'lucide-react';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import slugify from 'slugify';
import type { Program, ProgramFormData } from '@/types';

export default function EditProgramPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations('admin.programs');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<Program | null>(null);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<Partial<ProgramFormData>>();

  const watchTitle = watch('title');

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const data = await getDocument<Program>('programs', id);
        if (data) {
          setProgram(data);
          reset({
            title: data.title,
            titleNe: data.titleNe,
            description: data.description,
            descriptionNe: data.descriptionNe,
            objectives: data.objectives,
            objectivesNe: data.objectivesNe,
            category: data.category,
            displayOrder: data.displayOrder,
            isPublished: data.isPublished,
          });
        } else {
          alert('Program not found');
          router.push('/en/admin/programs');
        }
      } catch (error) {
        console.error('Error fetching program:', error);
        alert('Failed to load program');
      } finally {
        setLoading(false);
      }
    };

    fetchProgram();
  }, [id, reset, router]);

  const onSubmit = async (data: Partial<ProgramFormData>) => {
    setIsSubmitting(true);

    try {
      const slug = slugify(data.title || '', { lower: true, strict: true });

      const updateData: Partial<Program> = {
        ...data,
        slug,
        updatedAt: Timestamp.now(),
      };

      await updateDocument('programs', id, updateData);
      alert(t('updateSuccess'));
      router.push('/en/admin/programs');
    } catch (error) {
      console.error('Error updating program:', error);
      alert('Failed to update program');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading program...</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/en/admin/programs')}
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
                placeholder="Enter program title in English"
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
                placeholder="Enter program description in English (HTML supported)"
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

            {/* Objectives (English) */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Objectives (English)
              </label>
              <textarea
                {...register('objectives')}
                rows={6}
                className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Program objectives and learning outcomes (HTML supported)"
              />
              <p className="mt-1 text-sm text-muted-foreground">
                You can use HTML tags for formatting
              </p>
            </div>

            {/* Objectives (Nepali) */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Objectives (Nepali)
              </label>
              <textarea
                {...register('objectivesNe')}
                rows={6}
                className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="उद्देश्यहरू नेपालीमा"
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
                <option value="science">Science</option>
                <option value="commerce">Commerce</option>
                <option value="arts">Arts</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Display Order */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Display Order <span className="text-error">*</span>
              </label>
              <input
                {...register('displayOrder', { required: 'Display order is required', valueAsNumber: true })}
                type="number"
                min="1"
                className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="1"
              />
              {errors.displayOrder && (
                <p className="mt-1 text-sm text-error">{errors.displayOrder.message}</p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                Programs are displayed in ascending order
              </p>
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
            onClick={() => router.push('/en/admin/programs')}
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
            <span>{isSubmitting ? 'Updating...' : 'Update Program'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
