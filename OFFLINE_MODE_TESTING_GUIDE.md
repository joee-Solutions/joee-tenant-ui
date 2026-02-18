# Offline Mode - Testing Guide

## 🧪 Comprehensive Testing Guide

This guide will help you test all the offline mode enhancements we've implemented.

---

## Prerequisites

1. **Development Environment**
   - Run `npm run dev` to start the development server
   - Open browser DevTools (F12)
   - Go to Application tab → IndexedDB → JoeeTenantDB

2. **Test User**
   - Have a test account ready
   - Login credentials that you can use offline

---

## Test 1: Cache Expiration (1 Month) ✅

### Steps:
1. **Login while online**
   - Login to the application
   - Navigate to dashboard
   - Wait for pre-cache to complete

2. **Check Cache Expiration**
   - Open DevTools → Application → IndexedDB → JoeeTenantDB → apiCache
   - Click on any cached entry
   - Check the `expiresAt` field
   - **Expected**: Should be approximately 1 month (30 days) from `timestamp`

3. **Verify Calculation**
   - Note the `timestamp` value
   - Note the `expiresAt` value
   - Calculate difference: should be ~30 days
   - **Expected**: `expiresAt` = `timestamp` + 30 days

### ✅ Success Criteria:
- [ ] Cache entries have `expiresAt` set to 1 month from `timestamp`
- [ ] All new cache entries use 1-month expiration
- [ ] Old cache entries (if any) keep their original expiration

---

## Test 2: Automatic Cache Cleanup ✅

### Steps:
1. **Create Expired Cache Entry** (for testing)
   - Open DevTools Console
   - Run this code to manually create an expired entry:
   ```javascript
   // In browser console
   const db = await new Dexie('JoeeTenantDB').open();
   await db.apiCache.add({
     endpoint: '/test/expired',
     data: { test: 'expired data' },
     timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
     expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (expired)
   });
   console.log('Created expired cache entry');
   ```

2. **Trigger Cleanup**
   - Wait for the next cleanup cycle (runs every hour)
   - OR manually trigger cleanup by refreshing the page
   - OR run in console:
   ```javascript
   // Import and trigger cleanup
   const { offlineService } = await import('/src/lib/offline/offlineService.ts');
   await offlineService.cleanupExpiredCache();
   ```

3. **Verify Cleanup**
   - Check IndexedDB → apiCache table
   - **Expected**: Expired entry should be removed
   - Check console for cleanup log message

### ✅ Success Criteria:
- [ ] Expired cache entries are automatically removed
- [ ] Cleanup runs on service initialization
- [ ] Cleanup runs periodically (every hour)
- [ ] Console shows cleanup log messages

---

## Test 3: Enhanced Offline Indicator ✅

### Steps:

#### 3.1 Test Status Messages

1. **Offline Status**
   - Go offline (DevTools → Network → Offline)
   - **Expected**: Indicator shows "You're Offline" with yellow background
   - **Expected**: Description: "Working in offline mode. Your changes will sync when you reconnect."

2. **Syncing Status**
   - Go online
   - Create/update something while offline (to queue actions)
   - Go back online
   - **Expected**: Indicator shows "Syncing Changes" with blue background
   - **Expected**: Description: "Saving your changes in the background..."
   - **Expected**: Spinning refresh icon

3. **Pending Status**
   - Create/update something while offline
   - Stay offline
   - **Expected**: Indicator shows "Changes Pending" with blue background
   - **Expected**: Description shows count: "X changes waiting to sync. Click to sync now."
   - **Expected**: "Sync" button visible

4. **Failed Status**
   - Create actions while offline
   - Go online but disconnect server (or cause sync failure)
   - **Expected**: Indicator shows "Sync Failed" with red background
   - **Expected**: Description: "X changes failed to sync. Please try again."
   - **Expected**: Alert icon

5. **Synced Status**
   - After successful sync
   - **Expected**: Indicator shows "All Synced" with green background
   - **Expected**: Description: "Just now" or "X minutes ago"
   - **Expected**: Check circle icon

#### 3.2 Test Minimize Functionality

1. **Minimize Indicator**
   - Click the minimize button (chevron down icon)
   - **Expected**: Indicator collapses to small circular button
   - **Expected**: Shows appropriate status icon
   - **Expected**: Sync continues in background

2. **Expand Indicator**
   - Click the minimized button
   - **Expected**: Indicator expands to full view
   - **Expected**: Shows all status information

3. **Background Sync While Minimized**
   - Minimize indicator
   - Create changes while offline
   - Go online
   - **Expected**: Sync happens in background
   - **Expected**: Minimized button shows syncing icon (spinning)
   - **Expected**: Can expand to see full status

#### 3.3 Test Auto-Hide

1. **Online with No Pending Actions**
   - Be online
   - Have no pending sync actions
   - **Expected**: Indicator is hidden (not visible)

2. **Online with Pending Actions**
   - Be online
   - Have pending sync actions
   - **Expected**: Indicator is visible
   - **Expected**: Shows pending count and sync button

