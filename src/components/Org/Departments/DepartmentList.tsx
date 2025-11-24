"use client";

import { DepartmentList } from "@/components/shared/table/data";

import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState, useMemo, useEffect, useRef } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import useSWR from "swr";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import { formatDateFn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Define Department type
interface Department {
  id: number;
  name: string;
  userCount: number;
  createdAt: string;
  status: string;
}

export default function Page({ slug }: { slug: string }) {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data } = useSWR(
    API_ENDPOINTS.TENANTS_DEPARTMENTS(parseInt(slug)),
    authFectcher
  );

  // Filter departments by search query on the frontend
  const filteredDepartments = useMemo(() => {
    if (!Array.isArray(data?.data)) return [];
    
    if (!search.trim()) {
      // No search query - return all departments
      return data.data;
    }
    
    // Filter by search query (case-insensitive)
    // Search in department name
    const searchLower = search.toLowerCase().trim();
    return data.data.filter((dept: Department) => {
      const deptName = dept?.name?.toLowerCase() || '';
      return deptName.includes(searchLower);
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

  return (
    <section className="max-sm:px-5 mb-10">
      {/* Remove all references to isAddOrg and setIsAddOrg */}
      {/* <NewOrg setIsAddOrg={setIsAddOrg} /> */}
      {/* <OrgManagement setIsAddOrg={setIsAddOrg} /> */}
      {/* <Button
        onClick={() => setIsAddOrg("add")}
        className="text-base text-[#4E66A8] font-normal"
      >
        Add Department
      </Button> */}
      <section className="px-6 py-8 my-8 shadow-[0px_0px_4px_1px_#0000004D]">
        <header className="flex items-center justify-between border-b-2 gap-5 py-2">
          <h2 className="font-semibold text-xl text-black">
            Department List
          </h2>

          <Link href={`/dashboard/organization/${slug}/departments/new`}>
            <Button className="font-normal text-base text-white bg-[#003465] h-[60px] px-6">
              Add Department
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
              placeholder="Search Departments"
              className="py-[10px] pr-[10px] pl-5 bg-[#EDF0F6] w-full font-normal text-xs text-[#999999] h-full outline-none rounded"
            />
          </div>
        </header>
        <DataTable tableDataObj={DepartmentList[0]}>
          {Array.isArray(filteredDepartments) && filteredDepartments.length > 0 ? (
            filteredDepartments.map((data: Department, index: number) => {
              return (
                <TableRow
                  key={data.id}
                  className="px-3 odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="py-[21px]">
                    <div className="flex items-center gap-[10px]">
                      <p className="font-medium text-xs text-black">
                        {data?.name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-[#737373] w-[180px]">
                    {data?.userCount || 0}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-[#737373]">
                    {formatDateFn(data?.createdAt)}
                  </TableCell>
                  <TableCell
                    className={`font-semibold text-xs ${
                      data?.status.toLowerCase() === "active"
                        ? "text-[#3FA907]"
                        : "text-[#EC0909]"
                    }`}
                  >
                    {data?.status}
                  </TableCell>
                  {/* <TableCell>
                    <button className="flex items-center justify-center px-2 h-6 rounded-[2px] border border-[#BFBFBF] bg-[#EDF0F6]">
                      <Ellipsis className="text-black size-5" />
                    </button>
                  </TableCell> */}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                {search.trim() 
                  ? `No departments found matching "${search}"` 
                  : "No departments found"}
              </TableCell>
            </TableRow>
          )}
        </DataTable>
        <Pagination
          dataLength={filteredDepartments?.length || 0}
          numOfPages={Math.ceil((filteredDepartments?.length || 0) / pageSize)}
          pageSize={pageSize}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </section>
    </section>
  );
}
