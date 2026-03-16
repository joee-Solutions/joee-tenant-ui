"use client";

import { useAdminProfile } from "@/hooks/swr";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function SuperAdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: adminProfile, isLoading } = useAdminProfile();

  const roles: string[] = Array.isArray(adminProfile)
    ? (adminProfile[0]?.roles ?? [])
    : (adminProfile?.roles ?? []);
  const isSuperAdmin = roles.some((r) => String(r) === "Super_Admin");

  useEffect(() => {
    if (isLoading) return;
    if (!isSuperAdmin) {
      router.replace("/dashboard");
    }
  }, [isLoading, isSuperAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-[#003465] border-blue-200" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return <>{children}</>;
}
