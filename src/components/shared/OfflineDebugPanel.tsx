"use client";

import { useState, useEffect } from 'react';
import { useOffline } from '@/hooks/useOffline';
import { offlineLogger } from '@/lib/offline/offlineLogger';
import { db } from '@/lib/offline/database';
import { preCacheService } from '@/lib/offline/preCacheService';
import { Button } from '@/components/ui/button';
import { X, RefreshCw, Trash2, Download, Database } from 'lucide-react';

export default function OfflineDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [cacheStats, setCacheStats] = useState({
    totalCached: 0,
    totalQueued: 0,
    pendingActions: 0,
    failedActions: 0,
  });
  const [logs, setLogs] = useState<any[]>([]);
  const { isOnline, syncStatus } = useOffline();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const cached = await db.apiCache.count();
        const queued = await db.syncQueue.count();
        const pending = await db.syncQueue.where('status').equals('pending').count();
        const failed = await db.syncQueue.where('status').equals('failed').count();

        setCacheStats({
          totalCached: cached,
          totalQueued: queued,
          pendingActions: pending,
          failedActions: failed,
        });
      } catch (error) {
        console.error('Error loading cache stats:', error);
      }
    };

    if (isOpen) {
      loadStats();
      const interval = setInterval(loadStats, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setLogs(offlineLogger.getLogs().slice(-20).reverse()); // Last 20 logs, newest first
      const interval = setInterval(() => {
        setLogs(offlineLogger.getLogs().slice(-20).reverse());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
      >
        Offline Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-bold text-lg">Offline Mode Debug</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* Status */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Status</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Connection:</span>
              <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Pending Sync:</span>
              <span>{syncStatus.pending}</span>
            </div>
            <div className="flex justify-between">
              <span>Failed Actions:</span>
              <span className="text-red-600">{syncStatus.failed}</span>
            </div>
          </div>
        </div>

        {/* Cache Stats */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Cache Statistics</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Cached Endpoints:</span>
              <span>{cacheStats.totalCached}</span>
            </div>
            <div className="flex justify-between">
              <span>Queued Actions:</span>
              <span>{cacheStats.totalQueued}</span>
            </div>
            <div className="flex justify-between">
              <span>Pending:</span>
              <span>{cacheStats.pendingActions}</span>
            </div>
            <div className="flex justify-between">
              <span>Failed:</span>
              <span className="text-red-600">{cacheStats.failedActions}</span>
            </div>
          </div>
        </div>

        {/* Pre-cache Status */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Pre-cache Status</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={preCacheService.isCompleted() ? 'text-green-600' : 'text-yellow-600'}>
                {preCacheService.isCompleted() ? 'Completed' : 'Not Started'}
              </span>
            </div>
            {preCacheService.getPreCacheTimestamp() && (
              <div className="flex justify-between">
                <span>Last Pre-cache:</span>
                <span className="text-xs">
                  {new Date(preCacheService.getPreCacheTimestamp()!).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Actions</h4>
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                preCacheService.resetPreCache();
                await preCacheService.preCacheAll({
                  onProgress: (current, total, endpoint) => {
                    console.log(`Pre-caching ${current}/${total}: ${endpoint}`);
                  },
                });
              }}
              className="text-xs w-full"
            >
              <Database className="w-3 h-3 mr-1" />
              Pre-cache All Now
            </Button>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const logs = offlineLogger.getLogs();
                  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `offline-logs-${new Date().toISOString()}.json`;
                  a.click();
                }}
                className="text-xs flex-1"
              >
                <Download className="w-3 h-3 mr-1" />
                Export Logs
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  offlineLogger.clearLogs();
                  setLogs([]);
                }}
                className="text-xs flex-1"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear Logs
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Logs */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Recent Logs</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-2 rounded border-l-2 ${
                    log.level === 'error'
                      ? 'border-red-500 bg-red-50'
                      : log.level === 'warn'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{log.message}</span>
                    <span className="text-gray-500 text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {log.data && (
                    <pre className="mt-1 text-xs overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

