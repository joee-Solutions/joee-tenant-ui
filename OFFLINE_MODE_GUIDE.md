# Offline Mode Guide

## How Offline Mode Works

### Overview
The offline mode automatically caches API responses when you're online, allowing you to access previously visited pages and data when you go offline.

### Do I Need to Load All Pages Before Going Offline?

**Short Answer: No! The app automatically pre-caches all important pages on first load.**

**How it works:**
1. **Automatic Pre-caching**: On your first dashboard load (while online), the app automatically:
   - ✅ Pre-caches all dashboard data
   - ✅ Pre-caches all organizations
   - ✅ Pre-caches all organization tab pages (departments, employees, patients, appointments, schedules) for every organization
   - ✅ Pre-caches notifications, login data, and system settings
   - ✅ Shows a progress indicator at the bottom right
   - ✅ Runs only once per session (saved in localStorage)

2. **Automatic Caching**: When you visit a page while online, all GET requests are automatically cached in IndexedDB
   - ✅ You'll see `[OFFLINE DEBUG] Cached GET response in normal flow: /endpoint` in console
   - ✅ Data is stored with 24-hour expiration

3. **Cache Duration**: Cached data expires after 24 hours

4. **Offline Access**: When you go offline, the app will:
   - ✅ Use cached data for GET requests (if available) - you'll see `[OFFLINE INFO] ✅ Cache HIT for /endpoint`
   - ✅ Queue write operations (POST, PUT, PATCH, DELETE) for sync when you come back online
   - ❌ Show an error if no cached data is available - you'll see `[OFFLINE WARN] Cache MISS for /endpoint`

**Important**: 
- ✅ **First load**: Pre-caching happens automatically - you'll see a progress indicator
- ✅ **Organization pages**: When you visit an organization, its tab pages are automatically cached in the background
- ✅ **Pages you visit while online**: Also cached automatically
- ❌ **Pages you never visited**: Won't work offline (no cache)

### What Gets Cached?

**Automatically Pre-cached on First Load:**
- ✅ **Dashboard data** (organizations, employees, patients, appointments)
- ✅ **All organizations** (list, details, multiple paginated pages, filtered by status)
- ✅ **All organization tab pages** for every organization:
  - Departments (with pagination)
  - Employees (multiple pages)
  - Patients (multiple pages + individual patient details)
  - Appointments (multiple pages)
  - Schedules (with pagination)
- ✅ **Notifications** (all, sent, received tabs, multiple pages)
- ✅ **Login data** (admin profile)
- ✅ **System settings**
- ✅ **Roles & permissions** (with pagination)
- ✅ **Training guides** (list, categories, individual guide details)
- ✅ **Super admins** (list with pagination)
- ✅ **All users/employees** (multiple pages)
- ✅ **Individual items** (patient details, training guide details extracted from lists)

**Cached When You Visit:**
- ✅ **Organization details** (when you visit an organization page - also triggers background pre-cache of all its tabs)
- ✅ **Any other GET API responses** you access while online

### What Happens When Offline?

#### Authentication (Login/Logout)
- ✅ **Logout**: Works offline - just clears cookies and redirects to login page
- ✅ **Offline Login**: Works offline if you've logged in online before - uses encrypted cached credentials
- ✅ **Online Login**: Requires internet connection - authenticates with server and saves credentials for offline use
- ✅ **Auto-login with existing token**: If you have a valid `auth_token` cookie, you'll be automatically redirected to dashboard (works offline)
- 💡 **Tip**: Login once while online to enable offline login capability

#### Reading Data (GET requests)
- ✅ **If cached**: Returns cached data immediately
- ❌ **If not cached**: Shows error "No cached data available and device is offline"

#### Writing Data (POST, PUT, PATCH, DELETE)
- ✅ **Always works**: Actions are queued and will sync automatically when you come back online
- 📋 **Queue**: You can see queued actions in the offline debug panel

### Login/Logout Offline

**Can I logout and login again without internet?**

