import { useState, useEffect } from 'react';
import { offlineService } from '@/lib/offline/offlineService';
import { db } from '@/lib/offline/database';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState({
    pending: 0,
    syncing: 0,
    failed: 0,
  });

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      offlineService.syncPendingActions();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update sync status periodically
    const updateSyncStatus = async () => {
      const status = await offlineService.getSyncStatus();
      setSyncStatus(status);
    };

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000); // Update every 5 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    syncStatus,
    syncPendingActions: () => offlineService.syncPendingActions(),
  };
}

// Hook to use cached data
export function useCachedData<T>(endpoint: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(typeof window !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Check if we're in browser environment and db is available
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }
      
      try {
        if (navigator.onLine) {
          try {
            const result = await fetcher();
            setData(result);
          } catch (error) {
            // If online fetch fails, try cache
            try {
              const cached = await db.apiCache
                .where('endpoint')
                .equals(endpoint)
                .and((item) => item.expiresAt > new Date())
                .first();
              
              if (cached) {
                setData(cached.data);
              }
            } catch (cacheError) {
              console.error('Error accessing cache:', cacheError);
            }
          }
        } else {
          // Offline - use cache
          try {
            const cached = await db.apiCache
              .where('endpoint')
              .equals(endpoint)
              .and((item) => item.expiresAt > new Date())
              .first();
            
            if (cached) {
              setData(cached.data);
            }
          } catch (cacheError) {
            console.error('Error accessing cache:', cacheError);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [endpoint, fetcher]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { data, isLoading, isOffline };
}

