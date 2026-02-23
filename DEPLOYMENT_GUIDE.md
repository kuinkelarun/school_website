# Deployment Guide - High School Website

This guide provides step-by-step instructions for deploying your high school website to Firebase.

## Prerequisites

✅ Node.js 18.16.0+ installed
✅ npm installed
✅ Firebase CLI v12.9.1 installed
✅ All dependencies installed (`npm install`)

## Part 1: Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter your project name (e.g., "my-high-school-website")
4. Accept Firebase terms
5. Enable Google Analytics (optional but recommended)
6. Click "Create project"

### Step 2: Enable Firebase Services

Once your project is created:

1. **Enable Firestore Database**
   - In the left sidebar, click "Firestore Database"
   - Click "Create database"
   - Select "Start in production mode" (we'll deploy security rules next)
   - Choose your region (closest to your users)
   - Click "Enable"

2. **Enable Authentication**
   - In the left sidebar, click "Authentication"
   - Click "Get started"
   - Go to "Sign-in method" tab
   - Enable "Email/Password" provider
   - Click "Save"

3. **Enable Storage**
   - In the left sidebar, click "Storage"
   - Click "Get started"
   - Start in production mode
   - Choose your region
   - Click "Done"

4. **Enable Hosting**
   - In the left sidebar, click "Hosting"
   - Click "Get started"
   - Follow the setup wizard (we'll do actual deployment later)

### Step 3: Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click on the web icon `</>`
4. Register your app with a nickname (e.g., "School Website")
5. Copy the Firebase configuration object

It will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Step 4: Update Environment Variables

1. Open `.env.local` in your project root
2. Update the values with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Save the file

### Step 5: Update Firebase Project ID

1. Open `.firebaserc` in your project root
2. Update the project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

3. Save the file

## Part 2: Firebase Authentication

### Authenticate Firebase CLI

Run the following command to authenticate:

```bash
firebase login
```

This will open a browser window for you to sign in with your Google account.

### Verify Project Connection

```bash
firebase projects:list
```

You should see your project listed. Then set it as the active project:

```bash
firebase use your-project-id
```

## Part 3: Deploy Security Rules

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

This will deploy the security rules from `firestore.rules` to your Firestore database.

**Expected output:**
```
✔  Deploy complete!
✔  Firestore Rules have been successfully deployed
```

### Deploy Storage Rules

```bash
firebase deploy --only storage
```

This will deploy the security rules from `storage.rules` to Firebase Storage.

**Expected output:**
```
✔  Deploy complete!
✔  Storage Rules have been successfully deployed
```

## Part 4: Create Admin User

### Step 1: Create User in Firebase Authentication

1. Go to Firebase Console > Authentication > Users tab
2. Click "Add user"
3. Enter email: `admin@yourschool.edu` (or your preferred admin email)
4. Enter a secure password
5. Click "Add user"
6. **Copy the User UID** (it will look like: `abc123xyz789...`)

### Step 2: Create Admin User Document

You need to manually create a document in Firestore:

1. Go to Firebase Console > Firestore Database
2. Click "Start collection"
3. Collection ID: `adminUsers`
4. Document ID: Paste the User UID you copied
5. Add the following fields:

| Field | Type | Value |
|-------|------|-------|
| email | string | admin@yourschool.edu |
| fullName | string | Admin User |
| role | string | super_admin |
| isActive | boolean | true |
| createdAt | timestamp | (click "INSERT TIMESTAMP") |

6. Click "Save"

Now you can log in to `/login` with the admin credentials!

## Part 5: Initial Data Setup

### Create Site Settings Document

1. Go to Firestore Database
2. Create a collection named `siteSettings`
3. Create a document with ID: `main`
4. Add the following fields:

| Field | Type | Value |
|-------|------|-------|
| schoolName | string | Your High School Name |
| schoolNameNe | string | तपाईंको स्कूलको नाम |
| tagline | string | Excellence in Education |
| taglineNe | string | शिक्षामा उत्कृष्टता |
| address | string | 123 School Street, City |
| addressNe | string | नेपाली ठेगाना |
| phone | string | +1-234-567-8900 |
| email | string | info@yourschool.edu |
| aboutContent | string | Your school's about content (HTML) |
| aboutContentNe | string | नेपालीमा बारे सामग्री |
| missionVision | string | Your mission and vision (HTML) |
| missionVisionNe | string | नेपालीमा मिशन र दृष्टि |

### Add Social Media Links

Add a map field called `socialMedia`:

```
socialMedia (map):
  - facebook: "https://facebook.com/yourschool"
  - twitter: "https://twitter.com/yourschool"
  - instagram: "https://instagram.com/yourschool"
  - youtube: "https://youtube.com/@yourschool"
```

## Part 6: Test Locally

### Start Development Server

```bash
npm run dev
```

### Access the Website

1. **Public Website**: http://localhost:3000/en
2. **Nepali Version**: http://localhost:3000/ne
3. **Admin Login**: http://localhost:3000/login

### Test Admin Functions

1. Log in with your admin credentials
2. Navigate to `/en/admin/dashboard`
3. Test creating:
   - Hero images (upload, reorder)
   - Announcements (create, edit, delete)
   - Events (create, edit, delete)
   - Programs (create, edit, delete)
4. Verify changes appear on the public website

## Part 7: Build and Deploy to Firebase Hosting

### Step 1: Build the Project

```bash
npm run build
```

This will create an optimized production build in the `.next` folder.

### Step 2: Export Static Files (if needed)

If you want to deploy as a static site:

Update `next.config.ts`:
```typescript
const nextConfig = {
  output: 'export', // Add this line
  // ... rest of your config
};
```

Then rebuild:
```bash
npm run build
```

### Step 3: Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

**Expected output:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project-id/overview
Hosting URL: https://your-project-id.web.app
```

### Step 4: Configure Custom Domain (Optional)

1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Enter your domain (e.g., www.yourschool.edu)
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning (24-48 hours)

## Part 8: Post-Deployment Verification

### Test Production Website

1. Visit your Firebase Hosting URL
2. Test all pages:
   - ✅ Homepage with hero carousel
   - ✅ About page
   - ✅ Announcements list and detail
   - ✅ Programs page
   - ✅ Events page
   - ✅ Contact form
   - ✅ Language switcher (EN ↔ NE)
3. Test admin panel:
   - ✅ Login functionality
   - ✅ Dashboard statistics
   - ✅ CRUD operations for all content
4. Test on mobile devices
5. Test in different browsers

### Performance Check

Run Lighthouse audit:
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Check "Performance", "Accessibility", "Best Practices", "SEO"
4. Click "Analyze page load"
5. Target scores:
   - Performance: > 85
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 90

## Troubleshooting

### Issue: "Firebase project not found"
**Solution:** Make sure `.firebaserc` has the correct project ID and you've run `firebase use your-project-id`

### Issue: "Permission denied" errors in Firestore
**Solution:** Check that security rules are deployed: `firebase deploy --only firestore:rules`

### Issue: Admin can't log in
**Solution:**
1. Verify user exists in Authentication
2. Verify adminUsers document exists with correct UID
3. Check that `isActive` is `true`

### Issue: Images not uploading
**Solution:**
1. Check Storage rules are deployed: `firebase deploy --only storage`
2. Verify file size is under 10MB
3. Check browser console for errors

### Issue: 404 errors on page refresh
**Solution:** Firebase Hosting needs proper rewrite rules. Check `firebase.json`:
```json
{
  "hosting": {
    "public": "out",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## Maintenance Tasks

### Regular Backups

1. Go to Firebase Console > Firestore Database > Usage tab
2. Enable automated backups (paid feature on Blaze plan)
3. Or manually export data periodically:
   ```bash
   gcloud firestore export gs://[BUCKET_NAME]
   ```

### Monitor Usage

1. Go to Firebase Console > Usage tab
2. Check Firestore reads/writes
3. Check Storage usage
4. Check Hosting bandwidth
5. Upgrade to Blaze plan if you exceed free tier

### Update Content

Admins can log in to `/login` and manage:
- Hero carousel images
- Announcements
- Events
- Programs
- Media library

### Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Regularly review Firestore rules** as your app grows
3. **Use strong passwords** for admin accounts
4. **Enable 2FA** for Firebase Console access
5. **Monitor Authentication logs** for suspicious activity
6. **Keep dependencies updated**: `npm outdated` and `npm update`

## Support

For issues or questions:
1. Check Firebase documentation: https://firebase.google.com/docs
2. Next.js documentation: https://nextjs.org/docs
3. GitHub issues for specific libraries

## Summary Checklist

- [ ] Firebase project created
- [ ] Firestore, Authentication, Storage, Hosting enabled
- [ ] Environment variables configured
- [ ] Firebase CLI authenticated
- [ ] Security rules deployed
- [ ] Admin user created in Authentication
- [ ] Admin user document created in Firestore
- [ ] Site settings document created
- [ ] Local testing completed
- [ ] Production build successful
- [ ] Deployed to Firebase Hosting
- [ ] Production website verified
- [ ] Performance optimized (Lighthouse > 85)

---

**Congratulations! Your high school website is now live!** 🎉
