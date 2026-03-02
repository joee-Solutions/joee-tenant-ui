"use client";

import { useEffect } from "react";
import { useOffline } from "@/hooks/useOffline";
import { WifiOff } from "lucide-react";

export default function OfflineIndicator() {
  const { isOnline, syncStatus, syncPendingActions } = useOffline();

  // Auto-sync in the background when online (no UI, no modal)
  useEffect(() => {
    if (isOnline && syncStatus.pending > 0 && syncStatus.syncing === 0) {
      syncPendingActions();
    }
  }, [isOnline, syncStatus.pending, syncStatus.syncing, syncPendingActions]);

  // Only show a top-of-page banner when offline; no popup/modal when online
  if (isOnline) return null;

  return (
    <div className="sticky top-0 left-0 right-0 z-40 flex items-center justify-center gap-2 bg-amber-500 text-amber-950 px-4 py-2 text-sm font-medium shadow-sm">
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span>
        You&apos;re offline. You can continue using the app; your changes will sync when you&apos;re back online.
      </span>
    </div>
  );
}
