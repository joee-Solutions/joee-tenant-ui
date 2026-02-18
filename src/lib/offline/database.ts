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
    
    // Version 1 - Initial schema (for existing databases)
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

    // Version 2 - Current version (same schema, just version bump to handle migration issues)
    // If database is already at version 1, this migration will be a no-op
    this.version(2).stores({
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
    }).upgrade(async (tx) => {
      // No-op migration - schema is the same, just version bump
      // This allows Dexie to properly handle the version transition
      console.log('Database migrated to version 2 (no schema changes)');
    });
  }

  /**
   * Safely open the database, handling existing indexes
   * This method handles the case where indexes already exist (ConstraintError)
   */
  async safeOpen(): Promise<void> {
    // If already open, return immediately
    if (this.isOpen()) {
      return;
    }

    try {
      await this.open();
    } catch (error: any) {
      // If we get a ConstraintError about existing indexes, the database might be in an inconsistent state
      // This can happen if the database was partially created or if there's a version mismatch
      if (error?.name === 'ConstraintError' || error?.message?.includes('already exists')) {
        console.warn('Database constraint error detected (index already exists), attempting recovery...', error);
        
        try {
          // Close if open
          if (this.isOpen()) {
            await this.close();
          }
          
          // Wait a bit for the database to release locks
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Try opening again - Dexie should handle version migration
          // If indexes already exist, Dexie should skip creating them
          await this.open();
          console.log('Database recovered successfully');
        } catch (recoveryError: any) {
          console.error('Failed to recover database:', recoveryError);
          
          // If recovery also fails with constraint error, the database schema is corrupted
          // Delete and recreate as a last resort (this will lose cached data, but allow the app to work)
          if (recoveryError?.name === 'ConstraintError' || recoveryError?.message?.includes('already exists')) {
            console.warn('Database schema appears corrupted, deleting and recreating... (cached data will be lost)');
            try {
              if (this.isOpen()) {
                await this.close();
              }
              await this.delete();
              await this.open();
              console.log('Database recreated successfully (cached data was lost, but app can continue)');
            } catch (deleteError: any) {
              console.error('Failed to delete and recreate database:', deleteError);
              // Don't throw - let the app continue even if database is broken
              // The app can still work without offline caching
              console.warn('Database initialization failed, but app will continue without offline caching');
            }
          } else {
            // For other errors, just log and continue
            console.warn('Database initialization failed, but app will continue:', recoveryError?.message || 'Unknown error');
          }
        }
      } else {
        // For non-constraint errors, just log and continue
        console.warn('Database initialization error (non-critical):', error?.message || 'Unknown error');
        // Don't throw - let the app continue without offline caching
      }
    }
  }
}

// Create and export a singleton instance
export const db = new OfflineDatabase();

