"use client";

import { AllOrgTableData } from "@/components/shared/table/data";
import OrgCardStatus from "./OrgStatCard";
import orgPlaceholder from "@public/assets/orgPlaceholder.png";

import DataTable from "@/components/shared/table/DataTable";
import DataTableFilter, {
  ListView,
} from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState, useEffect, useRef } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { ChartNoAxesColumn, Hospital, Plus } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import NewOrg from "./NewOrg";
import OrgManagement from "./OrgManagement";
import Link from "next/link";
import { SkeletonBox } from "@/components/shared/loader/skeleton";
import { cn, formatDateFn } from "@/lib/utils";
import { useDashboardData, useTenantsData } from "@/hooks/swr";
import { Tenant } from "@/lib/types";
import { AllOrgChart } from "@/components/icons/icon";
import { chartList } from "@/components/icons/chart";


export default function Page() {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [status, setStatus] = useState("");
  const [isAddOrg, setIsAddOrg] = useState<"add" | "none" | "edit">("none");

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
  const mappedStatus = status ? status.toUpperCase() : undefined;
  // Fetch tenants list with filters
  const { data: tenantsData, meta, isLoading: tenantsLoading, error: tenantsError } = useTenantsData({
    search,
    sort: mappedSort,
    status: mappedStatus,
    page,
    limit: pageSize,
  });

  console.log(tenantsData, "tenants data");

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

  const keyToCardTypeMap: Record<
    "totalTenants" | "activeTenants" | "inactiveTenants" | "deactivatedTenants",
    "all" | "active" | "inactive" | "deactivated"
  > = {
    totalTenants: "all",
    activeTenants: "active",
    inactiveTenants: "inactive",
    deactivatedTenants: "deactivated",
  };
  const datas = (
    Object.keys(dashboardData || {}) as Array<
      "totalTenants" | "activeTenants" | "inactiveTenants" | "deactivatedTenants"
    >
  ).map((key) => {
    const value = dashboardData?.[key] || 0;
    const cardType = keyToCardTypeMap[key];

    return {
      cardType: cardType as "active" | "inactive" | "deactivated" | "all",
      title: cardType.charAt(0).toUpperCase() + cardType.slice(1) + " Organizations",
      statNum: value,
      orgIcon: <Hospital className={cn("text-white size-5")} />,
      chart: chartList[key as keyof typeof chartList] || (
        <AllOrgChart className="w-full h-full object-fit" />
      ),
      barChartIcon: <ChartNoAxesColumn />,
      OrgPercentChanges: parseFloat(
        (key !== "totalTenants" && dashboardData?.totalTenants
          ? (value * 100) / dashboardData.totalTenants
          : 0
        ).toFixed(2)
      ),
    };
  });

  console.log(datas);

  // Handle error states
  if (dashboardError || tenantsError) {
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
              <SkeletonBox className="h-[250px] w-full" />
              <SkeletonBox className="h-[250px] w-full" />
              <SkeletonBox className="h-[250px] w-full" />
              <SkeletonBox className="h-[250px] w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[19px] mb-[48px]">
              {datas.map((org) => (
                <OrgCardStatus
                  key={org.cardType}
                  title={org.title}
                  statNum={org.statNum}
                  cardType={org.cardType}
                  chart={org.chart}
                  orgIcon={org.orgIcon}
                  barChartIcon={org.barChartIcon}
                  OrgPercentChanges={
                    org.OrgPercentChanges ? org.OrgPercentChanges : undefined
                  }
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
              ) : Array.isArray(tenantsData) && tenantsData.length > 0 ? (
                tenantsData.map((data: any) => (
                  <TableRow key={data.id} className="px-3 relative">
                    <TableCell>{data.id}</TableCell>
                    <TableCell className="py-[21px] ">
                      <Link
                        href={`/dashboard/organization/${data.id}`}
                        className="absolute cursor-pointer inset-0"
                      />
                      <div className="flex items-center gap-[10px]">
                        <span className="w-[42px] h-42px rounded-full overflow-hidden">
                          <Image
                            src={
                              data?.logo ||
                              orgPlaceholder
                            }
                            alt="organization image"
                            className="object-cover aspect-square w-full h-full"
                          />
                        </span>
                        <p className="font-medium text-xs text-black">
                          {data?.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {formatDateFn(data?.created_at)}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {data?.address}{" "}
                    </TableCell>
                    <TableCell
                      className={`font-semibold text-xs ${data?.status?.toLowerCase() === "active"
                          ? "text-[#3FA907]"
                          : "text-[#EC0909]"
                        }`}
                    >
                      {data?.status?.toUpperCase()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No organizations found
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
