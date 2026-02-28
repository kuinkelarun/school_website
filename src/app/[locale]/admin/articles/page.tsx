'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Star,
  Inbox, Newspaper, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useCollection, useDeleteDocument } from '@/hooks/useFirestore';
import { addDocument, updateDocument } from '@/lib/firebase/firestore';
import { orderBy } from 'firebase/firestore';
import type { Article, ArticleSubmission } from '@/types';
import { formatDate } from '@/lib/utils';
import slugify from 'slugify';

type Tab = 'articles' | 'submissions';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function AdminArticlesPage() {
  const router = useRouter();
  const tA = useTranslations('admin.articles');
  const [tab, setTab] = useState<Tab>('articles');

  // Articles
  const { data: articles, loading: loadingArticles, refetch: refetchArticles } = useCollection<Article>(
    'articles',
    [orderBy('createdAt', 'desc')]
  );
  const { mutate: deleteArticle } = useDeleteDocument('articles');

  // Submissions
  const { data: submissions, loading: loadingSubmissions, refetch: refetchSubmissions } = useCollection<ArticleSubmission>(
    'articleSubmissions',
    [orderBy('createdAt', 'desc')]
  );

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  // --- Article actions ---
  const handleDeleteArticle = async (id: string) => {
    if (!confirm(tA('confirmDelete'))) return;
    try {
      await deleteArticle(id);
      refetchArticles();
    } catch {
      alert('Failed to delete article');
    }
  };

  const handleTogglePublish = async (article: Article) => {
    const newPublished = !article.isPublished;
    try {
      await updateDocument('articles', article.id, {
        isPublished: newPublished,
        ...(newPublished && !article.publishedDate
          ? { publishedDate: new Date().toISOString() }
          : {}),
      });
      refetchArticles();
    } catch {
      alert('Failed to update article');
    }
  };

  // --- Submission actions ---
  const handleCreateDraft = async (sub: ArticleSubmission) => {
    if (!sub.id) return;
    try {
      const slug = slugify(sub.title, { lower: true, strict: true });
      const newId = await addDocument('articles', {
        title: sub.title,
        titleNe: sub.titleNe || '',
        slug,
        content: sub.extractedText || sub.contentText || '',
        contentNe: '',
        excerpt: '',
        excerptNe: '',
        category: sub.category,
        authorName: sub.submitterName,
        authorNameNe: '',
        isPublished: false,
        isFeatured: false,
        viewCount: 0,
        submissionId: sub.id,
      });
      await updateDocument('articleSubmissions', sub.id, { status: 'approved' });
      refetchSubmissions();
      refetchArticles();
      router.push(`/en/admin/articles/${newId}/edit`);
    } catch {
      alert('Failed to create draft article');
    }
  };

  const [rejectModal, setRejectModal] = useState<{ id: string; notes: string } | null>(null);

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await updateDocument('articleSubmissions', rejectModal.id, {
        status: 'rejected',
        adminNotes: rejectModal.notes,
        reviewedAt: new Date().toISOString(),
      });
      setRejectModal(null);
      refetchSubmissions();
    } catch {
      alert('Failed to reject submission');
    }
  };

  // Expanded submission state for showing extracted text
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{tA('title')}</h1>
          <p className="mt-1 text-muted-foreground">{tA('subtitle')}</p>
        </div>
        {tab === 'articles' && (
          <button
            onClick={() => router.push('/en/admin/articles/new')}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-5 w-5" />
            {tA('createNew')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b gap-0">
        <button
          onClick={() => setTab('articles')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === 'articles'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Newspaper className="h-4 w-4" />
          {tA('tabArticles')}
          <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">{articles.length}</span>
        </button>
        <button
          onClick={() => setTab('submissions')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === 'submissions'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Inbox className="h-4 w-4" />
          {tA('tabSubmissions')}
          {pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white">{pendingCount}</span>
          )}
        </button>
      </div>

      {/* ─── Articles Tab ─── */}
      {tab === 'articles' && (
        <>
          {loadingArticles && (
            <div className="rounded-lg border">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse border-b bg-muted/20 last:border-b-0" />
              ))}
            </div>
          )}

          {!loadingArticles && articles.length === 0 && (
            <div className="rounded-xl border border-dashed py-16 text-center">
              <Newspaper className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">{tA('noArticles')}</p>
            </div>
          )}

          {!loadingArticles && articles.length > 0 && (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">{tA('colTitle')}</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">{tA('colCategory')}</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">{tA('colAuthor')}</th>
                    <th className="px-4 py-3 font-medium">{tA('colStatus')}</th>
                    <th className="px-4 py-3 font-medium text-right">{tA('colActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {articles.map((article) => (
                    <tr key={article.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {article.isFeatured && <Star className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />}
                          <span className="font-medium line-clamp-1">{article.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(article.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="capitalize text-xs rounded-full border px-2 py-0.5">{article.category}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{article.authorName}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleTogglePublish(article)} className="inline-flex items-center gap-1 text-xs">
                          {article.isPublished ? (
                            <><ToggleRight className="h-5 w-5 text-emerald-500" /><span className="text-emerald-600">{tA('published')}</span></>
                          ) : (
                            <><ToggleLeft className="h-5 w-5 text-muted-foreground" /><span className="text-muted-foreground">{tA('draft')}</span></>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => router.push(`/en/admin/articles/${article.id}/edit`)}
                            className="rounded-lg p-2 hover:bg-muted"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteArticle(article.id)}
                            className="rounded-lg p-2 hover:bg-destructive/10 text-destructive"
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
          )}
        </>
      )}

      {/* ─── Submissions Tab ─── */}
      {tab === 'submissions' && (
        <>
          {loadingSubmissions && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl border bg-muted/20" />
              ))}
            </div>
          )}

          {!loadingSubmissions && submissions.length === 0 && (
            <div className="rounded-xl border border-dashed py-16 text-center">
              <Inbox className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">{tA('noSubmissions')}</p>
            </div>
          )}

          {!loadingSubmissions && submissions.length > 0 && (
            <div className="space-y-3">
              {submissions.map((sub) => {
                const isExpanded = expandedId === sub.id;
                const preview = sub.extractedText || sub.contentText || '';
                return (
                  <div key={sub.id} className="rounded-xl border bg-card">
                    <div className="flex items-start justify-between gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[sub.status] || ''}`}>
                            {sub.status === 'pending' && <Clock className="mr-1 inline h-3 w-3" />}
                            {sub.status === 'approved' && <CheckCircle className="mr-1 inline h-3 w-3" />}
                            {sub.status === 'rejected' && <XCircle className="mr-1 inline h-3 w-3" />}
                            {sub.status}
                          </span>
                          <span className="text-xs rounded-full border px-2 py-0.5 capitalize">{sub.category}</span>
                          {sub.documentName && (
                            <span className="text-xs text-muted-foreground">📎 {sub.documentName}</span>
                          )}
                        </div>
                        <h3 className="font-semibold line-clamp-1">{sub.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          By {sub.submitterName} ({sub.submitterEmail}) · {sub.submitterType} · {formatDate(sub.createdAt)}
                        </p>
                        {sub.adminNotes && (
                          <p className="mt-1 text-xs text-muted-foreground italic">Note: {sub.adminNotes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {preview && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : (sub.id || null))}
                            className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground"
                            title="Preview content"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        )}
                        {sub.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleCreateDraft(sub)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              {tA('createDraft')}
                            </button>
                            <button
                              onClick={() => setRejectModal({ id: sub.id || '', notes: '' })}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              {tA('reject')}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {isExpanded && preview && (
                      <div className="border-t px-4 py-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Content Preview</p>
                        <div className="max-h-56 overflow-y-auto rounded bg-muted/30 p-3 text-sm whitespace-pre-wrap text-muted-foreground">
                          {preview.slice(0, 2000)}{preview.length > 2000 && '…'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">{tA('rejectTitle')}</h3>
            <label className="mb-1 block text-sm font-medium">{tA('rejectNotes')}</label>
            <textarea
              rows={3}
              value={rejectModal.notes}
              onChange={(e) => setRejectModal({ ...rejectModal, notes: e.target.value })}
              placeholder="Optional notes to self…"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="mt-4 flex gap-3 justify-end">
              <button
                onClick={() => setRejectModal(null)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
              >
                {tA('confirmReject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
