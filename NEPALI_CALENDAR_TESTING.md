# Testing Nepali Calendar Integration

This guide explains how to test the Nepali calendar integration locally, including BS (Bikram Sambat) date displays, the calendar widget, and the admin date picker.

## Prerequisites

- **Node.js** 18+ and npm installed
- **Firebase CLI** installed (`npm install -g firebase-tools`)
- Access to both codebases:
  - `E:\Arun\Side - Projects\school_website` (this app)
  - `E:\Arun\Side - Projects\Family Tree\family-tree-app` (hamropanchanga functions)

## Step 1 — Deploy Hamro Panchanga Functions

The school website depends on 4 new conversion endpoints added to the hamropanchanga API. These must be deployed to Firebase Cloud Functions.

### In the family-tree-app directory:

```bash
cd "E:\Arun\Side - Projects\Family Tree\family-tree-app\functions"
firebase deploy --only functions
```

This deploys the updated `routes.js` with:
- `GET /v1/convert/ad-to-bs?date=YYYY-MM-DD` — Convert Gregorian to BS
- `GET /v1/convert/bs-to-ad?year=YYYY&month=M&day=D` — Convert BS to Gregorian
- `POST /v1/convert/batch` — Batch conversion (up to 100 dates)
- `GET /v1/today` — Get today's date in BS

**Expected output:** You should see a `✔  functions deployed successfully` message. Note the deployed URL — it should be something like:
```
https://us-central1-family-tree-crm-firebase.cloudfunctions.net/api
```

## Step 2 — Create or Get an API Key

The school website needs an API key to authenticate with hamropanchanga. This key is stored in Firestore.

### Option A: Use an existing key

If you already created one, find it in:
- **Firestore project:** `hamropanchanga-db` (in family-tree-app)
- **Collection:** `apiKeys`
- Look for a document with `name: "school-website"`
- Copy its key value (starts with `npcal_`)

### Option B: Create a new key

1. Open **Firestore Console** for `hamropanchanga-db`
2. Go to **Collections > apiKeys**
3. Click **Add Document** and create a new one:

```json
{
  "name": "school-website",
  "rateLimitPerDay": 10000,
  "keyHash": "<SHA-256 hash of your key>",
  "createdAt": "<current timestamp>",
  "status": "active"
}
```

Generate a test key:

```bash
# On PowerShell:
$key = "npcal_" + ([guid]::NewGuid().ToString().Replace("-", "")).Substring(0, 58)
Write-Host $key

# On macOS/Linux:
key="npcal_$(openssl rand -hex 32)"
echo $key
```

Then generate its SHA-256 hash:

```bash
# PowerShell:
$text = $key
$hash = [System.Security.Cryptography.SHA256]::Create()
$hashBytes = $hash.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($text))
$hashHex = [System.BitConverter]::ToString($hashBytes).Replace("-", "").ToLower()
Write-Host $hashHex

# macOS/Linux:
echo -n "$key" | sha256sum | cut -d' ' -f1
```

Save both the key and hash in Firestore.

## Step 3 — Configure School Website

### Create `.env.local` file

In the school_website directory, copy and configure the environment file:

```bash
cd "E:\Arun\Side - Projects\school_website"
copy .env.local.example .env.local
```

### Edit `.env.local`

Add or update these two lines (at the end of the file):

```dotenv
NEPALI_CALENDAR_API_URL=https://us-central1-family-tree-crm-firebase.cloudfunctions.net/api
NEPALI_CALENDAR_API_KEY=npcal_your_actual_api_key_here
```

Replace `npcal_your_actual_api_key_here` with the actual key you created/found in Step 2.

## Step 4 — Run the School Website

```bash
npm install  # If running for the first time, install dependencies

npm run dev  # Start the development server
```

The app will start on `http://localhost:3000`.

## Step 5 — Test the Integration

### Test 1: Homepage Calendar Widget

1. Open `http://localhost:3000/en` (or `http://localhost:3000/ne` for Nepali)
2. In the **Quick Links** section, you should see the **Nepali Calendar** widget on the right side
3. Verify:
   - Today's BS date is displayed at the top (e.g., "१6 फाल्गुन २०८२")
   - The calendar grid shows the current month in BS
   - You can navigate between months with the chevron buttons
   - Saturday dates are highlighted in red
   - Clicking a date in the calendar works (updates the display)

### Test 2: Public Page Dates

Navigate to any public-facing page and verify all dates are shown in BS (Nepali):

- **Homepage** → Upcoming Events section: Event dates should show as BS (e.g., "१6 फाल्गुन २०८२")
- **Announcements** (`/announcements`): Announcement publish dates should be in BS
- **Events** (`/events`): Event start/end dates should be in BS
- **Articles** (`/articles`): Article publish dates should be in BS
- **Article detail pages** (`/articles/[slug]`): Publish date in BS with author info

**Expected behavior:** If the API call succeeds, you'll see Nepali numerals and month names. If the API is unreachable, dates gracefully fall back to English AD dates.

### Test 3: Admin Date Picker

1. Log in to admin panel (`/admin`)
2. Go to **Events > Create New** or **Events > Edit**
3. Look for the **Start Date & Time** and **End Date & Time** inputs
4. Click the calendar icon to open the **NepaliDatePicker**
5. Verify:
   - The picker shows today's BS date highlighted
   - You can select a year (2070-2089 range for now)
   - You can select a month (Baishakh through Chaitra)
   - Clicking a day updates the display and closes the picker
   - The time input fields work independently
   - The selected date appears in the datetime-local format in the hidden input (for form submission)

