import Dexie, { Table } from 'dexie';

// Define interfaces for offline data
export interface OfflineOrganization {
  id?: number;
  name: string;
  email: string;
  phone_number: string;
  status: string;
  // ... other organization fields
  _syncStatus?: 'synced' | 'pending' | 'conflict';
  _lastSynced?: Date;
  _localId?: string;
  _timestamp?: Date;
}

export interface OfflineEmployee {
  id?: number;
  tenantId: number;
  firstname: string;
  lastname: string;
  email: string;
  // ... other employee fields
  _syncStatus?: 'synced' | 'pending' | 'conflict';
  _lastSynced?: Date;
  _localId?: string;
  _timestamp?: Date;
}

export interface OfflinePatient {
  id?: number;
  tenantId: number;
  // ... patient fields
  _syncStatus?: 'synced' | 'pending' | 'conflict';
  _lastSynced?: Date;
  _localId?: string;
  _timestamp?: Date;
}

export interface OfflineAppointment {
  id?: number;
  tenantId: number;
  patientId: number;
  doctorId: number;
  date: string;
  startTime: string;
  endTime: string;
  // ... other appointment fields
  _syncStatus?: 'synced' | 'pending' | 'conflict';
  _lastSynced?: Date;
  _localId?: string;
  _timestamp?: Date;
}

export interface OfflineSchedule {
  id?: number;
  tenantId: number;
  employeeId: number;
  availableDays: any[];
  _syncStatus?: 'synced' | 'pending' | 'conflict';
  _lastSynced?: Date;
  _localId?: string;
  _timestamp?: Date;
}

export interface OfflineDepartment {
  id?: number;
  tenantId: number;
  name: string;
  description: string;
  status: string;
  _syncStatus?: 'synced' | 'pending' | 'conflict';
  _lastSynced?: Date;
  _localId?: string;
  _timestamp?: Date;
}

export interface OfflineNotification {
  id?: number;
  title: string;
  message: string;
  sender?: string;
  read?: boolean;
  isRead?: boolean;
  readAt?: string | null;
  _syncStatus?: 'synced' | 'pending' | 'conflict';
  _lastSynced?: Date;
  _localId?: string;
  _timestamp?: Date;
}

export interface SyncQueueItem {
  id?: number;
  action: 'create' | 'update' | 'delete';
  entity: 'organization' | 'employee' | 'patient' | 'appointment' | 'schedule' | 'department' | 'notification' | 'medical_record';
  endpoint: string;
  data: any;
  timestamp: Date;
  retries: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

export interface CachedApiResponse {
  id?: number;
  endpoint: string;
  data: any;
  timestamp: Date;
  expiresAt: Date;
}

export interface OfflineCredentials {
  id?: number;
  email: string;
  passwordHash: string; // Hashed password (not plain text)
  token?: string;
  userData?: any;
  lastLogin: Date;
  expiresAt: Date;
}

// Define the database
export class OfflineDatabase extends Dexie {
  organizations!: Table<OfflineOrganization, number>;
  employees!: Table<OfflineEmployee, number>;
  patients!: Table<OfflinePatient, number>;
  appointments!: Table<OfflineAppointment, number>;
  schedules!: Table<OfflineSchedule, number>;
  departments!: Table<OfflineDepartment, number>;
  notifications!: Table<OfflineNotification, number>;
  syncQueue!: Table<SyncQueueItem, number>;
  apiCache!: Table<CachedApiResponse, number>;
  offlineCredentials!: Table<OfflineCredentials, number>;

  constructor() {
    super('JoeeTenantDB');
    
    // Version 1 - Initial schema
    this.version(1).stores({
      organizations: '++id, name, email, status, _syncStatus, _timestamp',
      employees: '++id, tenantId, email, _syncStatus, _timestamp',
      patients: '++id, tenantId, _syncStatus, _timestamp',
      appointments: '++id, tenantId, patientId, doctorId, date, _syncStatus, _timestamp',
      schedules: '++id, tenantId, employeeId, _syncStatus, _timestamp',
      departments: '++id, tenantId, name, _syncStatus, _timestamp',
      notifications: '++id, read, isRead, _syncStatus, _timestamp',
      syncQueue: '++id, action, entity, status, timestamp',
      apiCache: '++id, endpoint, *endpoint, timestamp, expiresAt',
      offlineCredentials: '++id, email, expiresAt',
    });
  }

  /**
   * Safely open the database, handling existing indexes
   * This method handles the case where indexes already exist (ConstraintError)
   * If the database is corrupted, it will delete and recreate it
   */
  async safeOpen(): Promise<void> {
    // If already open, return immediately
    if (this.isOpen()) {
      return;
    }

    try {
      await this.open();
    } catch (error: any) {
      // If we get a ConstraintError about existing indexes, the database schema is corrupted
      // This happens when Dexie tries to create indexes that already exist
      // The best solution is to delete and recreate the database
      if (error?.name === 'ConstraintError' || error?.message?.includes('already exists')) {
        console.warn('⚠️ Database constraint error detected (index already exists). This usually means the database schema is corrupted.');
        console.warn('Deleting and recreating database... (cached data will be lost)');
        
        try {
          // Close if open
          if (this.isOpen()) {
            await this.close();
          }
          
          // Wait for database to release locks
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Delete the corrupted database
          await this.delete();
          console.log('✅ Corrupted database deleted');
          
          // Wait a bit more
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Recreate with fresh schema
          await this.open();
          console.log('✅ Database recreated successfully. Offline features are now available.');
        } catch (recreateError: any) {
          console.error('❌ Failed to delete and recreate database:', recreateError);
          // Don't throw - let the app continue even if database is broken
          // The app can still work without offline caching
          console.warn('⚠️ Database initialization failed. App will continue without offline caching.');
        }
      } else {
        // For other errors, just log and continue
        console.warn('Database initialization error (non-critical):', error?.message || 'Unknown error');
        // Don't throw - let the app continue without offline caching
      }
    }
  }
}

// Create and export a singleton instance
export const db = new OfflineDatabase();

// Track if database initialization is in progress to prevent multiple simultaneous opens
let initializing = false;
let initializationPromise: Promise<void> | null = null;

// Initialize database on module load (only in browser)
// This ensures the database is ready before any operations
if (typeof window !== 'undefined') {
  // Use safeOpen to handle any initialization errors
  // Only initialize once, even if called multiple times
  if (!initializationPromise) {
    initializing = true;
    initializationPromise = db.safeOpen().catch((error) => {
      console.warn('Database initialization failed on module load:', error);
      // Don't throw - app can continue without offline features
    }).finally(() => {
      initializing = false;
    });
  }
}

