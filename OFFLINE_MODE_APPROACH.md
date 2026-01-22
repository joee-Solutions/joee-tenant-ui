# Offline Mode Implementation Approach

## Overview
This document outlines the approach for implementing offline mode functionality in the Joee Tenant UI application, allowing users to access and manage data even when they don't have internet connectivity.

## Core Requirements
- Users should be able to view cached data when offline
- Users should be able to add/edit/delete data when offline
- All offline actions should be queued and synced when connection is restored
- Data should be stored locally and synchronized with the server

## Technology Stack

### 1. Service Worker & PWA
- **Purpose**: Cache static assets and enable offline functionality
- **Implementation**: 
  - Use Next.js PWA plugin or Workbox
  - Cache static assets (JS, CSS, images)
  - Cache API responses for frequently accessed data
  - Implement network-first, cache-fallback strategy

### 2. IndexedDB (via Dexie.js or idb)
- **Purpose**: Store structured data locally
- **Why IndexedDB**: 
  - Large storage capacity (unlike localStorage)
  - Supports complex queries
  - Better performance for large datasets
- **Data to Store**:
  - **Organizations/Tenants** (GET, POST, PUT, DELETE)
    - Organization details (name, address, email, phone, status, etc.)
    - Organization admin profiles
    - Organization settings
  - **Employees/Users** (GET, POST, PUT, DELETE)
    - Employee profiles (name, email, phone, designation, department, etc.)
    - Employee roles and permissions
    - Employee schedules
    - Employee images
  - **Patients** (GET, POST, PUT, DELETE)
    - Patient demographics
    - Patient medical history
    - Patient allergies
    - Patient medications/prescriptions
    - Patient visits
    - Patient vital signs
    - Patient diagnosis history
    - Patient surgery history
    - Patient immunization history
    - Patient family history
    - Patient emergency contacts
    - Patient images
  - **Appointments** (GET, POST, PUT, DELETE)
    - Appointment details (date, time, patient, doctor, description)
    - Appointment status
  - **Schedules** (GET, POST, PATCH, DELETE)
    - Employee schedules
    - Available days and times
  - **Departments** (GET, POST, PUT, DELETE)
    - Department details (name, description, status, image)
    - Department employees
  - **Notifications** (GET, POST, DELETE)
    - Notification details (title, message, sender, recipient, read status)
    - Notification unread counts
  - **Medical Records** (GET, POST, PUT, DELETE)
    - Medical history entries
    - Visit records
    - Prescription records
    - Diagnosis records
    - Vital signs records
  - **Dashboard Data** (GET)
    - Dashboard statistics
    - Appointments by day
    - Patient statistics
    - Employee statistics
    - Organization status
  - **Roles & Permissions** (GET, POST, PUT, DELETE)
    - Role definitions
    - Permission definitions
    - User-role assignments
  - **Training Guides** (GET, POST, PUT, DELETE)
    - Training guide content
    - Training guide categories
    - Training guide metadata
  - **System Settings** (GET, PUT)
    - System configuration
    - Application settings
  - **Activity Logs** (GET)
    - User activity logs
    - System activity logs
    - Tenant activity logs
    - Activity statistics
  - **Admin Profiles** (GET, PUT)
    - Super admin profiles
    - Admin user data
  - **Search Data** (GET)
    - Recent searches
    - Search results cache
  - **Authentication Data** (POST, GET)
    - User tokens (encrypted)
    - Refresh tokens
    - Session data

### 3. Local Storage
- **Purpose**: Store user preferences and settings
- **Data to Store**:
  - User authentication tokens (encrypted)
  - User preferences
  - UI state (sidebar open/closed, etc.)
  - Recent activity

### 4. Background Sync API
- **Purpose**: Queue actions when offline and sync when online
- **Implementation**:
  - Queue all POST/PUT/DELETE requests when offline
  - Store in IndexedDB with metadata (timestamp, action type, data)
  - Sync when connection is restored
  - Handle conflicts and retries

## Implementation Strategy

### Phase 1: Data Caching
1. **Cache Frequently Accessed Data**
   - Organizations list
   - Current user profile
   - Recent notifications
   - Dashboard statistics

2. **Cache Strategy**
   - Network-first: Try network, fallback to cache
   - Cache-first: Use cache, update in background
   - Stale-while-revalidate: Show cache, update in background

### Phase 2: Offline Data Management
1. **Read Operations**
   - Check IndexedDB first
   - If not found, show cached data or empty state
   - Queue network request for when online

2. **Write Operations (Create/Update/Delete)**
   - Store action in IndexedDB queue
   - Show optimistic UI update
   - Sync when connection restored
   - Handle sync conflicts

### Phase 3: Sync Mechanism
1. **Sync Queue Management**
   - Track pending actions
   - Retry failed syncs
   - Handle conflicts (last-write-wins or user resolution)
   - Show sync status to user

2. **Conflict Resolution**
   - Last-write-wins (simple)
   - User intervention (complex)
   - Merge strategies for different data types

## Data Structure

### IndexedDB Schema
```typescript
// Organizations
organizations: {
  id: number;
  name: string;
  // ... other fields
  _syncStatus: 'synced' | 'pending' | 'conflict';
  _lastSynced: Date;
  _localId?: string; // For offline-created items
}

// Sync Queue
syncQueue: {
  id: string;
  action: 'create' | 'update' | 'delete';
  entity: 'organization' | 'employee' | 'patient' | 'appointment';
  data: any;
  timestamp: Date;
  retries: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
}
```

## User Experience

### 1. Offline Indicator
- Show banner/icon when offline
- Display sync status
- Show number of pending actions

### 2. Offline Actions
- Allow all CRUD operations
- Show "Will sync when online" message
- Disable features that require real-time data

### 3. Sync Status
- Show sync progress
- Display sync errors
- Allow manual sync trigger

## Implementation Steps

### Step 1: Setup Service Worker
```bash
npm install next-pwa
# Configure in next.config.js
```

### Step 2: Setup IndexedDB
```bash
npm install dexie
# Create database schema
```

### Step 3: Create Offline Service
- Intercept API calls
- Store in IndexedDB
- Queue write operations
- Sync when online

### Step 4: Update Components
- Check online/offline status
- Use cached data when offline
- Show offline indicators
- Handle sync states

### Step 5: Testing
- Test offline scenarios
- Test sync functionality
- Test conflict resolution
- Test data persistence

## Considerations

### 1. Data Freshness
- How stale is acceptable?
- When to show "data may be outdated" warning?
- Refresh strategy

### 2. Storage Limits
- Monitor IndexedDB usage
- Implement cleanup for old data
- Set storage quotas

### 3. Security
- Encrypt sensitive data
- Secure authentication tokens
- Validate data before sync

### 4. Performance
- Lazy load cached data
- Optimize IndexedDB queries
- Minimize sync payload

## Benefits
1. **Improved UX**: Users can work without internet
2. **Faster Load Times**: Cached data loads instantly
3. **Reduced Server Load**: Less API calls
4. **Better Reliability**: Works in poor network conditions

## Challenges
1. **Complexity**: More code to maintain
2. **Conflict Resolution**: Handling concurrent edits
3. **Storage Management**: Managing local storage limits
4. **Testing**: More scenarios to test

## Next Steps
1. Review and approve this approach
2. Set up development environment
3. Implement Phase 1 (Data Caching)
4. Test and iterate
5. Implement Phase 2 (Offline Management)
6. Implement Phase 3 (Sync Mechanism)
7. Full testing and deployment

