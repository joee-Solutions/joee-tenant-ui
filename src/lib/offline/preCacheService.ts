import { offlineService } from './offlineService';
import { offlineLogger } from './offlineLogger';
import { API_ENDPOINTS } from '@/framework/api-endpoints';
import { processRequestAuth } from '@/framework/https';

/**
 * Pre-cache Service
 * Automatically caches all important endpoints on first load
 */

interface PreCacheConfig {
  enabled: boolean;
  endpoints: string[];
  onProgress?: (current: number, total: number, endpoint: string) => void;
}

class PreCacheService {
  private static instance: PreCacheService;
  private isPreCaching = false;
  private preCacheCompleted = false;

  private constructor() {
    // Check if pre-cache was already completed
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('offline_precache_completed');
      this.preCacheCompleted = completed === 'true';
    }
  }

  static getInstance(): PreCacheService {
    if (!PreCacheService.instance) {
      PreCacheService.instance = new PreCacheService();
    }
    return PreCacheService.instance;
  }

  /**
   * Get list of all important endpoints to pre-cache
   * This includes ALL GET endpoints that can be cached
   */
  private getImportantEndpoints(): string[] {
    const endpoints: string[] = [
      // Dashboard
      API_ENDPOINTS.GET_DASHBOARD_DATA,
      API_ENDPOINTS.GET_DASHBOARD_APPOINTMENTS,
      API_ENDPOINTS.GET_DASHBOARD_PATIENTS,
      API_ENDPOINTS.GET_DASHBOARD_USERS,
      
      // Organizations - Multiple pages for pagination
      API_ENDPOINTS.GET_ALL_TENANTS,
      `${API_ENDPOINTS.GET_ALL_TENANTS}?limit=4`, // Dashboard preview
      `${API_ENDPOINTS.GET_ALL_TENANTS}?page=1&limit=10`,
      `${API_ENDPOINTS.GET_ALL_TENANTS}?page=2&limit=10`,
      `${API_ENDPOINTS.GET_ALL_TENANTS}?page=3&limit=10`,
      `${API_ENDPOINTS.GET_ALL_TENANTS}?status=active`,
      `${API_ENDPOINTS.GET_ALL_TENANTS}?status=inactive`,
      
      // All Users/Employees
      API_ENDPOINTS.GET_ALL_USERS,
      `${API_ENDPOINTS.GET_ALL_USERS}?page=1&limit=10`,
      `${API_ENDPOINTS.GET_ALL_USERS}?page=2&limit=10`,
      `${API_ENDPOINTS.GET_ALL_USERS}?page=3&limit=10`,
      
      // Notifications - All variations
      API_ENDPOINTS.GET_NOTIFICATIONS,
      `${API_ENDPOINTS.GET_NOTIFICATIONS}?tab=all`,
      `${API_ENDPOINTS.GET_NOTIFICATIONS}?tab=sent`,
      `${API_ENDPOINTS.GET_NOTIFICATIONS}?tab=received`,
      `${API_ENDPOINTS.GET_NOTIFICATIONS}?page=1&limit=10`,
      `${API_ENDPOINTS.GET_NOTIFICATIONS}?page=2&limit=10`,
      `${API_ENDPOINTS.GET_NOTIFICATIONS}?page=3&limit=10`,
      
      // Admin Profile (Login-related)
      API_ENDPOINTS.GET_ADMIN_PROFILE,
      
      // Super Admins - Multiple pages
      API_ENDPOINTS.GET_SUPER_ADMIN,
      `${API_ENDPOINTS.GET_SUPER_ADMIN}?page=1&limit=10`,
      `${API_ENDPOINTS.GET_SUPER_ADMIN}?page=2&limit=10`,
      
      // System Settings
      API_ENDPOINTS.GET_SYSTEM_SETTINGS,
      
      // Roles & Permissions - Multiple pages
      API_ENDPOINTS.GET_ALL_ROLES,
      `${API_ENDPOINTS.GET_ALL_ROLES}?permission=true`,
      `${API_ENDPOINTS.GET_ALL_ROLES}?page=1&limit=10`,
      `${API_ENDPOINTS.GET_ALL_ROLES}?page=2&limit=10`,
      API_ENDPOINTS.GET_ALL_PERMISSIONS,
      `${API_ENDPOINTS.GET_ALL_PERMISSIONS}?page=1&limit=10`,
      `${API_ENDPOINTS.GET_ALL_PERMISSIONS}?page=2&limit=10`,
      
      // Training Guides - List, categories, and multiple pages
      API_ENDPOINTS.GET_TRAINING_GUIDES,
      `${API_ENDPOINTS.GET_TRAINING_GUIDES}?page=1&limit=10`,
      `${API_ENDPOINTS.GET_TRAINING_GUIDES}?page=2&limit=10`,
      `${API_ENDPOINTS.GET_TRAINING_GUIDES}?page=3&limit=10`,
      API_ENDPOINTS.GET_TRAINING_GUIDE_CATEGORIES,
    ];

    return endpoints;
  }

  /**
   * Get tenant-specific endpoints for a given tenant
   * Includes paginated versions for list endpoints and ALL possible endpoints
   */
  private getTenantEndpoints(tenantId: number): string[] {
    const endpoints: string[] = [
      // Organization details
      API_ENDPOINTS.GET_TENANT(tenantId.toString()),
      
      // Departments tab - Multiple pages
      API_ENDPOINTS.TENANTS_DEPARTMENTS(tenantId),
      `${API_ENDPOINTS.TENANTS_DEPARTMENTS(tenantId)}?page=1&limit=10`,
      `${API_ENDPOINTS.TENANTS_DEPARTMENTS(tenantId)}?page=2&limit=10`,
      
      // Employees tab - Multiple pages
      API_ENDPOINTS.GET_TENANTS_EMPLOYEES(tenantId),
      `${API_ENDPOINTS.GET_TENANTS_EMPLOYEES(tenantId)}?page=1&limit=10`,
      `${API_ENDPOINTS.GET_TENANTS_EMPLOYEES(tenantId)}?page=2&limit=10`,
      `${API_ENDPOINTS.GET_TENANTS_EMPLOYEES(tenantId)}?page=3&limit=10`,
      
      // Patients tab - Multiple pages
      API_ENDPOINTS.TENANTS_PATIENTS(tenantId),
      `${API_ENDPOINTS.TENANTS_PATIENTS(tenantId)}?page=1&limit=10`,
      `${API_ENDPOINTS.TENANTS_PATIENTS(tenantId)}?page=2&limit=10`,
      `${API_ENDPOINTS.TENANTS_PATIENTS(tenantId)}?page=3&limit=10`,
      `${API_ENDPOINTS.TENANTS_PATIENTS(tenantId)}?page=4&limit=10`,
      
      // Appointments tab - Multiple pages
      API_ENDPOINTS.TENANTS_APPOINTMENTS(tenantId),
      `${API_ENDPOINTS.TENANTS_APPOINTMENTS(tenantId)}?page=1&limit=10`,
      `${API_ENDPOINTS.TENANTS_APPOINTMENTS(tenantId)}?page=2&limit=10`,
      `${API_ENDPOINTS.TENANTS_APPOINTMENTS(tenantId)}?page=3&limit=10`,
      
      // Schedules tab - Multiple pages
      API_ENDPOINTS.TENANTS_SCHEDULES(tenantId),
      `${API_ENDPOINTS.TENANTS_SCHEDULES(tenantId)}?page=1&limit=10`,
      `${API_ENDPOINTS.TENANTS_SCHEDULES(tenantId)}?page=2&limit=10`,
      
      // Tenant Users/Employees (alternative endpoint)
      API_ENDPOINTS.GET_TENANT_USERS(tenantId.toString()),
      `${API_ENDPOINTS.GET_TENANT_USERS(tenantId.toString())}?page=1&limit=10`,
      `${API_ENDPOINTS.GET_TENANT_USERS(tenantId.toString())}?page=2&limit=10`,
      
      // All Patients endpoint
      API_ENDPOINTS.GET_ALL_PATIENTS(tenantId),
      `${API_ENDPOINTS.GET_ALL_PATIENTS(tenantId)}?page=1&limit=10`,
      `${API_ENDPOINTS.GET_ALL_PATIENTS(tenantId)}?page=2&limit=10`,
    ];

    return endpoints;
  }

  /**
   * Pre-cache all important endpoints including all organization tab pages
   */
  async preCacheAll(config?: Partial<PreCacheConfig>): Promise<void> {
    // Don't pre-cache if already completed or currently caching
    if (this.preCacheCompleted || this.isPreCaching) {
      offlineLogger.debug('Pre-cache skipped', {
        reason: this.preCacheCompleted ? 'already completed' : 'already in progress',
      });
      return;
    }

    // Don't pre-cache if offline
    if (!offlineService.getOnlineStatus()) {
      offlineLogger.warn('Pre-cache skipped - device is offline');
      return;
    }

    this.isPreCaching = true;
    offlineLogger.info('🚀 Starting comprehensive pre-cache', {
      includes: 'dashboard, organizations, notifications, login data, and all organization tabs',
    });

    let totalEndpoints = 0;
    let successCount = 0;
    let failCount = 0;

    try {
      // Step 1: Pre-cache base endpoints (dashboard, notifications, login, etc.)
      const baseEndpoints = this.getImportantEndpoints();
      totalEndpoints = baseEndpoints.length;

      offlineLogger.info('📦 Step 1: Pre-caching base endpoints', {
        count: baseEndpoints.length,
      });

      for (let i = 0; i < baseEndpoints.length; i++) {
        const endpoint = baseEndpoints[i];
        
        if (config?.onProgress) {
          config.onProgress(i + 1, baseEndpoints.length, endpoint);
        }

        try {
          await processRequestAuth('get', endpoint);
          successCount++;
          offlineLogger.debug(`✅ Pre-cached: ${endpoint}`, {
            progress: `${i + 1}/${baseEndpoints.length}`,
          });
        } catch (error: any) {
          failCount++;
          offlineLogger.warn(`❌ Failed to pre-cache: ${endpoint}`, {
            error: error?.message || error,
            progress: `${i + 1}/${baseEndpoints.length}`,
          });
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Step 2: Fetch all organizations to get their IDs
      offlineLogger.info('📦 Step 2: Fetching all organizations');
      let organizations: any[] = [];
      
      try {
        const orgsResponse = await processRequestAuth('get', API_ENDPOINTS.GET_ALL_TENANTS);
        // Extract organizations from response (handle different response structures)
        if (Array.isArray(orgsResponse)) {
          organizations = orgsResponse;
        } else if (orgsResponse?.data && Array.isArray(orgsResponse.data)) {
          organizations = orgsResponse.data;
        } else if (orgsResponse?.data?.data && Array.isArray(orgsResponse.data.data)) {
          organizations = orgsResponse.data.data;
        }
        
        offlineLogger.info(`Found ${organizations.length} organizations to pre-cache`);
      } catch (error: any) {
        offlineLogger.warn('Failed to fetch organizations list', {
          error: error?.message,
        });
      }

      // Step 3: Pre-cache all organization tab pages
      if (organizations.length > 0) {
        offlineLogger.info('📦 Step 3: Pre-caching organization tab pages', {
          organizationCount: organizations.length,
        });

        // Calculate total endpoints first (for accurate progress)
        let orgEndpointsCount = 0;
        const validOrgs: Array<{ org: any; tenantId: number; endpoints: string[] }> = [];
        
        for (const org of organizations) {
          const tenantId = org.id || org.organization_id || parseInt(org.slug || org.domain || '0', 10);
          if (tenantId && !isNaN(tenantId)) {
            const endpoints = this.getTenantEndpoints(tenantId);
            validOrgs.push({ org, tenantId, endpoints });
            orgEndpointsCount += endpoints.length;
          }
        }
        
        totalEndpoints = baseEndpoints.length + orgEndpointsCount;

        for (let orgIndex = 0; orgIndex < validOrgs.length; orgIndex++) {
          const { org, tenantId, endpoints: tenantEndpoints } = validOrgs[orgIndex];

          offlineLogger.debug(`Pre-caching organization ${tenantId} (${orgIndex + 1}/${validOrgs.length})`, {
            orgName: org.name || org.domain || 'Unknown',
            endpoints: tenantEndpoints.length,
          });

          for (let endpointIndex = 0; endpointIndex < tenantEndpoints.length; endpointIndex++) {
            const endpoint = tenantEndpoints[endpointIndex];
            const currentIndex = baseEndpoints.length + 
              validOrgs.slice(0, orgIndex).reduce((sum, o) => sum + o.endpoints.length, 0) + 
              endpointIndex + 1;
            
            if (config?.onProgress) {
              config.onProgress(currentIndex, totalEndpoints, endpoint);
            }

            try {
              const response = await processRequestAuth('get', endpoint);
              successCount++;
              offlineLogger.debug(`✅ Pre-cached org endpoint: ${endpoint}`);
              
              // Step 4: Cache individual items from lists (patients, employees, appointments, etc.)
              await this.cacheIndividualItemsFromList(endpoint, response, tenantId);
            } catch (error: any) {
              failCount++;
              offlineLogger.warn(`❌ Failed to pre-cache org endpoint: ${endpoint}`, {
                error: error?.message,
              });
            }

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }

      // Step 4: Cache individual items from global lists
      await this.cacheGlobalListItems(config, baseEndpoints.length, totalEndpoints);

      // Step 5: Cache additional paginated results for organizations
      if (organizations.length > 0) {
        offlineLogger.info('📦 Step 5: Caching additional paginated results');
        await this.cachePaginatedResults(organizations, config, totalEndpoints);
      }

      this.preCacheCompleted = true;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('offline_precache_completed', 'true');
        localStorage.setItem('offline_precache_timestamp', new Date().toISOString());
        localStorage.setItem('offline_precache_stats', JSON.stringify({
          total: totalEndpoints,
          success: successCount,
          failed: failCount,
          organizations: organizations.length,
        }));
      }

      offlineLogger.info('✅ Comprehensive pre-cache completed', {
        total: totalEndpoints,
        success: successCount,
        failed: failCount,
        organizations: organizations.length,
      });
    } catch (error: any) {
      offlineLogger.error('Pre-cache process failed', { error: error?.message });
    } finally {
      this.isPreCaching = false;
    }
  }

  /**
   * Pre-cache tenant-specific endpoints for a given tenant
   * This includes all tab pages: departments, employees, patients, appointments, schedules
   */
  async preCacheTenant(tenantId: number): Promise<void> {
    if (!offlineService.getOnlineStatus()) {
      offlineLogger.warn(`Cannot pre-cache tenant ${tenantId} - device is offline`);
      return;
    }

    const tenantEndpoints = this.getTenantEndpoints(tenantId);

    offlineLogger.info(`Pre-caching tenant ${tenantId} endpoints`, {
      totalEndpoints: tenantEndpoints.length,
      tabs: ['departments', 'employees', 'patients', 'appointments', 'schedules'],
    });

    for (const endpoint of tenantEndpoints) {
      try {
        await processRequestAuth('get', endpoint);
        offlineLogger.debug(`✅ Pre-cached tenant endpoint: ${endpoint}`);
      } catch (error: any) {
        offlineLogger.warn(`❌ Failed to pre-cache tenant endpoint: ${endpoint}`, {
          error: error?.message,
        });
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Cache additional endpoints on-demand (for pages visited after initial pre-cache)
   * This allows incremental caching of pages that weren't in the initial pre-cache
   */
  async cacheAdditionalEndpoints(endpoints: string[]): Promise<void> {
    if (!offlineService.getOnlineStatus()) {
      offlineLogger.warn('Cannot cache additional endpoints - device is offline');
      return;
    }

    offlineLogger.info(`Caching ${endpoints.length} additional endpoints`);

    for (const endpoint of endpoints) {
      try {
        await processRequestAuth('get', endpoint);
        offlineLogger.debug(`✅ Cached additional endpoint: ${endpoint}`);
      } catch (error: any) {
        offlineLogger.warn(`❌ Failed to cache additional endpoint: ${endpoint}`, {
          error: error?.message,
        });
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Cache a single endpoint on-demand
   */
  async cacheEndpoint(endpoint: string): Promise<boolean> {
    if (!offlineService.getOnlineStatus()) {
      offlineLogger.warn(`Cannot cache endpoint ${endpoint} - device is offline`);
      return false;
    }

    try {
      await processRequestAuth('get', endpoint);
      offlineLogger.debug(`✅ Cached endpoint: ${endpoint}`);
      return true;
    } catch (error: any) {
      offlineLogger.warn(`❌ Failed to cache endpoint: ${endpoint}`, {
        error: error?.message,
      });
      return false;
    }
  }

  /**
   * Reset pre-cache status (useful for testing or forcing re-cache)
   */
  resetPreCache(): void {
    this.preCacheCompleted = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('offline_precache_completed');
      localStorage.removeItem('offline_precache_timestamp');
    }
    offlineLogger.info('Pre-cache status reset');
  }

  /**
   * Check if pre-cache was completed
   */
  isCompleted(): boolean {
    return this.preCacheCompleted;
  }

  /**
   * Get pre-cache timestamp
   */
  getPreCacheTimestamp(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('offline_precache_timestamp');
    }
    return null;
  }

  /**
   * Cache individual items from a list response
   * This allows caching detail pages for items in lists
   * Public method so it can be called from https.ts for on-demand caching
   */
  async cacheIndividualItemsFromList(
    listEndpoint: string,
    listResponse: any,
    tenantId?: number
  ): Promise<void> {
    try {
      // Extract data array from response (handle different response structures)
      let items: any[] = [];
      if (Array.isArray(listResponse)) {
        items = listResponse;
      } else if (listResponse?.data && Array.isArray(listResponse.data)) {
        items = listResponse.data;
      } else if (listResponse?.data?.data && Array.isArray(listResponse.data.data)) {
        items = listResponse.data.data;
      }

      if (items.length === 0) return;

      // Cache individual items based on endpoint type
      if (listEndpoint.includes('/patients')) {
        // Cache individual patient details - cache more items
        for (const item of items.slice(0, 50)) { // Increased to 50
          const patientId = item.id || item.patientId;
          if (patientId && tenantId) {
            try {
              await processRequestAuth('get', API_ENDPOINTS.GET_PATIENT(tenantId, patientId));
              offlineLogger.debug(`✅ Pre-cached patient detail: ${patientId}`);
              // Small delay to avoid overwhelming the server
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
              // Silently fail - not critical
            }
          }
        }
      } else if (listEndpoint.includes('/employees')) {
        // Cache individual employee details if endpoint exists
        // Check if we can get employee details (might need tenantId + employeeId)
        for (const item of items.slice(0, 50)) {
          const employeeId = item.id || item.employeeId;
          if (employeeId && tenantId) {
            try {
              // Try to cache employee detail if endpoint exists
              const employeeEndpoint = API_ENDPOINTS.UPDATE_TENANT_EMPLOYEE(tenantId, employeeId);
              // For GET, we'd need a GET endpoint, but UPDATE endpoint might work for caching
              // This is a fallback - actual GET endpoint might be different
              offlineLogger.debug(`Would cache employee detail: ${employeeId}`);
            } catch (error) {
              // Silently fail - not critical
            }
          }
        }
      } else if (listEndpoint.includes('/training-guides') && !listEndpoint.includes('/categories')) {
        // Cache individual training guide details - cache more items
        for (const item of items.slice(0, 50)) {
          const guideId = item.id || item.guideId;
          if (guideId) {
            try {
              await processRequestAuth('get', API_ENDPOINTS.GET_TRAINING_GUIDE(guideId));
              offlineLogger.debug(`✅ Pre-cached training guide: ${guideId}`);
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
              // Silently fail - not critical
            }
          }
        }
      } else if (listEndpoint.includes('/appointments')) {
        // Cache individual appointment details if endpoint exists
        for (const item of items.slice(0, 30)) {
          const appointmentId = item.id || item.appointmentId;
          if (appointmentId && tenantId) {
            try {
              // Appointment detail endpoint might exist
              offlineLogger.debug(`Would cache appointment detail: ${appointmentId}`);
            } catch (error) {
              // Silently fail
            }
          }
        }
      }
    } catch (error: any) {
      offlineLogger.debug('Error caching individual items', { error: error?.message });
    }
  }

  /**
   * Cache individual items from global lists (training guides, etc.)
   */
  private async cacheGlobalListItems(
    config: Partial<PreCacheConfig> | undefined,
    baseIndex: number,
    totalEndpoints: number
  ): Promise<void> {
    try {
      // Cache training guides
      try {
        const guidesResponse = await processRequestAuth('get', API_ENDPOINTS.GET_TRAINING_GUIDES);
        await this.cacheIndividualItemsFromList(API_ENDPOINTS.GET_TRAINING_GUIDES, guidesResponse);
      } catch (error) {
        // Silently fail
      }

      // Cache super admins (if needed)
      try {
        const adminsResponse = await processRequestAuth('get', API_ENDPOINTS.GET_SUPER_ADMIN);
        // Admins might not have individual detail endpoints
      } catch (error) {
        // Silently fail
      }
    } catch (error: any) {
      offlineLogger.debug('Error caching global list items', { error: error?.message });
    }
  }

  /**
   * Cache paginated results for organizations
   * This ensures we cache multiple pages of data for each organization
   */
  private async cachePaginatedResults(
    organizations: any[],
    config: Partial<PreCacheConfig> | undefined,
    currentTotal: number
  ): Promise<void> {
    let additionalEndpoints = 0;
    
    // Cache additional pages for each organization's lists
    for (const org of organizations.slice(0, 10)) { // Limit to first 10 orgs to avoid too many requests
      const tenantId = org.id || org.organization_id || parseInt(org.slug || org.domain || '0', 10);
      if (!tenantId || isNaN(tenantId)) continue;

      const paginatedEndpoints = [
        `${API_ENDPOINTS.TENANTS_PATIENTS(tenantId)}?page=3&limit=10`,
        `${API_ENDPOINTS.TENANTS_PATIENTS(tenantId)}?page=4&limit=10`,
        `${API_ENDPOINTS.TENANTS_APPOINTMENTS(tenantId)}?page=3&limit=10`,
        `${API_ENDPOINTS.GET_TENANTS_EMPLOYEES(tenantId)}?page=3&limit=10`,
      ];

      for (const endpoint of paginatedEndpoints) {
        try {
          await processRequestAuth('get', endpoint);
          additionalEndpoints++;
          offlineLogger.debug(`✅ Pre-cached paginated endpoint: ${endpoint}`);
        } catch (error) {
          // Silently fail - not all pages may exist
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    if (additionalEndpoints > 0) {
      offlineLogger.info(`Cached ${additionalEndpoints} additional paginated endpoints`);
    }
  }
}

export const preCacheService = PreCacheService.getInstance();

