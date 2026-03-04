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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Pre-cache in background only (no popup modal)
  useEffect(() => {
    if (typeof window !== 'undefined' && offlineService.getOnlineStatus() && !preCacheService.isCompleted()) {
      preCacheService.preCacheAll({});
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
        <OfflineIndicator />
        <MainHeader isMobileMenuOpen={isMobileMenuOpen} toggleMobileMenu={toggleMobileMenu} />
        {children}
        <OfflineDebugPanel />
      </div>
    </div>
  );
};

export default DashboardLayout;
