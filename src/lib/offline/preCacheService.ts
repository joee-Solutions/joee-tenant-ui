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
   */
  private getImportantEndpoints(): string[] {
    return [
      // Dashboard
      API_ENDPOINTS.GET_DASHBOARD_DATA,
      API_ENDPOINTS.GET_DASHBOARD_APPOINTMENTS,
      API_ENDPOINTS.GET_DASHBOARD_PATIENTS,
      API_ENDPOINTS.GET_DASHBOARD_USERS,
      
      // Organizations (will be expanded with tenant-specific endpoints)
      API_ENDPOINTS.GET_ALL_TENANTS,
      `${API_ENDPOINTS.GET_ALL_TENANTS}?limit=4`, // Dashboard preview
      `${API_ENDPOINTS.GET_ALL_TENANTS}?page=1&limit=10`, // First page
      
      // Notifications
      API_ENDPOINTS.GET_NOTIFICATIONS,
      `${API_ENDPOINTS.GET_NOTIFICATIONS}?tab=all`,
      `${API_ENDPOINTS.GET_NOTIFICATIONS}?tab=sent`,
      `${API_ENDPOINTS.GET_NOTIFICATIONS}?tab=received`,
      
      // Admin Profile (Login-related)
      API_ENDPOINTS.GET_ADMIN_PROFILE,
      
      // System Settings
      API_ENDPOINTS.GET_SYSTEM_SETTINGS,
      
      // Roles & Permissions
      API_ENDPOINTS.GET_ALL_ROLES,
      `${API_ENDPOINTS.GET_ALL_ROLES}?permission=true`,
      API_ENDPOINTS.GET_ALL_PERMISSIONS,
      
      // Training Guides
      API_ENDPOINTS.GET_TRAINING_GUIDES,
      API_ENDPOINTS.GET_TRAINING_GUIDE_CATEGORIES,
    ];
  }

  /**
   * Get tenant-specific endpoints for a given tenant
   */
  private getTenantEndpoints(tenantId: number): string[] {
    return [
      // Organization details
      API_ENDPOINTS.GET_TENANT(tenantId.toString()),
      
      // Departments tab
      API_ENDPOINTS.TENANTS_DEPARTMENTS(tenantId),
      
      // Employees tab
      API_ENDPOINTS.GET_TENANTS_EMPLOYEES(tenantId),
      
      // Patients tab
      API_ENDPOINTS.TENANTS_PATIENTS(tenantId),
      
      // Appointments tab
      API_ENDPOINTS.TENANTS_APPOINTMENTS(tenantId),
      
      // Schedules tab
      API_ENDPOINTS.TENANTS_SCHEDULES(tenantId),
    ];
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
              await processRequestAuth('get', endpoint);
              successCount++;
              offlineLogger.debug(`✅ Pre-cached org endpoint: ${endpoint}`);
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
}

export const preCacheService = PreCacheService.getInstance();

