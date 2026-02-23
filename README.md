# High School Website

A comprehensive, bilingual (English/Nepali) school website built with Next.js 14, Firebase, and TypeScript.

## 🚀 Features

### Public Website
- **Hero Carousel** - Dynamic image carousel with overlay text
- **Announcements** - Latest news with categories and filtering
- **Academic Programs** - Comprehensive program listings
- **Events Calendar** - Upcoming events management
- **Contact Form** - Firebase-integrated submissions
- **Multi-language** - Full English/Nepali support
- **Responsive Design** - Mobile-first approach

### Admin Panel
- **Secure Authentication** - Firebase Auth with role-based access
- **Dashboard** - Statistics and quick actions
- **Content Management** - CRUD for all content types
- **Hero Images** - Upload, reorder, manage carousel
- **Announcements** - Create, edit, publish news
- **Events & Programs** - Complete management
- **Media Library** - Centralized file management

## 🛠️ Tech Stack

- Next.js 14 (App Router) + TypeScript
- Firebase (Firestore, Auth, Storage, Hosting)
- Tailwind CSS + Custom Branding
- next-intl (Internationalization)
- React Hook Form + Zod Validation

## 📋 Prerequisites

- Node.js 18.16.0+ (20.9.0+ recommended)
- npm or yarn
- Firebase account

## 🔧 Quick Start

### Option 1: Local Testing (No Firebase Project Needed)

**Test everything locally in 5 minutes using Firebase Emulators!**

See **`QUICK_START_LOCAL.md`** for step-by-step instructions.

```bash
# 1. Create .env.local with emulator config
# 2. Start Firebase emulators
firebase emulators:start

# 3. Seed test data (in another terminal)
node scripts/seed-emulator.js

# 4. Start dev server
npm run dev
```

Visit [http://localhost:3000/en](http://localhost:3000/en)
Login at [http://localhost:3000/login](http://localhost:3000/login) with `admin@test.com` / `password123`

### Option 2: Production Firebase Setup

1. **Install dependencies**
```bash
npm install
```

2. **Configure Firebase**
- Create a Firebase project
- Enable Firestore, Authentication, Storage
- Copy `.env.example` to `.env.local`
- Add your Firebase credentials

3. **Deploy Security Rules**
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

4. **Create Admin User**
- Add user in Firebase Authentication
- Create document in `adminUsers` collection with user UID

5. **Run development server**
```bash
npm run dev
```

Visit [http://localhost:3000/en](http://localhost:3000/en)

## 📁 Key Directories

```
src/
├── app/[locale]/        # Localized routes (en, ne)
│   ├── page.tsx        # Homepage
│   ├── admin/          # Admin panel
│   ├── announcements/  # News & updates
│   ├── programs/       # Academic programs
│   ├── events/         # Events calendar
│   └── contact/        # Contact form
├── components/         # React components
├── hooks/             # Custom hooks
├── lib/firebase/      # Firebase helpers
└── types/             # TypeScript types
```

## 🔐 Admin Access

1. Navigate to `/login`
2. Sign in with admin credentials
3. Access `/en/admin/dashboard`

## 🌐 Deployment

**See `DEPLOYMENT_GUIDE.md` for complete step-by-step deployment instructions.**

The deployment guide covers:
- Firebase project setup
- Security rules deployment
- Admin user creation
- Initial data setup
- Production deployment
- Custom domain configuration
- Troubleshooting

Quick deploy (after Firebase setup):
```bash
npm run build
firebase deploy
```

## 📚 Documentation

- **`QUICK_START_LOCAL.md`** - **Start here!** Test locally in 5 minutes
- `LOCAL_TESTING_GUIDE.md` - Complete local testing with Firebase Emulators
- `DEPLOYMENT_GUIDE.md` - Step-by-step production deployment
- `PROJECT_STATUS.md` - Current project status and progress
- `Technical_Requirements_Document.md` - Complete technical specifications
- `.env.example` - Environment variables template

## 📄 License

MIT License

---

Built with Next.js and Firebase
