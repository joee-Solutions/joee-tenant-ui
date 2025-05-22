import React from "react";

const SystemLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="px-10 pt-[32px] pb-[56px]  rounded-md h-fit max-w-6xl mx-auto w-full">
      {children}
    </div>
  );
};

export default SystemLayout;
