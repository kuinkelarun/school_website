'use client';

import { useState, useCallback } from 'react';
import {
  uploadFile,
  uploadMultipleFiles,
  generateUniqueFileName,
  validateFileType,
  validateFileSize,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES,
  type STORAGE_PATHS,
} from '@/lib/firebase/storage';
import type { UploadProgress } from '@/types';

interface UseUploadReturn {
  upload: (file: File, path: keyof typeof STORAGE_PATHS | string) => Promise<string>;
  uploadMultiple: (files: File[], path: keyof typeof STORAGE_PATHS | string) => Promise<string[]>;
  progress: number;
  uploading: boolean;
  error: string | null;
  uploadProgress: UploadProgress[];
}

export function useUpload(): UseUploadReturn {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  /**
   * Upload a single file
   */
  const upload = useCallback(
    async (file: File, path: keyof typeof STORAGE_PATHS | string): Promise<string> => {
      setUploading(true);
      setError(null);
      setProgress(0);

      try {
        // Validate file type
        const isImage = validateFileType(file, ALLOWED_FILE_TYPES.images);
        const isDocument = validateFileType(file, ALLOWED_FILE_TYPES.documents);

        if (!isImage && !isDocument) {
          throw new Error('Invalid file type. Only images (JPEG, PNG, WebP) and PDFs are allowed.');
        }

        // Validate file size
        const maxSize = isImage ? MAX_FILE_SIZES.image : MAX_FILE_SIZES.document;
        if (!validateFileSize(file, maxSize)) {
          throw new Error(`File size exceeds ${maxSize}MB limit.`);
        }

        // Generate unique file name
        const uniqueFileName = generateUniqueFileName(file.name);
        const filePath = `${path}/${uniqueFileName}`;

        // Upload file
        const url = await uploadFile(file, filePath, (uploadProgress) => {
          setProgress(uploadProgress);
        });

        setProgress(100);
        return url;
      } catch (err: any) {
        setError(err.message || 'Failed to upload file');
        throw err;
      } finally {
        setUploading(false);
      }
    },
    []
  );

  /**
   * Upload multiple files
   */
  const uploadMultiple = useCallback(
    async (files: File[], path: keyof typeof STORAGE_PATHS | string): Promise<string[]> => {
      setUploading(true);
      setError(null);
      setProgress(0);

      // Initialize upload progress for each file
      const initialProgress: UploadProgress[] = files.map((file) => ({
        fileName: file.name,
        progress: 0,
      }));
      setUploadProgress(initialProgress);

      try {
        // Validate all files
        for (const file of files) {
          const isImage = validateFileType(file, ALLOWED_FILE_TYPES.images);
          const isDocument = validateFileType(file, ALLOWED_FILE_TYPES.documents);

          if (!isImage && !isDocument) {
            throw new Error(
              `Invalid file type for ${file.name}. Only images and PDFs are allowed.`
            );
          }

          const maxSize = isImage ? MAX_FILE_SIZES.image : MAX_FILE_SIZES.document;
          if (!validateFileSize(file, maxSize)) {
            throw new Error(`File ${file.name} exceeds ${maxSize}MB limit.`);
          }
        }

        // Upload all files
        const urls = await uploadMultipleFiles(files, path, (fileIndex, fileProgress) => {
          setUploadProgress((prev) => {
            const updated = prev.map((item, index) =>
              index === fileIndex ? { ...item, progress: fileProgress } : item
            );

            // Calculate overall progress
            const totalProgress =
              updated.reduce((sum, item, index) => {
                return sum + (index === fileIndex ? fileProgress : item.progress);
              }, 0) / files.length;

            setProgress(totalProgress);
            return updated;
          });
        });

        // Update progress with URLs
        setUploadProgress((prev) =>
          prev.map((item, index) => ({
            ...item,
            progress: 100,
            url: urls[index],
          }))
        );

        setProgress(100);
        return urls;
      } catch (err: any) {
        setError(err.message || 'Failed to upload files');

        // Mark failed files in progress
        setUploadProgress((prev) =>
          prev.map((item) =>
            item.progress < 100 ? { ...item, error: err.message } : item
          )
        );

        throw err;
      } finally {
        setUploading(false);
      }
    },
    []
  );

  return {
    upload,
    uploadMultiple,
    progress,
    uploading,
    error,
    uploadProgress,
  };
}
