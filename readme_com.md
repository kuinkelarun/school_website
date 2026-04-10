🏫 Janata Secondary School Website — Overview & Introduction
Brief Intro
Janata Secondary School Website is a full-featured, production-grade, bilingual (English/Nepali) school management and public-facing website that I built entirely as a charity project for a school in Nepal. The application is deployed and running at my own expense — hosted on Firebase infrastructure, paid for with my personal credit card — because I believe every school deserves a modern digital presence, regardless of budget.

This isn't a template or a demo — it is a live, operational platform powering a real school's online presence. It serves three distinct audiences through dedicated portals:

The Public — Students, parents, and community members can browse announcements, events, academic programs, a photo gallery, read and submit articles, and interact with the school through a contact form — all in English or Nepali.

Teachers (Faculty Portal) — Teachers log in through a dedicated faculty login page where they can manage their assignments, upload and organize files (PDFs, documents, spreadsheets) in a personal folder system, preview and share documents, and track their storage usage — all within a clean, intuitive dashboard.

School Administrators (Admin Panel) — Admins have full content management control over the main public website. They can add/edit/publish announcements, events, and academic programs; manage the homepage hero carousel; upload media to a centralized library; manage faculty profiles and approve faculty accounts; review and approve student-submitted articles before publication; configure all site settings (school name, logo, contact info, social media links, mission/vision); and monitor system storage usage.

Key highlights:

Nepali Calendar API Integration — Since this is a Nepali school, the platform integrates with the Hamro Panchanga API to convert Gregorian (AD) dates to Bikram Sambat (BS) dates. Admins can publish events with Nepali dates, and a Nepali calendar widget is displayed on the homepage. The system supports single and batch date conversions, BS-to-AD lookups, today's tithi (lunar day), and full monthly calendar views.

Student Article Submission & Admin Approval — Students (and teachers, parents, alumni) can submit articles, news pieces, creative writing, or any other work. They can either type inline or upload a Word document (.docx), which is automatically parsed and text-extracted using the Mammoth library. Submissions enter a review queue where admins can approve, reject, or provide notes — and approved articles are published on the school's public Articles page.

Full Bilingual Support — Every piece of content, every UI label, every form field supports both English and Nepali. Users can switch languages with a single click, and the URL structure reflects the language choice (/en/... or /ne/...).

Built as Charity, Deployed at Personal Cost — This entire application was designed, developed, and deployed as a charitable contribution. The Firebase hosting, storage, authentication, and cloud functions are all funded from my personal credit card because I wanted to give this school a world-class digital platform without any financial burden on them.

📖 Comprehensive README / Feature Documentation
Project: Janata Secondary School Website
Repository: kuinkelarun/school_website
Live Project ID: janatamavi-edu
Tech Stack: Next.js 16 · React 19 · TypeScript · Firebase · Tailwind CSS v4 · next-intl
Languages: English 🇺🇸 & Nepali 🇳🇵 (fully bilingual)

🌟 What This App Does
This is a comprehensive school website and content management system that provides:

A beautiful, responsive public website for the school community
A powerful admin CMS for managing all website content
A dedicated faculty portal for teachers to manage documents and assignments
A student contribution pipeline where students submit articles/art for publication
Nepali calendar integration for culturally relevant date display
Full bilingual support in English and Nepali
🏗️ Architecture & Tech Stack
Layer	Technology
Frontend Framework	Next.js 16.1.6 (App Router)
UI Library	React 19.2.3
Language	TypeScript 5
Styling	Tailwind CSS v4 with custom school branding
Database	Firebase Firestore (named database: janatamavi-db)
Authentication	Firebase Auth (email/password) with role-based access
File Storage	Firebase Storage with organized directory structure
Cloud Functions	Firebase Cloud Functions (TypeScript)
Internationalization	next-intl v4.8.3
Rich Text Editor	Quill / React-Quill
Form Handling	React Hook Form + Zod validation
Image Carousel	Embla Carousel
Document Parsing	Mammoth.js (.docx text extraction)
Icons	Lucide React
Hosting	Firebase Hosting
📚 Detailed Feature Breakdown
1. 🌐 Public Website
Homepage

Dynamic hero image carousel with auto-rotation, overlay text (bilingual), and configurable display duration
Featured announcements section
Quick links grid for easy navigation
Latest articles showcase
Upcoming events listing
Nepali Calendar Widget showing today's BS date and tithi
About Us preview with school information
Announcements Page (/announcements)

Category-based filtering: General, Academic, Events, Urgent
Featured announcements highlighted at top
Full-text search functionality
View counter tracking per announcement
Detail pages with rich HTML content and image attachments
Articles Page (/articles)

Browse published articles by category: Sports, Arts, Academics, Achievements, General
Featured articles section
Search functionality
View counter
Individual article detail pages with full content
Events Page (/events)

