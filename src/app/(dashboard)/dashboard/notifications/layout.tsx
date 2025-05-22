import Breadcrumb from "@/components/notifications/Breadcrumb";
import React from "react";

const NotificationLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="px-12 pb-20 flex flex-col gap-[30px]">
      <Breadcrumb />
      {children}
    </div>
  );
};

export default NotificationLayout;
