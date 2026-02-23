# Quick Start - Local Testing (5 Minutes)

This is a quick guide to get the website running locally using Firebase Emulators. **No production Firebase project needed!**

## Prerequisites

✅ Node.js installed
✅ Firebase CLI installed (`npm install -g firebase-tools@12.9.1`)
✅ Dependencies installed (`npm install`)

## Step 1: Create Environment File (1 minute)

Create `.env.local` in the project root:

```env
# Firebase Emulator Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-school-website
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-school-website.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Enable emulators
NEXT_PUBLIC_USE_EMULATORS=true

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 2: Start Firebase Emulators (1 minute)

Open **Terminal 1** and run:

```bash
firebase emulators:start
```

Wait for this message:
```
✔  All emulators ready! It is now safe to connect your app.
```

**Keep this terminal running!**

## Step 3: Seed Test Data (1 minute)

Open **Terminal 2** and run:

```bash
node scripts/seed-emulator.js
```

You should see:
```
✅ Seed data completed successfully!

📝 Test Credentials:
   Email: admin@test.com
   Password: password123
```

## Step 4: Start Next.js Dev Server (1 minute)

In **Terminal 2** (or open Terminal 3), run:

```bash
npm run dev
```

Wait for:
```
✓ Ready in X.Xs
○ Local: http://localhost:3000
```

## Step 5: Access the Website (1 minute)

Open your browser:

### Public Website
🌐 **http://localhost:3000/en** (English)
🌐 **http://localhost:3000/ne** (Nepali)

You should see:
- Hero carousel section (empty initially - add via admin)
- Sample announcements (3 announcements)
- Sample events (2 events)
- Working navigation

### Admin Panel
🔐 **http://localhost:3000/login**

Login with:
- **Email:** `admin@test.com`
- **Password:** `password123`

After login, you'll see the admin dashboard.

### Firebase Emulator UI
🔧 **http://localhost:4000**

View real-time data:
- Authentication → See your admin user
- Firestore → See all collections and documents
- Storage → See uploaded files

## What Can You Test?

### Public Website
✅ Browse all pages (Home, About, Announcements, Programs, Events, Contact)
✅ Switch language (EN ↔ NE)
✅ View announcement details
✅ Filter programs by category
✅ Submit contact form

### Admin Panel
✅ **Dashboard** - View statistics
✅ **Announcements** - Create, edit, delete
✅ **Events** - Create, edit, delete
✅ **Programs** - Create, edit, delete
✅ **Hero Images** - Toggle active/inactive
✅ **Media Library** - Upload files

## Common Commands

| Action | Command | Terminal |
|--------|---------|----------|
| Start emulators | `firebase emulators:start` | Terminal 1 |
| Seed data | `node scripts/seed-emulator.js` | Terminal 2 |
| Start dev server | `npm run dev` | Terminal 2/3 |
| Stop server | `Ctrl+C` | Any terminal |

## Troubleshooting

### Issue: Can't connect to emulator

**Solution:** Make sure emulators are running first (Terminal 1)

### Issue: No data appearing

**Solution:** Run the seed script: `node scripts/seed-emulator.js`

### Issue: Port already in use

**Solution:**
```bash
# Check what's using the port
netstat -ano | findstr :3000
# Kill the process or use different port
```

### Issue: "Firebase: Error (auth/emulator-config-failed)"

**Solution:** Restart emulators and dev server in this order:
1. Stop everything (Ctrl+C)
2. Start emulators first
3. Then start dev server

## Reset Everything

If you want to start fresh:

```bash
# Stop emulators (Ctrl+C in Terminal 1)
# Restart emulators
firebase emulators:start

# In another terminal, seed again
node scripts/seed-emulator.js
```

## Data Persistence

By default, emulator data is cleared when you stop the emulators. To persist data:

```bash
# Start with export/import
firebase emulators:start --import=./emulator-data --export-on-exit
```

## Next Steps

Once local testing is complete:

1. **See full testing guide:** `LOCAL_TESTING_GUIDE.md`
2. **Deploy to production:** `DEPLOYMENT_GUIDE.md`

---

## Summary

✅ **3 terminals running:**
- Terminal 1: Firebase emulators (`firebase emulators:start`)
- Terminal 2: Next.js dev server (`npm run dev`)

✅ **3 URLs to bookmark:**
- http://localhost:3000/en (Public website)
- http://localhost:3000/login (Admin login)
- http://localhost:4000 (Emulator UI)

✅ **Test credentials:**
- Email: admin@test.com
- Password: password123

**You're all set! Start testing the website locally.** 🚀
