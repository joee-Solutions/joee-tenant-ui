"use client";

import { EmployeesData } from "@/components/shared/table/data";

import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState, useMemo, useEffect, useRef } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import orgPlaceholder from "@public/assets/orgPlaceholder.png";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.GET_TENANTS_EMPLOYEES(parseInt(slug)),
    authFectcher
  );

  // Filter employees by search query on the frontend
  const filteredEmployees = useMemo(() => {
    if (!Array.isArray(data?.data)) return [];
    
    if (!search.trim()) {
      // No search query - return all employees
      return data.data;
    }
    
    // Filter by search query (case-insensitive)
    // Search in employee name, email, department, designation
    const searchLower = search.toLowerCase().trim();
    return data.data.filter((employee: Employee) => {
      const fullName = `${employee?.firstname || ''} ${employee?.lastname || ''}`.toLowerCase();
      const email = employee?.email?.toLowerCase() || '';
      const department = typeof employee.department === 'string'
        ? employee.department.toLowerCase()
        : employee.department?.name?.toLowerCase() || '';
      const designation = employee?.designation?.toLowerCase() || '';
      
      return fullName.includes(searchLower) ||
             email.includes(searchLower) ||
             department.includes(searchLower) ||
             designation.includes(searchLower);
    });
  }, [data?.data, search]);

  // Reset to page 1 when search changes
  const prevSearch = useRef(search);
  useEffect(() => {
    if (prevSearch.current !== search) {
      setCurrentPage(1);
    }
    prevSearch.current = search;
  }, [search]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading employees...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">Failed to load employees.</div>;
  }

  return (
    <section className=" mb-10">
      <>
        <section className="px-6 py-8 shadow-[0px_0px_4px_1px_#0000004D]">
          <header className="flex justify-between items-center border-b-2  py-4 mb-8">
            <h2 className="font-semibold text-xl text-black">Employee List</h2>

            <Link href={`/dashboard/organization/${slug}/employees/new`}>
              <Button className="font-normal text-base text-white bg-[#003465] h-[60px] px-6">
              Add Employee
              </Button>
            </Link>
          </header>
          <header className="flex items-center justify-between gap-5 py-6">
            <ListView pageSize={pageSize} setPageSize={setPageSize} />
            <div className="w-full max-w-md">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Employees"
                className="py-[10px] pr-[10px] pl-5 bg-[#EDF0F6] w-full font-normal text-xs text-[#999999] h-full outline-none rounded"
              />
            </div>
          </header>
          <DataTable tableDataObj={EmployeesData[0]}>
            {Array.isArray(filteredEmployees) && filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee: Employee, index: number) => (
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
                    <span className="w-[42px] h-[42px] rounded-full overflow-hidden">
                      <Image
                        src={employee?.image_url || orgPlaceholder}
                        alt="employee image"
                        width={42}
                        height={42}
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  {search.trim() 
                    ? `No employees found matching "${search}"` 
                    : "No employees found"}
                </TableCell>
              </TableRow>
            )}
          </DataTable>
          <Pagination
            dataLength={filteredEmployees?.length || 0}
            numOfPages={Math.ceil((filteredEmployees?.length || 0) / pageSize)}
            pageSize={pageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </section>
      </>
    </section>
  );
}
