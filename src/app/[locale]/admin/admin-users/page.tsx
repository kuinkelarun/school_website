'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Loader2,
  X,
  Eye,
  EyeOff,
  UserCog,
} from 'lucide-react';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  initializeApp,
  deleteApp,
  getApps,
  type FirebaseApp,
} from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/useAuth';

// ─── Types ─────────────────────────────────────────────────────────────────

interface AdminUserDoc {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt?: any;
}

type Role = 'admin' | 'editor';

interface FormState {
  email: string;
  fullName: string;
  password: string;
  role: Role;
}

const EMPTY_FORM: FormState = {
  email: '',
  fullName: '',
  password: '',
  role: 'admin',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Creates a Firebase Auth user using a temporary secondary app instance so the
 * current admin session is not disrupted.
 */
async function createAuthUser(email: string, password: string): Promise<string> {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const secondaryName = `admin-create-${Date.now()}`;
  let secondaryApp: FirebaseApp | null = null;

  try {
    secondaryApp = initializeApp(firebaseConfig, secondaryName);
    const secondaryAuth = getAuth(secondaryApp);
    const { user } = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = user.uid;
    await fbSignOut(secondaryAuth);
    return uid;
  } finally {
    if (secondaryApp) {
      await deleteApp(secondaryApp);
    }
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { adminUser: currentAdmin } = useAuth();

  const [users, setUsers] = useState<AdminUserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Load users ─────────────────────────────────────────────────────────
  async function loadUsers() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'adminUsers'));
      const list: AdminUserDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<AdminUserDoc, 'id'>),
      }));
      list.sort((a, b) => a.email.localeCompare(b.email));
      setUsers(list);
    } catch (err: any) {
      console.error('Failed to load admin users:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  // ── Create user ────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim() || !form.fullName.trim() || !form.password.trim()) return;
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const uid = await createAuthUser(form.email.trim(), form.password);

      await setDoc(doc(db, 'adminUsers', uid), {
        email: form.email.trim().toLowerCase(),
        fullName: form.fullName.trim(),
        role: form.role,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setForm(EMPTY_FORM);
      setShowModal(false);
      await loadUsers();
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. If they exist in Firebase Auth, add them manually via the Firebase Console.');
      } else {
        setError(err.message ?? 'Failed to create user.');
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle active ──────────────────────────────────────────────────────
  async function handleToggleActive(user: AdminUserDoc) {
    if (user.id === currentAdmin?.id) {
      alert("You cannot deactivate your own account.");
      return;
    }
    setTogglingId(user.id);
    try {
      await updateDoc(doc(db, 'adminUsers', user.id), {
        isActive: !user.isActive,
        updatedAt: serverTimestamp(),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      );
    } catch (err: any) {
      console.error('Toggle failed:', err);
    } finally {
      setTogglingId(null);
    }
  }

  // ── Delete user ────────────────────────────────────────────────────────
  async function handleDelete(user: AdminUserDoc) {
    if (user.id === currentAdmin?.id) {
      alert("You cannot delete your own account.");
      return;
    }
    if (!confirm(`Remove "${user.fullName || user.email}" from admin users? They will still exist in Firebase Auth but cannot log in.`)) return;

    setDeletingId(user.id);
    try {
      await deleteDoc(doc(db, 'adminUsers', user.id));
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: any) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCog className="h-7 w-7 text-primary" />
          <div>
            <h1 className="font-heading text-2xl font-bold">Admin Users</h1>
            <p className="text-sm text-muted-foreground">Manage who can access the admin panel</p>
          </div>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setError(null); setShowModal(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Admin User
        </button>
      </div>

      {/* User List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          No admin users found.
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/40">
                  <td className="px-6 py-4 font-medium">
                    {user.fullName || '—'}
                    {user.id === currentAdmin?.id && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">You</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                      {user.role?.replace('_', ' ') || 'admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {/* Toggle active */}
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={togglingId === user.id || user.id === currentAdmin?.id}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                        className="rounded p-1.5 hover:bg-muted disabled:opacity-40"
                      >
                        {togglingId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : user.isActive ? (
                          <ShieldOff className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <ShieldCheck className="h-4 w-4 text-green-600" />
                        )}
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={deletingId === user.id || user.id === currentAdmin?.id}
                        title="Remove admin access"
                        className="rounded p-1.5 hover:bg-muted disabled:opacity-40"
                      >
                        {deletingId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="font-heading text-lg font-semibold">Add Admin User</h2>
              <button onClick={() => setShowModal(false)} className="rounded p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 p-6">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="admin@school.edu.np"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Share this password with the user so they can log in.</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="admin">Admin (full access)</option>
                  <option value="editor">Editor (content only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
