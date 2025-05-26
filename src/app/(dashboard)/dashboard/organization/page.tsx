"use client";

import { AllOrgTableData } from "@/components/shared/table/data";
import OrgCardStatus, { cards } from "./OrgStatCard";
import orgPlaceholder from "@public/assets/orgPlaceholder.png";

import DataTable from "@/components/shared/table/DataTable";
import DataTableFilter, {
  ListView,
} from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { ChartNoAxesColumn, Ellipsis, Hospital, Plus } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import NewOrg from "./NewOrg";
import OrgManagement from "./OrgManagement";
import Link from "next/link";
import { authFectcher } from "@/hooks/swr";
import useSWR from "swr";
import { SkeletonBox } from "@/components/shared/loader/skeleton";
import { cn, formatDateFn } from "@/lib/utils";
import {
  ActiveOrgChart,
  AllOrgChart,
  DeactivatedOrgChart,
  InactiveOrgChart,
} from "@/components/icons/icon";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { formatDate } from "date-fns";

export const chartList = {
  total: <AllOrgChart className="w-full h-full object-fit" />,
  active: <ActiveOrgChart className="w-full h-full object-fit" />,
  inactive: <InactiveOrgChart className="w-full h-full object-fit" />,
  deactivated: <DeactivatedOrgChart className="w-full h-full object-fit" />,
  all: <AllOrgChart className="w-full h-full object-fit" />,
};

export default function Page() {
  const [pageSize, setPageSize] = useState(10);
  const [isAddOrg, setIsAddOrg] = useState<"add" | "none" | "edit">("none");
  const { data, isLoading, error } = useSWR<{
    total: number;
    active: number;
    inactive: number;
    deactivated: number;
  }>(API_ENDPOINTS.GET_DASHBOARD_DATA, authFectcher);

  const { data: tenants, isLoading: tenantLoad } = useSWR(
    API_ENDPOINTS.GET_ALL_TENANTS,
    authFectcher
  );

  const datas = (
    Object.keys(data || {}) as Array<
      "total" | "active" | "inactive" | "deactivated"
    >
  ).map((key) => {
    const value = data?.[key] || 0;

    return {
      cardType: key === "total" ? "all" : key,
      title: key.charAt(0).toUpperCase() + key.slice(1) + " Organizations",
      statNum: value,
      orgIcon: <Hospital className={cn("text-white size-5")} />,
      chart: chartList[key] || (
        <AllOrgChart className="w-full h-full object-fit" />
      ),
      barChartIcon: <ChartNoAxesColumn />,
      OrgPercentChanges: parseFloat(
        (key !== "total" && data?.total
          ? (value * 100) / data.total
          : 0
        ).toFixed(2)
      ),
    };
  });

  console.log(datas);

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

          {isLoading ? (
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
              {tenants &&
                tenants.map((data) => {
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
                        {data?.profile?.address_metadata?.state},{" "}
                        {data?.profile?.address_metadata?.country},{" "}
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
                })}
            </DataTable>
            <Pagination
              dataLength={AllOrgTableData.length}
              numOfPages={1}
              pageSize={pageSize}
            />
          </section>
        </>
      )}
    </section>
  );
}
