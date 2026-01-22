# Offline Authentication - Complete Explanation

## Overview

The offline authentication system allows users to **login without internet** using encrypted credentials that were previously saved when they logged in online. This enables seamless access to the app even when offline.

---

## How It Works

### 1. **Online Login (First Time)**

When a user logs in **while online**, the system:

```
User enters email + password
    ↓
Server authenticates credentials
    ↓
Server returns:
  - Authentication token
  - User data (profile, permissions, etc.)
    ↓
System stores in cookies:
  - auth_token (for session)
  - user (user data)
    ↓
System ALSO stores encrypted credentials in IndexedDB:
  - Email (plain text, for lookup)
  - Password hash (SHA-256, one-way encryption)
  - Encrypted token (AES encryption)
  - Encrypted user data (AES encryption)
  - Expiration date (7 days from now)
```

**Code Flow** (`src/app/(auth)/auth/login/page.tsx`):
```typescript
// After successful online login
await offlineAuthService.storeCredentials(
  data.email,           // User's email
  data.password,        // User's password (will be hashed)
  authToken,            // Authentication token (will be encrypted)
  userData              // User profile data (will be encrypted)
);
```

### 2. **Offline Login (Subsequent Logins)**

When a user tries to login **while offline**, the system:

```
User enters email + password
    ↓
System checks IndexedDB for saved credentials
    ↓
If found:
  - Hash the entered password (SHA-256)
  - Compare with stored password hash
  - If match:
    - Decrypt stored token
    - Decrypt stored user data
    - Restore session (set cookies)
    - Login successful ✅
  - If no match:
    - Show error: "Invalid credentials"
    ↓
If not found:
  - Show error: "No offline credentials found. Please login online first."
```

**Code Flow** (`src/app/(auth)/auth/login/page.tsx`):
```typescript
// When offline, try offline login
const offlineResult = await offlineAuthService.verifyCredentialsOffline(
  data.email,
  data.password
);

if (offlineResult.success) {
  // Restore session from cached credentials
  Cookies.set("auth_token", offlineResult.token);
  Cookies.set("user", JSON.stringify(offlineResult.userData));
  setUser(offlineResult.userData);
  router.push("/dashboard");
}
```

### 3. **Logout Behavior**

When a user logs out:

```
User clicks logout
    ↓
System clears session cookies:
  - auth_token
  - refresh_token
  - user
  - mfa_token
    ↓
System KEEPS offline credentials in IndexedDB
  (This allows offline login after logout)
    ↓
Redirect to login page
```

**Important**: Credentials are **NOT cleared on logout** by default. This allows:
- ✅ Logout while offline
- ✅ Login again offline using saved credentials
- ✅ Credentials expire after 7 days automatically

**Code Flow** (`src/components/shared/SideNavigation.tsx`):
```typescript
// On logout - credentials are kept by default
// offlineAuthService.clearCredentials() is NOT called
// This allows future offline login
```

---

## Security Implementation

### Password Storage

**Hashing (One-Way Encryption)**:
```typescript
// Password is hashed using SHA-256
passwordHash = SHA256(password)

// Stored: passwordHash (cannot be reversed to get original password)
// When verifying: Hash entered password and compare hashes
```

**Why Hash?**
- ✅ Original password is never stored
- ✅ Even if database is compromised, passwords can't be recovered
- ✅ One-way function - cannot be reversed

### Token & User Data Storage

**Encryption (Two-Way Encryption)**:
```typescript
// Token and user data are encrypted using AES
encryptedToken = AES.encrypt(token, encryptionKey)
encryptedUserData = AES.encrypt(JSON.stringify(userData), encryptionKey)

// Stored: encryptedToken, encryptedUserData
// When needed: Decrypt to get original values
```

**Why Encrypt?**
- ✅ Tokens are sensitive - should not be readable if database is accessed
- ✅ User data may contain sensitive information
- ✅ Can be decrypted when needed (unlike hashing)

### Encryption Key

**Current Implementation**:
```typescript
const ENCRYPTION_KEY = 'joee-offline-auth-key';
```

