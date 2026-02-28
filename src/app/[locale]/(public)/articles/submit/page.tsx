'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowLeft, Upload, FileText, CheckCircle2, Loader2, X } from 'lucide-react';
import { addDocument } from '@/lib/firebase/firestore';
import { uploadFile } from '@/lib/firebase/storage';
import type { ArticleCategory, SubmitterType, SubmissionStatus } from '@/types';

const BYPASS = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';

const CATEGORIES: ArticleCategory[] = ['sports', 'arts', 'academics', 'achievements', 'general'];
const SUBMITTER_TYPES: SubmitterType[] = ['student', 'teacher', 'parent', 'alumni', 'other'];

type ContentMethod = 'write' | 'upload';

interface FormValues {
  submitterName: string;
  submitterEmail: string;
  submitterType: SubmitterType;
  title: string;
  titleNe: string;
  category: ArticleCategory;
  contentText: string;
}

const EMPTY: FormValues = {
  submitterName: '',
  submitterEmail: '',
  submitterType: 'student',
  title: '',
  titleNe: '',
  category: 'general',
  contentText: '',
};

export default function ArticleSubmitPage() {
  const t = useTranslations('articles.submit');
  const tCats = useTranslations('articles.categories');
  const locale = useLocale();

  const [form, setForm] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [method, setMethod] = useState<ContentMethod>('write');

  // Document upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [docUploading, setDocUploading] = useState(false);
  const [docUrl, setDocUrl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const setField = <K extends keyof FormValues>(k: K, v: FormValues[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormValues, string>> = {};
    if (!form.submitterName.trim()) errs.submitterName = 'Required';
    if (!form.submitterEmail.trim()) errs.submitterEmail = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.submitterEmail)) errs.submitterEmail = 'Invalid email';
    if (!form.title.trim()) errs.title = 'Required';
    if (method === 'write' && !form.contentText.trim()) errs.contentText = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleDocSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.docx')) {
      alert('Please select a .docx file');
      return;
    }
    setDocFile(file);
    setExtractedText('');

    // Extract text with mammoth
    try {
      const mammoth = (await import('mammoth')).default;
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      setExtractedText(result.value);
    } catch {
      setExtractedText('');
    }

    // Upload file to Storage (skip in bypass mode if too large)
    if (!BYPASS) {
      setDocUploading(true);
      try {
        const url = await uploadFile(file, `articleSubmissions/${Date.now()}_${file.name}`);
        setDocUrl(url);
      } catch {
        // non-fatal — submission still goes through with extracted text
      } finally {
        setDocUploading(false);
      }
    }
  };

  const removeDoc = () => {
    setDocFile(null);
    setExtractedText('');
    setDocUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const status: SubmissionStatus = 'pending';
      await addDocument('articleSubmissions', {
        title: form.title.trim(),
        titleNe: form.titleNe.trim() || undefined,
        submitterName: form.submitterName.trim(),
        submitterEmail: form.submitterEmail.trim(),
        submitterType: form.submitterType,
        category: form.category,
        contentText: method === 'write' ? form.contentText.trim() : undefined,
        documentUrl: docUrl || undefined,
        documentName: docFile?.name || undefined,
        extractedText: method === 'upload' ? extractedText : undefined,
        status,
      });
      setSubmitted(true);
    } catch {
      setSubmitError(t('errorMessage'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-16">
        <div className="mx-auto max-w-md rounded-xl border bg-card p-10 text-center shadow-sm">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
          <h2 className="mb-3 text-2xl font-bold">{t('successTitle')}</h2>
          <p className="mb-8 text-muted-foreground">{t('successMessage')}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => { setSubmitted(false); setForm(EMPTY); setDocFile(null); setExtractedText(''); setDocUrl(''); }}
              className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted"
            >
              {t('submitAnother')}
            </button>
            <Link
              href={`/${locale}/articles`}
              className="rounded-lg bg-primary px-5 py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Browse Articles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const inputClass = (err?: string) =>
    `w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
      err ? 'border-destructive' : ''
    }`;

  return (
    <div className="py-12">
      <div className="container max-w-2xl">
        {/* Back */}
        <Link
          href={`/${locale}/articles`}
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Articles
        </Link>

        <h1 className="mb-2 text-3xl font-bold">{t('title')}</h1>
        <p className="mb-8 text-muted-foreground">{t('subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Submitter info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{t('submitterName')} *</label>
              <input
                type="text"
                value={form.submitterName}
                onChange={(e) => setField('submitterName', e.target.value)}
                className={inputClass(errors.submitterName)}
              />
              {errors.submitterName && <p className="mt-1 text-xs text-destructive">{errors.submitterName}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('submitterEmail')} *</label>
              <input
                type="email"
                value={form.submitterEmail}
                onChange={(e) => setField('submitterEmail', e.target.value)}
                className={inputClass(errors.submitterEmail)}
              />
              {errors.submitterEmail && <p className="mt-1 text-xs text-destructive">{errors.submitterEmail}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{t('submitterType')}</label>
              <select
                value={form.submitterType}
                onChange={(e) => setField('submitterType', e.target.value as SubmitterType)}
                className={inputClass()}
              >
                {SUBMITTER_TYPES.map((type) => (
                  <option key={type} value={type}>{t(`submitterTypes.${type}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('category')}</label>
              <select
                value={form.category}
                onChange={(e) => setField('category', e.target.value as ArticleCategory)}
                className={inputClass()}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{tCats(cat)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{t('articleTitle')} *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                className={inputClass(errors.title)}
              />
              {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('articleTitleNe')}</label>
              <input
                type="text"
                value={form.titleNe}
                onChange={(e) => setField('titleNe', e.target.value)}
                className={inputClass()}
                placeholder="वैकल्पिक"
              />
            </div>
          </div>

          {/* Content method tabs */}
          <div>
            <label className="mb-2 block text-sm font-medium">{t('contentMethod')}</label>
            <div className="flex rounded-lg border overflow-hidden">
              <button
                type="button"
                onClick={() => setMethod('write')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  method === 'write' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                {t('writeHere')}
              </button>
              <button
                type="button"
                onClick={() => setMethod('upload')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  method === 'upload' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                {t('uploadDoc')}
              </button>
            </div>
          </div>

          {/* Write content */}
          {method === 'write' && (
            <div>
              <textarea
                rows={10}
                value={form.contentText}
                onChange={(e) => setField('contentText', e.target.value)}
                placeholder={t('contentPlaceholder')}
                className={inputClass(errors.contentText)}
              />
              {errors.contentText && <p className="mt-1 text-xs text-destructive">{errors.contentText}</p>}
            </div>
          )}

          {/* Upload .docx */}
          {method === 'upload' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t('uploadHint')}</p>
              {!docFile ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleDocSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg border border-dashed px-6 py-4 text-sm hover:bg-muted w-full justify-center"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">Click to select .docx file</span>
                  </button>
                </>
              ) : (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{docFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(docFile.size / 1024).toFixed(1)} KB
                          {docUploading && ' — Uploading...'}
                          {docUrl && ' — ' + t('docUploaded')}
                        </p>
                      </div>
                    </div>
                    <button type="button" onClick={removeDoc} className="rounded-lg p-1 hover:bg-muted">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {extractedText && (
                    <div className="mt-4">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('extractedPreview')}
                      </p>
                      <div className="max-h-48 overflow-y-auto rounded border bg-background p-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {extractedText.slice(0, 1200)}
                        {extractedText.length > 1200 && '…'}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {method === 'upload' && !docFile && errors.contentText && (
                <p className="text-xs text-destructive">Please upload a document</p>
              )}
            </div>
          )}

          {/* Submit */}
          {submitError && (
            <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={submitting || docUploading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" />{t('submitting')}</>
            ) : t('submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