Chronological listing of upcoming school events
Category filtering (Academic, Sports, Cultural, Other)
Event details with location, date/time, and Nepali date conversion
Image support
Academic Programs (/programs)

Showcase of academic streams: Science, Commerce, Arts
Program descriptions, objectives, and curriculum PDF links
Category filtering
Featured programs
Gallery (/gallery)

Responsive image and media gallery
Published items displayed in grid layout
About Page (/about)

School mission, vision, and history
Faculty directory organized by category (Principal & Management, Teachers, Staff)
Former faculty and Board of Advisers sections
Bio modal popups for detailed faculty information
Contact information
Contact Page (/contact)

Form with validation (Name, Email, Phone, Subject, Message)
Submissions stored in Firestore for admin review
Success/error messaging
2. 👨‍🏫 Faculty Portal (Teacher Login)
Faculty Login (/faculty-login)

Dedicated email/password authentication separate from admin
New account registration with email verification
Account approval workflow — new registrations require admin approval before access
Status messages for pending approval or deactivated accounts
Faculty Dashboard (/faculty/dashboard)

Welcome message with teacher's name
Statistics cards: total folders, total files, storage used
Storage usage meter (50 MB quota per faculty, with color-coded warnings)
Quick access to document management
Recent files list (last 5 uploads)
Document Management (/faculty/folders)

Create folders to organize teaching materials and assignments
Nested folder hierarchy support
Folder descriptions
Delete folders with contents
File Management (/faculty/folders/[id])

Upload files via drag-and-drop interface
Supported formats: .txt, .pdf, .zip, .docx, .xlsx
3 MB per file size limit, 50 MB total storage quota
File preview/viewer for supported formats
Download and share functionality (copy URL)
File metadata display (size, type, upload date)
Breadcrumb navigation through folder hierarchy
3. 🔧 Admin Panel (Content Management System)
Admin Authentication (/login)

Firebase Auth with role-based access control
Roles: Super Admin, Admin, Editor, Viewer
Protected route wrapper ensuring only authorized users access admin pages
"Remember Me" option for persistent sessions
Admin Dashboard (/admin/dashboard)

Statistics overview: total announcements, events, programs, unread messages
Storage usage meter with warning indicators (70% yellow, 90% red)
Quick action buttons for creating new content
Recent announcements and upcoming events at a glance
Hero Image Management (/admin/hero-images)

Upload and manage homepage carousel images
Configure display order and duration
Toggle active/inactive status
Bilingual overlay text (English/Nepali)
Image preview
Announcements Management (/admin/announcements)

Full CRUD for announcements
Rich text editor (Quill) for HTML content
Bilingual content fields (English & Nepali)
Category selection, featured toggle, publish/unpublish workflow
Auto-slug generation, image uploads, file attachments
Events Management (/admin/events)

Create and manage school events
Date/time pickers with Nepali date support — admins can publish events using BS dates via the Nepali Calendar API
Rich descriptions, bilingual fields, category selection
Location field, image uploads
Programs Management (/admin/programs)

Manage academic program listings
Display order control
Bilingual content, objectives, curriculum PDF URLs
Media Library (/admin/media)

Centralized file management hub
Drag-and-drop multi-file upload with progress bars
File type validation (images up to 5MB, documents up to 10MB)
Grid view with copy-URL functionality
Search and filter capabilities
Article Review & Approval (/admin/articles)

View all student/community-submitted articles
Review queue with pending submissions
Approve submissions → automatically published to public Articles page
Reject submissions with admin notes
Edit approved articles before or after publication
Faculty Management (/admin/faculty)

Manage faculty member profiles (name, role, bio, photo — all bilingual)
Category assignment: Principal, Teacher, Staff
Member type: Active Faculty, Former, Board of Advisers
Display order configuration
Faculty Account Approval (/admin/faculty-accounts)

View and manage pending faculty registration requests
Approve or reject accounts
Activate/deactivate existing accounts
Monitor per-faculty storage usage
Cascade delete (removes auth user, Firestore documents, and all stored files)
Email notifications via Cloud Functions
Contact Messages (/admin/messages)

View all contact form submissions
Filter by status: Unread, Read, Replied
Mark as read, delete
Gallery Management (/admin/gallery)

Upload gallery items (images, videos, documents)
Bilingual titles and descriptions
Display order, publish/unpublish, delete
Site Settings (/admin/site-settings)

School name and logo (bilingual)
Tagline, address, phone, email
Office hours
Social media links (Facebook, Twitter, Instagram, YouTube)
About content and Mission/Vision (rich HTML editor)
Google Maps embed URL
Admin User Management (/admin/admin-users)

View all admin users
Manage roles and permissions
Activate/deactivate users
4. 📅 Nepali Calendar Integration
Since this website serves a Nepali school, it features deep integration with the Bikram Sambat (BS) calendar system via the Hamro Panchanga API:

