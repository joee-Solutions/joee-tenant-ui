# Offline Login Troubleshooting Guide

## 🔍 Issue: "No offline credentials found" Error

If you're getting this error even after logging in online multiple times, follow these steps:

---

## 🧪 Diagnostic Steps

### Step 1: Check Browser Console

Open browser DevTools (F12) → Console tab and run:

```javascript
// Check credentials for your email
window.checkOfflineCredentials('your-email@example.com');
```

**What to look for**:
- ✅ Database open: `true`
- ✅ Credentials found: Should show your email
- ✅ Is expired: Should be `false`
- ❌ If credentials not found: Check "Available emails" to see what's stored

---

### Step 2: Check Database Directly

**In Browser Console**:
```javascript
// Check IndexedDB
const db = await new Dexie('JoeeTenantDB').open();
const credentials = await db.offlineCredentials.toArray();
console.log('All stored credentials:', credentials);
```

**What to check**:
- Are there any credentials stored?
- What emails are stored?
- Are they expired?

---

### Step 3: Check Storage During Login

**When logging in online**, check the console for:
- `[OFFLINE CREDENTIALS] Attempting to store credentials for: your-email@example.com`
- `[OFFLINE CREDENTIALS] ✅ Credentials stored and verified for: your-email@example.com`
- Any error messages

---

## 🐛 Common Issues & Solutions

### Issue 1: Database Not Opening

**Symptoms**:
- Console shows "Database not open"
- Errors about IndexedDB

**Solution**:
```javascript
// In browser console
const db = await new Dexie('JoeeTenantDB').open();
await db.safeOpen();
console.log('Database open:', db.isOpen());
```

**If still fails**:
- Check if IndexedDB is enabled in browser settings
- Try in incognito/private mode (IndexedDB might be disabled)
- Clear browser cache and try again

---

### Issue 2: Credentials Not Being Stored

**Symptoms**:
- Login succeeds but credentials not found offline
- Console shows storage errors

**Check**:
1. **During login**, check console for:
   - `[OFFLINE CREDENTIALS] Attempting to store credentials`
   - Any error messages

2. **After login**, verify:
   ```javascript
   window.checkOfflineCredentials('your-email@example.com');
   ```

**Possible Causes**:
- Database not open during storage
- Encryption failing
- IndexedDB quota exceeded
- Browser blocking IndexedDB

**Solution**:
- Check browser console for specific errors
- Try clearing IndexedDB and logging in again
- Check browser storage quota

---

### Issue 3: Encryption Key Mismatch

**Symptoms**:
- Credentials stored but can't decrypt
- Error: "Failed to decrypt credentials"

**Cause**:
- Encryption key changed (different hostname or email)
- Database corrupted

**Solution**:
1. Clear offline credentials:
   ```javascript
   const db = await new Dexie('JoeeTenantDB').open();
   await db.offlineCredentials.clear();
   ```
2. Login online again to store new credentials

---

### Issue 4: Credentials Expired

**Symptoms**:
- "Offline credentials expired" error

**Solution**:
- Login online again to refresh credentials
- Credentials expire after 7 days

---

## 🔧 Manual Fixes

### Clear and Re-store Credentials

```javascript
// In browser console after successful online login
const email = 'your-email@example.com';
const password = 'your-password'; // You'll need to enter this
const token = Cookies.get('auth_token');
const userData = JSON.parse(Cookies.get('user'));

// Manually store
await window.storeOfflineCredentials(email, password, token, userData);

// Verify
const verified = await offlineAuthService.hasOfflineCredentials(email);
console.log('Verified:', verified);
```

---

### Check Database Schema

```javascript
// In browser console
const db = await new Dexie('JoeeTenantDB').open();
console.log('Database version:', db.verno);
console.log('Tables:', db.tables.map(t => t.name));
console.log('offlineCredentials table exists:', !!db.offlineCredentials);
```

---

## 📋 Debugging Checklist

- [ ] **IndexedDB Available**: Check `!!window.indexedDB` in console
- [ ] **Database Open**: Check `db.isOpen()` returns `true`
- [ ] **Credentials Stored**: Run `window.checkOfflineCredentials('your-email')`
- [ ] **Not Expired**: Check `expiresAt` is in the future
- [ ] **Email Match**: Verify email matches exactly (case-sensitive)
- [ ] **Password Match**: Verify password is correct
- [ ] **Encryption Working**: Check for decryption errors in console
- [ ] **Browser Settings**: Check if IndexedDB is enabled
- [ ] **Storage Quota**: Check if storage quota is exceeded

---

## 🚨 Emergency Fix

If nothing works, try this complete reset:

```javascript
// In browser console
// 1. Clear all offline credentials
const db = await new Dexie('JoeeTenantDB').open();
await db.offlineCredentials.clear();
console.log('✅ Credentials cleared');

// 2. Clear pre-cache status (optional)
localStorage.removeItem('offline_precache_completed');

// 3. Login online again
// This will store fresh credentials

// 4. Verify after login
await new Promise(resolve => setTimeout(resolve, 1000));
window.checkOfflineCredentials('your-email@example.com');
```

---

## 📝 What to Report

If the issue persists, check console and report:

1. **Console Errors**: All `[OFFLINE CREDENTIALS]` messages
2. **Diagnostic Output**: Result of `window.checkOfflineCredentials()`
3. **Browser**: Chrome/Firefox/Safari version
4. **Storage**: IndexedDB available and enabled
5. **Login Flow**: What happens during online login

---

## ✅ Expected Behavior

**After Online Login**:
1. Console shows: `[OFFLINE CREDENTIALS] Attempting to store credentials`
2. Console shows: `✅ Offline credentials successfully stored and verified`
3. `window.checkOfflineCredentials()` returns credentials

**During Offline Login**:
1. Console shows: `[OFFLINE CREDENTIALS] Looking up credentials`
2. Console shows: `✅ Credentials found`
3. Console shows: `✅ Offline login successful`
4. Login succeeds

---

**Last Updated**: Current Date