### Test 4: Admin List Pages

1. Go to **Admin > Events**, **Admin > Announcements**, or **Admin > Articles**
2. Verify that the date columns show BS dates instead of English dates
3. Check that sorting still works correctly (if implemented)

### Test 5: Fallback Behavior

To test the graceful fallback when the API is unavailable:

1. In `.env.local`, temporarily change the `NEPALI_CALENDAR_API_URL` to an invalid URL
2. Refresh the app
3. Verify that:
   - Dates still display, but as English AD dates (e.g., "16 Feb 2026")
   - No error messages are shown to users
   - Calendar widget quietly hides (no error banner)
   - Form submission still works
4. Fix the URL back to the correct one

## Troubleshooting

### Issue: Calendar widget doesn't appear

**Cause:** The API endpoint might be unreachable or returning an error.

**Solution:**
1. Check that `NEPALI_CALENDAR_API_URL` matches the deployed Cloud Function URL
2. Verify the Cloud Functions are deployed: `firebase deploy --only functions`
3. Check browser DevTools **Network** tab → requests to `/api/nepali-date/today` should return 200 or 304

### Issue: Dates show as "Loading..." indefinitely

**Cause:** The API key might be invalid or the endpoint is timing out.

**Solution:**
1. Verify `NEPALI_CALENDAR_API_KEY` matches the one in Firestore
2. Test the API directly using curl:
   ```bash
   curl -H "X-API-Key: npcal_your_key" "https://us-central1-family-tree-crm-firebase.cloudfunctions.net/api/v1/today"
   ```
   Should return JSON: `{ "bsYear": 2082, "bsMonth": 11, "bsDay": 16, ... }`
3. Check Cloud Function logs in Firebase Console for errors

### Issue: Admin date picker doesn't work

**Cause:** React Hook Form's `setValue` might not be updating properly.

**Solution:**
1. Check browser console for JavaScript errors
2. Make sure the form is wrapped in `<FormProvider>` (it should be by default)
3. Try submitting the form — if the date is submitted correctly, the picker is working (just the visual feedback might be delayed)

### Issue: Nepali numerals aren't showing

**Cause:** Font rendering issue or function not being called.

**Solution:**
1. Check that `toNepaliNumber()` is being used in the widget and date picker components
2. Verify browser supports Devanagari script (it does in modern browsers)
3. Check browser DevTools **Console** for JavaScript errors

## Understanding the Architecture

```
School Website (Next.js)
  ├─ src/app/api/nepali-date/* (proxy routes)
  │  └─ Fetch from hamropanchanga, cache, hide API key
  ├─ src/lib/nepali-calendar/api.ts (client API service)
  │  └─ Session-level caching, batch operations
  ├─ src/components/shared/NepaliDate.tsx (display component)
  │  └─ Shows BS date with AD fallback
  ├─ src/components/admin/NepaliDatePicker.tsx (form input)
  │  └─ Calendar UI for selecting BS dates
  └─ src/components/public/NepaliCalendarWidget.tsx (homepage widget)
     └─ Monthly calendar with today highlight
        ↓
   Hamro Panchanga API (Cloud Functions, family-tree-app)
     ├─ /v1/convert/ad-to-bs
     ├─ /v1/convert/bs-to-ad
     ├─ /v1/convert/batch
     └─ /v1/today
        ↓
   Firestore (hamropanchanga-db)
     ├─ nepaliCalendarYears (BS 2000-2100 calendar data)
     ├─ tithis (lunar day info)
     └─ apiKeys (usage tracking & rate limiting)
```

## Testing Date Conversions Manually

If you want to verify the conversion logic independently:

### Using the browser DevTools console:

```javascript
// Test API service directly
import { convertAdToBs } from '@/lib/nepali-calendar/api';

// In console:
convertAdToBs('2026-02-28').then(console.log);
// Should output: { bsYear: 2082, bsMonth: 11, bsDay: 16, ... }
```

### Using curl (test the Cloud Function):

```bash
curl -H "X-API-Key: npcal_your_key" \
  "https://us-central1-family-tree-crm-firebase.cloudfunctions.net/api/v1/convert/ad-to-bs?date=2026-02-28"
```

Should return:
```json
{
  "adDate": "2026-02-28",
  "bsYear": 2082,
  "bsMonth": 11,
  "bsDay": 16,
  "monthName": "Falgun",
  "monthNameNepali": "फाल्गुन",
  "dayOfWeek": "Saturday"
}
```

## Next Steps After Testing

Once everything is working locally:

1. **Deploy to production:**
   - School website: Run `npm run build` and deploy to Vercel/Firebase Hosting
   - Hamro Panchanga: Already deployed in Step 1
   - Update production `.env` with the API key

2. **Monitor rate limits:**
   - Check Firestore `apiKeys` collection for usage stats
   - Server-side caching (30 days for AD→BS, 1 hour for today) means API calls should be minimal

3. **Adjust cache TTLs** if needed:
   - Edit `src/app/api/nepali-date/[route].ts` files (look for `maxAge` in Cache-Control headers)
   - Edit `src/lib/nepali-calendar/api.ts` for client-side session cache

4. **Add more calendar data** (when needed):
   - If BS years beyond 2100 are needed, add docs to Firestore `nepaliCalendarYears` collection
   - School website automatically picks up new data

---

**Questions?** Check the conversation history for architecture details, or review the inline comments in:
- `src/lib/nepali-calendar/api.ts` (API service)
- `src/components/shared/NepaliDate.tsx` (display component)
- `src/components/admin/NepaliDatePicker.tsx` (form picker)