API Endpoints (internal proxy routes):

Endpoint	Purpose
GET /api/nepali-date?date=YYYY-MM-DD	Convert single AD date to BS
POST /api/nepali-date/batch	Batch convert multiple AD dates
GET /api/nepali-date/bs-to-ad?year=&month=&day=	Convert BS date to AD
GET /api/nepali-date/today	Get today's date in BS
GET /api/nepali-date/today-tithi	Get today's Nepali tithi (lunar day)
GET /api/nepali-calendar?year=&month=	Get full month calendar data
Features:

Nepali Calendar Widget on homepage displaying current BS date and tithi
NepaliDatePicker component in admin forms for publishing events in Nepali dates
NepaliDate display component throughout the site for inline BS date rendering
In-memory caching with 1-hour TTL to minimize API calls
Batch request deduplication for efficiency
Nepali numeral conversion (e.g., 2081 → २०८१)
Full Nepali month name support (बैशाख, जेठ, etc.)
5. ✍️ Student Article Submission Pipeline
Submission (/articles/submit):

Open to anyone: students, teachers, parents, alumni, community members
Two submission methods:
Inline text — type directly in the form
Word document upload — upload a .docx file, which is automatically parsed using Mammoth.js to extract text content
Category selection (Sports, Arts, Academics, Achievements, General)
Submitter information (name, email, type)
Admin Review (/admin/articles):

All submissions enter a review queue with "Pending" status
Admins can read the full submission (including auto-extracted text from .docx files)
Approve → Article is published on the public website
Reject → Submission is rejected with optional admin notes
Admins can edit content before or after publication
Publication:

Approved articles appear on the public /articles page
Articles can be featured, categorized, and include cover images
View count tracking
Linked back to original submission for audit trail
6. 🌍 Internationalization (i18n)
Full bilingual support in English (EN) and Nepali (NE)
URL-based locale routing: /en/... and /ne/...
Language switcher in header preserves current page
All UI labels, navigation, buttons, form fields, error messages, and category names are translated
Content fields support bilingual input (e.g., title + titleNe, content + contentNe)
Nepali numeral conversion for dates and numbers
Noto Sans Devanagari font for Nepali text rendering
7. ☁️ Cloud Functions (Backend Automation)
Function	Trigger	Purpose
onGalleryWrite	Firestore write on gallery	Recalculates storage usage; sends warning emails at 70%/90% thresholds
onMediaWrite	Firestore write on media	Updates storage usage tracking
scheduledStorageCleanup	Daily cron (Asia/Kathmandu TZ)	Auto-deletes old unpublished items when storage exceeds 95%; reports to admin
checkStorageBeforeUpload	Callable function	Pre-upload validation to prevent exceeding storage limits
deleteFacultyMember	Callable function (admin only)	Cascade deletes: Auth user + Firestore docs + Storage files
8. 🔐 Security
Firebase Authentication with email/password
Role-based access control: Super Admin, Admin, Editor, Viewer (admin panel); Approved Faculty (faculty portal)
Firestore Security Rules: Public read for published content; admin-only write access; faculty users restricted to own documents; article submissions and contact messages are write-only for public
Storage Security Rules: Organized by content type with size limits (3MB for faculty files, 10MB for admin uploads); owner-restricted access for faculty files
Bypass mode available for local development/testing without Firebase
9. 📊 Project Metrics
Metric	Value
TypeScript Source Pages	48+ route pages
React Components	18+ components
Custom Hooks	5 (useAuth, useFacultyAuth, useFirestore, useNepaliDate, useUpload)
Firestore Collections	17
API Routes	6 (Nepali Calendar proxy)
Cloud Functions	5
TypeScript Types	25+ interfaces
Supported Languages	2 (English, Nepali)
Estimated Lines of Code	10,000+
10. 🚀 Deployment & Infrastructure
Hosting: Firebase Hosting
Database: Firebase Firestore (named database)
Storage: Firebase Storage with automated cleanup
Functions: Firebase Cloud Functions (Node.js/TypeScript)
Domain: Custom domain configured via Firebase
Cost: Entirely self-funded (personal credit card) as a charitable contribution
Region: Optimized for Nepal (Asia-South2 consideration, defaulted to us-central1 for compatibility)
💝 Built with Love, Deployed as Charity
This entire project — from architecture design to the last line of code, from deployment configuration to ongoing hosting costs — was created as a charitable contribution to Janata Secondary School. The Firebase infrastructure (hosting, database, storage, authentication, cloud functions) is paid for entirely from my personal credit card because I believe technology should be accessible to every educational institution, regardless of their budget. This is not a portfolio piece or a demo — it is a live, operational platform serving real students, teachers, and families every day.
