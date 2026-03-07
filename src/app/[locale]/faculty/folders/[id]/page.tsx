'use client';

import { useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  FolderOpen, FileText, Upload, Download, Eye, Trash2,
  ArrowLeft, Plus, Pencil, AlertCircle, File, FileArchive,
} from 'lucide-react';
import { useFacultyAuth } from '@/hooks/useFacultyAuth';
import { useDocument, useQueryDocuments, useAddDocument, useUpdateDocument, useDeleteDocument } from '@/hooks/useFirestore';
import { uploadFile, deleteFile as deleteStorageFile, generateUniqueFileName, getFileDownloadURL, ALLOWED_FILE_TYPES, MAX_FILE_SIZES, FACULTY_STORAGE_LIMIT_MB } from '@/lib/firebase/storage';
import { updateDocument } from '@/lib/firebase/firestore';
import type { FacultyFolder, FacultyFile, FacultyUser } from '@/types';
import FileViewer from '@/components/faculty/FileViewer';

const ACCEPTED_EXTENSIONS = '.txt,.pdf,.zip,.doc,.docx';

export default function FolderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('faculty.files');
  const tFolders = useTranslations('faculty.folders');
  const { user, facultyUser } = useFacultyAuth();
  const folderId = params.id as string;

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<FacultyFile | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [duplicateFile, setDuplicateFile] = useState<{ file: File; existing: FacultyFile } | null>(null);
  const [showCreateSubfolder, setShowCreateSubfolder] = useState(false);
  const [subfolderName, setSubfolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<FacultyFolder | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isReady = !!(user && facultyUser?.isApproved && facultyUser?.isActive);

  // Fetch current folder
  const { data: folder } = useDocument<FacultyFolder>('facultyFolders', folderId);

  // Fetch parent folder for breadcrumb
  const { data: parentFolder } = useDocument<FacultyFolder>(
    'facultyFolders',
    folder?.parentFolderId || null
  );

  // Fetch sub-folders
  const { data: subFolders, refetch: refetchSubFolders } = useQueryDocuments<FacultyFolder>(
    'facultyFolders',
    isReady ? [
      { field: 'ownerId', operator: '==', value: user!.uid },
      { field: 'parentFolderId', operator: '==', value: folderId },
    ] : [],
    'createdAt',
    'desc'
  );

  // Fetch files in this folder
  const { data: files, refetch: refetchFiles } = useQueryDocuments<FacultyFile>(
    'facultyFiles',
    isReady ? [
      { field: 'ownerId', operator: '==', value: user!.uid },
      { field: 'folderId', operator: '==', value: folderId },
    ] : [],
    'createdAt',
    'desc'
  );

  const { mutate: addFileDoc } = useAddDocument<Partial<FacultyFile>>('facultyFiles');
  const { mutate: addSubFolder } = useAddDocument<Partial<FacultyFolder>>('facultyFolders');
  const { mutate: updateFolderDoc } = useUpdateDocument<FacultyFolder>('facultyFolders');
  const { mutate: deleteFileDoc } = useDeleteDocument('facultyFiles');
  const { mutate: deleteFolderDoc } = useDeleteDocument('facultyFolders');

  const storageUsed = facultyUser?.storageUsed || 0;
  const storageLimitBytes = FACULTY_STORAGE_LIMIT_MB * 1024 * 1024;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
    if (mimeType.includes('zip')) return <FileArchive className="h-5 w-5 text-yellow-600" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="h-5 w-5 text-blue-500" />;
    if (mimeType === 'text/plain') return <File className="h-5 w-5 text-gray-500" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const getFriendlyType = (mimeType: string) => {
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX';
    if (mimeType === 'application/msword') return 'DOC';
    if (mimeType === 'text/plain') return 'TXT';
    if (mimeType.includes('zip')) return 'ZIP';
    const ext = mimeType.split('/').pop() || mimeType;
    return ext.length > 10 ? ext.substring(0, 10).toUpperCase() : ext.toUpperCase();
  };

  const validateFile = (file: File): string | null => {
    const maxSize = MAX_FILE_SIZES.facultyFile * 1024 * 1024;
    if (file.size > maxSize) {
      return t('fileTooLarge', { max: `${MAX_FILE_SIZES.facultyFile} MB` });
    }
    const isAllowedType = (ALLOWED_FILE_TYPES.faculty as readonly string[]).some(
      (type) => file.type === type
    );
    if (!isAllowedType) {
      return t('invalidFileType');
    }
    if (storageUsed + file.size > storageLimitBytes) {
      return t('storageLimitReached', { limit: `${FACULTY_STORAGE_LIMIT_MB} MB` });
    }
    return null;
  };

  const uploadNewFile = useCallback(async (file: File) => {
    if (!user || !folderId) return;
    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const uniqueName = generateUniqueFileName(file.name);
      const storagePath = `faculty-files/${user.uid}/${folderId}/${uniqueName}`;
      const fileUrl = await uploadFile(file, storagePath, (progress) => {
        setUploadProgress(progress);
      });

      await addFileDoc({
        name: uniqueName,
        folderId,
        ownerId: user.uid,
        fileUrl,
        storagePath,
        fileSize: file.size,
        mimeType: file.type,
        originalFileName: file.name,
      });

      // Update storage used
      await updateDocument('facultyUsers', user.uid, {
        storageUsed: storageUsed + file.size,
      });

      refetchFiles();
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || t('uploadFailed'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [user, folderId, storageUsed, addFileDoc, refetchFiles, t]);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    // Check for duplicate name
    const existing = files.find(
      (f) => f.originalFileName.toLowerCase() === selectedFile.name.toLowerCase()
    );
    if (existing) {
      setDuplicateFile({ file: selectedFile, existing });
      return;
    }

    await uploadNewFile(selectedFile);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, uploadNewFile]);

  const handleReplace = async () => {
    if (!duplicateFile || !user) return;
    const { file, existing } = duplicateFile;
    setDuplicateFile(null);
    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Delete old file from storage
      try {
        await deleteStorageFile(existing.storagePath);
      } catch { /* ignore if already gone */ }

      // Upload new
      const uniqueName = generateUniqueFileName(file.name);
      const storagePath = `faculty-files/${user.uid}/${folderId}/${uniqueName}`;
      const fileUrl = await uploadFile(file, storagePath, (progress) => {
        setUploadProgress(progress);
      });

      // Update Firestore doc
      await updateDocument('facultyFiles', existing.id, {
        name: uniqueName,
        fileUrl,
        storagePath,
        fileSize: file.size,
        mimeType: file.type,
        originalFileName: file.name,
      });

      // Adjust storage
      const sizeDiff = file.size - existing.fileSize;
      await updateDocument('facultyUsers', user.uid, {
        storageUsed: storageUsed + sizeDiff,
      });

      refetchFiles();
    } catch (error: any) {
      setUploadError(error.message || t('uploadFailed'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUploadAsNew = async () => {
    if (!duplicateFile) return;
    setDuplicateFile(null);
    await uploadNewFile(duplicateFile.file);
  };

  const handleDeleteFile = async (file: FacultyFile) => {
    if (!user) return;
    setDeletingFileId(file.id);
    try {
      try {
        await deleteStorageFile(file.storagePath);
      } catch { /* ignore if storage file already gone */ }
      await deleteFileDoc(file.id);

      // Update storage
      await updateDocument('facultyUsers', user.uid, {
        storageUsed: Math.max(0, storageUsed - file.fileSize),
      });

      setDeleteConfirm(null);
      refetchFiles();
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleDownload = async (file: FacultyFile) => {
    try {
      const url = await getFileDownloadURL(file.storagePath);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleCreateSubFolder = async () => {
    if (!subfolderName.trim() || !user) return;
    try {
      await addSubFolder({
        name: subfolderName.trim(),
        ownerId: user.uid,
        parentFolderId: folderId,
      });
      setSubfolderName('');
      setShowCreateSubfolder(false);
      refetchSubFolders();
    } catch (error) {
      console.error('Error creating sub-folder:', error);
    }
  };

  const handleEditSubFolder = async () => {
    if (!editFolderName.trim() || !editingFolder) return;
    try {
      await updateFolderDoc(editingFolder.id, { name: editFolderName.trim() });
      setEditingFolder(null);
      setEditFolderName('');
      refetchSubFolders();
    } catch (error) {
      console.error('Error updating folder:', error);
    }
  };

  const handleDeleteSubFolder = async (subfolderId: string) => {
    try {
      await deleteFolderDoc(subfolderId);
      refetchSubFolders();
    } catch (error) {
      console.error('Error deleting sub-folder:', error);
    }
  };

  const canPreview = (mimeType: string) => {
    return mimeType === 'application/pdf' ||
      mimeType === 'text/plain' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword';
  };

  if (!folder) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href={`/${locale}/faculty/folders`} className="hover:text-foreground">
          {tFolders('title')}
        </Link>
        {parentFolder && (
          <>
            <span>/</span>
            <Link href={`/${locale}/faculty/folders/${parentFolder.id}`} className="hover:text-foreground">
              {parentFolder.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground font-medium">{folder.name}</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={() => router.back()} className="rounded p-1 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{folder.name}</h1>
            {folder.description && <p className="text-sm text-muted-foreground">{folder.description}</p>}
          </div>
        </div>
        <button
          onClick={() => { setShowCreateSubfolder(true); setSubfolderName(''); }}
          className="inline-flex items-center space-x-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <Plus className="h-4 w-4" />
          <span>{tFolders('newSubfolder')}</span>
        </button>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="mb-6 rounded-lg border-2 border-dashed bg-muted/30 p-8 text-center transition-colors hover:border-primary/50"
      >
        <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">{t('dragDrop')}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('acceptedTypes')} &middot; {t('maxSize', { size: `${MAX_FILE_SIZES.facultyFile} MB` })}
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {uploading ? `${t('uploading')} ${Math.round(uploadProgress)}%` : t('browse')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileSelect(f);
            e.target.value = '';
          }}
        />
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="mb-4">
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="mb-4 flex items-center space-x-2 rounded-lg bg-error/10 p-3 text-sm text-error">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Sub-folders */}
      {subFolders.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">{tFolders('subfolders')}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subFolders.map((sf) => (
              <div key={sf.id} className="group relative flex items-center space-x-3 rounded-lg border bg-card p-4 hover:shadow-sm">
                <Link href={`/${locale}/faculty/folders/${sf.id}`} className="flex flex-1 items-center space-x-3">
                  <FolderOpen className="h-6 w-6 text-primary" />
                  <span className="font-medium truncate">{sf.name}</span>
                </Link>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => { setEditingFolder(sf); setEditFolderName(sf.name); }}
                    className="rounded p-1 hover:bg-muted"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSubFolder(sf.id)}
                    className="rounded p-1 text-error hover:bg-error/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files List */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">{t('files')} ({files.length})</h2>
        {files.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('noFiles')}</p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            {/* Table Header */}
            <div className="hidden border-b px-4 py-3 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-12 sm:gap-4">
              <span className="col-span-5">{t('name')}</span>
              <span className="col-span-2">{t('type')}</span>
              <span className="col-span-2">{t('size')}</span>
              <span className="col-span-3 text-right">{t('actions')}</span>
            </div>
            {files.map((file) => (
              <div
                key={file.id}
                className="flex flex-col border-b last:border-0 px-4 py-3 sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center"
              >
                <div className="col-span-5 flex items-center space-x-3 min-w-0">
                  {getFileIcon(file.mimeType)}
                  <span className="text-sm font-medium truncate">{file.originalFileName}</span>
                </div>
                <div className="col-span-2 text-xs text-muted-foreground mt-1 sm:mt-0 truncate">
                  {getFriendlyType(file.mimeType)}
                </div>
                <div className="col-span-2 text-xs text-muted-foreground mt-1 sm:mt-0">
                  {formatBytes(file.fileSize)}
                </div>
                <div className="col-span-3 flex items-center justify-end space-x-1 mt-2 sm:mt-0">
                  {canPreview(file.mimeType) && (
                    <button
                      onClick={() => setViewingFile(file)}
                      className="rounded p-1.5 hover:bg-muted"
                      title={t('view')}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(file)}
                    className="rounded p-1.5 hover:bg-muted"
                    title={t('download')}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(file.id)}
                    className="rounded p-1.5 text-error hover:bg-error/10"
                    title={t('delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Viewer Modal */}
      {viewingFile && (
        <FileViewer
          file={viewingFile}
          onClose={() => setViewingFile(null)}
          onDownload={() => handleDownload(viewingFile)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-card p-6 shadow-lg">
            <h2 className="mb-2 text-lg font-bold">{t('deleteConfirmTitle')}</h2>
            <p className="mb-6 text-sm text-muted-foreground">{t('deleteConfirmMessage')}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  const f = files.find((f) => f.id === deleteConfirm);
                  if (f) handleDeleteFile(f);
                }}
                disabled={deletingFileId !== null}
                className="rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white hover:bg-error/90 disabled:opacity-50"
              >
                {deletingFileId ? (
                  <span className="flex items-center space-x-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>{t('delete')}...</span>
                  </span>
                ) : t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate File Modal */}
      {duplicateFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
            <h2 className="mb-2 text-lg font-bold">{t('duplicateTitle')}</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {t('duplicateMessage', { name: duplicateFile.file.name })}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDuplicateFile(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleUploadAsNew}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {t('uploadAsNew')}
              </button>
              <button
                onClick={handleReplace}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {t('replace')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Sub-folder Modal */}
      {showCreateSubfolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">{tFolders('newSubfolder')}</h2>
            <div>
              <label className="mb-2 block text-sm font-medium">{tFolders('folderName')} *</label>
              <input
                value={subfolderName}
                onChange={(e) => setSubfolderName(e.target.value)}
                autoFocus
                className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={tFolders('folderNamePlaceholder')}
              />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateSubfolder(false)}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {tFolders('cancel')}
              </button>
              <button
                onClick={handleCreateSubFolder}
                disabled={!subfolderName.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {tFolders('create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sub-folder Modal */}
      {editingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">{tFolders('editFolder')}</h2>
            <div>
              <label className="mb-2 block text-sm font-medium">{tFolders('folderName')} *</label>
              <input
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                autoFocus
                className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditingFolder(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {tFolders('cancel')}
              </button>
              <button
                onClick={handleEditSubFolder}
                disabled={!editFolderName.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {tFolders('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
