import { db, SyncQueueItem } from './database';
import { offlineLogger } from './offlineLogger';

export class OfflineService {
  private static instance: OfflineService;
  private isOnline: boolean = typeof window !== 'undefined' ? navigator.onLine : true;
  private syncInProgress: boolean = false;

  private constructor() {
    // Initialize online status
    this.isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
    
    offlineLogger.info('OfflineService initialized', { isOnline: this.isOnline });
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        offlineLogger.info('Device came ONLINE - starting sync');
        this.syncPendingActions();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
        offlineLogger.warn('Device went OFFLINE - requests will use cache or be queued');
      });
    }
  }

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Intercept API calls and handle offline/online scenarios
  async makeRequest(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    endpoint: string,
    data?: any
  ): Promise<any> {
    // Update online status before checking (only in browser)
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
    }
    
    offlineLogger.debug(`API Request: ${method.toUpperCase()} ${endpoint}`, {
      isOnline: this.isOnline,
      hasData: !!data,
    });
    
    if (!this.isOnline) {
      offlineLogger.info(`Device is OFFLINE - handling ${method.toUpperCase()} request for ${endpoint}`);
      
      // We're offline
      if (method === 'get') {
        // Try to get from cache
        const cached = await this.getCachedResponse(endpoint);
        if (cached) {
          // Cache hit is already logged in getCachedResponse
          return cached;
        }
        offlineLogger.warn(`Cache MISS for ${endpoint} - no cached data available`);
        throw new Error('No cached data available and device is offline');
      } else {
        // Queue write operations (POST, PUT, PATCH, DELETE)
        offlineLogger.info(`Queuing ${method.toUpperCase()} action for sync when online`, { endpoint });
        const queueId = await this.queueAction(method, endpoint, data);
        
        // Apply optimistic update to cache
        const optimisticResponse = await this.applyOptimisticUpdate(method, endpoint, data);
        
        // Invalidate SWR cache for related endpoints
        await this.invalidateRelatedCache(endpoint);
        
        offlineLogger.info(`Optimistic update applied for ${method.toUpperCase()} ${endpoint}`);
        
        // Return optimistic response that matches expected format
        return optimisticResponse || { 
          success: true, 
          message: 'Action queued for sync when online',
          data: data,
          _offline: true,
          _queueId: queueId
        };
      }
    }
    
    offlineLogger.debug(`Device is ONLINE - making ${method.toUpperCase()} request for ${endpoint}`);
    
    // If we reach here, we're online - make the actual HTTP request
    // Import axios and site config to create request directly to avoid circular dependency
    const axios = (await import('axios')).default;
    const { getToken, getRefreshToken } = await import('@/framework/get-token');
    const { siteConfig } = await import('@/framework/site-config');
    const token = getToken();
    
    const httpClient = axios.create({
      baseURL: siteConfig.siteUrl,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    // Add request interceptor for token refresh
    httpClient.interceptors.request.use(
      (config) => {
        const currentToken = getToken();
        if (currentToken && typeof currentToken === 'string' && currentToken.trim().length > 10) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        } else {
          const refreshed = getRefreshToken();
          if (refreshed) {
            const newToken = getToken();
            if (newToken && typeof newToken === 'string' && newToken.trim().length > 10) {
              config.headers.Authorization = `Bearer ${newToken}`;
            }
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    try {
      let response;
      if (method === "post") {
        response = await httpClient.post(`/api${endpoint}`, data);
      } else if (method === "get") {
        response = await httpClient.get(`/api${endpoint}`);
      } else if (method === "put") {
        response = await httpClient.put(`/api${endpoint}`, data);
      } else if (method === "patch") {
        response = await httpClient.patch(`/api${endpoint}`, data);
      } else if (method === "delete") {
        response = await httpClient.delete(`/api${endpoint}`);
      } else {
        throw new Error(`Invalid method: ${method}`);
      }
      
      const responseData = response.data;
      
      // Cache GET requests for offline use
      if (method === 'get') {
        await this.cacheResponse(endpoint, responseData);
        offlineLogger.debug(`Cached GET response for ${endpoint}`);
      }
      
      offlineLogger.info(`API Request SUCCESS: ${method.toUpperCase()} ${endpoint}`);
      return responseData;
    } catch (error: any) {
      offlineLogger.error(`API Request FAILED: ${method.toUpperCase()} ${endpoint}`, {
        error: error?.message || error,
        status: error?.response?.status,
      });
      
      // If request fails and we're online, check if we went offline during the request
      if (typeof window !== 'undefined') {
        this.isOnline = navigator.onLine;
      }
      if (!this.isOnline && method === 'get') {
        offlineLogger.info(`Went offline during request - trying cache for ${endpoint}`);
        // Try cache as fallback
        const cached = await this.getCachedResponse(endpoint);
        if (cached) {
          offlineLogger.info(`Cache fallback SUCCESS for ${endpoint}`);
          return cached;
        }
        offlineLogger.warn(`Cache fallback FAILED for ${endpoint}`);
      }
      throw error;
    }
  }

  // Cache API responses (public method so it can be called from https.ts)
  async cacheResponse(endpoint: string, data: any): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Cache for 24 hours

      await db.apiCache.put({
        endpoint,
        data,
        timestamp: new Date(),
        expiresAt,
      });
      
      offlineLogger.debug(`Cached response for ${endpoint}`, {
        expiresAt: expiresAt.toISOString(),
        dataSize: JSON.stringify(data).length,
      });
    } catch (error: any) {
      offlineLogger.error(`Error caching response for ${endpoint}`, { error: error?.message });
    }
  }

  // Get cached API response
  private async getCachedResponse(endpoint: string): Promise<any | null> {
    try {
      // Try exact match first
      let cached = await db.apiCache
        .where('endpoint')
        .equals(endpoint)
        .and((item) => item.expiresAt > new Date())
        .first();
      
      // If no exact match and endpoint has query params, try to find base endpoint match
      if (!cached && endpoint.includes('?')) {
        const baseEndpoint = endpoint.split('?')[0];
        // Get all cached entries for this base endpoint and find the most recent valid one
        const allCached = await db.apiCache
          .where('endpoint')
          .startsWith(baseEndpoint)
          .and((item) => item.expiresAt > new Date())
          .sortBy('timestamp');
        
        if (allCached && allCached.length > 0) {
          // Use the most recent cache entry
          cached = allCached[allCached.length - 1];
          offlineLogger.debug(`Using base endpoint cache for ${endpoint}`, {
            matchedEndpoint: cached.endpoint,
            baseEndpoint,
          });
        }
      }
      
      if (cached) {
        const ageSeconds = Math.round((new Date().getTime() - new Date(cached.timestamp).getTime()) / 1000);
        offlineLogger.info(`✅ Cache HIT for ${endpoint}`, {
          cachedAt: cached.timestamp,
          expiresAt: cached.expiresAt,
          matchedEndpoint: cached.endpoint,
          age: `${ageSeconds}s ago`,
        });
        return cached.data;
      } else {
        offlineLogger.debug(`❌ No valid cache found for ${endpoint}`);
        return null;
      }
    } catch (error: any) {
      offlineLogger.error(`Error getting cached response for ${endpoint}`, { error: error?.message });
      return null;
    }
  }

  // Queue action for sync when online
  private async queueAction(
    method: 'post' | 'put' | 'patch' | 'delete',
    endpoint: string,
    data?: any
  ): Promise<number> {
    const action: SyncQueueItem['action'] = 
      method === 'post' ? 'create' :
      method === 'put' || method === 'patch' ? 'update' :
      'delete';

    const entity = this.extractEntityFromEndpoint(endpoint);

    const queueItem = {
      action,
      entity,
      endpoint,
      data,
      timestamp: new Date(),
      retries: 0,
      status: 'pending' as const,
    };

    const id = await db.syncQueue.add(queueItem);
    
    offlineLogger.info(`Queued ${action} action for ${entity}`, {
      endpoint,
      queueItemId: id,
      timestamp: queueItem.timestamp,
    });
    
    return id;
  }

  // Extract entity type from endpoint
  private extractEntityFromEndpoint(endpoint: string): SyncQueueItem['entity'] {
    if (endpoint.includes('/tenants') || endpoint.includes('/organizations')) {
      return 'organization';
    } else if (endpoint.includes('/employees')) {
      return 'employee';
    } else if (endpoint.includes('/patients')) {
      return 'patient';
    } else if (endpoint.includes('/appointments')) {
      return 'appointment';
    } else if (endpoint.includes('/schedules')) {
      return 'schedule';
    } else if (endpoint.includes('/departments')) {
      return 'department';
    } else if (endpoint.includes('/notification')) {
      return 'notification';
    } else if (endpoint.includes('/medical') || endpoint.includes('/visit') || endpoint.includes('/prescription')) {
      return 'medical_record';
    }
    return 'organization'; // default
  }

  // Sync pending actions when coming back online
  async syncPendingActions(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      offlineLogger.debug('Sync skipped', { syncInProgress: this.syncInProgress, isOnline: this.isOnline });
      return;
    }

    this.syncInProgress = true;
    offlineLogger.info('Starting sync of pending actions');

    try {
      const pendingItems = await db.syncQueue
        .where('status')
        .equals('pending')
        .toArray();
      
      offlineLogger.info(`Found ${pendingItems.length} pending actions to sync`);

      for (const item of pendingItems) {
        try {
          offlineLogger.debug(`Syncing action: ${item.action} ${item.entity}`, { itemId: item.id });
          
          // Update status to syncing
          await db.syncQueue.update(item.id!, { status: 'syncing' });

          // Determine HTTP method from action
          const method = 
            item.action === 'create' ? 'post' :
            item.action === 'update' ? 'put' :
            item.action === 'delete' ? 'delete' : 'get';

          // Make the request using the offline service (which will handle online requests)
          await this.makeRequest(method, item.endpoint, item.data);

          // Mark as completed
          await db.syncQueue.update(item.id!, { 
            status: 'completed',
            retries: item.retries + 1,
          });
          
          offlineLogger.info(`Successfully synced action: ${item.action} ${item.entity}`, { itemId: item.id });
        } catch (error: any) {
          offlineLogger.error(`Failed to sync action: ${item.action} ${item.entity}`, {
            itemId: item.id,
            error: error?.message,
            retries: item.retries,
          });
          
          // Mark as failed if retries exceeded
          const newRetries = item.retries + 1;
          if (newRetries >= 3) {
            await db.syncQueue.update(item.id!, {
              status: 'failed',
              retries: newRetries,
              error: error.message || 'Sync failed',
            });
            offlineLogger.warn(`Action marked as FAILED after ${newRetries} retries`, { itemId: item.id });
          } else {
            // Retry later
            await db.syncQueue.update(item.id!, {
              status: 'pending',
              retries: newRetries,
            });
            offlineLogger.info(`Action will retry (attempt ${newRetries}/3)`, { itemId: item.id });
          }
        }
      }
      
      const remaining = await db.syncQueue.where('status').equals('pending').count();
      offlineLogger.info(`Sync completed. ${remaining} actions still pending`);
    } catch (error: any) {
      offlineLogger.error('Error syncing pending actions', { error: error?.message });
    } finally {
      this.syncInProgress = false;
    }
  }

  // Get sync queue status
  async getSyncStatus(): Promise<{
    pending: number;
    syncing: number;
    failed: number;
  }> {
    const pending = await db.syncQueue.where('status').equals('pending').count();
    const syncing = await db.syncQueue.where('status').equals('syncing').count();
    const failed = await db.syncQueue.where('status').equals('failed').count();

    return { pending, syncing, failed };
  }

  // Apply optimistic update to cache
  private async applyOptimisticUpdate(
    method: 'post' | 'put' | 'patch' | 'delete',
    endpoint: string,
    data?: any
  ): Promise<any> {
    try {
      // Get the list endpoint (e.g., /tenants/1/employees from /tenants/1/employees/5)
      const listEndpoint = this.getListEndpoint(endpoint);
      
      // Get current cached data for the list
      const cachedList = await this.getCachedResponse(listEndpoint);
      
      if (!cachedList) {
        offlineLogger.debug(`No cached list found for optimistic update: ${listEndpoint}`);
        return null;
      }

      let updatedData: any;

      if (method === 'post') {
        // CREATE: Add new item to list
        const newItem = {
          ...data,
          id: `temp_${Date.now()}`, // Temporary ID until synced
          _offline: true,
          _pending: true,
        };
        
        // Handle different response structures
        if (Array.isArray(cachedList)) {
          updatedData = [newItem, ...cachedList];
        } else if (cachedList.data && Array.isArray(cachedList.data)) {
          updatedData = { ...cachedList, data: [newItem, ...cachedList.data] };
        } else if (cachedList.results && Array.isArray(cachedList.results)) {
          updatedData = { ...cachedList, results: [newItem, ...cachedList.results] };
        } else {
          offlineLogger.debug(`Unknown list structure for ${listEndpoint}`);
          return null;
        }
        
        // Cache the updated list
        await this.cacheResponse(listEndpoint, updatedData);
        offlineLogger.info(`Optimistically added item to ${listEndpoint}`);
        
        return { success: true, data: newItem, message: 'Created (offline)' };
        
      } else if (method === 'put' || method === 'patch') {
        // UPDATE: Update item in list
        const itemId = this.extractIdFromEndpoint(endpoint);
        
        if (Array.isArray(cachedList)) {
          updatedData = cachedList.map((item: any) => 
            item.id === itemId || item.id?.toString() === itemId?.toString()
              ? { ...item, ...data, _offline: true, _pending: true }
              : item
          );
        } else if (cachedList.data && Array.isArray(cachedList.data)) {
          updatedData = {
            ...cachedList,
            data: cachedList.data.map((item: any) =>
              item.id === itemId || item.id?.toString() === itemId?.toString()
                ? { ...item, ...data, _offline: true, _pending: true }
                : item
            ),
          };
        } else if (cachedList.results && Array.isArray(cachedList.results)) {
          updatedData = {
            ...cachedList,
            results: cachedList.results.map((item: any) =>
              item.id === itemId || item.id?.toString() === itemId?.toString()
                ? { ...item, ...data, _offline: true, _pending: true }
                : item
            ),
          };
        } else {
          offlineLogger.debug(`Unknown list structure for update: ${listEndpoint}`);
          return null;
        }
        
        // Cache the updated list
        await this.cacheResponse(listEndpoint, updatedData);
        
        // Also update the individual item cache if it exists
        const itemCache = await this.getCachedResponse(endpoint);
        if (itemCache) {
          await this.cacheResponse(endpoint, { ...itemCache, ...data, _offline: true, _pending: true });
        }
        
        offlineLogger.info(`Optimistically updated item in ${listEndpoint}`);
        
        return { success: true, data: { ...data, id: itemId }, message: 'Updated (offline)' };
        
      } else if (method === 'delete') {
        // DELETE: Remove item from list
        const itemId = this.extractIdFromEndpoint(endpoint);
        
        if (Array.isArray(cachedList)) {
          updatedData = cachedList.filter((item: any) => 
            item.id !== itemId && item.id?.toString() !== itemId?.toString()
          );
        } else if (cachedList.data && Array.isArray(cachedList.data)) {
          updatedData = {
            ...cachedList,
            data: cachedList.data.filter((item: any) =>
              item.id !== itemId && item.id?.toString() !== itemId?.toString()
            ),
          };
        } else if (cachedList.results && Array.isArray(cachedList.results)) {
          updatedData = {
            ...cachedList,
            results: cachedList.results.filter((item: any) =>
              item.id !== itemId && item.id?.toString() !== itemId?.toString()
            ),
          };
        } else {
          offlineLogger.debug(`Unknown list structure for delete: ${listEndpoint}`);
          return null;
        }
        
        // Cache the updated list
        await this.cacheResponse(listEndpoint, updatedData);
        
        // Also remove the individual item cache if it exists
        try {
          const cachedItem = await db.apiCache.where('endpoint').equals(endpoint).first();
          if (cachedItem) {
            await db.apiCache.delete(cachedItem.id!);
          }
        } catch (error) {
          // Ignore errors when deleting item cache
        }
        
        offlineLogger.info(`Optimistically removed item from ${listEndpoint}`);
        
        return { success: true, message: 'Deleted (offline)' };
      }
      
      return null;
    } catch (error: any) {
      offlineLogger.error(`Error applying optimistic update for ${endpoint}`, {
        error: error?.message,
      });
      return null;
    }
  }

  // Get list endpoint from detail endpoint
  private getListEndpoint(endpoint: string): string {
    // Remove trailing ID and slash (e.g., /tenants/1/employees/5 -> /tenants/1/employees)
    const parts = endpoint.split('/');
    // Check if last part is a number (ID)
    const lastPart = parts[parts.length - 1];
    if (lastPart && /^\d+$/.test(lastPart)) {
      return parts.slice(0, -1).join('/');
    }
    return endpoint;
  }

  // Extract ID from endpoint
  private extractIdFromEndpoint(endpoint: string): string | number | null {
    const parts = endpoint.split('/');
    const lastPart = parts[parts.length - 1];
    if (lastPart && /^\d+$/.test(lastPart)) {
      return parseInt(lastPart, 10);
    }
    return null;
  }

  // Invalidate related cache entries (for SWR)
  private async invalidateRelatedCache(endpoint: string): Promise<void> {
    try {
      // Only invalidate in browser environment
      if (typeof window === 'undefined') return;
      
      // Import mutate from SWR dynamically to avoid circular dependency
      const { mutate } = await import('swr');
      
      // Invalidate the list endpoint
      const listEndpoint = this.getListEndpoint(endpoint);
      if (listEndpoint) {
        mutate(listEndpoint);
      }
      
      // Invalidate the detail endpoint
      mutate(endpoint);
      
      // Invalidate common related endpoints using matcher function
      if (endpoint.includes('/employees')) {
        mutate(
          (key: string) => typeof key === 'string' && key.includes('/employees'),
          undefined,
          { revalidate: true }
        );
      } else if (endpoint.includes('/patients')) {
        mutate(
          (key: string) => typeof key === 'string' && key.includes('/patients'),
          undefined,
          { revalidate: true }
        );
      } else if (endpoint.includes('/appointments')) {
        mutate(
          (key: string) => typeof key === 'string' && key.includes('/appointments'),
          undefined,
          { revalidate: true }
        );
      } else if (endpoint.includes('/notification')) {
        mutate(
          (key: string) => typeof key === 'string' && key.includes('/notification'),
          undefined,
          { revalidate: true }
        );
      } else if (endpoint.includes('/tenants') || endpoint.includes('/organizations')) {
        mutate(
          (key: string) => typeof key === 'string' && (key.includes('/tenants') || key.includes('/organizations')),
          undefined,
          { revalidate: true }
        );
      }
      
      offlineLogger.debug(`Invalidated SWR cache for ${endpoint} and related endpoints`);
    } catch (error: any) {
      offlineLogger.error(`Error invalidating cache for ${endpoint}`, {
        error: error?.message,
      });
    }
  }
}

// Export singleton instance
export const offlineService = OfflineService.getInstance();

