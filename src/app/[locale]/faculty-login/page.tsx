'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useFacultyAuth } from '@/hooks/useFacultyAuth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function FacultyLoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('faculty.login');
  const { signIn, register: registerUser, isAuthenticated, isApproved, loading: authLoading } = useFacultyAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated && isApproved) {
      router.push(`/${locale}/faculty/folders`);
    }
  }, [isAuthenticated, isApproved, authLoading, router, locale]);

  const onLogin = async (data: LoginFormValues) => {
    setFormError(null);
    try {
      await signIn(data.email, data.password);
      router.push(`/${locale}/faculty/folders`);
    } catch (error: any) {
      if (error.message?.includes('pending')) {
        setFormError(t('pendingApproval'));
      } else if (error.message?.includes('deactivated')) {
        setFormError(t('accountDeactivated'));
      } else if (error.message?.includes('No faculty account')) {
        setFormError(t('noAccount'));
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setFormError(t('invalidCredentials'));
      } else {
        setFormError(t('loginFailed'));
      }
    }
  };

  const onRegister = async (data: RegisterFormValues) => {
    setFormError(null);
    setSuccessMessage(null);
    try {
      await registerUser(data.email, data.password, data.fullName);
      setSuccessMessage(t('registrationSuccess'));
      setMode('login');
      registerForm.reset();
    } catch (error: any) {
      if (error.message?.includes('not found in faculty')) {
        setFormError(t('emailNotFound'));
      } else if (error.code === 'auth/email-already-in-use') {
        setFormError(t('emailAlreadyUsed'));
      } else {
        setFormError(t('registrationFailed'));
      }
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-lg border bg-card p-8 shadow-lg">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">
              {mode === 'login' ? t('title') : t('registerTitle')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === 'login' ? t('subtitle') : t('registerSubtitle')}
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 flex items-start space-x-2 rounded-lg bg-success/10 p-4 text-success">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{successMessage}</p>
            </div>
          )}

          {/* Error Alert */}
          {formError && (
            <div className="mb-6 flex items-start space-x-2 rounded-lg bg-error/10 p-4 text-error">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{formError}</p>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('email')} <span className="text-error">*</span>
                </label>
                <input
                  {...loginForm.register('email')}
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="faculty@example.com"
                />
                {loginForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-error">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('password')} <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    {...loginForm.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="w-full rounded-lg border bg-background px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-error">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loginForm.formState.isSubmitting}
                className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loginForm.formState.isSubmitting ? t('signingIn') : t('signIn')}
              </button>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('fullName')} <span className="text-error">*</span>
                </label>
                <input
                  {...registerForm.register('fullName')}
                  type="text"
                  autoComplete="name"
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {registerForm.formState.errors.fullName && (
                  <p className="mt-1 text-sm text-error">{registerForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('email')} <span className="text-error">*</span>
                </label>
                <input
                  {...registerForm.register('email')}
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="faculty@example.com"
                />
                {registerForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-error">{registerForm.formState.errors.email.message}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">{t('emailHint')}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('password')} <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    {...registerForm.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="w-full rounded-lg border bg-background px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-error">{registerForm.formState.errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('confirmPassword')} <span className="text-error">*</span>
                </label>
                <input
                  {...registerForm.register('confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-error">{registerForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={registerForm.formState.isSubmitting}
                className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {registerForm.formState.isSubmitting ? t('registering') : t('createAccount')}
              </button>
            </form>
          )}

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            {mode === 'login' ? (
              <p className="text-sm text-muted-foreground">
                {t('noAccount')}{' '}
                <button
                  onClick={() => { setMode('register'); setFormError(null); setSuccessMessage(null); }}
                  className="font-medium text-primary hover:underline"
                >
                  {t('createAccount')}
                </button>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('haveAccount')}{' '}
                <button
                  onClick={() => { setMode('login'); setFormError(null); setSuccessMessage(null); }}
                  className="font-medium text-primary hover:underline"
                >
                  {t('signIn')}
                </button>
              </p>
            )}
          </div>

          {/* Back to website */}
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push(`/${locale}`)}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← {t('backToWebsite')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
