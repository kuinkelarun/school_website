'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Upload,
  Users,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import {
  addDocument,
  updateDocument,
  deleteDocument,
} from '@/lib/firebase/firestore';
import { uploadFile } from '@/lib/firebase/storage';
import type { FacultyMember, FacultyCategory, FacultyMemberType } from '@/types';

// ─── Bypass mode helpers ───────────────────────────────────────────────────
const BYPASS = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadPhotoSafe(file: File): Promise<string> {
  if (BYPASS) {
    if (file.size <= 2 * 1024 * 1024) {
      return fileToBase64(file);
    }
    return URL.createObjectURL(file);
  }
  const uniqueName = `faculty_${Date.now()}_${file.name}`;
  return uploadFile(file, `faculty/${uniqueName}`);
}
// ──────────────────────────────────────────────────────────────────────────

const CATEGORIES: FacultyCategory[] = ['principal', 'teacher', 'staff'];

interface FormState {
  name: string;
  nameNe: string;
  role: string;
  roleNe: string;
  bio: string;
  bioNe: string;
  email: string;
  photoUrl: string;
  category: FacultyCategory;
  memberType: FacultyMemberType;
  displayOrder: number;
  isPublished: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  nameNe: '',
  role: '',
  roleNe: '',
  bio: '',
  bioNe: '',
  email: '',
  photoUrl: '',
  category: 'teacher',
  memberType: 'faculty',
  displayOrder: 0,
  isPublished: true,
};

