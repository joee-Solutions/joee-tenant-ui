import MainHeader from "@/components/shared/MainHeader";
import SideNavigation from "@/components/shared/SideNavigation";
import React from "react";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex">
      <div className="">
        <SideNavigation />
      </div>
      <div className="px-10 lg:pl-72 w-full">
        <MainHeader />
        {children}
        </div>
    </div>
  );
};

export default DashboardLayout;
