"use client";

import { AllOrgTableData } from "@/components/shared/table/data";
import OrgCardStatus from "./OrgStatCard";
import orgPlaceholder from "@public/assets/orgPlaceholder.png";

import DataTable from "@/components/shared/table/DataTable";
import DataTableFilter, {
  ListView,
} from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { ChartNoAxesColumn, Hospital, Plus } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import NewOrg from "./NewOrg";
import OrgManagement from "./OrgManagement";
import Link from "next/link";
import { SkeletonBox } from "@/components/shared/loader/skeleton";
import { cn, formatDateFn } from "@/lib/utils";
import {
  ActiveOrgChart,
  AllOrgChart,
  DeactivatedOrgChart,
  InactiveOrgChart,
} from "@/components/icons/icon";
import { useDashboardData, useTenantsData } from "@/hooks/swr";

export const chartList = {
  total: <AllOrgChart className="w-full h-full object-fit" />,
  active: <ActiveOrgChart className="w-full h-full object-fit" />,
  inactive: <InactiveOrgChart className="w-full h-full object-fit" />,
  deactivated: <DeactivatedOrgChart className="w-full h-full object-fit" />,
  all: <AllOrgChart className="w-full h-full object-fit" />,
};

// Type for tenant data
interface TenantData {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  profile?: {
    organization_logo?: string;
    address_metadata?: {
      state?: string;
      country?: string;
    };
  };
}

export default function Page() {
  const [pageSize, setPageSize] = useState(10);
  const [isAddOrg, setIsAddOrg] = useState<"add" | "none" | "edit">("none");
  
  // Fetch dashboard stats
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useDashboardData();
console.log(dashboardData,'dashboardData')
  // Fetch tenants list
  const { data: tenantsData, isLoading: tenantsLoading, error: tenantsError } = useTenantsData();

  console.log(tenantsData, "tenants data");

  const datas = (
    Object.keys(dashboardData?.data || {}) as Array<
      "total" | "active" | "inactive" | "deactivated"
    >
  ).map((key) => {
    const value = dashboardData?.data?.[key] || 0;
    const cardType = key === "total" ? "all" : key;

    return {
      cardType: cardType as "active" | "inactive" | "deactivated" | "all",
      title: key.charAt(0).toUpperCase() + key.slice(1) + " Organizations",
      statNum: value,
      orgIcon: <Hospital className={cn("text-white size-5")} />,
      chart: chartList[key as keyof typeof chartList] || (
        <AllOrgChart className="w-full h-full object-fit" />
      ),
      barChartIcon: <ChartNoAxesColumn />,
      OrgPercentChanges: parseFloat(
        (key !== "total" && dashboardData.data?.total
          ? (value * 100) / dashboardData.data.total
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
          <section className="p-[29px_14px_30px_24px] shadow-[0px_0px_4px_1px_#0000004D]">
            <header className="flex items-center justify-between gap-5">
              <h2 className="font-semibold text-xl text-black">
                Organization List
              </h2>
              <ListView pageSize={pageSize} setPageSize={setPageSize} />
            </header>
            <DataTableFilter />
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
              ) : tenantsData && tenantsData.tenants ? (
                tenantsData.tenants.map((data: TenantData) => {
                  return (
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
                                data?.profile?.organization_logo ||
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
                        {formatDateFn(data?.createdAt)}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-[#737373]">
                        {data?.profile?.address_metadata?.state}{" "}
                        {data?.profile?.address_metadata?.country}{" "}
                      </TableCell>
                      <TableCell
                        className={`font-semibold text-xs ${
                          data?.status?.toLowerCase() === "active"
                            ? "text-[#3FA907]"
                            : "text-[#EC0909]"
                        }`}
                      >
                        {data?.status}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No organizations found
                  </TableCell>
                </TableRow>
              )}
            </DataTable>
            <Pagination
              dataLength={tenantsData?.tenants?.length || 0}
              numOfPages={1}
              pageSize={pageSize}
            />
          </section>
        </>
      )}
    </section>
  );
}