### ✅ Success Criteria:
- [ ] All status messages are accurate and context-aware
- [ ] Minimize/expand functionality works correctly
- [ ] Sync continues when minimized
- [ ] Indicator auto-hides when appropriate
- [ ] Visual indicators (icons, colors) are correct

---

## Test 4: Comprehensive Pre-caching ✅

### Steps:

1. **Clear Existing Cache**
   - Open DevTools Console
   - Run:
   ```javascript
   // Clear pre-cache status
   localStorage.removeItem('offline_precache_completed');
   localStorage.removeItem('offline_precache_timestamp');
   // Clear IndexedDB cache (optional, for clean test)
   const db = await new Dexie('JoeeTenantDB').open();
   await db.apiCache.clear();
   ```

2. **Trigger Pre-cache**
   - Refresh the page
   - Login if needed
   - **Expected**: Pre-cache progress indicator appears
   - **Expected**: Shows progress: "X / Y endpoints"

3. **Monitor Pre-cache Progress**
   - Watch the progress indicator
   - Check console for pre-cache logs
   - **Expected**: Logs show:
     - "Step 1: Pre-caching base endpoints"
     - "Step 2: Fetching all organizations (all pages)"
     - "Step 3: Pre-caching ALL organization tab pages"
   - **Expected**: Progress updates in real-time

4. **Verify All Organizations Fetched**
   - Check console logs
   - **Expected**: Log shows "Found X organizations across Y pages"
   - **Expected**: Y should be > 1 if you have multiple pages of organizations

5. **Verify All Tenant Pages Cached**
   - After pre-cache completes
   - Check IndexedDB → apiCache
   - **Expected**: Should see endpoints for ALL organizations
   - **Expected**: Should see multiple pages for each organization's tabs
   - **Expected**: Should see up to 10 pages for patients

6. **Verify Pagination**
   - Check cached endpoints
   - **Expected**: Should see paginated endpoints like:
     - `/super/tenants/all?page=1&limit=10`
     - `/super/tenants/all?page=2&limit=10`
     - `/super/tenants/1/patients?page=1&limit=10`
     - `/super/tenants/1/patients?page=2&limit=10`
     - etc.

7. **Test Offline Access**
   - Go offline (DevTools → Network → Offline)
   - Navigate to different pages
   - **Expected**: All pre-cached pages should load from cache
   - **Expected**: No "No cached data available" errors for pre-cached pages

### ✅ Success Criteria:
- [ ] Pre-cache fetches ALL organization pages (not just first page)
- [ ] Pre-cache caches ALL tenant tab pages for ALL organizations
- [ ] Pagination is generated automatically (up to 5-10 pages)
- [ ] All pre-cached pages work offline
- [ ] Progress indicator shows accurate progress
- [ ] Pre-cache completes successfully

---

## Test 5: End-to-End Offline Workflow ✅

### Steps:

1. **Initial Setup**
   - Login while online
   - Wait for pre-cache to complete
   - Verify you can access dashboard, organizations, etc.

2. **Go Offline**
   - DevTools → Network → Offline
   - **Expected**: Offline indicator appears
   - **Expected**: Shows "You're Offline" message

3. **Read Operations (Offline)**
   - Navigate to dashboard
   - **Expected**: Loads from cache
   - Navigate to organizations
   - **Expected**: Loads from cache
   - Navigate to a tenant's patients
   - **Expected**: Loads from cache
   - Navigate to a tenant's employees
   - **Expected**: Loads from cache

4. **Write Operations (Offline)**
   - Create a new patient (or any entity)
   - **Expected**: Shows success message
   - **Expected**: Appears in UI immediately (optimistic update)
   - **Expected**: Offline indicator shows "Changes Pending"
   - Update an existing patient
   - **Expected**: Changes appear immediately
   - **Expected**: Pending count increases
   - Delete a patient
   - **Expected**: Removed from UI immediately
   - **Expected**: Pending count increases

5. **Minimize Indicator**
   - Click minimize button
   - **Expected**: Indicator minimizes to small button
   - **Expected**: Sync status icon still visible
   - Continue working
   - **Expected**: Can still create/update/delete

6. **Go Online and Sync**
   - Go online (DevTools → Network → Online)
   - **Expected**: Indicator shows "Syncing Changes"
   - **Expected**: Spinning icon
   - Wait for sync to complete
   - **Expected**: Indicator shows "All Synced"
   - **Expected**: Shows "Just now" or timestamp
   - **Expected**: All changes are synced to server

7. **Verify Sync Success**
   - Refresh page
   - **Expected**: All changes persist
   - **Expected**: Data matches what was created offline

### ✅ Success Criteria:
- [ ] Can read all pre-cached pages offline
- [ ] Can create/update/delete offline
- [ ] Optimistic updates work correctly
- [ ] Changes sync when back online
- [ ] All synced changes persist
- [ ] Indicator shows correct status throughout

---

## Test 6: Performance Testing ✅

### Steps:

