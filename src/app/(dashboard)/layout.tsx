"use client";
import MainHeader from "@/components/shared/MainHeader";
import SideNavigation from "@/components/shared/SideNavigation";
import OfflineIndicator from "@/components/shared/OfflineIndicator";
import React, { useState, useEffect } from "react";
import { preCacheService } from "@/lib/offline/preCacheService";
import { offlineService } from "@/lib/offline/offlineService";
import dynamic from "next/dynamic";

// Only load debug panel in development - not bundled in production
const OfflineDebugPanel = process.env.NODE_ENV === 'development' 
  ? dynamic(() => import("@/components/shared/OfflineDebugPanel"), { ssr: false })
  : () => null;

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [preCacheProgress, setPreCacheProgress] = useState<{ current: number; total: number; endpoint: string } | null>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Pre-cache all important endpoints on first load
  useEffect(() => {
    // Only pre-cache if online and not already completed
    if (typeof window !== 'undefined' && offlineService.getOnlineStatus() && !preCacheService.isCompleted()) {
      preCacheService.preCacheAll({
        onProgress: (current, total, endpoint) => {
          setPreCacheProgress({ current, total, endpoint });
        },
      }).then(() => {
        setPreCacheProgress(null);
      });
    }
  }, []);

  return (
    <div className="flex w-full relative">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:!block ">
        <SideNavigation isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      </div>

      {/* Mobile Sidebar Overlay - Shows on mobile when menu is open */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[150]"
            onClick={toggleMobileMenu}
          />
          {/* Mobile Sidebar */}
          <div className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-[160] transform transition-transform duration-300 ease-in-out">
            <SideNavigation isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex flex-col gap-[49px] lg:pl-72 w-full">
        <MainHeader isMobileMenuOpen={isMobileMenuOpen} toggleMobileMenu={toggleMobileMenu} />
        {children}
        <OfflineIndicator />
        <OfflineDebugPanel />
        
        {/* Pre-cache Progress Indicator */}
        {preCacheProgress && (
          <div className="fixed bottom-20 right-4 z-40 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm max-w-sm">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              </div>
              <div className="flex-1">
                <p className="font-medium">Pre-caching for offline mode...</p>
                <p className="text-xs opacity-90">
                  {preCacheProgress.current} / {preCacheProgress.total} endpoints
                </p>
                <p className="text-xs opacity-75 truncate">
                  {preCacheProgress.endpoint}
                </p>
              </div>
            </div>
            <div className="mt-2 w-full bg-blue-700 rounded-full h-1.5">
              <div
                className="bg-white h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(preCacheProgress.current / preCacheProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardLayout;
