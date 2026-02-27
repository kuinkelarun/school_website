import { Timestamp } from 'firebase/firestore';

// ============================================================================
// Base Types
// ============================================================================

export interface BaseDocument {
  id: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// ============================================================================
// Hero Image
// ============================================================================

export interface HeroImage extends BaseDocument {
  imageUrl: string;
  altText: string;
  altTextNe?: string;
  overlayText?: string;
  overlayTextNe?: string;
  displayOrder: number;
  displayDuration: number; // in seconds
  isActive: boolean;
}

export type HeroImageFormData = Omit<HeroImage, 'id' | 'createdAt' | 'updatedAt'>;

// ============================================================================
// Announcement
// ============================================================================

export type AnnouncementCategory = 'general' | 'academic' | 'events' | 'urgent';

export interface Announcement extends BaseDocument {
  title: string;
  titleNe?: string;
  slug: string;
  content: string; // HTML content
  contentNe?: string;
  category: AnnouncementCategory;
  isFeatured: boolean;
  isPublished: boolean;
  imageUrl?: string;
  attachments: Attachment[];
  authorId: string;
  authorName: string;
  viewCount: number;
  publishedDate?: Timestamp | Date;
}

export interface Attachment {
  filename: string;
  url: string;
  size: number; // in bytes
}

export type AnnouncementFormData = Omit<
  Announcement,
  'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'slug'
>;

// ============================================================================
// Event
// ============================================================================

export type EventCategory = 'academic' | 'sports' | 'cultural' | 'other';

export interface Event extends BaseDocument {
  title: string;
  titleNe?: string;
  slug: string;
  description: string;
  descriptionNe?: string;
  startDate: Timestamp | Date;
  endDate: Timestamp | Date;
  location: string;
  category: EventCategory;
  imageUrl?: string;
  isPublished: boolean;
  authorId: string;
  authorName: string;
}

export type EventFormData = Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'slug'>;

// ============================================================================
// Program
// ============================================================================

export type ProgramCategory = 'science' | 'commerce' | 'arts' | 'other';

export interface Program extends BaseDocument {
  title: string;
  titleNe?: string;
  slug: string;
  description: string;
  descriptionNe?: string;
  category: ProgramCategory;
  objectives?: string;
  objectivesNe?: string;
  curriculumPdfUrl?: string;
  imageUrl?: string;
  displayOrder: number;
  isPublished: boolean;
}

export type ProgramFormData = Omit<Program, 'id' | 'createdAt' | 'updatedAt' | 'slug'>;

// ============================================================================
// Contact Message
// ============================================================================

export type ContactMessageStatus = 'unread' | 'read' | 'replied';

export interface ContactMessage extends BaseDocument {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  ipAddress?: string;
}

export type ContactFormData = Omit<
  ContactMessage,
  'id' | 'createdAt' | 'updatedAt' | 'status' | 'ipAddress'
>;

// ============================================================================
// Admin User
// ============================================================================

export type AdminRole = 'super_admin' | 'admin' | 'editor' | 'viewer';

export interface AdminUser extends BaseDocument {
  email: string;
  fullName: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin?: Timestamp | Date;
}

// ============================================================================
// Site Settings
// ============================================================================

export interface SiteSettings {
  id: string;
  schoolName: string;
  schoolNameNe: string;
  logoUrl: string;
  tagline: string;
  taglineNe: string;
  address: string;
  addressNe: string;
  phone: string;
  email: string;
  socialMedia: SocialMedia;
  mapEmbedUrl?: string;
  aboutContent: string;
  aboutContentNe: string;
  missionVision: string;
  missionVisionNe: string;
}

export interface SocialMedia {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
}

// ============================================================================
// Gallery
// ============================================================================

export type GalleryItemType = 'image' | 'video' | 'document';

export interface GalleryItem extends BaseDocument {
  type: GalleryItemType;
  url: string;
  thumbnailUrl?: string;
  title: string;
  titleNe?: string;
  description?: string;
  descriptionNe?: string;
  mimeType: string;
  fileSize: number;
  fileName: string;
  isPublished: boolean;
  displayOrder: number;
  uploadedBy: string;
}

export type GalleryItemFormData = Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt'>;

// ============================================================================
// Media File
// ============================================================================

export type MediaType = 'image' | 'document';

export interface MediaFile extends BaseDocument {
  filename: string;
  originalFilename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  folder?: string;
  uploadedBy: string;
  uploadedAt: Timestamp | Date;
}

// ============================================================================
// Pagination
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// ============================================================================
// API Response
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ============================================================================
// Form State
// ============================================================================

export interface FormState<T = any> {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  data: T | null;
}

// ============================================================================
// Upload Progress
// ============================================================================

export interface UploadProgress {
  fileName: string;
  progress: number;
  url?: string;
  error?: string;
}

// ============================================================================
// Filter Options
// ============================================================================

export interface FilterOption {
  label: string;
  value: string;
}

export interface CategoryFilterOption {
  label: string;
  value: AnnouncementCategory | EventCategory | ProgramCategory | 'all';
}

// ============================================================================
// Validation Schemas (for Zod)
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}
