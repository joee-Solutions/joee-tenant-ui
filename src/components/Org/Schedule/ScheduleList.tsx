"use client";

import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search";
import useSWR from "swr";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import { ScheduleList } from "@/components/shared/table/data";
import AddSchedule from "./AddSchedule";
import Link from "next/link";

export default function Page({ slug }: { slug: string }) {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOrg, setIsAddOrg] = useState<"add" | "none" | "edit">("none");

  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.TENANTS_SCHEDULES(parseInt(slug)),
    authFectcher
  );

  // Get schedules array safely
  const schedules = data?.data?.data || [];
  console.log(schedules, 'data');

  return (
    <section className="mb-10">
      <section className="px-6 py-8 my-8 shadow-[0px_0px_4px_1px_#0000004D]">
        <header className="flex justify-between items-center border-b-2  py-4 mb-8">
          <h2 className="font-semibold text-xl text-black">
            Schedule List
          </h2>

          <Link href={`/dashboard/organization/${slug}/schedules/new`}>
            <Button className="h-[60px] bg-[#003465] text-white font-medium text-base px-6">
              Add Schedule
            </Button>
          </Link>
        </header>
        <header className="flex items-center justify-between gap-5 py-6">
          <ListView pageSize={pageSize} setPageSize={setPageSize} />
          <SearchInput onSearch={(query) => console.log('Searching:', query)} />


        </header>
        <DataTable tableDataObj={ScheduleList[0]}>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                Loading schedules...
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No schedules found
              </TableCell>
            </TableRow>
          ) : Array.isArray(schedules) && schedules.length > 0 ? (
            schedules.map((schedule: any) => {
              // Flatten the availableDays array to show each day as a separate row
              return schedule.availableDays?.map((day: any, dayIndex: number) => (
                <TableRow key={`${schedule.id}-${dayIndex}`} className="px-3 odd:bg-white even:bg-gray-50 hover:bg-gray-100">
                  <TableCell>{schedule.id}</TableCell>
                  <TableCell className="py-[21px]">
                    <div className="flex items-center gap-[10px]">
                      <p className="font-medium text-xs text-black">
                        {schedule.user?.firstname} {schedule.user?.lastname}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-[#737373]">
                    {schedule.department}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-[#737373]">
                    {day.day}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-[#737373]">
                    {day.startTime}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-[#737373]">
                    {day.endTime}
                  </TableCell>
                </TableRow>
              ));
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No schedules found
              </TableCell>
            </TableRow>
          )}
        </DataTable>
        <Pagination
          dataLength={data?.data?.meta?.total || 0}
          numOfPages={data?.data?.meta?.totalPages || 1}
          pageSize={data?.data?.meta?.limit || pageSize}
          currentPage={data?.data?.meta?.page || currentPage}
          setCurrentPage={setCurrentPage}
        />
      </section>
    </section>
  );
}
