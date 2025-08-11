"use client";

import { AllOrgTableData } from "@/components/shared/table/data";
import OrgCardStatus from "../OrgStatCard";
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
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import useSWR from "swr";
import { AllOrgChart } from "@/components/icons/icon";
import { cn, formatDateFn } from "@/lib/utils";
import { chartList } from "../page";
import Link from "next/link";
import { Spinner } from "@/components/icons/Spinner";
import { Tenant } from "@/lib/types";
import { useDashboardData } from "@/hooks/swr";

export default function Page() {
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [status, setStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, error } = useSWR(
    `${API_ENDPOINTS.GET_ALL_TENANTS}/active`,
    authFectcher
  );

  // Handle the new standardized response format
  const tenants = Array.isArray(data?.data) ? data.data : [];

  // Use aggregated dashboard counts for stat cards instead of endpoint meta
  const { data: dashboardData } = useDashboardData();
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
    (Object.keys(dashboardData || {}) as Array<
      "totalTenants" | "activeTenants" | "inactiveTenants" | "deactivatedTenants"
    >)
  ).map((key) => {
    const value = dashboardData?.[key] || 0;
    const cardType = keyToCardTypeMap[key];

    return {
      cardType: cardType,
      title: cardType.charAt(0).toUpperCase() + cardType.slice(1) + " Organizations",
      statNum: value,
      orgIcon: <Hospital className={cn("text-white size-5")} />,
      chart: chartList[(cardType as keyof typeof chartList)] || (
        <AllOrgChart className="w-full h-full object-fit" />
      ),
      barChartIcon: <ChartNoAxesColumn />,
      OrgPercentChanges:
        key !== "totalTenants" && dashboardData?.totalTenants
          ? (value * 100) / (dashboardData.totalTenants || 1)
          : 0,
    };
  });

  if (isLoading) {
    return (
      <section className="px-[30px] mb-10">
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-[30px] mb-10">
        <div className="flex items-center justify-center py-8">
          <div className="text-red-500">Failed to load organizations</div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-[30px] mb-10">
      <header className="flex items-center gap-6 justify-between flex-wrap mb-[50px]">
        <h2 className="text-2xl text-black font-normal">Organizations</h2>

        <Button className="font-normal text-base text-white bg-[#003465] w-[306px] h-[60px]">
          Create Organization <Plus size={24} />
        </Button>
      </header>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-[19px] mb-[48px]">
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
      <section className="px-6 py-8 shadow-[0px_0px_4px_1px_#0000004D]">
        <header className="flex items-center justify-between gap-5">
          <h2 className="font-semibold text-xl text-black">
            Active Organization List
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
          {tenants.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                No active organizations found
              </TableCell>
            </TableRow>
          ) : (
            tenants.map((tenant: Tenant) => (
              <TableRow key={tenant.id} className="px-3 relative">
                <TableCell>{tenant.id}</TableCell>
                <TableCell className="py-[21px] ">
                  <Link
                    href={`/dashboard/organization/${tenant.id}`}
                    className="absolute cursor-pointer inset-0"
                  />
                  <div className="flex items-center gap-[10px]">
                    <span className="w-[42px] h-[42px] rounded-full overflow-hidden">
                      <Image
                        src={tenant.logo || orgPlaceholder}
                        alt="organization image"
                        width={42}
                        height={42}
                        className="object-cover aspect-square w-full h-full"
                      />
                    </span>
                    <p className="font-medium text-xs text-black">
                      {tenant.name}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-xs text-[#737373]">
                  {formatDateFn(tenant.created_at)}
                </TableCell>
                <TableCell className="font-semibold text-xs text-[#737373]">
                  {tenant.address || "No address"}
                </TableCell>
                <TableCell
                  className={`font-semibold text-xs ${
                    tenant.status.toLowerCase() === "active"
                      ? "text-[#3FA907]"
                      : "text-[#EC0909]"
                  }`}
                >
                  {tenant.status}
                </TableCell>
              </TableRow>
            ))
          )}
        </DataTable>
        <Pagination
          dataLength={tenants.length}
          numOfPages={Math.ceil(tenants.length / pageSize)}
          pageSize={pageSize}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </section>
    </section>
  );
}
