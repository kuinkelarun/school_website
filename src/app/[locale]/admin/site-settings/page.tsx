'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Save, Loader2, Upload, X, Facebook, Twitter, Instagram, Youtube, MapPin } from 'lucide-react';
import { useDocument } from '@/hooks/useFirestore';
import { setDocument } from '@/lib/firebase/firestore';
import { uploadFile } from '@/lib/firebase/storage';
import type { SiteSettings } from '@/types';

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
// ──────────────────────────────────────────────────────────────────────────

const EMPTY_SETTINGS: Omit<SiteSettings, 'id'> = {
  schoolName: '',
  schoolNameNe: '',
  logoUrl: '',
  tagline: '',
  taglineNe: '',
  address: '',
  addressNe: '',
  phone: '',
  email: '',
  socialMedia: {},
  mapEmbedUrl: '',
  aboutContent: '',
  aboutContentNe: '',
  missionVision: '',
  missionVisionNe: '',
};

export default function SiteSettingsPage() {
  const t = useTranslations('admin.siteSettings');
  const { data: settings, loading } = useDocument<SiteSettings>('siteSettings', 'main');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Form state
  const [schoolName, setSchoolName] = useState('');
  const [schoolNameNe, setSchoolNameNe] = useState('');
  const [tagline, setTagline] = useState('');
  const [taglineNe, setTaglineNe] = useState('');
  const [address, setAddress] = useState('');
  const [addressNe, setAddressNe] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Social media state
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [mapEmbedUrl, setMapEmbedUrl] = useState('');

  // Logo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Populate form when settings load
  useEffect(() => {
    if (settings) {
      setSchoolName(settings.schoolName || '');
      setSchoolNameNe(settings.schoolNameNe || '');
      setTagline(settings.tagline || '');
      setTaglineNe(settings.taglineNe || '');
      setAddress(settings.address || '');
      setAddressNe(settings.addressNe || '');
      setPhone(settings.phone || '');
      setEmail(settings.email || '');
      setLogoUrl(settings.logoUrl || '');
      if (settings.logoUrl) setPreviewUrl(settings.logoUrl);
      setSocialFacebook(settings.socialMedia?.facebook || '');
      setSocialTwitter(settings.socialMedia?.twitter || '');
      setSocialInstagram(settings.socialMedia?.instagram || '');
      setSocialYoutube(settings.socialMedia?.youtube || '');
      setMapEmbedUrl(settings.mapEmbedUrl || '');
    }
  }, [settings]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    // Validate size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2 MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setLogoUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      let finalLogoUrl = logoUrl;

      // Upload new logo if selected
      if (selectedFile) {
        setUploading(true);
        if (BYPASS) {
          finalLogoUrl = await fileToBase64(selectedFile);
        } else {
          const uniqueName = `logo_${Date.now()}_${selectedFile.name}`;
          finalLogoUrl = await uploadFile(selectedFile, `site/${uniqueName}`);
        }
        setUploading(false);
        setSelectedFile(null);
      }

      const merged: Omit<SiteSettings, 'id'> = {
        ...(settings ? (({ id, ...rest }: SiteSettings) => rest)(settings) : EMPTY_SETTINGS),
        schoolName,
        schoolNameNe,
        tagline,
        taglineNe,
        address,
        addressNe,
        phone,
        email,
        logoUrl: finalLogoUrl,
        socialMedia: {
          ...(socialFacebook ? { facebook: socialFacebook } : {}),
          ...(socialTwitter ? { twitter: socialTwitter } : {}),
          ...(socialInstagram ? { instagram: socialInstagram } : {}),
          ...(socialYoutube ? { youtube: socialYoutube } : {}),
        },
        mapEmbedUrl: mapEmbedUrl || '',
      };

      await setDocument('siteSettings', 'main', merged);
      setLogoUrl(finalLogoUrl);
      setSaveMessage(t('saveSuccess'));
    } catch (error) {
      console.error('Error saving site settings:', error);
      setSaveMessage(t('saveError'));
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{isSaving ? t('saving') : t('save')}</span>
        </button>
      </div>

      {saveMessage && (
        <div className="rounded-lg border bg-muted/50 p-3 text-sm">{saveMessage}</div>
      )}

      {/* School Logo */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">{t('schoolLogo')}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{t('logoHint')}</p>

        <div className="flex items-start space-x-6">
          {/* Preview */}
          <div className="flex-shrink-0">
            {previewUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="School logo preview"
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-full border-2 border-muted object-cover"
                />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted">
                <span className="text-3xl font-bold text-muted-foreground">
                  {(schoolName || 'S')[0]}
                </span>
              </div>
            )}
          </div>

          {/* Upload button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center space-x-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Upload className="h-4 w-4" />
              <span>{t('uploadLogo')}</span>
            </button>
            <p className="mt-2 text-xs text-muted-foreground">{t('logoRequirements')}</p>
          </div>
        </div>
      </div>

      {/* School Name */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">{t('schoolNameSection')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t('schoolNameEn')} <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter school name in English"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t('schoolNameNe')}</label>
            <input
              type="text"
              value={schoolNameNe}
              onChange={(e) => setSchoolNameNe(e.target.value)}
              className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="विद्यालयको नाम नेपालीमा"
            />
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">{t('taglineSection')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">{t('taglineEn')}</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter tagline in English"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t('taglineNe')}</label>
            <input
              type="text"
              value={taglineNe}
              onChange={(e) => setTaglineNe(e.target.value)}
              className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="नेपालीमा ट्यागलाइन"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">{t('contactInfo')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">{t('phone')}</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="+977-..."
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="info@school.edu.np"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t('addressEn')}</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter address in English"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t('addressNe')}</label>
            <input
              type="text"
              value={addressNe}
              onChange={(e) => setAddressNe(e.target.value)}
              className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="नेपालीमा ठेगाना"
            />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">{t('socialSection')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Facebook className="h-4 w-4 text-[#1877F2]" /> {t('socialFacebook')}
            </label>
            <input
              type="url"
              value={socialFacebook}
              onChange={(e) => setSocialFacebook(e.target.value)}
              className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://facebook.com/yourpage"
            />
          </div>
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Twitter className="h-4 w-4 text-[#1DA1F2]" /> {t('socialTwitter')}
            </label>
            <input
              type="url"
              value={socialTwitter}
              onChange={(e) => setSocialTwitter(e.target.value)}
              className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://twitter.com/yourhandle"
            />
          </div>
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Instagram className="h-4 w-4 text-[#E4405F]" /> {t('socialInstagram')}
            </label>
            <input
              type="url"
              value={socialInstagram}
              onChange={(e) => setSocialInstagram(e.target.value)}
              className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://instagram.com/yourprofile"
            />
          </div>
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Youtube className="h-4 w-4 text-[#FF0000]" /> {t('socialYoutube')}
            </label>
            <input
              type="url"
              value={socialYoutube}
              onChange={(e) => setSocialYoutube(e.target.value)}
              className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://youtube.com/@yourchannel"
            />
          </div>
        </div>
      </div>

      {/* Map Location */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-1 text-xl font-semibold">{t('mapSection')}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{t('mapEmbedHint')}</p>
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-primary" /> {t('mapEmbedUrl')}
          </label>
          <input
            type="url"
            value={mapEmbedUrl}
            onChange={(e) => setMapEmbedUrl(e.target.value)}
            className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="https://www.google.com/maps/embed?pb=..."
          />
        </div>
        {mapEmbedUrl && (
          <div className="mt-4 h-56 overflow-hidden rounded-lg border">
            <iframe src={mapEmbedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" />
          </div>
        )}
      </div>
    </div>
  );
}