- ✅ **Logout**: Yes, works offline - clears your session and redirects to login page
- ✅ **Offline Login**: Yes! If you've logged in online before, you can **logout and login again offline** using your saved credentials
- ✅ **Online Login**: Requires internet - authenticates with server and saves credentials for future offline login
- ✅ **Access with existing session**: Yes, if you have a valid token in cookies, you can access the app offline

**How it works:**
1. **First time (online)**: Login normally - your credentials are encrypted and saved locally
2. **Logout**: Clears session cookies but **keeps offline credentials** (allows future offline login)
3. **When offline**: 
   - ✅ You can logout (clears cookies, redirects to login)
   - ✅ You can login again using your previously saved credentials (encrypted, secure)
   - ✅ Credentials persist after logout (expire after 7 days automatically)
   - ✅ If you haven't logged in online before, you'll need internet for first-time login
   - ✅ If you have a valid token, you'll be auto-redirected to dashboard
4. **After going offline**: 
   - ✅ Logout works immediately
   - ❌ Login shows a message: "Login requires internet connection"
   - ✅ If you had a valid session before, you can still access the app

### Best Practices

1. **Stay Logged In Before Going Offline**
   - Make sure you're logged in and have a valid session before going offline
   - The app will automatically redirect you to dashboard if you have a valid token

2. **Visit Important Pages While Online**
   - Navigate to pages you'll need offline (dashboard, organizations, etc.)
   - This ensures data is cached

3. **Check Cache Status**
   - Use the Offline Debug Panel (bottom right in development mode)
   - See how many endpoints are cached
   - View pending sync actions

4. **Monitor Logs**
   - All offline operations are logged
   - Check browser console for `[OFFLINE INFO]`, `[OFFLINE WARN]`, `[OFFLINE ERROR]` messages
   - Export logs from the debug panel for troubleshooting

### Offline Debug Panel

In development mode, you'll see an "Offline Debug" button in the bottom right corner. Click it to see:

- **Connection Status**: Online/Offline
- **Cache Statistics**: 
  - Number of cached endpoints
  - Queued actions
  - Pending syncs
  - Failed actions
- **Recent Logs**: Last 20 operations with timestamps
- **Actions**:
  - Export logs as JSON
  - Clear logs

### Logging

All offline operations are logged with different levels:

- **INFO**: Normal operations (cache hits, syncs, etc.)
- **DEBUG**: Detailed information (request details, cache operations)
- **WARN**: Warnings (cache misses, retries)
- **ERROR**: Errors (failed requests, sync failures)

Logs are:
- Displayed in browser console with `[OFFLINE LEVEL]` prefix
- Stored in memory (last 100 entries)
- Persisted in localStorage (last 50 entries across page reloads)
- Exportable as JSON from debug panel

### Example Workflow

1. **While Online**:
   ```
   - Visit dashboard → Cached ✅
   - View organizations → Cached ✅
   - View employees → Cached ✅
   - Create notification → Queued for sync ✅
   ```

2. **Go Offline**:
   ```
   - Visit dashboard → Uses cache ✅
   - View organizations → Uses cache ✅
   - View employees → Uses cache ✅
   - Create notification → Queued ✅
   - Visit new page → Error (not cached) ❌
   ```

3. **Come Back Online**:
   ```
   - Queued actions sync automatically ✅
   - New requests fetch fresh data ✅
   - Cache updates with new data ✅
   ```

### Troubleshooting

**Problem**: "No cached data available" when offline
- **Solution**: Visit that page while online first to cache it

**Problem**: Actions not syncing when back online
- **Solution**: Check the debug panel for failed actions. They may need manual retry.

**Problem**: Cache seems outdated
- **Solution**: Cache expires after 24 hours. Visit pages again while online to refresh.

### Technical Details

- **Storage**: IndexedDB (via Dexie.js)
- **Cache Strategy**: Network-first with cache fallback
- **Sync Strategy**: Automatic when connection restored
- **Retry Logic**: 3 attempts before marking as failed

