'use client';

import { useState, useEffect, useCallback } from 'react';
import { type User } from 'firebase/auth';
import {
  signIn as firebaseSignIn,
  signOut as firebaseSignOut,
  onAuthStateChange,
  getAdminUser,
} from '@/lib/firebase/auth';
import type { AdminUser } from '@/types';

// ─── Bypass mode (no Firebase / no emulator) ──────────────────────────────────
const BYPASS_AUTH = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';
const BYPASS_EMAIL = process.env.NEXT_PUBLIC_BYPASS_ADMIN_EMAIL ?? '';
const BYPASS_PASSWORD = process.env.NEXT_PUBLIC_BYPASS_ADMIN_PASSWORD ?? '';
const BYPASS_KEY = 'bypass_admin_session';
// ─────────────────────────────────────────────────────────────────────────────

interface UseAuthReturn {
  user: User | null;
  adminUser: AdminUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Bypass mode: simple boolean state instead of Firebase user
  const [bypassAuthed, setBypassAuthed] = useState(false);

  useEffect(() => {
    if (BYPASS_AUTH) {
      // Restore bypass session from sessionStorage (survives page refresh)
      const stored = sessionStorage.getItem(BYPASS_KEY);
      setBypassAuthed(stored === 'true');
      setLoading(false);
      return;
    }

    // Normal Firebase auth
    const unsubscribe = onAuthStateChange(async (authUser) => {
      setUser(authUser);
      if (authUser) {
        const adminData = await getAdminUser(authUser.uid);
        setAdminUser(adminData);
      } else {
        setAdminUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, rememberMe: boolean = false) => {
      try {
        setLoading(true);
        setError(null);

        if (BYPASS_AUTH) {
          if (email === BYPASS_EMAIL && password === BYPASS_PASSWORD) {
            sessionStorage.setItem(BYPASS_KEY, 'true');
            setBypassAuthed(true);
          } else {
            throw new Error('Invalid email or password');
          }
          return;
        }

        await firebaseSignIn(email, password, rememberMe);
      } catch (err: any) {
        setError(err.message || 'Failed to sign in');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (BYPASS_AUTH) {
        sessionStorage.removeItem(BYPASS_KEY);
        setBypassAuthed(false);
        return;
      }

      await firebaseSignOut();
      setUser(null);
      setAdminUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const isAuthenticated = BYPASS_AUTH ? bypassAuthed : user !== null;
  const isAdmin = BYPASS_AUTH ? bypassAuthed : adminUser !== null && adminUser.isActive;

  return {
    user,
    adminUser,
    loading,
    error,
    signIn,
    signOut,
    isAuthenticated,
    isAdmin,
  };
}
