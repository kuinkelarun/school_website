'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useCollection, useDeleteDocument } from '@/hooks/useFirestore';
import { orderBy } from 'firebase/firestore';
import type { Program } from '@/types';

export default function ProgramsAdminPage() {
  const router = useRouter();
  const t = useTranslations('admin.programs');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch programs
  const { data: programs, loading, refetch } = useCollection<Program>(
    'programs',
    [orderBy('displayOrder', 'asc')]
  );

  const { mutate: deleteProgram } = useDeleteDocument('programs');

  // Filter programs
  const filteredPrograms = programs.filter((program) => {
    if (filterCategory !== 'all' && program.category !== filterCategory) return false;
    if (filterStatus === 'published' && !program.isPublished) return false;
    if (filterStatus === 'draft' && program.isPublished) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;

    try {
      await deleteProgram(id);
      alert(t('deleteSuccess'));
      refetch();
    } catch (error) {
      console.error('Error deleting program:', error);
      alert('Failed to delete program');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-1 text-muted-foreground">
            Manage all academic programs
          </p>
        </div>
        <button
          onClick={() => router.push('/en/admin/programs/new')}
          className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
          <span>{t('createNew')}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border bg-background px-4 py-2"
        >
          <option value="all">All Categories</option>
          <option value="science">Science</option>
          <option value="commerce">Commerce</option>
          <option value="arts">Arts</option>
          <option value="other">Other</option>
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border bg-background px-4 py-2"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-lg border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse border-b bg-muted/20 last:border-b-0" />
          ))}
        </div>
      )}

      {/* No Programs */}
      {!loading && filteredPrograms.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="mb-4 text-muted-foreground">
            {programs.length === 0
              ? 'No programs yet. Create your first program!'
              : 'No programs match your filters.'}
          </p>
          {programs.length === 0 && (
            <button
              onClick={() => router.push('/en/admin/programs/new')}
              className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
            >
              <Plus className="h-5 w-5" />
              <span>{t('createNew')}</span>
            </button>
          )}
        </div>
      )}

      {/* Programs Table */}
      {!loading && filteredPrograms.length > 0 && (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Order</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrograms.map((program) => (
                  <tr key={program.id} className="border-b last:border-b-0 hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium">
                      {program.displayOrder}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{program.title}</span>
                      {program.titleNe && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {program.titleNe}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                        {program.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          program.isPublished
                            ? 'bg-success/10 text-success'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {program.isPublished ? t('published') : t('draft')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => window.open(`/en/programs#${program.slug}`, '_blank')}
                          className="rounded-lg bg-muted p-2 transition-colors hover:bg-muted/80"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/en/admin/programs/${program.id}/edit`)}
                          className="rounded-lg bg-primary/10 p-2 text-primary transition-colors hover:bg-primary/20"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(program.id)}
                          className="rounded-lg bg-error/10 p-2 text-error transition-colors hover:bg-error/20"
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
        </div>
      )}
    </div>
  );
}
