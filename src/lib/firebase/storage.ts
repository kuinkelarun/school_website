import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  type UploadTaskSnapshot,
  type StorageReference,
} from 'firebase/storage';
import { storage } from './config';

/**
 * Upload file to Firebase Storage with progress tracking
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    } catch (error) {
      console.error('Upload initialization error:', error);
      reject(error);
    }
  });
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  pathPrefix: string,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<string[]> {
  const uploadPromises = files.map((file, index) => {
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `${pathPrefix}/${fileName}`;

    return uploadFile(file, filePath, (progress) => {
      if (onProgress) {
        onProgress(index, progress);
      }
    });
  });

  return Promise.all(uploadPromises);
}

/**
 * Delete file from Firebase Storage
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
}

/**
 * Delete multiple files
 */
export async function deleteMultipleFiles(fileUrls: string[]): Promise<void> {
  const deletePromises = fileUrls.map((url) => deleteFile(url));
  await Promise.all(deletePromises);
}

/**
 * List all files in a directory
 */
export async function listFiles(path: string): Promise<StorageReference[]> {
  try {
    const listRef = ref(storage, path);
    const result = await listAll(listRef);
    return result.items;
  } catch (error) {
    console.error('List files error:', error);
    throw error;
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(path: string): Promise<any> {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    return { url };
  } catch (error) {
    console.error('Get metadata error:', error);
    throw error;
  }
}

/**
 * Generate unique file name
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(`.${extension}`, '');
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');

  return `${sanitizedName}_${timestamp}_${randomString}.${extension}`;
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: readonly string[]): boolean {
  return allowedTypes.some((type) => {
    if (type.includes('/*')) {
      // Handle wildcard types like 'image/*'
      const baseType = type.split('/')[0];
      return file.type.startsWith(baseType + '/');
    }
    return file.type === type;
  });
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

/**
 * Get storage path for different content types
 */
export const STORAGE_PATHS = {
  heroImages: 'hero-images',
  announcements: 'announcements',
  events: 'events',
  programs: 'programs',
  media: 'media',
} as const;

/**
 * Allowed file types
 */
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  documents: ['application/pdf'],
  all: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
} as const;

/**
 * Max file sizes (in MB)
 */
export const MAX_FILE_SIZES = {
  image: 5,
  document: 10,
} as const;
