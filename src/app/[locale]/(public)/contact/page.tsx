'use client';

import { useState } from 'react';
import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Phone, Mail, Clock, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { addDocument } from '@/lib/firebase/firestore';
import { useDocument } from '@/hooks/useFirestore';
import type { ContactFormData, SiteSettings } from '@/types';

// ─── Bypass mode helper ──────────────────────────────────────────────────────
const BYPASS = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';
// ─────────────────────────────────────────────────────────────────────────────

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const t = useTranslations('contact');
  const locale = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: settings } = useDocument<SiteSettings>('siteSettings', 'main');

  const address = settings
    ? locale === 'ne' && settings.addressNe ? settings.addressNe : settings.address
    : '123 School Street, City, Nepal';
  const phone = settings?.phone || '+977-1-1234567';
  const email = settings?.email || 'info@schoolname.edu.np';
  const mapUrl = settings?.mapEmbedUrl || '';
  const officeHoursDisplay = settings
    ? locale === 'ne' && settings.officeHoursNe ? settings.officeHoursNe : settings.officeHours
    : '';

  const socialLinks = [
    settings?.socialMedia?.facebook && { icon: Facebook, href: settings.socialMedia.facebook, label: 'Facebook' },
    settings?.socialMedia?.twitter && { icon: Twitter, href: settings.socialMedia.twitter, label: 'Twitter (X)' },
    settings?.socialMedia?.instagram && { icon: Instagram, href: settings.socialMedia.instagram, label: 'Instagram' },
    settings?.socialMedia?.youtube && { icon: Youtube, href: settings.socialMedia.youtube, label: 'YouTube' },
  ].filter(Boolean) as { icon: React.ElementType; href: string; label: string }[];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Create contact message with status - cast to ContactMessage type
      const contactData = {
        ...data,
        status: 'unread' as const,
      };

      await addDocument('contactMessages', contactData);

      // ── Firebase Trigger Email extension ────────────────────────────────────
      // Requires: Firebase Trigger Email extension installed in your project.
      // Setup: Firebase Console → Extensions → Trigger Email from Firestore
      // Configure SMTP with Gmail:
      //   SMTP URI: smtps://you%40gmail.com:<app-password>@smtp.gmail.com:465
      //   (Use a Gmail App Password, not your regular password)
      //   DEFAULT_FROM: you@gmail.com
      // The extension watches the "mail" collection and sends each document.
      // ────────────────────────────────────────────────────────────────────────
      if (!BYPASS && settings?.email) {
        await addDocument('mail', {
          to: [settings.email],
          message: {
            subject: `[Contact Form] ${data.subject}`,
            html: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${data.name}</p>
              <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
              ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
              <p><strong>Subject:</strong> ${data.subject}</p>
              <hr />
              <p><strong>Message:</strong></p>
              <p>${data.message.replace(/\n/g, '<br />')}</p>
            `,
          },
        });
      }

      setSubmitSuccess(true);
      reset();
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">{t('title')}</h1>
          <p className="text-xl text-muted-foreground">{t('getInTouch')}</p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Contact Form */}
          <div>
            <h2 className="mb-6 text-2xl font-bold">{t('send')}</h2>

            {submitSuccess && (
              <div className="mb-6 rounded-lg bg-success/10 p-4 text-success">
                {t('successMessage')}
              </div>
            )}

            {submitError && (
              <div className="mb-6 rounded-lg bg-error/10 p-4 text-error">
                {t('errorMessage')}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('name')} <span className="text-error">*</span>
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-error">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('email')} <span className="text-error">*</span>
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-error">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm font-medium">{t('phone')}</label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('subject')} <span className="text-error">*</span>
                </label>
                <input
                  {...register('subject')}
                  type="text"
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-error">{errors.subject.message}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('message')} <span className="text-error">*</span>
                </label>
                <textarea
                  {...register('message')}
                  rows={5}
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-error">{errors.message.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : t('send')}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="mb-6 text-2xl font-bold">Contact Information</h2>

              <div className="space-y-4">
                {/* Address */}
                {address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">{t('address')}</p>
                      <p className="text-sm text-muted-foreground">{address}</p>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {phone && (
                  <div className="flex items-start space-x-3">
                    <Phone className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">{t('phone')}</p>
                      <a href={`tel:${phone}`} className="text-sm text-muted-foreground hover:text-primary">{phone}</a>
                    </div>
                  </div>
                )}

                {/* Email */}
                {email && (
                  <div className="flex items-start space-x-3">
                    <Mail className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">{t('email')}</p>
                      <a href={`mailto:${email}`} className="text-sm text-muted-foreground hover:text-primary">{email}</a>
                    </div>
                  </div>
                )}

                {/* Office Hours */}
                {officeHoursDisplay && (
                  <div className="flex items-start space-x-3">
                    <Clock className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">{t('officeHours')}</p>
                      <p className="text-sm text-muted-foreground">
                        {officeHoursDisplay}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Social Media */}
            {socialLinks.length > 0 && (
              <div>
                <h3 className="mb-4 text-lg font-semibold">{t('socialMedia')}</h3>
                <div className="flex space-x-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      <social.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {mapUrl && (
              <div>
                <h3 className="mb-4 text-lg font-semibold">Location</h3>
                <div className="h-64 overflow-hidden rounded-lg border">
                  <iframe
                    src={mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
