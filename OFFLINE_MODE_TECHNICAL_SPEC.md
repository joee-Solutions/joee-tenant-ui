# Offline Mode – Full Technical Specification

This document describes how offline mode is implemented in this project so the same approach can be replicated in the tenant-side repo.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Dependencies](#3-dependencies)
4. [Storage Layer (IndexedDB)](#4-storage-layer-indexeddb)
5. [Core Services](#5-core-services)
6. [HTTP Integration](#6-http-integration)
7. [Data Fetching (SWR) Integration](#7-data-fetching-swr-integration)
8. [Offline Authentication](#8-offline-authentication)
9. [Pre-caching](#9-pre-caching)
10. [UI Components & Hooks](#10-ui-components--hooks)
11. [Login Page Integration](#11-login-page-integration)
12. [Dashboard Layout Integration](#12-dashboard-layout-integration)
13. [Configuration & Constants](#13-configuration--constants)
14. [Replication Checklist for Tenant Repo](#14-replication-checklist-for-tenant-repo)

---

## 1. Overview

### What It Does

- **Read (GET)**: When online, all GET responses are cached in IndexedDB. When offline, requests are served from cache or fail with a clear message.
- **Write (POST/PUT/PATCH/DELETE)**: When offline, writes are queued, applied optimistically in the UI, and synced when back online.
- **Auth**: After a successful online login, credentials are stored (encrypted) so the user can log in again offline.
- **Pre-cache**: On first dashboard load, a configurable set of GET endpoints is fetched and cached so key screens work offline without prior navigation.

### Design Principles

- Single entry point for API: all authenticated requests go through one function (`processRequestAuth`).
- Offline logic is centralized in `offlineService.makeRequest()`.
- Storage is IndexedDB via Dexie; no offline logic in components beyond using the shared HTTP layer and hooks.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  React components / pages                                        │
│  (use processRequestAuth for API, useOffline for status)         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│  HTTP layer (e.g. processRequestAuth in https.ts)                │
│  • If offline → offlineService.makeRequest(method, path, data)    │
│  • If online  → real HTTP; on GET success → offlineService       │
│                 .cacheResponse(path, response)                    │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│  Offline service (singleton)                                     │
│  • makeRequest(): GET→cache, write→queue+optimistic+SWR update    │
│  • cacheResponse() / getCachedResponse()                          │
│  • syncPendingActions() on window 'online'                       │
│  • cleanupExpiredCache() on init + every 1h                       │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│  IndexedDB (Dexie): apiCache, syncQueue, offlineCredentials      │
│  + preCacheService (first-load pre-cache)                         │
│  + offlineAuth (store/verify credentials)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Dependencies

- **dexie** – IndexedDB wrapper (schema, tables, queries).
- **crypto-js** – SHA-256 for password hash, AES for encrypting token and user JSON.
- **js-cookie** – Cookies for auth_token, user, refresh_token (same as online).
- **swr** – Data fetching; fetcher uses `processRequestAuth` and falls back to `offlineService.getCachedResponse` on failure/offline.
- **axios** – Used inside `offlineService` for real HTTP when online (to avoid circular dependency with main http client).

All API calls from the app must go through the same authenticated request function that you wire to the offline layer (see below).

---

## 4. Storage Layer (IndexedDB)

### Database Name

- Use a unique name per app, e.g. `JoeeTenantDB` (tenant app could use `JoeeTenantAppDB`).

### Dexie Schema (concept)

```ts
// database.ts
import Dexie, { Table } from 'dexie';

export interface SyncQueueItem {
  id?: number;
  action: 'create' | 'update' | 'delete';
  entity: string; // e.g. 'patient' | 'appointment' | ...
  endpoint: string;
  data: any;
  timestamp: Date;
  retries: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

export interface CachedApiResponse {
  id?: number;
  endpoint: string;   // e.g. "/dashboard/stats" (path only, no /api prefix)
  data: any;
  timestamp: Date;
  expiresAt: Date;
}

export interface OfflineCredentials {
  id?: number;
  email: string;
  passwordHash: string;   // SHA-256
  token?: string;         // AES-encrypted
  userData?: any;         // stored as AES-encrypted JSON string
  lastLogin: Date;
  expiresAt: Date;
}

export class OfflineDatabase extends Dexie {
  syncQueue!: Table<SyncQueueItem, number>;
  apiCache!: Table<CachedApiResponse, number>;
  offlineCredentials!: Table<OfflineCredentials, number>;
  // Optional: entity tables if you want to mirror server entities
  // organizations!: Table<...>; etc.

  constructor() {
    super('YourAppDB');
    this.version(1).stores({
      syncQueue: '++id, action, entity, status, timestamp',
      apiCache: '++id, endpoint, *endpoint, timestamp, expiresAt',
      offlineCredentials: '++id, email, expiresAt',
    });
  }

  async safeOpen(): Promise<void> {
    if (this.isOpen()) return;
    try {
      await this.open();
    } catch (error: any) {
      if (error?.name === 'ConstraintError' || error?.message?.includes('already exists')) {
        if (this.isOpen()) await this.close();
        await new Promise(r => setTimeout(r, 500));
        await this.delete();
        await new Promise(r => setTimeout(r, 300));
        await this.open();
      }
    }
  }
}

export const db = new OfflineDatabase();

// On load (browser only): db.safeOpen() and store promise for offlineAuth to await
if (typeof window !== 'undefined') {
  const p = db.safeOpen().catch(() => null);
  (window as any).__offlineDbInitPromise = p;
}
```

- **apiCache**: one record per `endpoint` (path); `put` overwrites. Endpoint is stored **without** `/api` prefix (e.g. `/dashboard/stats`).
- **syncQueue**: one row per queued write; `status` drives sync and retries.
- **offlineCredentials**: one row per user (e.g. by email); 7-day expiry.

---

## 5. Core Services

### 5.1 OfflineService (singleton)

**Responsibilities**

- Decide from `navigator.onLine` (and optional refresh before each request) if the device is online.
- **GET**: return from cache if offline; if online, perform HTTP and then cache the response.
- **POST/PUT/PATCH/DELETE**: if offline, queue the action, apply optimistic update to cache, update SWR cache, return a success-shaped response; if online, perform HTTP.

**Key methods**

- `getOnlineStatus(): boolean`  
  Return current online state (e.g. `navigator.onLine`).

- `makeRequest(method, endpoint, data?): Promise<any>`  
  - If offline and GET: `getCachedResponse(endpoint)`; if null, throw “No cached data available and device is offline”.
  - If offline and write: `queueAction(...)`, `applyOptimisticUpdate(...)`, `updateSWRCacheWithOptimisticData(...)`, return `{ status: true, success: true, message: '...', data?, _offline: true, _queueId }`.
  - If online: build axios client (baseURL, auth header from your getToken()), send request to `\`/api${endpoint}\``, on success and method === 'get' call `cacheResponse(endpoint, response.data)`, return `response.data`.

- `cacheResponse(endpoint, data): Promise<void>`  
  Ensure DB open; set `expiresAt = now + 1 month`; `db.apiCache.put({ endpoint, data, timestamp, expiresAt })`. Skip or truncate very large payloads (e.g. > 10MB).

- `getCachedResponse(endpoint): Promise<any | null>`  
  Ensure DB open; try exact `endpoint` match with `expiresAt > now`; if no match and endpoint has `?`, try base path and use latest valid entry by timestamp; return `cached.data` or null.

- `syncPendingActions(): Promise<void>`  
  If already syncing or offline, return. Load all `status === 'pending'`, for each: set `syncing`, call `makeRequest(method, item.endpoint, item.data)` (map action → post/put/delete), then set `completed` or on failure increment retries and set `failed` after 3 retries or leave `pending`.

- `getSyncStatus(): Promise<{ pending, syncing, failed }>`  
  Count syncQueue by status.

- `cleanupExpiredCache(): Promise<void>`  
  Delete from apiCache where `expiresAt < now`. Call on init and on a 1-hour interval.

**Optimistic update (concept)**

- `applyOptimisticUpdate(method, endpoint, data)`  
  - Derive “list” endpoint from `endpoint` (e.g. strip trailing numeric id or “/update” segment).
  - Load list from cache; if not found return null.
  - **POST**: prepend `{ ...data, id: \`temp_${Date.now()}\`, _offline: true, _pending: true }` to list (support arrays, or `data`/`results` wrappers); write back with `cacheResponse(listEndpoint, updated)`; return `{ status: true, success: true, data: newItem, message: '...' }`.
  - **PUT/PATCH**: find item by id in list (from `extractIdFromEndpoint`), merge `data`, set `_offline`, `_pending`; write list and optional detail cache; return `{ status: true, success: true, data: { ...data, id }, message: '...' }`.
  - **DELETE**: remove item by id from list; delete detail cache entry if present; return `{ status: true, success: true, message: '...' }`.

- `getListEndpoint(endpoint)`  
  Strip query; split by `/`; if last segment is a number, return path without it; if last is “update”/“read”/“delete”, drop last one or two segments to get list path.

- `extractIdFromEndpoint(endpoint)`  
  Same parsing; return the numeric id used for update/delete.

- `updateSWRCacheWithOptimisticData(endpoint, method, data)`  
  Get list endpoint, get updated list from cache, then `mutate(listEndpoint, updatedList, { revalidate: false })` and optionally mutate matcher for same base path so all SWR keys for that list see the new data.

**Queue**

- `queueAction(method, endpoint, data)`  
  Map method to action (`create`/`update`/`delete`), derive `entity` from endpoint (e.g. by path segments), then `db.syncQueue.add({ action, entity, endpoint, data, timestamp, retries: 0, status: 'pending' })`.

**Entity mapping (example)**

- Map path segments to an `entity` string (e.g. `/patients` → `patient`, `/appointments` → `appointment`) so sync and logs are clear; default to a generic type if unknown.

**Events**

- On `window.addEventListener('online')`: set online, call `syncPendingActions()`.
- On `window.addEventListener('offline')`: set offline.

---

### 5.2 OfflineLogger

- In-memory log list (e.g. last 100 entries) and optional persistence (e.g. last 50 in localStorage under `offline_logs`).
- Methods: `info`, `warn`, `error`, `debug`.
- In production: only write to console when `NODE_ENV === 'development'` or `localStorage.getItem('offline_debug') === 'true'`.
- Optional: `getLogs()`, `clearLogs()` for a debug UI.

---

## 6. HTTP Integration

All authenticated API calls must go through one function. Example pattern:

```ts
// https.ts (or your central HTTP module)

const processRequestAuth = async (method, path, data?, callback?, files?) => {
  if (typeof window !== 'undefined') {
    const { offlineService } = await import('@/lib/offline/offlineService');
    if (!offlineService.getOnlineStatus()) {
      return await offlineService.makeRequest(method, path, data);
    }
  }

  // Normal HTTP: axios with baseURL + /api prefix, auth header from getToken()
  const response = await httpAuth.request({ method, url: `/api${path}`, data });
  const responseData = response.data;

  if (typeof window !== 'undefined' && method === 'get') {
    try {
      const { offlineService } = await import('@/lib/offline/offlineService');
      await offlineService.cacheResponse(path, responseData);
    } catch (e) {
      // non-blocking
    }
  }

  return responseData;
};
```

- **Path**: use the same path your backend expects **without** the `/api` prefix when storing in cache (e.g. `/dashboard/stats`), and when calling `makeRequest`/`cacheResponse`/`getCachedResponse`.
- **Auth**: when online, `offlineService` uses the same token (e.g. from cookies) for the axios request it makes internally.

---

## 7. Data Fetching (SWR) Integration

Use a single fetcher that goes through the same HTTP layer and falls back to cache on failure/offline:

```ts
// swr.ts (or wherever your SWR fetcher is)

export const authFetcher = async (url: string) => {
  try {
    return await processRequestAuth('get', url);
  } catch (error: any) {
    if (typeof window !== 'undefined') {
      const isOffline = !navigator.onLine;
      const isNetworkError = error?.code === 'ERR_NETWORK' || error?.message?.includes('Network');
      if (isOffline || isNetworkError) {
        const { offlineService } = await import('@/lib/offline/offlineService');
        const cacheKeys = [url, url.replace(/^\/api/, ''), /* path only, with/without leading slash */];
        for (const key of [...new Set(cacheKeys)]) {
          const cached = await offlineService.getCachedResponse(key);
          if (cached) return cached;
        }
      }
    }
    throw error;
  }
};

export const fetcher = (url: string) => processRequestAuth('get', url);
```

Use `authFetcher` for SWR hooks that need offline fallback. Cache keys must match how you store endpoints (e.g. path without `/api`).

---

## 8. Offline Authentication

### 8.1 Storing credentials (after successful online login)

- **When**: Right after you set cookies (auth_token, user) and before redirect.
- **Inputs**: email, password (plain), token string, user object.
- **Steps**:
  - Ensure DB open (await `__offlineDbInitPromise` if you set it, then `db.safeOpen()` if needed).
  - Hash password: `CryptoJS.SHA256(password).toString()`.
  - Encrypt token and `JSON.stringify(userData)` with a **per-user key** (e.g. `SHA256(email + hostname).slice(0, 32)`), store ciphertext.
  - `expiresAt = now + 7 days`.
  - `db.offlineCredentials.put` (or add) with email, passwordHash, encrypted token, encrypted userData, lastLogin, expiresAt.
- Do not block login on failure; log and optionally toast that offline login may be unavailable.

### 8.2 Verifying credentials (offline login)

- Look up by email in `offlineCredentials`.
- If not found or expired, return `{ success: false, error: '...' }`.
- Compare `hashPassword(enteredPassword)` with stored `passwordHash`.
- Decrypt token and userData with the same per-user key.
- Return `{ success: true, token, userData }`.
- Caller sets cookies and redirects to dashboard.

### 8.3 Logout

- Clear cookies (auth_token, user, refresh_token, etc.).
- Do **not** clear `offlineCredentials` so the user can log in again offline with the same credentials until they expire.

### 8.4 Security

- Password: store only hash (SHA-256).
- Token and user: AES with a key derived from email + hostname (so each user and origin has a different key).
- Credentials expire in 7 days; remove or ignore when expired.

---

## 9. Pre-caching

### 9.1 When it runs

- Once per “session” or per device: e.g. on first dashboard load when online and a flag in localStorage (e.g. `offline_precache_completed`) is not set.
- Optional: allow user to close/minimize the progress UI; keep running in background and still set the flag when done.

### 9.2 What to cache

- Define a list of GET endpoints that cover the main screens (dashboard, lists, settings, etc.).
- For list endpoints, add variants with `?page=1&limit=10`, etc., if your API uses pagination.
- Optionally: after fetching a list of “parents” (e.g. tenants), for each parent fetch detail and sub-lists (e.g. per-tenant endpoints) and cache those too.
- Call your existing `processRequestAuth('get', endpoint)` for each; that will populate `apiCache` via the HTTP layer.

### 9.3 Throttling

- Limit concurrency (e.g. 5 in-flight requests).
- Small delay between requests (e.g. 100ms) to avoid overloading the server.
- Use a progress callback `(current, total)` only (no endpoint string in UI) and show a simple message like “Preparing offline mode…”.

### 9.4 State

- `localStorage.offline_precache_completed = 'true'` when done; optionally store timestamp and stats.
- Reset this (and optionally clear apiCache) for testing or “refresh offline data” feature.

---

## 10. UI Components & Hooks

### 10.1 useOffline()

- State: `isOnline` (from `navigator.onLine`), `syncStatus` (pending, syncing, failed counts from `offlineService.getSyncStatus()`).
- Effects: listen to `online`/`offline`; on `online` call `syncPendingActions()`; poll `getSyncStatus()` every 5 seconds.
- Return: `{ isOnline, syncStatus, syncPendingActions }`.

### 10.2 OfflineIndicator

- Renders when offline or when there are pending/failed syncs (and optionally when user hasn’t chosen “hide when synced”).
- Shows: “You’re Offline” / “Syncing…” / “Changes Pending” / “Sync Failed” / “All Synced” with short description.
- Actions: “Sync” button (call `syncPendingActions`), minimize (collapse to icon), and optional “Close” when synced (persist in localStorage so you don’t show again until there are new pending/failed items).

### 10.3 PreCacheProgressModal

- Receives `current`, `total`, `onMinimize`.
- Shows a simple message (“Preparing offline mode…”) and a progress bar (e.g. `current/total` as percentage).
- Buttons: Minimize (collapse to small icon that restores on click), Close (set localStorage so next time pre-cache runs without showing modal).
- When `current >= total` and total > 0, auto-close after a short delay and call `onMinimize`.

### 10.4 useCachedData (optional)

- Takes `endpoint` and a `fetcher` function.
- If online, call fetcher; on failure try `db.apiCache` for that endpoint and set data.
- If offline, read from cache only.
- Return `{ data, isLoading, isOffline }`. Useful for one-off screens that don’t use SWR.

---

## 11. Login Page Integration

### 11.1 Online login (existing flow)

- Call your login API (e.g. `processRequestNoAuth('post', LOGIN, data)`).
- From response take token and user (support nested shapes, e.g. `data.tokens.accessToken`, `data.user`).
- Set cookies: auth_token, refresh_token (if any), user.
- Then call `offlineAuthService.storeCredentials(email, password, token, userData)` (and optionally verify with `hasOfflineCredentials(email)`). Catch errors and show a non-blocking warning if storage fails.

### 11.2 Offline login

- If `!navigator.onLine` (or your offline flag), do not call the login API.
- Call `offlineAuthService.verifyCredentialsOffline(email, password)`.
- If result is `{ success: true, token, userData }`, set cookies (auth_token, user), set user in app state, redirect to dashboard.
- Otherwise show `result.error` or a generic “No offline credentials… Please login while online first.”

### 11.3 Auto-login with existing session

- On load, if you already have a valid auth cookie and user cookie, redirect to dashboard (works offline).

---

## 12. Dashboard Layout Integration

- In the main dashboard layout (or root layout that wraps authenticated pages):
  - If `!preCacheService.isCompleted()` and online, call `preCacheService.preCacheAll({ onProgress: (current, total) => setPreCacheProgress({ current, total }) })`. When progress is active, show `PreCacheProgressModal` with `current`, `total`, and `onMinimize` that you use to collapse/close the modal (and optionally respect a “user closed” flag so you don’t show progress next time).
  - Render `<OfflineIndicator />` so it’s visible on all dashboard pages.
  - Optionally in dev: render a small “Offline Debug” panel that shows cache count, queue count, recent logs, and a “Pre-cache now” button.

---

## 13. Configuration & Constants

- **Cache TTL**: 1 month for apiCache (e.g. `expiresAt = new Date(); expiresAt.setMonth(expiresAt.getMonth() + 1)`).
- **Credentials TTL**: 7 days.
- **Sync retries**: 3 before marking queue item as failed.
- **Pre-cache**: max concurrent requests (e.g. 5), delay between requests (e.g. 100ms).
- **Cleanup**: run `cleanupExpiredCache()` on OfflineService init and every 1 hour.
- **DB name**: unique per app (e.g. tenant app: `TenantAppDB`).
- **Encryption**: same algorithm (SHA-256 for password, AES for token/user) and key derivation (e.g. email + hostname) so offline login remains consistent.

---

## 14. Replication Checklist for Tenant Repo

Use this to implement the same behaviour in the tenant app.

### Dependencies
- [ ] Add `dexie`, `crypto-js`; ensure `axios`, `js-cookie`, `swr` (or equivalent) are available.

### Storage
- [ ] Create `database.ts`: Dexie schema with `apiCache`, `syncQueue`, `offlineCredentials`; `safeOpen()`; init on load and expose `__offlineDbInitPromise`.

### Services
- [ ] Implement `offlineLogger.ts`: in-memory + optional localStorage; console only in dev or when `offline_debug` is set.
- [ ] Implement `offlineService.ts`: `makeRequest`, `cacheResponse`, `getCachedResponse`, `queueAction`, `syncPendingActions`, `getSyncStatus`, `cleanupExpiredCache`, `applyOptimisticUpdate`, `getListEndpoint`, `extractIdFromEndpoint`, `updateSWRCacheWithOptimisticData`; online/offline listeners and cleanup interval.
- [ ] Implement `offlineAuth.ts`: `storeCredentials`, `verifyCredentialsOffline`, `hasOfflineCredentials`, `clearCredentials`; per-user encryption key; 7-day expiry.
- [ ] Implement `preCacheService.ts`: list of GET endpoints (and optional tenant/entity-based lists), throttling, `preCacheAll(onProgress)`, localStorage flag and optional “user closed” so progress UI can be hidden.

### HTTP & data
- [ ] In your central auth HTTP function: if offline, return `offlineService.makeRequest(method, path, data)`; if online and GET success, call `offlineService.cacheResponse(path, responseData)`.
- [ ] In SWR fetcher: catch errors and on offline/network error try `offlineService.getCachedResponse(key)` for a few key variants (path with/without `/api`).

### Auth
- [ ] Login page: after successful online login, call `offlineAuthService.storeCredentials(email, password, token, userData)`.
- [ ] Login page: when offline, call `offlineAuthService.verifyCredentialsOffline(email, password)` and set cookies + redirect on success.

### UI
- [ ] `useOffline` hook: online state, sync status polling, `syncPendingActions` on online.
- [ ] `OfflineIndicator`: status messages, minimize, optional “close when synced” with localStorage.
- [ ] `PreCacheProgressModal`: progress bar, minimize, close (and persist “user closed”).
- [ ] Dashboard layout: trigger `preCacheAll`, show progress modal and OfflineIndicator.

### Optional
- [ ] Debug panel (dev only): cache count, queue count, logs, manual pre-cache.
- [ ] `useCachedData` hook for non-SWR pages.
- [ ] Diagnostic helpers (e.g. `window.checkOfflineCredentials(email)`) for support.

### Testing
- [ ] Online: login, browse, confirm GETs are cached and writes work.
- [ ] Offline: confirm GETs from cache, writes queued and UI optimistic; after going online, queue drains and status updates.
- [ ] Offline login: after one online login, go offline and log in again with same credentials.
- [ ] Pre-cache: clear flag, reload dashboard, confirm progress and that cached endpoints work offline.

---

## File Layout (reference)

```
src/
  lib/offline/
    database.ts         # Dexie schema, db, safeOpen, init
    offlineService.ts   # makeRequest, cache, queue, sync, optimistic update
    offlineLogger.ts   # info, warn, error, debug, getLogs
    offlineAuth.ts     # storeCredentials, verifyCredentialsOffline, hasOfflineCredentials
    preCacheService.ts # preCacheAll, getImportantEndpoints, throttling
  hooks/
    useOffline.ts      # isOnline, syncStatus, syncPendingActions
  framework/
    https.ts           # processRequestAuth → offline check + cache on GET
  app/(auth)/auth/login/
    page.tsx           # online login + storeCredentials; offline verifyCredentialsOffline
  app/(dashboard)/
    layout.tsx         # preCacheAll, PreCacheProgressModal, OfflineIndicator
  components/shared/
    OfflineIndicator.tsx
    PreCacheProgressModal.tsx
    OfflineDebugPanel.tsx  # optional, dev only
```

---

## Endpoint Convention

- **In code and cache**: use the path **without** the `/api` prefix (e.g. `/dashboard/stats`, `/tenants/1/patients`).
- **When calling the server**: your HTTP client adds the prefix (e.g. `baseURL + '/api' + path` or `url: \`/api${path}\``).
- **SWR keys**: use the same path format as in your API layer (e.g. the same string you pass to `processRequestAuth('get', path)`), so cache lookup in the fetcher matches what you stored.

---

This spec, plus the existing code in this repo, is enough to replicate offline mode in the tenant app with the same behaviour and structure.
