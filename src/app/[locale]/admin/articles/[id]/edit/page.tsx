'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Save, ImagePlus, X, Loader2 } from 'lucide-react';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { uploadFile } from '@/lib/firebase/storage';
import type { Article, ArticleCategory } from '@/types';

const BYPASS = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';

const CATEGORIES: ArticleCategory[] = ['sports', 'arts', 'academics', 'achievements', 'general'];

interface FormValues {
  title: string;
  titleNe: string;
  excerpt: string;
  excerptNe: string;
  content: string;
  contentNe: string;
  category: ArticleCategory;
  authorName: string;
  authorNameNe: string;
  isFeatured: boolean;
  isPublished: boolean;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations('admin.articles');

  const [article, setArticle] = useState<Article | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const [form, setForm] = useState<FormValues>({
    title: '',
    titleNe: '',
    excerpt: '',
    excerptNe: '',
    content: '',
    contentNe: '',
    category: 'general',
    authorName: '',
    authorNameNe: '',
    isFeatured: false,
    isPublished: false,
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getDocument<Article>('articles', id);
        if (!data) {
          alert('Article not found');
          router.push('/en/admin/articles');
          return;
        }
        setArticle(data);
        setForm({
          title: data.title || '',
          titleNe: data.titleNe || '',
          excerpt: data.excerpt || '',
          excerptNe: data.excerptNe || '',
          content: data.content || '',
          contentNe: data.contentNe || '',
          category: data.category || 'general',
          authorName: data.authorName || '',
          authorNameNe: data.authorNameNe || '',
          isFeatured: data.isFeatured ?? false,
          isPublished: data.isPublished ?? false,
        });
        if (data.coverImageUrl) setCoverPreview(data.coverImageUrl);
      } catch {
        alert('Failed to load article');
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [id, router]);

  const set = <K extends keyof FormValues>(k: K, v: FormValues[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const preview = await fileToBase64(file);
    setCoverPreview(preview);
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormValues, string>> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.authorName.trim()) errs.authorName = 'Author name is required';
    if (!form.content.trim()) errs.content = 'Content is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      let coverImageUrl = article?.coverImageUrl || '';

      if (coverFile) {
        setUploading(true);
        if (BYPASS) {
          coverImageUrl = await fileToBase64(coverFile);
        } else {
          coverImageUrl = await uploadFile(coverFile, `articles/covers/${Date.now()}_${coverFile.name}`);
        }
        setUploading(false);
      } else if (!coverPreview) {
        // user removed the existing cover
        coverImageUrl = '';
      }

      const wasUnpublished = !article?.isPublished;
      const nowPublished = form.isPublished;

      await updateDocument('articles', id, {
        title: form.title.trim(),
        titleNe: form.titleNe.trim() || undefined,
        content: form.content.trim(),
        contentNe: form.contentNe.trim() || undefined,
        excerpt: form.excerpt.trim() || undefined,
        excerptNe: form.excerptNe.trim() || undefined,
        coverImageUrl: coverImageUrl || undefined,
        category: form.category,
        authorName: form.authorName.trim(),
        authorNameNe: form.authorNameNe.trim() || undefined,
        isFeatured: form.isFeatured,
        isPublished: nowPublished,
        ...(wasUnpublished && nowPublished && !article?.publishedDate
          ? { publishedDate: new Date().toISOString() }
          : {}),
      });

      // If this article came from a submission and we just published it, mark the submission as published
      if (wasUnpublished && nowPublished && article?.submissionId) {
        try {
          await updateDocument('articleSubmissions', article.submissionId, {
            status: 'approved',
            reviewedAt: new Date().toISOString(),
          });
        } catch {
          // Non-fatal
        }
      }

      alert(t('updateSuccess'));
      router.push('/en/admin/articles');
    } catch {
      alert('Failed to update article');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const inputCls = (err?: string) =>
    `w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
      err ? 'border-destructive' : ''
    }`;

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/en/admin/articles')} className="rounded-lg p-2 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold">{t('editArticle')}</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {(saving || uploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t('save')}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">{t('titleEn')} *</label>
                <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} className={inputCls(errors.title)} />
                {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t('titleNe')}</label>
                <input type="text" value={form.titleNe} onChange={(e) => set('titleNe', e.target.value)} className={inputCls()} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">{t('excerptEn')}</label>
                <textarea rows={3} value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} className={inputCls()} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t('excerptNe')}</label>
                <textarea rows={3} value={form.excerptNe} onChange={(e) => set('excerptNe', e.target.value)} className={inputCls()} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">{t('contentEn')} *</label>
              <textarea rows={14} value={form.content} onChange={(e) => set('content', e.target.value)} className={inputCls(errors.content)} />
              {errors.content && <p className="mt-1 text-xs text-destructive">{errors.content}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">{t('contentNe')}</label>
              <textarea rows={14} value={form.contentNe} onChange={(e) => set('contentNe', e.target.value)} className={inputCls()} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish settings */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h3 className="font-semibold">{t('publishSettings')}</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => set('isPublished', e.target.checked)} className="rounded" />
              <span className="text-sm">{t('isPublished')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="rounded" />
              <span className="text-sm">{t('isFeatured')}</span>
            </label>
          </div>

          {/* Category & author */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h3 className="font-semibold">{t('meta')}</h3>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('category')}</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value as ArticleCategory)} className={inputCls()}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('authorEn')} *</label>
              <input type="text" value={form.authorName} onChange={(e) => set('authorName', e.target.value)} className={inputCls(errors.authorName)} />
              {errors.authorName && <p className="mt-1 text-xs text-destructive">{errors.authorName}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('authorNe')}</label>
              <input type="text" value={form.authorNameNe} onChange={(e) => set('authorNameNe', e.target.value)} className={inputCls()} />
            </div>
          </div>

          {/* Cover image */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <h3 className="font-semibold">{t('coverImage')}</h3>
            {coverPreview ? (
              <div className="relative rounded-lg overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverPreview} alt="Cover" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={removeCover}
                  className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-6 text-sm text-muted-foreground hover:bg-muted"
                >
                  <ImagePlus className="h-5 w-5" />
                  Upload cover image
                </button>
              </>
            )}
          </div>

          {/* Submission info */}
          {article?.submissionId && (
            <div className="rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground">
              <p className="font-medium mb-1">Created from submission</p>
              <p>Submission ID: {article.submissionId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
