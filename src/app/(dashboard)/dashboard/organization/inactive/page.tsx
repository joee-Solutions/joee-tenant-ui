"use client";

import { AllOrgTableData } from "@/components/shared/table/data";
import OrgCardStatus, { InactiveOrgCards } from "../OrgStatCard";
import orgPlaceholder from "@public/assets/orgPlaceholder.png";
import DataTable from "@/components/shared/table/DataTable";
import DataTableFilter, {
  ListView,
} from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState, useRef, useEffect } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  ChartNoAxesColumn,
  Ellipsis,
  Hospital,
  Plus,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AllOrgChart } from "@/components/icons/icon";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import { cn, formatDateFn } from "@/lib/utils";
import useSWR from "swr";
import { chartList } from "../page";
import Link from "next/link";
import { Tenant } from "@/lib/types";
import { useDashboardData } from "@/hooks/swr";

export default function Page() {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [status, setStatus] = useState("");

  const prev = useRef({ search, sortBy, status, pageSize });
  useEffect(() => {
    if (
      prev.current.search !== search ||
      prev.current.sortBy !== sortBy ||
      prev.current.status !== status ||
      prev.current.pageSize !== pageSize
    ) {
      setPage(1);
    }
    prev.current = { search, sortBy, status, pageSize };
  }, [search, sortBy, status, pageSize]);

  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (sortBy) params.append("sort", sortBy);
  if (status) params.append("status", status);
  params.append("page", String(page));
  params.append("limit", String(pageSize));

  const { data, isLoading, error } = useSWR(
    `${API_ENDPOINTS.GET_ALL_TENANTS}/inactive?${params.toString()}`,
    authFectcher
  );

  // Use aggregated dashboard counts for the cards instead of pagination meta
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
      cardType,
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
            Inactive Organization List
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
          {!isLoading && data.length === 0 && (
            <TableRow key={data.id} className="px-3 relative">
              <TableCell className="py-[21px] ">Empty</TableCell>
            </TableRow>
          )}
          {data?.data &&
            data.data?.length > 0 &&
            data.data?.map((data: Tenant) => {
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
                            data?.profile?.organization_logo || orgPlaceholder
                          }
                          alt="organization image"
                          className="object-cover aspect-square w-full h-full"
                        />
                      </span>
                      <p className="font-medium text-xs text-black">
                        {data.name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-[#737373]">
                    {formatDateFn(data.createdAt)}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-[#737373]">
                    {/* {data?.profile?.address_metadata.state},{" "} */}
                    {data?.address}{" "}
                  </TableCell>
                  <TableCell
                    className={`font-semibold text-xs ${
                      data.status.toLowerCase() === "active"
                        ? "text-[#3FA907]"
                        : "text-[#EC0909]"
                    }`}
                  >
                    {data.status}
                  </TableCell>
                </TableRow>
              );
            })}
        </DataTable>
        <Pagination
          dataLength={data?.meta?.total || 0}
          numOfPages={data?.meta?.total ? Math.ceil(data.meta.total / pageSize) : 1}
          pageSize={pageSize}
          currentPage={page}
          setCurrentPage={setPage}
        />
      </section>
    </section>
  );
}
