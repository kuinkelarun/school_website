'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, Search, Trash2, Copy, Check } from 'lucide-react';
import { uploadFile, deleteFile, listFiles } from '@/lib/firebase/storage';
import { formatFileSize } from '@/lib/utils';

interface MediaFile {
  name: string;
  url: string;
  size: number;
  uploadedAt: Date;
  type: string;
}

export default function MediaLibraryPage() {
  const t = useTranslations('admin.media');
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'documents'>('all');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter files based on search and type
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === 'images') {
      return matchesSearch && file.type.startsWith('image/');
    }
    if (filterType === 'documents') {
      return matchesSearch && !file.type.startsWith('image/');
    }
    return matchesSearch;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(selectedFiles)) {
        // Upload to media folder
        const url = await uploadFile(file, `media/${Date.now()}_${file.name}`);

        // Add to local state (in production, this would come from Firestore metadata collection)
        const newFile: MediaFile = {
          name: file.name,
          url,
          size: file.size,
          uploadedAt: new Date(),
          type: file.type,
        };

        setFiles((prev) => [newFile, ...prev]);
      }

      alert('Files uploaded successfully!');
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Delete ${file.name}?`)) return;

    try {
      await deleteFile(file.url);
      setFiles((prev) => prev.filter((f) => f.url !== file.url));
      alert('File deleted successfully!');
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-1 text-muted-foreground">
            Manage all uploaded media files
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Upload className="h-5 w-5" />
          <span>{uploading ? 'Uploading...' : 'Upload Files'}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="rounded-lg border bg-background px-4 py-2"
        >
          <option value="all">All Files</option>
          <option value="images">Images Only</option>
          <option value="documents">Documents Only</option>
        </select>
      </div>

      {/* Empty State */}
      {files.length === 0 && !loading && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 mb-2 text-muted-foreground">
            No media files yet. Upload your first file!
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
          >
            <Upload className="h-5 w-5" />
            <span>Upload Files</span>
          </button>
        </div>
      )}

      {/* Files Grid */}
      {filteredFiles.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredFiles.map((file) => (
            <div
              key={file.url}
              className="group relative overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg"
            >
              {/* Preview */}
              <div className="relative h-48 w-full bg-muted">
                {file.type.startsWith('image/') ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                        <span className="text-2xl font-bold text-primary">
                          {file.name.split('.').pop()?.toUpperCase().slice(0, 3)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Document</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="p-4">
                <p className="mb-2 truncate text-sm font-medium" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>

                {/* Actions */}
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleCopyUrl(file.url)}
                    className="flex flex-1 items-center justify-center space-x-1 rounded-lg bg-muted px-3 py-2 text-sm transition-colors hover:bg-muted/80"
                    title="Copy URL"
                  >
                    {copiedUrl === file.url ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(file)}
                    className="rounded-lg bg-error/10 p-2 text-error transition-colors hover:bg-error/20"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {filteredFiles.length === 0 && files.length > 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No files match your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
}
