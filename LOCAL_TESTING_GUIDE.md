# Local Testing Guide with Firebase Emulators

This guide shows you how to test the entire website locally using Firebase Emulators - **no production Firebase project needed!**

## What are Firebase Emulators?

Firebase Emulators run locally on your computer and simulate:
- Firestore Database
- Authentication
- Storage
- All Firebase features

This lets you test everything without deploying to production or even creating a Firebase project yet!

## Setup Instructions

### Step 1: Install Firebase Emulators

```bash
firebase init emulators
```

When prompted, select:
- ✅ Authentication Emulator
- ✅ Firestore Emulator
- ✅ Storage Emulator

Accept default ports:
- Authentication: 9099
- Firestore: 8080
- Storage: 9199
- Emulator UI: 4000

### Step 2: Create Local Environment File

Create a file named `.env.local` with these values (for emulator use):

```env
# Firebase Emulator Configuration (for local testing)
NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-school-website
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-school-website.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Use emulators
NEXT_PUBLIC_USE_EMULATORS=true

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Update Firebase Config to Use Emulators

Update `src/lib/firebase/config.ts`:

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to emulators in development
if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
  console.log('🔧 Using Firebase Emulators');

  // Connect to Auth Emulator
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });

  // Connect to Firestore Emulator
  connectFirestoreEmulator(db, 'localhost', 8080);

  // Connect to Storage Emulator
  connectStorageEmulator(storage, 'localhost', 9199);
}

export { app, auth, db, storage };
```

### Step 4: Start Firebase Emulators

In one terminal, start the emulators:

```bash
firebase emulators:start
```

You should see:
```
✔  All emulators ready! It is now safe to connect your app.
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! It is now safe to connect your app. │
│ i  View Emulator UI at http://localhost:4000                │
└─────────────────────────────────────────────────────────────┘

┌────────────────┬────────────────┬─────────────────────────────────┐
│ Emulator       │ Host:Port      │ View in Emulator UI             │
├────────────────┼────────────────┼─────────────────────────────────┤
│ Authentication │ localhost:9099 │ http://localhost:4000/auth      │
├────────────────┼────────────────┼─────────────────────────────────┤
│ Firestore      │ localhost:8080 │ http://localhost:4000/firestore │
├────────────────┼────────────────┼─────────────────────────────────┤
│ Storage        │ localhost:9199 │ http://localhost:4000/storage   │
└────────────────┴────────────────┴─────────────────────────────────┘
```

### Step 5: Start Next.js Development Server

In a **second terminal**, start the Next.js app:

```bash
npm run dev
```

## Adding Test Data

### Option A: Using the Emulator UI (Easiest)

1. Open http://localhost:4000 (Firebase Emulator UI)

2. **Create Admin User:**
   - Go to "Authentication" tab
   - Click "Add user"
   - Email: `admin@test.com`
   - Password: `password123`
   - Copy the User UID

3. **Add Admin User Document:**
   - Go to "Firestore" tab
   - Click "Start collection"
   - Collection ID: `adminUsers`
   - Document ID: Paste the User UID from step 2
   - Add fields:
     - `email`: admin@test.com (string)
     - `fullName`: Test Admin (string)
     - `role`: super_admin (string)
     - `isActive`: true (boolean)
     - `createdAt`: Click timestamp button

4. **Add Site Settings:**
   - Create collection: `siteSettings`
   - Document ID: `main`
   - Add fields:
     ```
     schoolName: "Test High School" (string)
     schoolNameNe: "परीक्षण हाई स्कूल" (string)
     tagline: "Excellence in Education" (string)
     taglineNe: "शिक्षामा उत्कृष्टता" (string)
     address: "123 Test Street, Test City" (string)
     addressNe: "परीक्षण ठेगाना" (string)
     phone: "+1-234-567-8900" (string)
     email: "info@testschool.edu" (string)
     aboutContent: "<p>Welcome to our test school!</p>" (string)
     aboutContentNe: "<p>हाम्रो परीक्षण स्कूलमा स्वागत छ!</p>" (string)
     missionVision: "<p>Our mission is to provide quality education.</p>" (string)
     missionVisionNe: "<p>हाम्रो लक्ष्य गुणस्तरीय शिक्षा प्रदान गर्नु हो।</p>" (string)
     socialMedia: (map)
       facebook: "https://facebook.com" (string)
       twitter: "https://twitter.com" (string)
       instagram: "https://instagram.com" (string)
     ```

5. **Add Sample Announcement:**
   - Create collection: `announcements`
   - Auto-generate Document ID
   - Add fields:
     ```
     title: "Welcome to Our School" (string)
     titleNe: "हाम्रो स्कूलमा स्वागत छ" (string)
     slug: "welcome-to-our-school" (string)
     content: "<p>This is a test announcement.</p>" (string)
     contentNe: "<p>यो एक परीक्षण घोषणा हो।</p>" (string)
     category: "general" (string)
     isFeatured: true (boolean)
     isPublished: true (boolean)
     authorId: "test-admin" (string)
     authorName: "Test Admin" (string)
     viewCount: 0 (number)
     publishedDate: Click timestamp button
     createdAt: Click timestamp button
     updatedAt: Click timestamp button
     attachments: [] (array)
     ```

### Option B: Using a Seed Script

Create a file `scripts/seed-emulator.js`:

