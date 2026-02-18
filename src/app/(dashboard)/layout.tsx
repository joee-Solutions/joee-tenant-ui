"use client";
import MainHeader from "@/components/shared/MainHeader";
import SideNavigation from "@/components/shared/SideNavigation";
import OfflineIndicator from "@/components/shared/OfflineIndicator";
import PreCacheProgressModal from "@/components/shared/PreCacheProgressModal";
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
  const [preCacheProgress, setPreCacheProgress] = useState<{ current: number; total: number } | null>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Pre-cache all important endpoints on first load
  useEffect(() => {
    // Only pre-cache if online and not already completed
    // Check if user closed the notification (still pre-cache but don't show progress)
    if (typeof window !== 'undefined' && offlineService.getOnlineStatus() && !preCacheService.isCompleted()) {
      const userClosedNotification = localStorage.getItem('user_closed_precache_notification') === 'true';
      
      preCacheService.preCacheAll({
        onProgress: userClosedNotification 
          ? undefined // Don't show progress if user closed notification
          : (current, total) => {
              // Don't pass endpoint - just show progress
              setPreCacheProgress({ current, total });
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
        
        {/* Pre-cache Progress Indicator - User-friendly modal */}
        {preCacheProgress && (
          <PreCacheProgressModal 
            current={preCacheProgress.current}
            total={preCacheProgress.total}
            onMinimize={() => {
              // Don't clear state - just let modal handle minimized state
              // Pre-caching will continue in background and update progress
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardLayout;
