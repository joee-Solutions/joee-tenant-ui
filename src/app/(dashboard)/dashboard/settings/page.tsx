import SystemSettings from "@/components/system/SysemSettings";
import React from "react";

const SettingsPage = () => {
  return (
    <div className="px-12 py-10 pb-20 flex flex-col gap-[30px] shadow-[0px_0px_4px_1px_#0000004D]">
      <SystemSettings />
    </div>
  );
};

export default SettingsPage;
