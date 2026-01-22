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
}

// Create and export a singleton instance
export const db = new OfflineDatabase();