**⚠️ Security Note**: In production, this should be:
- Generated per user or per installation
- Stored securely (not hardcoded)
- Rotated periodically

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ONLINE LOGIN                              │
└─────────────────────────────────────────────────────────────┘

User Input → Server Authentication
    ↓
Success Response:
  - Token
  - User Data
    ↓
┌─────────────────────────────────────────────────────────────┐
│              STORAGE LAYER                                  │
├─────────────────────────────────────────────────────────────┤
│ Cookies (Session):                                           │
│   - auth_token: "eyJhbGc..."                                │
│   - user: "{id: 1, email: '...', ...}"                      │
│                                                              │
│ IndexedDB (Offline Credentials):                            │
│   - email: "user@example.com"                               │
│   - passwordHash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
│   - token: "U2FsdGVkX1..." (encrypted)                      │
│   - userData: "U2FsdGVkX1..." (encrypted)                   │
│   - expiresAt: "2024-01-15T10:00:00Z"                       │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                    OFFLINE LOGIN                             │
└─────────────────────────────────────────────────────────────┘

User Input → Check IndexedDB
    ↓
Found? → Hash entered password
    ↓
Compare hashes → Match?
    ↓
Yes → Decrypt token & userData
    ↓
Restore Session:
  - Set cookies from decrypted data
  - Set user in state
  - Redirect to dashboard
    ↓
Login Successful ✅


┌─────────────────────────────────────────────────────────────┐
│                    LOGOUT                                    │
└─────────────────────────────────────────────────────────────┘

User clicks logout
    ↓
Clear Cookies:
  - auth_token ❌
  - user ❌
  - refresh_token ❌
    ↓
Keep IndexedDB:
  - Offline credentials ✅ (for future offline login)
    ↓
Redirect to login page
```

---

## Key Features

### 1. **Automatic Storage**
- Credentials are saved automatically on successful online login
- No user action required
- Transparent to the user

### 2. **Secure Storage**
- Passwords: Hashed (SHA-256) - cannot be recovered
- Tokens: Encrypted (AES) - can be decrypted when needed
- User Data: Encrypted (AES) - can be decrypted when needed

### 3. **Expiration**
- Credentials expire after **7 days**
- Automatic cleanup of expired credentials
- User must login online again after expiration

### 4. **Persistence After Logout**
- Credentials are **kept** after logout (default behavior)
- Allows logout and login again offline
- Can be manually cleared if needed

### 5. **Error Handling**
- Graceful handling of missing credentials
- Clear error messages for users
- Logging for debugging

---

## Code Structure

### Main Files

1. **`src/lib/offline/offlineAuth.ts`** - Core authentication service
   - `storeCredentials()` - Save credentials after online login
   - `verifyCredentialsOffline()` - Verify credentials when offline
   - `clearCredentials()` - Clear credentials (optional)
   - `hasOfflineCredentials()` - Check if credentials exist

2. **`src/app/(auth)/auth/login/page.tsx`** - Login page
   - Handles both online and offline login
   - Routes to appropriate authentication method
   - Shows appropriate error messages

3. **`src/components/shared/SideNavigation.tsx`** - Logout handler
   - Clears session cookies
   - Keeps offline credentials (default)

### Database Schema

**Table: `offlineCredentials`**
```typescript
{
  id: number (auto-increment)
  email: string (indexed, for lookup)
  passwordHash: string (SHA-256 hash)
  token: string (AES encrypted)
  userData: string (AES encrypted JSON)
  lastLogin: Date
  expiresAt: Date (indexed, for cleanup)
}
```

---

## User Experience

### Scenario 1: First Time User

1. **Online**: User logs in → Credentials saved automatically
2. **Offline**: User can login using same credentials ✅

### Scenario 2: Returning User (Within 7 Days)

1. **Online or Offline**: User can login using saved credentials ✅
2. **Logout**: Session cleared, credentials kept
3. **Offline**: User can login again using saved credentials ✅

### Scenario 3: After 7 Days

1. **Offline**: Credentials expired → Cannot login offline
2. **Online**: User must login online again → New credentials saved

### Scenario 4: Manual Clear

1. **Developer/Admin**: Can manually clear credentials if needed
2. **User**: Would need to login online again

---

## Security Considerations

### ✅ What's Secure

1. **Password Hashing**: Passwords are hashed, not stored in plain text
2. **Token Encryption**: Tokens are encrypted before storage
3. **User Data Encryption**: Sensitive user data is encrypted
4. **Expiration**: Credentials expire after 7 days
5. **Browser Storage**: IndexedDB is more secure than localStorage

### ⚠️ Security Improvements Needed

1. **Encryption Key**: Should be generated per user/installation, not hardcoded
2. **Key Rotation**: Encryption key should be rotated periodically
3. **Biometric Auth**: Could add biometric authentication for offline login
4. **Rate Limiting**: Should limit offline login attempts
5. **Audit Logging**: Log offline login attempts for security monitoring

---

## API Reference

### `offlineAuthService.storeCredentials(email, password, token, userData)`

**Purpose**: Store credentials for offline login

**Parameters**:
- `email: string` - User's email
- `password: string` - User's password (will be hashed)
- `token: string` - Authentication token (will be encrypted)
- `userData: any` - User profile data (will be encrypted)

**Returns**: `Promise<void>`

**Usage**:
```typescript
await offlineAuthService.storeCredentials(
  'user@example.com',
  'password123',
  'eyJhbGc...',
  { id: 1, name: 'John Doe', ... }
);
```

### `offlineAuthService.verifyCredentialsOffline(email, password)`

**Purpose**: Verify credentials when offline

**Parameters**:
- `email: string` - User's email
- `password: string` - User's password

**Returns**: `Promise<{ success: boolean, token?: string, userData?: any }>`

**Usage**:
```typescript
const result = await offlineAuthService.verifyCredentialsOffline(
  'user@example.com',
  'password123'
);

