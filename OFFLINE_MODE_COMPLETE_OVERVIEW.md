# Offline Mode - Complete System Overview

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Data Flow](#data-flow)
4. [Key Features](#key-features)
5. [File Structure](#file-structure)
6. [Integration Points](#integration-points)
7. [Configuration](#configuration)
8. [Security](#security)
9. [Performance](#performance)
10. [User Experience](#user-experience)

---

## 🏗️ Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  (React Components, Pages, Hooks)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              HTTP Request Interceptor                        │
│              (src/framework/https.ts)                        │
│  • Checks online/offline status                             │
│  • Routes requests to offline service                       │
│  • Caches GET responses automatically                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐          ┌────────▼────────┐
│  Online Mode   │          │  Offline Mode   │
│                │          │                 │
│ • Direct API  │          │ • Cache lookup  │
│ • Cache GET   │          │ • Queue writes │
│ • Real-time   │          │ • Use cached   │
└───────────────┘          └─────────────────┘
        │                             │
        └──────────────┬──────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Offline Service Layer                           │
│  • offlineService.ts - Request handling                     │
│  • preCacheService.ts - Automatic pre-caching               │
│  • offlineAuth.ts - Offline authentication                  │
│  • offlineLogger.ts - Logging system                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Data Storage Layer (IndexedDB)                  │
│  • apiCache - Cached API responses (1 month expiration)      │
│  • syncQueue - Queued write operations                      │
│  • offlineCredentials - Encrypted login credentials         │
│  • Entity tables (organizations, employees, etc.)            │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 Core Components

### 1. **Database Layer** (`src/lib/offline/database.ts`)

**Technology**: Dexie.js (IndexedDB wrapper)

**Tables**:
- `apiCache`: Cached API responses with 1-month expiration
- `syncQueue`: Queued write operations (POST/PUT/PATCH/DELETE)
- `offlineCredentials`: Encrypted login credentials (per-user encryption)
- `organizations`: Cached organization data
- `employees`: Cached employee data
- `patients`: Cached patient data
- `appointments`: Cached appointment data
- `schedules`: Cached schedule data
- `departments`: Cached department data
- `notifications`: Cached notification data

**Key Features**:
- Automatic schema versioning
- Indexed queries for fast lookups
- Expiration support for cached data
- Sync status tracking

---

### 2. **Offline Service** (`src/lib/offline/offlineService.ts`)

**Purpose**: Central service that intercepts and handles all API requests

**Key Methods**:

#### `makeRequest(method, endpoint, data)`
- Checks online/offline status
- **If offline**:
  - GET: Returns cached data (or error if not cached)
  - POST/PUT/PATCH/DELETE: Queues for sync + applies optimistic update
- **If online**:
  - Makes actual API call
  - Caches GET responses automatically
  - Returns response

#### `cacheResponse(endpoint, data)`
- Stores in IndexedDB with **1-month expiration**
- Handles different response structures
- Logs cache operations

#### `getCachedResponse(endpoint)`
- Tries exact endpoint match first
- Falls back to base endpoint match (handles query params)
- Returns most recent valid cache
- Logs cache hits/misses

#### `queueAction(method, endpoint, data)`
- Stores in syncQueue for later sync
- Extracts entity type from endpoint
- Tracks retry count and status

#### `syncPendingActions()`
- Processes all queued operations when online
- Retries failed operations (up to 3 times)
- Updates sync status
- Handles errors gracefully

#### `applyOptimisticUpdate(method, endpoint, data)`
- Updates cache immediately for offline writes
- Handles CREATE, UPDATE, DELETE operations
- Updates both list and detail caches
- Returns optimistic response

#### `cleanupExpiredCache()`
- Removes expired cache entries
- Runs automatically on initialization
- Runs periodically every hour
- Prevents storage bloat

**Features**:
- Automatic online/offline detection
- Smart cache lookup (handles query parameters)
- Background sync when connection restored
- Error handling and retry logic
- Optimistic UI updates
- SWR cache integration

---

### 3. **Pre-cache Service** (`src/lib/offline/preCacheService.ts`)

**Purpose**: Automatically caches all important pages on first load

**What Gets Pre-cached**:

1. **Base Endpoints** (Step 1):
   - Dashboard data (dashboard, appointments, patients, users)
   - All organizations (with pagination - up to 5 pages)
   - Notifications (all tabs, multiple pages)
   - Admin profile
   - System settings
   - Roles & permissions (with pagination)
   - Training guides (with pagination)
   - Super admins (with pagination)

2. **All Organizations** (Step 2):
   - Fetches ALL pages of organizations (not just first page)
   - Handles pagination automatically
   - Processes all organizations found

3. **Organization Tab Pages** (Step 3):
   - For EACH organization, caches:
     - Organization details
     - Departments (up to 5 pages)
     - Employees (up to 5 pages)
     - Patients (up to 10 pages - more numerous)
     - Appointments (up to 5 pages)
     - Schedules (up to 5 pages)

4. **Individual Items** (Step 4):
   - Patient details (from patient lists)
   - Training guide details (from guide lists)
   - Employee details (where available)

5. **Additional Pagination** (Step 5):
   - Extra pages for high-traffic endpoints

**Features**:
- Runs automatically on first dashboard load
- Progress tracking with visual indicator
- One-time execution (saved in localStorage)
- Request throttling (max 5 concurrent requests)
- Handles errors gracefully
- Can be manually triggered from debug panel

**Request Throttling**:
- Maximum 5 concurrent requests
- 100ms delay between requests
- Prevents server overload

---

### 4. **Offline Authentication** (`src/lib/offline/offlineAuth.ts`)

**Purpose**: Enable login without internet using cached credentials

**Security Features**:
- **Per-user encryption keys**: Each user has unique encryption key
- **Password hashing**: SHA-256 (one-way, not reversible)
- **Token encryption**: AES encryption with per-user key
- **User data encryption**: Encrypted before storage
- **7-day expiration**: Credentials expire after 7 days
- **Credentials persist after logout**: Allows offline login after logout

**Key Methods**:

#### `storeCredentials(email, password, token, userData)`
- Hashes password (SHA-256)
- Encrypts token and user data with per-user key
- Stores in IndexedDB
- Sets 7-day expiration

#### `verifyCredentialsOffline(email, password)`
- Looks up credentials by email
- Checks expiration
- Verifies password hash
- Decrypts token and user data
- Returns success with decrypted data

#### `clearCredentials(email?, keepForOffline?)`
- Clears credentials (optional)
- Default: keeps credentials for offline login
- Can clear specific user or all users

**Flow**:
1. **Online Login**: Server authenticates → Credentials encrypted and stored
2. **Offline Login**: Verify against cached credentials → Restore session
3. **Logout**: Clears session but keeps credentials (default)

---

### 5. **HTTP Request Interceptor** (`src/framework/https.ts`)

**Purpose**: Intercepts all API calls and routes them appropriately

**Integration**:

```typescript
processRequestAuth(method, path, data)
  ├─ Check offlineService.getOnlineStatus()
  ├─ If offline:
  │   └─ Delegate to offlineService.makeRequest()
  └─ If online:
      ├─ Make normal API call
      ├─ Cache GET responses automatically
      ├─ Cache individual items from lists
      └─ Return response
```

**Key Features**:
- Automatic offline detection
- Automatic GET response caching
- Incremental cache building
- Transparent to components

---

### 6. **React Hooks** (`src/hooks/useOffline.ts`)

**Hooks Provided**:

#### `useOffline()`
Returns:
- `isOnline`: boolean
- `syncStatus`: { pending: number, syncing: number, failed: number }
- `syncPendingActions`: () => Promise<void>

Features:
- Monitors online/offline status
- Updates sync status every 5 seconds
- Auto-syncs when connection restored

#### `useCachedData<T>(endpoint, fetcher)`
Returns:
- `data`: T | null
- `isLoading`: boolean
- `isOffline`: boolean

Behavior:
- Tries online fetch first
- Falls back to cache if offline or fetch fails
- Handles different response structures

---

### 7. **UI Components**

#### **OfflineIndicator** (`src/components/shared/OfflineIndicator.tsx`)

**Features**:
- Context-aware status messages
- Minimize/expand functionality
- Visual status icons
- Last sync time display
- Color-coded states

**Status Messages**:
- **Offline**: "You're Offline - Working in offline mode..."
- **Syncing**: "Syncing Changes - Saving in background..."
- **Pending**: "Changes Pending - X changes waiting to sync..."
- **Failed**: "Sync Failed - X changes failed to sync..."
- **Synced**: "All Synced - Just now" or "X minutes ago"

**Minimize Behavior**:
- Can minimize to small circular button
- Sync continues in background
- Shows appropriate status icon
- Click to expand again

#### **OfflineDebugPanel** (`src/components/shared/OfflineDebugPanel.tsx`)

**Features** (Development only):
- Cache statistics
- Sync queue status
- Pre-cache status
- Recent logs viewer
- Manual pre-cache trigger
- Export logs
- Clear logs

#### **PreCacheProgressModal** (`src/components/shared/PreCacheProgressModal.tsx`)

**Features**:
- Progress indicator during pre-cache
- Shows current/total endpoints
- Can be minimized
- User-friendly modal

---

### 8. **Logging System** (`src/lib/offline/offlineLogger.ts`)

**Features**:
- Multiple log levels: info, warn, error, debug
- Console logging (development only)
- In-memory storage (last 100 entries)
- localStorage persistence (last 50 entries)
- Exportable logs
- Production-safe (no console logging in production)

**Log Levels**:
- **INFO**: Normal operations (cache hits, syncs, etc.)
- **DEBUG**: Detailed information (request details, cache operations)
- **WARN**: Warnings (cache misses, retries)
- **ERROR**: Errors (failed requests, sync failures)

---

## 🔄 Data Flow

### Online Flow

```
User Action → API Request
    ↓
HTTP Interceptor checks status
    ↓
Online → Make API call
    ↓
If GET → Cache response in IndexedDB (1 month expiration)
    ↓
Return response to component
```

### Offline Flow

```
User Action → API Request
    ↓
HTTP Interceptor checks status
    ↓
Offline → Route to Offline Service
    ↓
If GET:
    ├─ Look up in cache
    ├─ If found → Return cached data ✅
    └─ If not found → Show error ❌
    ↓
If POST/PUT/PATCH/DELETE:
    ├─ Queue operation in syncQueue
    ├─ Apply optimistic update to cache
    ├─ Update SWR cache
    ├─ Show success message
    └─ Return optimistic response
```

### Pre-caching Flow

```
Dashboard Loads (First Time)
    ↓
Check if pre-cache completed
    ↓
If not → Start pre-caching
    ↓
Step 1: Cache base endpoints
    ├─ Dashboard data
    ├─ Organizations (with pagination)
    ├─ Notifications (all tabs)
    ├─ Settings, roles, permissions
    └─ Training guides
    ↓
Step 2: Fetch ALL organization pages
    ├─ Fetch page 1, 2, 3, ... (up to 20 pages)
    └─ Extract all organization IDs
    ↓
Step 3: For EACH organization:
    ├─ Cache organization details
    ├─ Cache departments (with pagination)
    ├─ Cache employees (with pagination)
    ├─ Cache patients (with pagination - 10 pages)
    ├─ Cache appointments (with pagination)
    └─ Cache schedules (with pagination)
    ↓
Step 4: Cache individual items from lists
    ├─ Patient details
    ├─ Training guide details
    └─ Employee details (where available)
    ↓
Step 5: Cache additional paginated results
    ↓
Mark pre-cache as completed
    ↓
Save to localStorage
```

### Sync Flow

```
Connection Restored
    ↓
Offline Service detects online status
    ↓
Start sync process
    ↓
For each queued operation:
    ├─ Update status to 'syncing'
    ├─ Try to execute
    ├─ If success → Mark completed ✅
    └─ If fail → Increment retry, mark failed (after 3 retries) ❌
    ↓
Update sync status
    ↓
Show sync results in indicator
```

---

## ✨ Key Features

### 1. **Automatic Data Caching**
- ✅ All GET requests cached when online
- ✅ 1-month expiration for all cached data
- ✅ Automatic cleanup of expired entries
- ✅ Smart cache lookup (handles query parameters)

### 2. **Comprehensive Pre-caching**
- ✅ Automatically caches all important pages on first load
- ✅ Fetches ALL organization pages (not just first page)
- ✅ Caches all tenant tab pages for ALL organizations
- ✅ Automatic pagination generation
- ✅ Progress tracking with visual indicator

### 3. **Offline Write Operations**
- ✅ POST/PUT/PATCH/DELETE operations queued when offline
- ✅ Optimistic UI updates (immediate feedback)
- ✅ Automatic sync when connection restored
- ✅ Retry logic (up to 3 attempts)
- ✅ Error tracking and logging

### 4. **Offline Authentication**
- ✅ Login using encrypted cached credentials
- ✅ Per-user encryption keys (secure)
- ✅ 7-day credential expiration
- ✅ Credentials persist after logout (allows offline login)

### 5. **Background Sync**
- ✅ Automatically syncs when connection restored
- ✅ Monitors online/offline status
- ✅ Shows sync progress
- ✅ Handles conflicts and errors

### 6. **Smart Cache Lookup**
- ✅ Exact endpoint match first
- ✅ Falls back to base endpoint match (handles query params)
- ✅ Returns most recent valid cache entry
- ✅ Handles different API response structures

### 7. **Visual Feedback**
- ✅ Offline indicator (always visible when needed)
- ✅ Progress indicator (during pre-cache)
- ✅ Debug panel (development mode)
- ✅ Context-aware status messages

### 8. **Request Throttling**
- ✅ Maximum 5 concurrent requests during pre-cache
- ✅ 100ms delay between requests
- ✅ Prevents server overload

---

## 📁 File Structure

```
src/lib/offline/
├── database.ts              # IndexedDB schema and setup
├── offlineService.ts        # Core offline service (request handling)
├── preCacheService.ts       # Automatic pre-caching
├── offlineAuth.ts           # Offline authentication
└── offlineLogger.ts         # Logging system

src/hooks/
└── useOffline.ts            # React hooks for offline functionality

src/components/shared/
├── OfflineIndicator.tsx     # Visual offline status (with minimize)
├── OfflineDebugPanel.tsx    # Debug panel (dev mode only)
└── PreCacheProgressModal.tsx # Pre-cache progress modal

src/framework/
└── https.ts                # HTTP interceptor integration

src/app/(dashboard)/
└── layout.tsx              # Dashboard layout (triggers pre-cache)

Documentation:
├── OFFLINE_MODE_APPROACH.md           # Initial approach
├── OFFLINE_MODE_GUIDE.md               # User guide
├── OFFLINE_MODE_IMPLEMENTATION.md      # Implementation details
├── OFFLINE_AUTH_EXPLANATION.md         # Auth explanation
├── OFFLINE_MODE_PRODUCTION_REVIEW.md   # Production review
├── OFFLINE_MODE_PRODUCTION_FIXES.md    # Production fixes
├── OFFLINE_MODE_ENHANCEMENTS.md        # Recent enhancements
├── OFFLINE_MODE_TESTING_GUIDE.md       # Testing guide
└── OFFLINE_MODE_COMPLETE_OVERVIEW.md   # This document
```

---

## 🔗 Integration Points

### 1. **HTTP Interceptor** (`https.ts`)
- Intercepts all API calls
- Routes to offline service when offline
- Caches GET responses automatically

### 2. **Dashboard Layout** (`layout.tsx`)
- Triggers pre-cache on first load
- Shows progress indicator
- Includes offline indicator and debug panel

### 3. **SWR Integration** (`swr.ts`)
- Falls back to cache when offline
- Works with optimistic updates
- Handles cache invalidation

### 4. **Login Page** (`auth/login/page.tsx`)
- Stores credentials after online login
- Handles offline login
- Uses offline auth service

---

## ⚙️ Configuration

### Cache Expiration
- **API Cache**: 1 month (30 days)
- **Credentials**: 7 days
- **Pre-cache**: Until manually reset

### Request Throttling
- **Max Concurrent Requests**: 5
- **Delay Between Requests**: 100ms

### Sync Retry
- **Max Retries**: 3
- **Retry on**: Connection restored

### Logging
- **Max In-Memory Logs**: 100
- **Max Persisted Logs**: 50
- **Console Logging**: Development only

---

## 🔒 Security

### Encryption
- **Per-user encryption keys**: Each user has unique key
- **Key generation**: `SHA256(email + hostname)`
- **Password hashing**: SHA-256 (one-way)
- **Token encryption**: AES-256
- **User data encryption**: AES-256

### Storage
- **IndexedDB**: More secure than localStorage
- **Encrypted credentials**: Tokens and user data encrypted
- **Hashed passwords**: Passwords never stored in plain text
- **Auto-expiration**: Credentials expire after 7 days

### Production Safety
- **No console logging**: Disabled in production
- **Debug mode**: Can be enabled via localStorage
- **Error handling**: Graceful degradation

---

## ⚡ Performance

### Optimizations
- **Request throttling**: Prevents server overload
- **Efficient cache lookups**: Indexed queries
- **Lazy loading**: Services loaded on demand
- **Background sync**: Non-blocking
- **Optimistic updates**: Immediate UI feedback

### Storage Management
- **Automatic cleanup**: Expired entries removed hourly
- **1-month expiration**: Balances freshness and storage
- **IndexedDB**: Large storage capacity

### Pre-caching
- **Throttled requests**: Max 5 concurrent
- **Progress tracking**: Non-blocking UI
- **Error handling**: Continues on errors
- **One-time execution**: Saved in localStorage

---

## 👤 User Experience

### Visual Indicators
- **Offline Indicator**: Shows status, can be minimized
- **Progress Modal**: Shows pre-cache progress
- **Status Messages**: Context-aware and helpful

### Offline Capabilities
- **Read**: All pre-cached pages work offline
- **Write**: Create/update/delete works offline
- **Login**: Can login offline with cached credentials
- **Sync**: Automatic when connection restored

### Error Handling
- **Cache misses**: Clear error messages
- **Sync failures**: Retry logic and error tracking
- **Network errors**: Graceful fallback to cache

---

## 📊 Statistics & Monitoring

### Cache Statistics
- Total cached endpoints
- Cache hit/miss rates
- Storage usage
- Expired entries count

### Sync Statistics
- Pending actions
- Syncing actions
- Failed actions
- Completed actions

### Pre-cache Statistics
- Total endpoints cached
- Success/failure counts
- Organizations processed
- Last pre-cache timestamp

---

## 🎯 Summary

The offline mode system provides:

✅ **Comprehensive offline support** - Read and write operations work offline  
✅ **Automatic pre-caching** - All pages cached automatically  
✅ **Smart caching** - 1-month expiration, automatic cleanup  
✅ **Secure authentication** - Per-user encryption, offline login  
✅ **Background sync** - Automatic when connection restored  
✅ **Optimistic updates** - Immediate UI feedback  
✅ **Visual feedback** - Status indicators and progress  
✅ **Production-ready** - Security fixes, performance optimizations  

**Status**: ✅ Production Ready  
**Last Updated**: Current Date

---

## 📚 Related Documentation

- `OFFLINE_MODE_GUIDE.md` - User guide
- `OFFLINE_MODE_IMPLEMENTATION.md` - Implementation details
- `OFFLINE_AUTH_EXPLANATION.md` - Authentication details
- `OFFLINE_MODE_PRODUCTION_REVIEW.md` - Production review
- `OFFLINE_MODE_TESTING_GUIDE.md` - Testing guide

---

**This is a comprehensive, production-ready offline-first architecture that enables seamless operation without internet connectivity.**

