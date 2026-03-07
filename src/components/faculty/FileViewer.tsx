'use client';

import { useEffect, useState } from 'react';
import { X, Download, AlertCircle } from 'lucide-react';
import type { FacultyFile } from '@/types';
import { getFileBlob } from '@/lib/firebase/storage';

interface FileViewerProps {
  file: FacultyFile;
  onClose: () => void;
  onDownload: () => void;
}

export default function FileViewer({ file, onClose, onDownload }: FileViewerProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [wordHtml, setWordHtml] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let blobUrl: string | null = null;
    const loadContent = async () => {
      try {
        const blob = await getFileBlob(file.storagePath);
        if (file.mimeType === 'application/pdf') {
          blobUrl = URL.createObjectURL(blob);
          setPdfBlobUrl(blobUrl);
        } else if (file.mimeType === 'text/plain') {
          const text = await blob.text();
          setTextContent(text);
        } else if (
          file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.mimeType === 'application/msword'
        ) {
          const mammoth = (await import('mammoth')).default;
          const arrayBuffer = await blob.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setWordHtml(result.value);
        }
      } catch (err) {
        console.error('File preview error:', err);
        setError('Unable to load preview');
      } finally {
        setLoading(false);
      }
    };

    loadContent();

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80">
      {/* Header */}
      <div className="flex items-center justify-between bg-card px-4 py-3 shadow">
        <h3 className="text-sm font-semibold truncate max-w-[60%]">{file.originalFileName}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={onDownload}
            className="rounded p-2 hover:bg-muted"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="rounded p-2 hover:bg-muted"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        ) : file.mimeType === 'application/pdf' && pdfBlobUrl ? (
          <iframe
            src={pdfBlobUrl}
            className="mx-auto h-full w-full max-w-4xl rounded bg-white"
            title={file.originalFileName}
          />
        ) : textContent !== null ? (
          <pre className="mx-auto max-w-4xl whitespace-pre-wrap rounded-lg bg-card p-6 text-sm font-mono">
            {textContent}
          </pre>
        ) : wordHtml !== null ? (
          <div
            className="prose prose-sm dark:prose-invert mx-auto max-w-4xl rounded-lg bg-card p-6"
            dangerouslySetInnerHTML={{ __html: wordHtml }}
          />
        ) : null}
      </div>
    </div>
  );
}
