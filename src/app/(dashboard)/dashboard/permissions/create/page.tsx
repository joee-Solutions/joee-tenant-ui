import PermissionForm from "@/components/admin/PermissionForm";
import React from "react";

export default function CreatePermissionPage() {
  return (
    <div className="px-12 pb-20 flex flex-col gap-[30px] w-full">
      <PermissionForm mode="create" />
    </div>
  );
} 