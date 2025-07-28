import RoleForm from "@/components/admin/RoleForm";
import React from "react";

export default function CreateRolePage() {
  return (
    <div className="px-12 pb-20 flex flex-col gap-[30px] w-full">
      <RoleForm mode="create" />
    </div>
  );
} 