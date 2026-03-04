"use client";
import { useTenant } from "@/hooks/swr";
import { CircleArrowLeft, Building2, Users2, UserSquare2, CalendarDays, CalendarClock, Settings, Cloud, RotateCcw } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { preCacheService } from "@/lib/offline/preCacheService";
import { offlineService } from "@/lib/offline/offlineService";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";

const links = [
  { href: "departments", label: "Departments", Icon: Building2 },
  { href: "employees", label: "Employees", Icon: Users2 },
  { href: "patients", label: "Patients", Icon: UserSquare2 },
  { href: "appointments", label: "Appointments", Icon: CalendarDays },
  { href: "schedules", label: "Schedules", Icon: CalendarClock },
  { href: "manage", label: "Manage Organization", Icon: Settings },
] as const;

const OrgLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const orgSlug = pathname.split("/")[3];
  const base = `/dashboard/organization/${orgSlug}`;
  const segment4 = pathname.split("/")[4];
  const isBackupPage = segment4 === "backup";

  // Get current active tab from pathname (backup page is not a tab)
  const currentTab = segment4 || "departments";

  const { data, isLoading } = useTenant(orgSlug);
  const tenantId = typeof data === "object" && data && (data as any)?.id != null ? (data as any).id : (orgSlug && /^\d+$/.test(orgSlug) ? parseInt(orgSlug, 10) : null);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [backupModalOpen, setBackupModalOpen] = useState(false);

  const handleCreateBackup = async () => {
    if (!tenantId || typeof tenantId !== "number") {
      toast.error("Organization ID is required to create a backup");
      return;
    }
    setCreatingBackup(true);
    setBackupModalOpen(false);
    try {
      await processRequestAuth("post", API_ENDPOINTS.CREATE_TENANT_BACKUP(tenantId), { tenantId: Number(tenantId) });
      toast.success("Backup created successfully");
    } catch (err: any) {
      console.error("Backup creation error:", err);
      const data = err?.response?.data;
      const message = data?.message || data?.error;
      const validationErrors = data?.validationErrors;
      const detail = Array.isArray(validationErrors)
        ? validationErrors.join(", ")
        : typeof validationErrors === "string"
          ? validationErrors
          : message;
      toast.error(detail || "Backup operation failed. Check backend storage and permissions.");
    } finally {
      setCreatingBackup(false);
    }
  };

  useEffect(() => {
    if (!isLoading && data && typeof data === "object" && (data as { domain?: string }).domain) {
      try {
        localStorage.setItem(`orgDomain:${orgSlug}`, (data as { domain?: string }).domain as string);
      } catch {}
    }
  }, [data, isLoading, orgSlug]);

  // Pre-cache this organization's tab pages when the layout loads
  useEffect(() => {
    if (!isLoading && data && offlineService.getOnlineStatus()) {
      const tenantId = (data as any)?.id || (data as any)?.organization_id;
      if (tenantId && typeof tenantId === 'number') {
        // Pre-cache this organization's data in the background
        preCacheService.preCacheTenant(tenantId).catch((error) => {
          console.warn('Failed to pre-cache organization data:', error);
        });
      }
    }
  }, [data, isLoading]);

  const handleTabChange = (value: string) => {
    router.push(`${base}/${value}`);
  };

  // On /backup route, render only the backup page content (it has its own full UI)
  if (isBackupPage) {
    return <div className="px-4 pb-20">{children}</div>;
  }

  return (
    <div className="px-4 pb-20">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard/organization"
          className="font-semibold text-2xl text-black gap-2 p-0 flex items-center"
        >
          <CircleArrowLeft className="fill-[#003465] text-white size-[32px]" />
          {typeof data === "object" && data && (data as { name?: string }).name ? (data as { name?: string }).name : "Organization"}
        </Link>
        {tenantId != null && (
          <div className="flex items-center gap-2">
            <AlertDialog open={backupModalOpen} onOpenChange={setBackupModalOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={creatingBackup}
                  className="bg-[#003465] text-white hover:bg-[#003465]/90 h-10 px-4 text-sm"
                >
                  <Cloud className="w-4 h-4 mr-2" />
                  {creatingBackup ? "Creating..." : "Backup"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Backup organization</AlertDialogTitle>
                  <AlertDialogDescription>
                    We are about to backup the whole organization data. This may take a moment. Do you want to continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      handleCreateBackup();
                    }}
                    className="bg-[#003465] hover:bg-[#003465]/90"
                  >
                    {creatingBackup ? "Creating..." : "Confirm"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Link href={`/dashboard/organization/${orgSlug}/backup`}>
              <Button
                variant="outline"
                className="h-10 px-4 text-sm border-[#003465] text-[#003465] hover:bg-[#D9EDFF]"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore
              </Button>
            </Link>
          </div>
        )}
      </header>

      {/* General Overview Section */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">General Overview</h1>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-0">
        <div className="border-b border-gray-200 overflow-x-auto">
          <TabsList className="h-auto bg-transparent p-0 w-full justify-start flex-nowrap min-w-max md:min-w-0">
            {links.map(({ href, label }) => (
              <TabsTrigger
                key={href}
                value={href}
                className={cn(
                  "relative px-4 sm:px-6 md:px-8 lg:px-10 py-3 text-xs sm:text-sm font-medium border-b-[7px] border-transparent data-[state=active]:border-[#003465] data-[state=active]:text-[#000000] data-[state=inactive]:text-gray-500 hover:text-gray-700 bg-none !shadow-none rounded-none whitespace-nowrap flex-shrink-0"
                )}
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="w-full">
          {links.map(({ href }) => (
            <TabsContent key={href} value={href} className="mt-6">
              {currentTab === href && !isLoading ? children : null}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};

export default OrgLayout;