1. **Pre-cache Performance**
   - Clear cache and pre-cache status
   - Start pre-cache
   - Monitor:
     - Time to complete
     - Number of requests made
     - Server response times
   - **Expected**: Pre-cache completes without overwhelming server
   - **Expected**: Request throttling works (max 5 concurrent)

2. **Storage Usage**
   - After pre-cache completes
   - Check IndexedDB storage
   - DevTools → Application → Storage
   - **Expected**: Storage usage is reasonable
   - **Expected**: No quota errors

3. **Cache Lookup Performance**
   - Go offline
   - Navigate between pages quickly
   - **Expected**: Pages load instantly from cache
   - **Expected**: No noticeable delay

### ✅ Success Criteria:
- [ ] Pre-cache doesn't overwhelm server
- [ ] Request throttling works (5 concurrent max)
- [ ] Storage usage is manageable
- [ ] Cache lookups are fast

---

## Test 7: Error Handling ✅

### Steps:

1. **Cache Miss**
   - Go offline
   - Navigate to a page that wasn't pre-cached
   - **Expected**: Shows error message
   - **Expected**: Error is user-friendly

2. **Sync Failure**
   - Create changes while offline
   - Go online but simulate server error
   - **Expected**: Failed actions are tracked
   - **Expected**: Indicator shows "Sync Failed"
   - **Expected**: Can retry sync

3. **Storage Quota**
   - Fill up storage (if possible)
   - Try to cache more data
   - **Expected**: Graceful error handling
   - **Expected**: User-friendly error message

### ✅ Success Criteria:
- [ ] Cache misses show helpful errors
- [ ] Sync failures are handled gracefully
- [ ] Failed actions can be retried
- [ ] Storage errors are handled

---

## Quick Test Checklist

Use this quick checklist for rapid testing:

- [ ] **Cache Expiration**: New entries expire in 1 month
- [ ] **Cache Cleanup**: Expired entries are removed automatically
- [ ] **Offline Indicator**: Shows correct status messages
- [ ] **Minimize**: Can minimize/expand indicator
- [ ] **Background Sync**: Sync continues when minimized
- [ ] **Pre-cache**: Fetches all organization pages
- [ ] **Pre-cache**: Caches all tenant pages for all organizations
- [ ] **Pagination**: Generates paginated endpoints automatically
- [ ] **Offline Read**: Can read pre-cached pages offline
- [ ] **Offline Write**: Can create/update/delete offline
- [ ] **Sync**: Changes sync when back online
- [ ] **Performance**: Pre-cache doesn't overwhelm server
- [ ] **Error Handling**: Errors are handled gracefully

---

## Browser Console Commands

Use these commands in the browser console for quick testing:

```javascript
// Check cache entries
const db = await new Dexie('JoeeTenantDB').open();
const cacheCount = await db.apiCache.count();
console.log(`Cached endpoints: ${cacheCount}`);

// Check cache expiration
const entries = await db.apiCache.toArray();
entries.forEach(entry => {
  const expiresIn = new Date(entry.expiresAt) - new Date();
  const days = Math.floor(expiresIn / (1000 * 60 * 60 * 24));
  console.log(`${entry.endpoint}: expires in ${days} days`);
});

// Check sync queue
const queueCount = await db.syncQueue.count();
console.log(`Queued actions: ${queueCount}`);

// Check pending actions
const pending = await db.syncQueue.where('status').equals('pending').count();
console.log(`Pending: ${pending}`);

// Manually trigger cleanup
const { offlineService } = await import('/src/lib/offline/offlineService.ts');
await offlineService.cleanupExpiredCache();

// Check pre-cache status
const preCacheCompleted = localStorage.getItem('offline_precache_completed');
console.log(`Pre-cache completed: ${preCacheCompleted}`);

// Reset pre-cache (for testing)
localStorage.removeItem('offline_precache_completed');
localStorage.removeItem('offline_precache_timestamp');
console.log('Pre-cache status reset');
```

---

## Expected Results Summary

| Test | Expected Result |
|------|----------------|
| Cache Expiration | 1 month (30 days) |
| Cache Cleanup | Automatic, every hour |
| Offline Indicator | Context-aware messages, minimize works |
| Pre-cache | All pages cached automatically |
| Organization Fetching | All pages fetched |
| Tenant Pages | All organizations, all tabs, all pages |
| Offline Read | All pre-cached pages work |
| Offline Write | Create/update/delete works, syncs on reconnect |
| Performance | No server overload, fast cache lookups |

---

## Troubleshooting

### Issue: Pre-cache not starting
**Solution**: Clear localStorage and refresh:
```javascript
localStorage.removeItem('offline_precache_completed');
location.reload();
```

### Issue: Cache not working offline
**Solution**: Check if pre-cache completed and verify cache entries exist in IndexedDB

### Issue: Sync not working
**Solution**: Check sync queue in IndexedDB and verify online status

### Issue: Indicator not showing
**Solution**: Check if you're online with no pending actions (it auto-hides)

---

**Happy Testing!** 🚀