if (result.success) {
  // Use result.token and result.userData
}
```

### `offlineAuthService.clearCredentials(email?, keepForOffline?)`

**Purpose**: Clear stored credentials

**Parameters**:
- `email?: string` - Email to clear (optional, clears all if not provided)
- `keepForOffline: boolean = true` - If true, keeps credentials (default)

**Returns**: `Promise<void>`

**Usage**:
```typescript
// Clear specific user's credentials
await offlineAuthService.clearCredentials('user@example.com', false);

// Clear all credentials
await offlineAuthService.clearCredentials(undefined, false);
```

### `offlineAuthService.hasOfflineCredentials(email)`

**Purpose**: Check if offline credentials exist for an email

**Parameters**:
- `email: string` - User's email

**Returns**: `Promise<boolean>`

**Usage**:
```typescript
const hasCredentials = await offlineAuthService.hasOfflineCredentials('user@example.com');
```

---

## Troubleshooting

### Issue: "No offline credentials found"

**Cause**: User hasn't logged in online before, or credentials expired/cleared

**Solution**: User must login online first to save credentials

### Issue: "Invalid password" when offline

**Cause**: Password doesn't match stored hash

**Solution**: 
- Check if password is correct
- User may need to login online again to update credentials

### Issue: Credentials expired

**Cause**: 7 days have passed since last online login

**Solution**: User must login online again to refresh credentials

### Issue: Cannot login offline after logout

**Cause**: Credentials were manually cleared (shouldn't happen by default)

**Solution**: User must login online again

---

## Best Practices

1. **Always login online first** - This saves credentials for offline use
2. **Don't clear credentials unnecessarily** - They're needed for offline login
3. **Monitor expiration** - Credentials expire after 7 days
4. **Use secure encryption keys** - In production, generate unique keys
5. **Log authentication events** - For security auditing

---

## Summary

The offline authentication system provides:

✅ **Seamless offline login** - Login without internet using saved credentials  
✅ **Secure storage** - Passwords hashed, tokens encrypted  
✅ **Automatic management** - Credentials saved/verified automatically  
✅ **Persistence** - Credentials survive logout (for 7 days)  
✅ **Expiration** - Automatic cleanup after 7 days  

**Flow**:
1. Login online → Credentials saved
2. Go offline → Can login using saved credentials
3. Logout → Credentials kept (can login offline again)
4. After 7 days → Credentials expire (must login online again)

This enables a true offline-first experience where users can authenticate and access the app even without internet connectivity.

