"use client";
import { useTenant } from "@/hooks/swr";
import { CircleArrowLeft, Building2, Users2, UserSquare2, CalendarDays, CalendarClock, Settings } from "lucide-react";
import Link from "next/link";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const links = [
  { href: "departments", label: "Departments", Icon: Building2 },
  { href: "employees", label: "Employees", Icon: Users2 },
  { href: "patients", label: "Patients", Icon: UserSquare2 },
  { href: "appointments", label: "Appointments", Icon: CalendarDays },
  { href: "schedule", label: "Schedule", Icon: CalendarClock },
  { href: "manage", label: "Manage Organization", Icon: Settings },
] as const;

const OrgLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const orgSlug = pathname.split("/")[3];
  const base = `/dashboard/organization/${orgSlug}`;
  
  // Get current active tab from pathname
  const currentTab = pathname.split("/")[4] || "departments";

  const { data, isLoading } = useTenant(orgSlug);
  useEffect(() => {
    if (!isLoading && data && typeof data === "object" && (data as { domain?: string }).domain) {
      try {
        localStorage.setItem(`orgDomain:${orgSlug}`, (data as { domain?: string }).domain as string);
      } catch {}
    }
  }, [data, isLoading, orgSlug]);

  const handleTabChange = (value: string) => {
    router.push(`${base}/${value}`);
  };

  return (
    <div className="px-4 pb-20">
      <header className="mb-6">
        <Link
          href="/dashboard/organization"
          className="font-semibold text-2xl text-black gap-2 p-0 flex items-center"
        >
          <CircleArrowLeft className="fill-[#003465] text-white size-[32px]" />
          {typeof data === "object" && data && (data as { name?: string }).name ? (data as { name?: string }).name : "Organization"}
        </Link>
      </header>

      {/* General Overview Section */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">General Overview</h1>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-0">
        <div className="border-b border-gray-200">
          <TabsList className="h-auto bg-transparent p-0 w-full justify-start">
            {links.map(({ href, label }) => (
              <TabsTrigger
                key={href}
                value={href}
                className={cn(
                  "relative px-10 py-3 text-sm font-medium border-b-[7px] border-transparent data-[state=active]:border-[#003465] data-[state=active]:text-[#000000] data-[state=inactive]:text-gray-500 hover:text-gray-700 bg-none !shadow-none rounded-none"
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