```javascript
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const { connectAuthEmulator, connectFirestoreEmulator } = require('firebase/auth');

// Initialize Firebase with emulators
const app = initializeApp({
  projectId: 'demo-school-website',
});

const auth = getAuth(app);
const db = getFirestore(app);

connectAuthEmulator(auth, 'http://localhost:9099');
connectFirestoreEmulator(db, 'localhost', 8080);

async function seedData() {
  try {
    // Create admin user
    console.log('Creating admin user...');
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      'admin@test.com',
      'password123'
    );
    const uid = userCredential.user.uid;
    console.log('Admin user created with UID:', uid);

    // Add admin user document
    await setDoc(doc(db, 'adminUsers', uid), {
      email: 'admin@test.com',
      fullName: 'Test Admin',
      role: 'super_admin',
      isActive: true,
      createdAt: serverTimestamp(),
    });
    console.log('Admin user document created');

    // Add site settings
    await setDoc(doc(db, 'siteSettings', 'main'), {
      schoolName: 'Test High School',
      schoolNameNe: 'परीक्षण हाई स्कूल',
      tagline: 'Excellence in Education',
      taglineNe: 'शिक्षामा उत्कृष्टता',
      address: '123 Test Street, Test City',
      addressNe: 'परीक्षण ठेगाना',
      phone: '+1-234-567-8900',
      email: 'info@testschool.edu',
      aboutContent: '<p>Welcome to our test school!</p>',
      aboutContentNe: '<p>हाम्रो परीक्षण स्कूलमा स्वागत छ!</p>',
      missionVision: '<p>Our mission is to provide quality education.</p>',
      missionVisionNe: '<p>हाम्रो लक्ष्य गुणस्तरीय शिक्षा प्रदान गर्नु हो।</p>',
      socialMedia: {
        facebook: 'https://facebook.com',
        twitter: 'https://twitter.com',
        instagram: 'https://instagram.com',
      },
    });
    console.log('Site settings created');

    // Add sample announcement
    await setDoc(doc(db, 'announcements', 'test-announcement-1'), {
      title: 'Welcome to Our School',
      titleNe: 'हाम्रो स्कूलमा स्वागत छ',
      slug: 'welcome-to-our-school',
      content: '<p>This is a test announcement with some content.</p>',
      contentNe: '<p>यो एक परीक्षण घोषणा हो।</p>',
      category: 'general',
      isFeatured: true,
      isPublished: true,
      authorId: uid,
      authorName: 'Test Admin',
      viewCount: 0,
      publishedDate: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      attachments: [],
    });
    console.log('Sample announcement created');

    console.log('✅ Seed data completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
```

Then run:
```bash
node scripts/seed-emulator.js
```

## Testing the Website

### 1. Access the Public Website

Open http://localhost:3000/en

**Test:**
- ✅ Homepage loads
- ✅ Hero carousel (will be empty initially)
- ✅ Announcements section shows your test announcement
- ✅ Language switcher (EN ↔ NE) works
- ✅ Navigation links work
- ✅ About page shows site settings
- ✅ Contact form submits to emulator Firestore

### 2. Access the Admin Panel

1. Go to http://localhost:3000/login
2. Login with:
   - Email: `admin@test.com`
   - Password: `password123`

**Test:**
- ✅ Login works
- ✅ Dashboard shows statistics
- ✅ Create announcement
- ✅ Edit announcement
- ✅ Delete announcement
- ✅ Create event
- ✅ Create program
- ✅ Upload file to media library
- ✅ Toggle hero image active/inactive

### 3. View Data in Emulator UI

Open http://localhost:4000

**Explore:**
- Authentication tab - See created users
- Firestore tab - See all collections and documents in real-time
- Storage tab - See uploaded files

## Tips for Local Testing

### Emulator Data Persistence

By default, emulator data is cleared when you restart. To persist data:

1. Create `firebase.json` configuration:
```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

2. Start with data export:
```bash
firebase emulators:start --import=./emulator-data --export-on-exit
```

### Reset Emulator Data

If you want to start fresh:

```bash
# Stop emulators (Ctrl+C)
# Delete emulator data folder (if persisted)
rm -rf emulator-data
# Restart emulators
firebase emulators:start
```

### Check Console Logs

In your browser console (F12), you should see:
```
🔧 Using Firebase Emulators
```

This confirms you're using local emulators, not production Firebase.

## Common Issues

### Issue: "Firebase: Error (auth/emulator-config-failed)"

**Solution:** Make sure emulators are running before starting Next.js dev server.

### Issue: "Cannot connect to Firestore emulator"

**Solution:** Check that port 8080 is not in use:
```bash
netstat -ano | findstr :8080
```

### Issue: "Data not appearing"

**Solution:** Check Emulator UI (http://localhost:4000) to verify data exists in Firestore.

### Issue: "Images not uploading"

**Solution:** Check Storage emulator is running on port 9199.

## Advantages of Local Testing

✅ **No Production Firebase Needed** - Test everything without creating a Firebase project
✅ **Fast** - No network latency
✅ **Safe** - Can't accidentally affect production data
✅ **Free** - No Firebase costs
✅ **Easy Reset** - Clear data and start over anytime
✅ **Offline** - Works without internet connection

## When You're Ready for Production

Once local testing is complete:

1. Create production Firebase project
2. Update `.env.local` with real Firebase credentials
3. Set `NEXT_PUBLIC_USE_EMULATORS=false` (or remove the line)
4. Deploy using `DEPLOYMENT_GUIDE.md`

## Summary Commands

**Start emulators:**
```bash
firebase emulators:start
```

**Start Next.js (in separate terminal):**
```bash
npm run dev
```

**Access:**
- Public website: http://localhost:3000/en
- Admin login: http://localhost:3000/login
- Emulator UI: http://localhost:4000

**Test credentials:**
- Email: admin@test.com
- Password: password123

---

**Happy testing! You can now test the entire website locally without any production Firebase setup.** 🎉
