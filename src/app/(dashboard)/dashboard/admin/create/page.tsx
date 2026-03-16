"use client";

import AdminForm from "@/components/admin/AdminForm";
import SuperAdminGuard from "@/components/admin/SuperAdminGuard";
import React from "react";

const CreateAdminPage = () => {
  return (
    <SuperAdminGuard>
      <div className="px-10 pt-[32px] pb-[56px] shadow-[0px_0px_4px_1px_#0000004D] rounded-md h-fit max-w-6xl mx-auto w-full">
        <AdminForm />
      </div>
    </SuperAdminGuard>
  );
};

export default CreateAdminPage;
