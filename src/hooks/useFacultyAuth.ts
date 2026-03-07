'use client';

import { useState, useEffect, useCallback } from 'react';
import { type User } from 'firebase/auth';
import {
  signOut as firebaseSignOut,
  onAuthStateChange,
  getFacultyUser,
  facultySignIn,
  facultyRegister,
} from '@/lib/firebase/auth';
import type { FacultyUser } from '@/types';

interface UseFacultyAuthReturn {
  user: User | null;
  facultyUser: FacultyUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isApproved: boolean;
}

export function useFacultyAuth(): UseFacultyAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [facultyUser, setFacultyUser] = useState<FacultyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      setUser(authUser);
      if (authUser) {
        try {
          const data = await getFacultyUser(authUser.uid);
          setFacultyUser(data);
        } catch {
          // User may be an admin or have no facultyUsers doc — ignore
          setFacultyUser(null);
        }
      } else {
        setFacultyUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const { facultyUser: fUser } = await facultySignIn(email, password);
      setFacultyUser(fUser);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      setError(null);
      await facultyRegister(email, password, fullName);
    } catch (err: any) {
      setError(err.message || 'Failed to register');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await firebaseSignOut();
      setUser(null);
      setFacultyUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const isAuthenticated = user !== null && facultyUser !== null;
  const isApproved = facultyUser?.isApproved === true && facultyUser?.isActive === true;

  return {
    user,
    facultyUser,
    loading,
    error,
    signIn,
    register,
    signOut,
    isAuthenticated,
    isApproved,
  };
}
