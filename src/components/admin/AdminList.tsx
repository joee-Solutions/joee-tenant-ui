"use client";

import { AdminListData, AppointmentData } from "@/components/shared/table/data";
import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Ellipsis } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search";
import useSWR from "swr";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import { AdminUser } from "@/lib/types";

export default function AdminList() {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOrg, setIsAddOrg] = useState<"add" | "none" | "edit">("none");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: adminUsers, isLoading, error } = useSWR(
    API_ENDPOINTS.GET_SUPER_ADMIN,
    authFectcher
  );

  console.log('Admin users data:', adminUsers);

  // Filter admin users based on search term
  const filteredAdmins = adminUsers?.filter((admin: AdminUser) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      admin.first_name?.toLowerCase().includes(searchLower) ||
      admin.last_name?.toLowerCase().includes(searchLower) ||
      admin.email?.toLowerCase().includes(searchLower) ||
      admin.phone_number?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  if (isLoading) {
    return (
      <section className="px-[30px] mb-10">
        <div className="p-[29px_14px_30px_24px] shadow-[0px_0px_4px_1px_#0000004D]">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading admin users...</div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-[30px] mb-10">
        <div className="p-[29px_14px_30px_24px] shadow-[0px_0px_4px_1px_#0000004D]">
          <div className="flex items-center justify-center py-8">
            <div className="text-red-500">Failed to load admin users</div>
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section className="px-[30px] mb-10">
      <>
        <section className="p-[29px_14px_30px_24px] shadow-[0px_0px_4px_1px_#0000004D]">
          <header className="flex items-center justify-between gap-5 py-2 border-b">
            <h2 className="font-medium text-xl text-black">Admin List</h2>
          </header>
          <header className="flex items-center justify-between gap-5 py-6 mt-3">
            <ListView pageSize={pageSize} setPageSize={setPageSize} />
            <SearchInput onSearch={handleSearch} />
          </header>
          <DataTable tableDataObj={AdminListData[0]}>
            {filteredAdmins.length > 0 ? (
              filteredAdmins.map((admin: AdminUser) => (
                <TableRow
                  key={admin.id}
                  className="px-3 odd:bg-white even:bg-gray-50 hover:bg-gray-100 py-4"
                >
                  <TableCell>{admin.id}</TableCell>
                  <TableCell className="font-semibold text-xs text-[#737373] py-8">
                    {admin.profile_picture ? (
                      <div className="flex items-center gap-[10px]">
                        <span className="w-[42px] h-[42px] rounded-full overflow-hidden">
                          <Image
                            src={admin.profile_picture}
                            alt="admin profile"
                            width={42}
                            height={42}
                            className="object-cover aspect-square w-full h-full"
                          />
                        </span>
                        <p className="font-medium text-xs text-black">
                          {admin.first_name} {admin.last_name}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-[10px]">
                        <span className="w-[42px] h-[42px] rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-sm font-medium">
                            {admin.first_name?.[0]}{admin.last_name?.[0]}
                          </span>
                        </span>
                        <p className="font-medium text-xs text-black">
                          {admin.first_name} {admin.last_name}
                        </p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-[#737373]">
                    {admin.roles?.join(", ") || "No roles assigned"}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-[#737373]">
                    {admin.address || "No address"}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-[#737373]">
                    {admin.phone_number || "No phone"}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-[#737373]">
                    {admin.email}
                  </TableCell>
                  <TableCell>
                    <button className="flex items-center justify-center px-2 h-6 rounded-[2px] border border-[#BFBFBF] bg-[#EDF0F6]">
                      <Ellipsis className="text-black size-5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {searchTerm ? "No admin users found matching your search" : "No admin users found"}
                </TableCell>
              </TableRow>
            )}
          </DataTable>
          <Pagination
            dataLength={filteredAdmins.length}
            numOfPages={Math.max(1, Math.ceil(filteredAdmins.length / pageSize))}
            pageSize={pageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </section>
      </>
    </section>
  );
}
