"use client";

import { EmployeesData } from "@/components/shared/table/data";

import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import orgPlaceholder from "@public/assets/orgPlaceholder.png";
import Image from "next/image";
// import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SearchInput } from "@/components/ui/search";
import useSWR from "swr";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";

// Define Employee type
interface Employee {
  id: number;
  firstname: string;
  lastname: string;
  department?: { name?: string } | string;
  designation?: string;
  isActive?: boolean;
  roles?: Array<{ id: number; name: string }>;
  email?: string;
  gender?: string;
  image_url?: string;
  status?: string;
}

export default function Page({ slug }: { slug: string }) {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  // Remove isAddOrg and setIsAddOrg
  console.log(slug,'slug')
  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.GET_TENANTS_EMPLOYEES(parseInt(slug)),
    authFectcher
  );
  console.log(data,'emp data')

  if (isLoading) {
    return <div className="p-8 text-center">Loading employees...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">Failed to load employees.</div>;
  }
  if (!data.data || data.data.length === 0) {
    return <div className="p-8 text-center text-gray-500">No employees found.</div>;
  }

  console.log(data, "dkdkd");
  return (
    <section className=" mb-10">
      <>
        <section className="px-6 py-8 shadow-[0px_0px_4px_1px_#0000004D]">
          <header className="flex justify-between items-center border-b-2  py-4 mb-8">
            <h2 className="font-semibold text-xl text-black">Employee List</h2>

            <Link href={`/dashboard/organization/${slug}/employees/new`} className="text-base text-[#4E66A8] font-normal">
              Add Employee
            </Link>
          </header>
          <header className="flex items-center justify-between gap-5 py-6">
            <ListView pageSize={pageSize} setPageSize={setPageSize} />
            <SearchInput onSearch={(query: string) => console.log("Searching:", query)} />
          </header>
          <DataTable tableDataObj={EmployeesData[0]}>
            {Array.isArray(data?.data) && data.data.map((employee: Employee, index: number) => (
              <TableRow
                key={employee.id}
                className="px-3 odd:bg-white even:bg-gray-50 hover:bg-gray-100 relative"
              >
                <TableCell>
                <Link href={`/dashboard/organization/${slug}/employees/${employee.id}/edit`} className="absolute inset-0" />
                  {index + 1}
                  </TableCell>
                <TableCell className="py-[21px]">
                  <div className="flex items-center gap-[10px]">
                    <span className="w-[42px] h-42px rounded-full overflow-hidden">
                      <Image
                        src={employee?.image_url || orgPlaceholder}
                        alt="employee image"
                        className="object-cover aspect-square w-full h-full"
                      />
                    </span>
                    <p className="font-medium text-xs text-black">
                      {employee?.firstname} {employee?.lastname}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-xs text-[#737373]">
                  {typeof employee.department === 'string'
                    ? employee.department
                    : employee.department?.name || "N/A"}
                </TableCell>
                <TableCell className="font-semibold text-xs text-[#737373]">
                  {employee?.designation || "N/A"}
                </TableCell>
                <TableCell
                  className={`font-semibold text-xs ${
                    employee?.status?.toLowerCase() === "active"
                      ? "text-[#3FA907]"
                      : "text-[#EC0909]"
                  }`}
                >
                  {employee?.status}
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
          <Pagination
            dataLength={data?.users?.length || 0}
            numOfPages={1}
            pageSize={pageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </section>
      </>
    </section>
  );
}
