# Offline Mode - Quick Test Checklist

## 🚀 Quick Start Testing (15 minutes)

### Step 1: Setup (2 minutes)
1. Start dev server: `npm run dev`
2. Open browser: http://localhost:3600
3. Open DevTools (F12) → Application tab → IndexedDB
4. Login to the application

---

### Step 2: Test Cache Expiration (2 minutes)

**In Browser Console:**
```javascript
// Check cache expiration
const db = await new Dexie('JoeeTenantDB').open();
const entries = await db.apiCache.toArray();
entries.slice(0, 5).forEach(entry => {
  const days = Math.floor((new Date(entry.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
  console.log(`${entry.endpoint}: ${days} days`);
});
```

**✅ Expected**: All entries show ~30 days expiration

---

### Step 3: Test Offline Indicator (3 minutes)

1. **Go Offline**: DevTools → Network → Offline
   - **✅ Expected**: Yellow indicator appears: "You're Offline"

2. **Minimize**: Click minimize button (chevron down)
   - **✅ Expected**: Indicator becomes small circular button

3. **Expand**: Click the minimized button
   - **✅ Expected**: Indicator expands to full view

4. **Go Online**: DevTools → Network → Online
   - **✅ Expected**: Indicator shows "All Synced" or hides if no pending actions

---

### Step 4: Test Pre-caching (5 minutes)

**Clear and Reset:**
```javascript
// In console
localStorage.removeItem('offline_precache_completed');
localStorage.removeItem('offline_precache_timestamp');
location.reload();
```

**Watch for:**
1. Pre-cache progress indicator appears
2. Console shows pre-cache logs
3. Progress updates

**After completion, check:**
```javascript
// In console
const db = await new Dexie('JoeeTenantDB').open();
const count = await db.apiCache.count();
console.log(`Cached endpoints: ${count}`);

// Check organization pages
const orgPages = await db.apiCache.where('endpoint').startsWith('/super/tenants/all?page=').count();
console.log(`Organization pages: ${orgPages}`);
```

**✅ Expected**: 
- Multiple cached endpoints (100+)
- Multiple organization pages cached

---

### Step 5: Test Offline Functionality (3 minutes)

1. **Go Offline**: DevTools → Network → Offline
2. **Navigate**: 
   - Dashboard → **✅ Should load from cache**
   - Organizations → **✅ Should load from cache**
   - A tenant's patients → **✅ Should load from cache**
3. **Create Something**: Create a new patient (or any entity)
   - **✅ Expected**: Success message, appears in UI
   - **✅ Expected**: Indicator shows "Changes Pending"
4. **Go Online**: DevTools → Network → Online
   - **✅ Expected**: Indicator shows "Syncing Changes"
   - **✅ Expected**: Then shows "All Synced"

---

## ✅ Quick Verification Checklist

- [ ] Cache entries expire in ~30 days (1 month)
- [ ] Offline indicator shows correct messages
- [ ] Minimize/expand works
- [ ] Pre-cache fetches multiple organization pages
- [ ] Pre-cache caches all tenant pages
- [ ] Can read cached pages offline
- [ ] Can create/update offline
- [ ] Changes sync when back online

---

## 🐛 Quick Troubleshooting

**Pre-cache not starting?**
```javascript
localStorage.removeItem('offline_precache_completed');
location.reload();
```

**Cache not working?**
- Check IndexedDB → apiCache table has entries
- Verify pre-cache completed

**Sync not working?**
- Check IndexedDB → syncQueue table
- Verify online status

---

**That's it!** If all checks pass, offline mode is working correctly. 🎉



