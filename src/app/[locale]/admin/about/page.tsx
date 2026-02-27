'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Save, Loader2 } from 'lucide-react';
import { useDocument } from '@/hooks/useFirestore';
import { setDocument } from '@/lib/firebase/firestore';
import type { SiteSettings } from '@/types';

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
  aboutContent: '',
  aboutContentNe: '',
  missionVision: '',
  missionVisionNe: '',
};

export default function AdminAboutPage() {
  const t = useTranslations('admin.about');
  const { data: settings, loading } = useDocument<SiteSettings>('siteSettings', 'main');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [aboutContent, setAboutContent] = useState('');
  const [aboutContentNe, setAboutContentNe] = useState('');
  const [missionVision, setMissionVision] = useState('');
  const [missionVisionNe, setMissionVisionNe] = useState('');

  // Populate form when settings load
  useEffect(() => {
    if (settings) {
      setAboutContent(settings.aboutContent || '');
      setAboutContentNe(settings.aboutContentNe || '');
      setMissionVision(settings.missionVision || '');
      setMissionVisionNe(settings.missionVisionNe || '');
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const merged = {
        ...(settings || EMPTY_SETTINGS),
        aboutContent,
        aboutContentNe,
        missionVision,
        missionVisionNe,
      };
      // Remove the id field before saving
      const { id, ...dataToSave } = merged as SiteSettings;
      await setDocument('siteSettings', 'main', dataToSave);
      setSaveMessage(t('saveSuccess'));
    } catch (error) {
      console.error('Error saving about content:', error);
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

      {/* About Content (English) */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">{t('aboutContentEn')}</h2>
        <p className="mb-2 text-sm text-muted-foreground">{t('aboutContentHint')}</p>
        <textarea
          value={aboutContent}
          onChange={(e) => setAboutContent(e.target.value)}
          rows={10}
          className="w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Enter about content in English (HTML supported)..."
        />
      </div>

      {/* About Content (Nepali) */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">{t('aboutContentNe')}</h2>
        <textarea
          value={aboutContentNe}
          onChange={(e) => setAboutContentNe(e.target.value)}
          rows={10}
          className="w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="नेपालीमा बारेमा सामग्री प्रविष्ट गर्नुहोस् (HTML समर्थित)..."
        />
      </div>

      {/* Mission & Vision (English) */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">{t('missionVisionEn')}</h2>
        <textarea
          value={missionVision}
          onChange={(e) => setMissionVision(e.target.value)}
          rows={8}
          className="w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Enter mission & vision in English (HTML supported)..."
        />
      </div>

      {/* Mission & Vision (Nepali) */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">{t('missionVisionNe')}</h2>
        <textarea
          value={missionVisionNe}
          onChange={(e) => setMissionVisionNe(e.target.value)}
          rows={8}
          className="w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="नेपालीमा लक्ष्य र दृष्टिकोण प्रविष्ट गर्नुहोस् (HTML समर्थित)..."
        />
      </div>
    </div>
  );
}
