'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useFacultyAuth } from '@/hooks/useFacultyAuth';

interface FacultyProtectedRouteProps {
  children: React.ReactNode;
}

export function FacultyProtectedRoute({ children }: FacultyProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isApproved, loading } = useFacultyAuth();

  // Extract locale from pathname (e.g., /en/faculty/... → en)
  const locale = pathname.split('/')[1] || 'en';

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(`/${locale}/faculty-login`);
    } else if (!loading && isAuthenticated && !isApproved) {
      router.push(`/${locale}/faculty-login`);
    }
  }, [isAuthenticated, isApproved, loading, router, locale]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isApproved) {
    return null;
  }

  return <>{children}</>;
}
