"use client";
import MainHeader from "@/components/shared/MainHeader";
import SideNavigation from "@/components/shared/SideNavigation";
import React, { useState } from "react";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

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
      </div>
    </div>
  );
};

export default DashboardLayout;