export default function FacultyPage() {
  const t = useTranslations('admin.faculty');

  const { data: members, loading, refetch } = useCollection<FacultyMember>('faculty');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Photo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const openAdd = (defaultType: FacultyMemberType = 'faculty') => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, memberType: defaultType });
    setPhotoPreview(null);
    setSelectedPhoto(null);
    setModalOpen(true);
  };

  const openEdit = (m: FacultyMember) => {
    setEditingId(m.id);
    setForm({
      name: m.name || '',
      nameNe: m.nameNe || '',
      role: m.role || '',
      roleNe: m.roleNe || '',
      bio: m.bio || '',
      bioNe: m.bioNe || '',
      email: m.email || '',
      photoUrl: m.photoUrl || '',
      category: m.category,
      memberType: m.memberType ?? 'faculty',
      displayOrder: m.displayOrder,
      isPublished: m.isPublished,
    });
    setPhotoPreview(m.photoUrl || null);
    setSelectedPhoto(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setPhotoPreview(null);
    setSelectedPhoto(null);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    setSelectedPhoto(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert('Name (English) is required');
      return;
    }
    setSaving(true);
    try {
      let finalPhotoUrl = form.photoUrl;
      if (selectedPhoto) {
        setUploadingPhoto(true);
        finalPhotoUrl = await uploadPhotoSafe(selectedPhoto);
        setUploadingPhoto(false);
      }

      const data: Omit<FacultyMember, 'id' | 'createdAt' | 'updatedAt'> = {
        name: form.name.trim(),
        nameNe: form.nameNe.trim(),
        role: form.role.trim(),
        roleNe: form.roleNe.trim(),
        bio: form.bio.trim(),
        bioNe: form.bioNe.trim(),
        email: form.email.trim(),
        photoUrl: finalPhotoUrl,
        category: form.category,
        memberType: form.memberType,
        displayOrder: Number(form.displayOrder) || 0,
        isPublished: form.isPublished,
      };

      if (editingId) {
        await updateDocument('faculty', editingId, data);
        showStatus(t('updateSuccess'));
      } else {
        await addDocument('faculty', data);
        showStatus(t('createSuccess'));
      }
      closeModal();
      refetch();
    } catch (err) {
      console.error('Error saving faculty member:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
      setUploadingPhoto(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteDocument('faculty', id);
      showStatus(t('deleteSuccess'));
      refetch();
    } catch (err) {
      console.error('Error deleting faculty member:', err);
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const togglePublish = async (m: FacultyMember) => {
    try {
      await updateDocument('faculty', m.id, { isPublished: !m.isPublished });
      refetch();
    } catch (err) {
      console.error('Error toggling publish:', err);
    }
  };

  // Split members by type
  const allMembers = members || [];
  const facultyList = allMembers.filter((m) => (m.memberType ?? 'faculty') === 'faculty');
  const formerList  = allMembers.filter((m) => m.memberType === 'former');
  const boardList   = allMembers.filter((m) => m.memberType === 'board');

  const groupByCategory = (list: FacultyMember[]) =>
    CATEGORIES.reduce<Record<FacultyCategory, FacultyMember[]>>(
      (acc, cat) => {
        acc[cat] = list
          .filter((m) => m.category === cat)
          .sort((a, b) => a.displayOrder - b.displayOrder);
        return acc;
      },
      { principal: [], teacher: [], staff: [] }
    );

  const field = (
    key: keyof FormState,
    label: string,
    inputType: 'text' | 'email' | 'number' | 'textarea' = 'text',
    placeholder?: string
  ) => (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {inputType === 'textarea' ? (
        <textarea
          rows={3}
          value={form[key] as string}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      ) : (
        <input
          type={inputType}
          value={form[key] as string | number}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              [key]: inputType === 'number' ? Number(e.target.value) : e.target.value,
            }))
          }
          placeholder={placeholder}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      )}
    </div>
  );

  /* ── Reusable member card ─────────────────────────────────── */
  const MemberCard = ({ m }: { m: FacultyMember }) => (
    <div className="relative rounded-lg border bg-card p-4 shadow-sm">
      <span
        className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-xs font-medium ${
          m.isPublished ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
        }`}
      >
        {m.isPublished ? t('published') : 'Draft'}
      </span>
      <div className="flex items-start gap-3">
        {m.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.photoUrl} alt={m.name} className="h-14 w-14 flex-shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {m.name[0]}
          </div>
        )}
        <div className="min-w-0 flex-1 pr-12">
          <p className="font-semibold leading-tight">{m.name}</p>
          {m.nameNe && <p className="text-xs text-muted-foreground">{m.nameNe}</p>}
          <p className="mt-1 text-sm text-muted-foreground">{m.role}</p>
          {m.email && <p className="mt-1 truncate text-xs text-muted-foreground">{m.email}</p>}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          title={m.isPublished ? 'Unpublish' : 'Publish'}
          onClick={() => togglePublish(m)}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {m.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
        <button
          title="Edit"
          onClick={() => openEdit(m)}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          title="Delete"
          onClick={() => setDeleteConfirmId(m.id)}
          className="rounded-lg p-2 text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  /* ── Section block (Faculty / Former Faculty / Board) ──────── */
  const SectionBlock = ({
    label, list, type, withCategories,
  }: {
    label: string;
    list: FacultyMember[];
    type: FacultyMemberType;
    withCategories: boolean;
  }) => {
    const grouped = groupByCategory(list);
    return (
      <section className="rounded-xl border bg-muted/30 p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{label}</h2>
          <button
            onClick={() => openAdd(type)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span>{t('addNew')}</span>
          </button>
        </div>
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
            <Users className="mb-2 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          </div>
        ) : withCategories ? (
          <div className="space-y-6">
            {CATEGORIES.map((cat) =>
              grouped[cat].length > 0 ? (
                <div key={cat}>
                  <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    {t(`categories.${cat}`)}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {grouped[cat].map((m) => <MemberCard key={m.id} m={m} />)}
                  </div>
                </div>
              ) : null
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...list].sort((a, b) => a.displayOrder - b.displayOrder).map((m) => (
              <MemberCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
      </div>

      {statusMessage && (
        <div className="rounded-lg border bg-muted/50 p-3 text-sm">{statusMessage}</div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <SectionBlock label={t('sections.faculty')} list={facultyList} type="faculty" withCategories={true} />
          <SectionBlock label={t('sections.former')} list={formerList} type="former" withCategories={true} />
          <SectionBlock label={t('sections.board')} list={boardList} type="board" withCategories={false} />
        </div>
      )}

      {/* ── Add / Edit Modal ──────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 backdrop-blur-sm p-4">
          <div className="relative mt-8 w-full max-w-2xl rounded-xl border bg-card shadow-xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold">
                {editingId ? t('editMember') : t('addNew')}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="space-y-6 px-6 py-6">
              {/* Photo */}
              <div>
                <label className="mb-2 block text-sm font-medium">{t('photo')}</label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="h-20 w-20 rounded-full object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview(null);
                          setSelectedPhoto(null);
                          setForm((f) => ({ ...f, photoUrl: '' }));
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute -right-1 -top-1 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted text-2xl font-bold text-muted-foreground">
                      {form.name ? form.name[0] : '?'}
                    </div>
                  )}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted"
                    >
                      <Upload className="h-4 w-4" />
                      {t('uploadPhoto')}
                    </button>
                    {BYPASS && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Bypass: ≤2 MB saved locally; larger files session-only.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Names */}
              <div className="grid gap-4 sm:grid-cols-2">
                {field('name', `${t('nameEn')} *`, 'text', 'John Doe')}
                {field('nameNe', t('nameNe'), 'text', 'जोन डो')}
              </div>

              {/* Roles */}
              <div className="grid gap-4 sm:grid-cols-2">
                {field('role', t('roleEn'), 'text', 'Principal')}
                {field('roleNe', t('roleNe'), 'text', 'प्रधानाध्यापक')}
              </div>

              {/* Bio */}
              <div className="grid gap-4 sm:grid-cols-2">
                {field('bio', t('bioEn'), 'textarea', 'Brief biography...')}
                {field('bioNe', t('bioNe'), 'textarea', 'संक्षिप्त जीवनी...')}
              </div>

              {/* Email + Category */}
              <div className="grid gap-4 sm:grid-cols-2">
                {field('email', t('email'), 'email', 'faculty@school.edu.np')}
                {form.memberType !== 'board' && (
                  <div>
                    <label className="mb-1 block text-sm font-medium">{t('category')}</label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, category: e.target.value as FacultyCategory }))
                      }
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {t(`categories.${c}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Display Order + Published */}
              <div className="grid gap-4 sm:grid-cols-2">
                {field('displayOrder', t('displayOrder'), 'number', '0')}
                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={form.isPublished}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, isPublished: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border"
                  />
                  <label htmlFor="isPublished" className="text-sm font-medium">
                    {t('published')}
                  </label>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={closeModal}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {uploadingPhoto ? 'Uploading...' : t('saving')}
                  </>
                ) : (
                  t('save')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ──────────────────────────────────────────── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-xl">
            <h3 className="mb-3 text-lg font-semibold">Delete Faculty Member</h3>
            <p className="mb-6 text-sm text-muted-foreground">{t('confirmDelete')}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
