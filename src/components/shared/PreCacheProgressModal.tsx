"use client";

import { useState, useEffect } from "react";
import { Minimize2, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreCacheProgressModalProps {
  current: number;
  total: number;
  onMinimize: () => void;
}

export default function PreCacheProgressModal({
  current,
  total,
  onMinimize,
}: PreCacheProgressModalProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [localProgress, setLocalProgress] = useState({ current, total });
  const percentage = Math.round((localProgress.current / localProgress.total) * 100);

  // Check if user previously closed this notification
  useEffect(() => {
    const userClosedPreCache = localStorage.getItem('user_closed_precache_notification');
    if (userClosedPreCache === 'true') {
      setIsClosed(true);
      onMinimize();
    }
  }, [onMinimize]);

  // Update local progress when props change (even when minimized)
  useEffect(() => {
    setLocalProgress({ current, total });
    
    // Auto-close when pre-caching completes
    if (current >= total && total > 0) {
      // Wait a moment to show 100%, then close
      const timer = setTimeout(() => {
        setIsMinimized(true);
        setIsClosed(true);
        onMinimize();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [current, total, onMinimize]);

  const handleMinimize = () => {
    setIsMinimized(true);
    onMinimize();
  };

  const handleClose = () => {
    setIsClosed(true);
    setIsMinimized(true);
    // Store user preference to not show this notification again
    localStorage.setItem('user_closed_precache_notification', 'true');
    onMinimize();
  };

  const handleRestore = () => {
    setIsMinimized(false);
    setIsClosed(false);
  };

  // Don't render anything if user closed it
  if (isClosed) {
    return null;
  }

  // Show minimized button when minimized (only if not complete)
  // Position it above the offline indicator to avoid overlap
  if (isMinimized && percentage < 100) {
    return (
      <button
        onClick={handleRestore}
        className="fixed bottom-20 right-4 z-50 bg-blue-600 text-white rounded-full shadow-lg p-3 hover:bg-blue-700 transition-all duration-300 hover:scale-105"
        title={`Preparing offline mode (${percentage}%) - Click to view progress`}
      >
        <Download className="w-5 h-5 animate-pulse" />
      </button>
    );
  }

  // Don't render anything if minimized and complete
  if (isMinimized && percentage >= 100) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                Preparing Offline Mode
              </h3>
              <p className="text-sm text-gray-600">
                Setting up offline access for you...
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMinimize}
              className="text-gray-500 hover:text-gray-700"
              title="Minimize (will continue in background)"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
              title="Close (pre-caching will continue in background)"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {percentage < 100 ? "Loading..." : "Almost done..."}
            </span>
            <span className="text-gray-500 font-medium">
              {percentage}%
            </span>
          </div>

          <p className="text-xs text-gray-500 text-center pt-2">
            This will only take a moment. You can minimize or close this window and continue using the app. Pre-caching will continue in the background.
          </p>
        </div>
      </div>
    </div>
  );
}

