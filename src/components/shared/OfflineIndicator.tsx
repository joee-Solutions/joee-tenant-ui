"use client";

import { useState, useEffect } from 'react';
import { useOffline } from '@/hooks/useOffline';
import { Wifi, WifiOff, RefreshCw, AlertCircle, ChevronDown, ChevronUp, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflineIndicator() {
  const { isOnline, syncStatus, syncPendingActions } = useOffline();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Don't show when online with no pending actions (unless minimized and has sync history)
  // But respect user preference to hide when synced
  const hideWhenSynced = typeof window !== 'undefined' && 
    localStorage.getItem('user_hide_offline_indicator_when_synced') === 'true';

  // Update last sync time when sync completes
  useEffect(() => {
    if (isOnline && syncStatus.pending === 0 && syncStatus.failed === 0 && syncStatus.syncing === 0) {
      if (isSyncing) {
        setLastSyncTime(new Date());
        setIsSyncing(false);
      }
    } else if (syncStatus.syncing > 0) {
      setIsSyncing(true);
    }
  }, [syncStatus, isOnline, isSyncing]);

  // Show indicator if user closed it but there are new pending/failed actions
  // Reset the preference when there are new actions
  useEffect(() => {
    if ((syncStatus.pending > 0 || syncStatus.failed > 0) && hideWhenSynced) {
      localStorage.removeItem('user_hide_offline_indicator_when_synced');
    }
  }, [syncStatus.pending, syncStatus.failed, hideWhenSynced]);

  // Early return after all hooks are called
  if (isOnline && syncStatus.pending === 0 && syncStatus.failed === 0 && !isMinimized) {
    // If user closed it when synced, don't show it again
    if (hideWhenSynced) {
      return null;
    }
    // Otherwise, auto-hide when synced (default behavior)
    return null;
  }

  const getStatusMessage = () => {
    if (!isOnline) {
      return {
        title: 'You\'re Offline',
        description: 'Working in offline mode. Your changes will sync when you reconnect.',
        color: 'yellow'
      };
    }
    
    if (syncStatus.syncing > 0) {
      return {
        title: 'Syncing Changes',
        description: 'Saving your changes in the background...',
        color: 'blue'
      };
    }
    
    if (syncStatus.pending > 0) {
      return {
        title: 'Changes Pending',
        description: `${syncStatus.pending} change${syncStatus.pending > 1 ? 's' : ''} waiting to sync. Click to sync now.`,
        color: 'blue'
      };
    }
    
    if (syncStatus.failed > 0) {
      return {
        title: 'Sync Failed',
        description: `${syncStatus.failed} change${syncStatus.failed > 1 ? 's' : ''} failed to sync. Please try again.`,
        color: 'red'
      };
    }
    
    if (lastSyncTime) {
      const minutesAgo = Math.floor((new Date().getTime() - lastSyncTime.getTime()) / 60000);
      return {
        title: 'All Synced',
        description: minutesAgo < 1 ? 'Just now' : `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`,
        color: 'green'
      };
    }
    
    return {
      title: 'Online',
      description: 'All changes are synced',
      color: 'green'
    };
  };

  const status = getStatusMessage();

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
          status.color === 'green' ? 'bg-green-50 border-green-200' :
          status.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
          status.color === 'red' ? 'bg-red-50 border-red-200' :
          'bg-blue-50 border-blue-200'
        } border rounded-full shadow-lg p-3 hover:scale-105`}
        title={status.title}
      >
        {!isOnline ? (
          <WifiOff className="w-5 h-5 text-yellow-600" />
        ) : syncStatus.syncing > 0 ? (
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
        ) : syncStatus.failed > 0 ? (
          <AlertCircle className="w-5 h-5 text-red-600" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        )}
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      status.color === 'green' ? 'bg-green-50 border-green-200' :
      status.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
      status.color === 'red' ? 'bg-red-50 border-red-200' :
      'bg-blue-50 border-blue-200'
    } border rounded-lg shadow-lg p-4 max-w-sm`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {!isOnline ? (
            <WifiOff className="w-5 h-5 text-yellow-600" />
          ) : syncStatus.syncing > 0 ? (
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          ) : syncStatus.failed > 0 ? (
            <AlertCircle className="w-5 h-5 text-red-600" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900">
            {status.title}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {status.description}
          </p>
          
          {syncStatus.pending > 0 && !syncStatus.syncing && (
            <p className="text-xs text-gray-500 mt-1">
              {syncStatus.pending} pending • {syncStatus.failed > 0 && `${syncStatus.failed} failed`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {isOnline && (syncStatus.pending > 0 || syncStatus.failed > 0) && !syncStatus.syncing && (
            <Button
              onClick={async () => {
                setIsSyncing(true);
                await syncPendingActions();
              }}
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={syncStatus.syncing > 0}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${syncStatus.syncing > 0 ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          )}
          
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setIsMinimized(true)}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              title="Minimize"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            {isOnline && syncStatus.pending === 0 && syncStatus.failed === 0 && (
              <Button
                onClick={() => {
                  // Hide indicator when user closes it (only if synced)
                  setIsMinimized(true);
                  // Store preference to hide when synced
                  localStorage.setItem('user_hide_offline_indicator_when_synced', 'true');
                }}
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

