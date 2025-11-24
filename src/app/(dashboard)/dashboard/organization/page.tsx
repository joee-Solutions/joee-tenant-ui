"use client";

import { AllOrgTableData } from "@/components/shared/table/data";
import StatCard from "@/components/dashboard/StatCard";
import orgPlaceholder from "@public/assets/orgPlaceholder.png";

import DataTable from "@/components/shared/table/DataTable";
import DataTableFilter, {
  ListView,
} from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Plus, Building2, UserRoundPlus, UserRound, UserRoundX } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import NewOrg from "./NewOrg";
import OrgManagement from "./OrgManagement";
import Link from "next/link";
import { SkeletonBox } from "@/components/shared/loader/skeleton";
import { formatDateFn } from "@/lib/utils";
import { useDashboardData, useTenantsData } from "@/hooks/swr";
import { Tenant } from "@/lib/types";
import { useSearchParams } from "next/navigation";


export default function Page() {
  const searchParams = useSearchParams();
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [status, setStatus] = useState("");
  const [isAddOrg, setIsAddOrg] = useState<"add" | "none" | "edit">("none");

  // Read search query from URL params
  useEffect(() => {
    const urlSearch = searchParams?.get("search") || "";
    if (urlSearch) {
      setSearch(urlSearch);
    }
  }, [searchParams]);

  // Fetch dashboard stats
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useDashboardData();
  // Map sortBy to backend fields
  const sortFieldMap: Record<string, string> = {
    Name: "name",
    Date: "createdAt",
    Location: "domain",
    Status: "status",
  };
  const mappedSort = sortBy && sortFieldMap[sortBy] ? `${sortFieldMap[sortBy]}:asc` : undefined;
  // Fetch all tenants (without status filter - we'll filter on frontend)
  const { data: allTenantsData, meta, isLoading: tenantsLoading, error: tenantsError } = useTenantsData({
    search,
    sort: mappedSort,
    // Don't pass status to API - filter on frontend instead
    page,
    limit: pageSize,
  });

  // Filter organizations by status on the frontend
  const tenantsData = useMemo(() => {
    if (!Array.isArray(allTenantsData)) return [];
    
    if (!status) {
      // No filter - return all
      return allTenantsData;
    }
    
    // Filter by status (case-insensitive)
    // Check if organization status matches the selected filter
    const statusLower = status.toLowerCase();
    return allTenantsData.filter((org: any) => {
      const orgStatus = org?.status?.toLowerCase() || '';
      return orgStatus === statusLower;
    });
  }, [allTenantsData, status]);

  const prevFilters = useRef({ search, sortBy, status, pageSize });
  useEffect(() => {
    if (
      prevFilters.current.search !== search ||
      prevFilters.current.sortBy !== sortBy ||
      prevFilters.current.status !== status ||
      prevFilters.current.pageSize !== pageSize
    ) {
      setPage(1);
    }
    prevFilters.current = { search, sortBy, status, pageSize };
  }, [search, sortBy, status, pageSize]);

  // Map dashboard data to StatCard format
  const statsCards = [
    {
      key: "totalTenants" as const,
      title: "All Organizations",
      value: dashboardData?.totalTenants || 0,
      growth: null as number | null,
      color: "blue" as const,
      icon: <Building2 className="text-white size-5" />,
    },
    {
      key: "activeTenants" as const,
      title: "Active Organizations",
      value: dashboardData?.activeTenants || 0,
      growth: dashboardData?.totalTenants
        ? parseFloat(
            ((dashboardData.activeTenants * 100) / dashboardData.totalTenants).toFixed(2)
          )
        : null,
      color: "green" as const,
      icon: <UserRoundPlus className="text-white size-5" />,
    },
    {
      key: "inactiveTenants" as const,
      title: "Inactive Organizations",
      value: dashboardData?.inactiveTenants || 0,
      growth: dashboardData?.totalTenants
        ? parseFloat(
            ((dashboardData.inactiveTenants * 100) / dashboardData.totalTenants).toFixed(2)
          )
        : null,
      color: "yellow" as const,
      icon: <UserRound className="text-white size-5" />,
    },
    {
      key: "deactivatedTenants" as const,
      title: "Deactivated Organizations",
      value: dashboardData?.deactivatedTenants || 0,
      growth: dashboardData?.totalTenants
        ? parseFloat(
            ((dashboardData.deactivatedTenants * 100) / dashboardData.totalTenants).toFixed(2)
          )
        : null,
      color: "red" as const,
      icon: <UserRoundX className="text-white size-5" />,
    },
  ];

  // Handle error states - only show error page for critical dashboard errors
  // For tenants data, empty results should show empty state in table, not error page
  if (dashboardError) {
    return (
      <section className="px-[30px] mb-10">
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <h2 className="text-2xl font-semibold text-red-600">Failed to Load Organizations</h2>
          <p className="text-gray-600">Please try refreshing the page or contact support.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="px-[30px] mb-10">
      {isAddOrg === "add" ? (
        <NewOrg setIsAddOrg={setIsAddOrg} />
      ) : isAddOrg === "edit" ? (
        <OrgManagement setIsAddOrg={setIsAddOrg} />
      ) : (
        <>
          <header className="flex items-center gap-6 justify-between flex-wrap mb-[50px]">
            <h2 className="text-2xl text-black font-normal">Organizations</h2>

            <Button
              onClick={() => setIsAddOrg("add")}
              className="font-normal text-base text-white bg-[#003465] w-[306px] h-[60px]"
            >
              Create Organization <Plus size={24} />
            </Button>
          </header>

          {dashboardLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <SkeletonBox className="h-[300px] w-full" />
              <SkeletonBox className="h-[300px] w-full" />
              <SkeletonBox className="h-[300px] w-full" />
              <SkeletonBox className="h-[300px] w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-[48px]">
              {statsCards.map((stat) => (
                <StatCard
                  key={stat.key}
                  title={stat.title}
                  value={stat.value}
                  growth={stat.growth}
                  color={stat.color}
                  icon={stat.icon}
                />
              ))}
            </div>
          )}
          <section className="px-6 py-8 shadow-[0px_0px_4px_1px_#0000004D]">
            <header className="flex items-center justify-between gap-5">
              <h2 className="font-semibold text-xl text-black">
                Organization List
              </h2>
              <ListView pageSize={pageSize} setPageSize={setPageSize} />
            </header>
            <DataTableFilter
              search={search}
              setSearch={setSearch}
              sortBy={sortBy}
              setSortBy={setSortBy}
              status={status}
              setStatus={setStatus}
            />
            <DataTable tableDataObj={AllOrgTableData[0]}>
              {tenantsLoading ? (
                // Loading skeleton for table rows
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="px-3 relative">
                    <TableCell><SkeletonBox className="h-4 w-8" /></TableCell>
                    <TableCell className="py-[21px]">
                      <div className="flex items-center gap-[10px]">
                        <SkeletonBox className="w-[42px] h-[42px] rounded-full" />
                        <SkeletonBox className="h-4 w-24" />
                      </div>
                    </TableCell>
                    <TableCell><SkeletonBox className="h-4 w-20" /></TableCell>
                    <TableCell><SkeletonBox className="h-4 w-16" /></TableCell>
                    <TableCell><SkeletonBox className="h-4 w-12" /></TableCell>
                  </TableRow>
                ))
              ) : tenantsError ? (
                // Show error message
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-red-600 font-medium">Failed to load organizations</p>
                      <p className="text-gray-500 text-sm">
                        {tenantsError?.message || "Please try again or refresh the page"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : Array.isArray(tenantsData) && tenantsData.length > 0 ? (
                tenantsData.map((data: any, index: number) => (
                  <TableRow key={data.id} className="px-3 relative">
                    <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                    <TableCell className="py-[21px] ">
                      <Link
                        href={`/dashboard/organization/${data.id}`}
                        className="absolute cursor-pointer inset-0"
                      />
                      <div className="flex items-center gap-[10px]">
                        <span className="w-[42px] h-[42px] rounded-full overflow-hidden">
                          <Image
                            src={
                              data?.logo ||
                              orgPlaceholder
                            }
                            alt="organization image"
                            width={42}
                            height={42}
                            className="object-cover aspect-square w-full h-full"
                          />
                        </span>
                        <p className="font-medium text-xs text-black">
                          {data?.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {formatDateFn(data?.created_at || data?.createdAt)}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {data?.address}{" "}
                    </TableCell>
                    <TableCell
                      className={`font-semibold text-xs ${
                        data?.status?.toLowerCase() === "active"
                          ? "text-[#3FA907]"
                          : data?.status?.toLowerCase() === "inactive"
                          ? "text-[#EC0909]"
                          : data?.status?.toLowerCase() === "deactivated"
                          ? "text-[#999999]"
                          : "text-[#737373]"
                      }`}
                    >
                      {data?.status?.toUpperCase() || "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    {status 
                      ? `No ${status.toLowerCase()} organizations found` 
                      : "No organizations found"}
                  </TableCell>
                </TableRow>
              )}
            </DataTable>
            <Pagination
              dataLength={meta?.total || tenantsData?.length || 0}
              numOfPages={meta?.total ? Math.ceil(meta.total / pageSize) : 1}
              pageSize={pageSize}
              currentPage={page}
              setCurrentPage={setPage}
            />
          </section>
        </>
      )}
    </section>
  );
}
