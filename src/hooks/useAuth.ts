'use client';

import { useState, useEffect, useCallback } from 'react';
import { type User } from 'firebase/auth';
import {
  signIn as firebaseSignIn,
  signOut as firebaseSignOut,
  onAuthStateChange,
  getCurrentUser,
  getAdminUser,
} from '@/lib/firebase/auth';
import type { AdminUser } from '@/types';

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

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      setUser(authUser);

      if (authUser) {
        // Fetch admin user data
        const adminData = await getAdminUser(authUser.uid);
        setAdminUser(adminData);
      } else {
        setAdminUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in
  const signIn = useCallback(
    async (email: string, password: string, rememberMe: boolean = false) => {
      try {
        setLoading(true);
        setError(null);
        await firebaseSignIn(email, password, rememberMe);
        // User state will be updated by onAuthStateChange
      } catch (err: any) {
        setError(err.message || 'Failed to sign in');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
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

  const isAuthenticated = user !== null;
  const isAdmin = adminUser !== null && adminUser.isActive;

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
