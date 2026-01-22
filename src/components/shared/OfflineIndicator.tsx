"use client";

import { useOffline } from '@/hooks/useOffline';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflineIndicator() {
  const { isOnline, syncStatus, syncPendingActions } = useOffline();

  if (isOnline && syncStatus.pending === 0 && syncStatus.failed === 0) {
    return null; // Don't show indicator when online and no pending actions
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      isOnline ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
    } border rounded-lg shadow-lg p-4 max-w-sm`}>
      <div className="flex items-center gap-3">
        {isOnline ? (
          <Wifi className="w-5 h-5 text-green-600" />
        ) : (
          <WifiOff className="w-5 h-5 text-yellow-600" />
        )}
        
        <div className="flex-1">
          <p className="font-medium text-sm">
            {isOnline ? 'Online' : 'Offline Mode'}
          </p>
          {syncStatus.pending > 0 && (
            <p className="text-xs text-gray-600 mt-1">
              {syncStatus.pending} action(s) pending sync
            </p>
          )}
          {syncStatus.failed > 0 && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {syncStatus.failed} action(s) failed
            </p>
          )}
        </div>

        {isOnline && (syncStatus.pending > 0 || syncStatus.failed > 0) && (
          <Button
            onClick={syncPendingActions}
            size="sm"
            className="h-8 px-3 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Sync
          </Button>
        )}
      </div>
    </div>
  );
}

