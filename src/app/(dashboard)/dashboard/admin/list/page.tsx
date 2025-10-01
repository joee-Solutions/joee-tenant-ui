"use client";

import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SkeletonBox } from "@/components/shared/loader/skeleton";
import { ListView } from "@/components/shared/table/DataTableFilter";
import DataTable from "@/components/shared/table/DataTable";
import Pagination from "@/components/shared/table/pagination";
import { useAdminUsersData } from "@/hooks/swr";
import { AdminUser } from "@/lib/types";
import { Edit, Trash2, User } from "lucide-react";
import Image from "next/image";

// Mock table data structure - replace with actual data from API
const adminTableData = [
  {
    id: "ID",
    name: "Name",
    email: "Email",
    role: "Role",
    phone: "Phone",
    status: "Status",
    actions: "Actions",
  },
];

export default function AdminListPage() {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch admin users
  const { data: adminsData, isLoading, error } = useAdminUsersData();

  // Handle error state
  if (error) {
    return (
      <div className="px-10 pt-[32px] pb-[56px]">
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <h2 className="text-2xl font-semibold text-red-600">Failed to Load Admin Users</h2>
          <p className="text-gray-600">Please try refreshing the page or contact support.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-10 pt-[32px] pb-[56px] shadow-[0px_0px_4px_1px_#0000004D] rounded-md h-fit max-w-6xl mx-auto w-full">
      <h2 className="font-bold text-base text-black mb-[30px]">
        Admin Users
      </h2>
      
      <section className="shadow-[0px_0px_4px_1px_#0000004D]">
        <header className="flex items-center justify-between gap-5 py-5 border-b px-4">
          <h2 className="font-medium text-lg text-black">
            Admin List
          </h2>
        </header>
        
        <div className="px-6 py-8">
          <header className="flex items-center justify-between gap-5 py-6">
            <ListView pageSize={pageSize} setPageSize={setPageSize} />
          </header>
          
          <DataTable tableDataObj={adminTableData[0]}>
            {isLoading ? (
              // Loading skeleton for table rows
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="px-3 hover:bg-gray-50">
                  <TableCell><SkeletonBox className="h-4 w-8" /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-[10px]">
                      <SkeletonBox className="w-[42px] h-[42px] rounded-full" />
                      <SkeletonBox className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell><SkeletonBox className="h-4 w-32" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-16" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-20" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-12" /></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <SkeletonBox className="h-8 w-8 rounded" />
                      <SkeletonBox className="h-8 w-8 rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : adminsData && adminsData.length > 0 ? (
              (adminsData as AdminUser[]).map((admin) => (
                <TableRow key={admin.id} className="px-3 hover:bg-gray-50">
                  <TableCell className="font-medium">{admin.id}</TableCell>
                  <TableCell className="py-[21px]">
                    <div className="flex items-center gap-[10px]">
                      <span className="w-[42px] h-[42px] rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {admin.profile_picture ? (
                          <Image
                            src={admin.profile_picture}
                            alt="admin profile"
                            className="object-cover aspect-square w-full h-full"
                            width={42}
                            height={42}
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-500" />
                        )}
                      </span>
                      <p className="font-medium text-sm text-black">
                        {admin.first_name} {admin.last_name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-sm text-gray-700">
                    {admin.email}
                  </TableCell>
                  <TableCell className="font-medium text-sm text-gray-700">
                    {admin.roles?.[0] || 'Admin'}
                  </TableCell>
                  <TableCell className="font-medium text-sm text-gray-700">
                    {admin.phone_number || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Active
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          // Handle edit
                          console.log('Edit admin:', admin.id);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => {
                          // Handle delete
                          console.log('Delete admin:', admin.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No admin users found
                </TableCell>
              </TableRow>
            )}
          </DataTable>
          
          <Pagination
            dataLength={adminsData?.length || 0}
            numOfPages={Math.max(1, Math.ceil((adminsData?.length || 0) / pageSize))}
            pageSize={pageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </section>
    </div>
  );
}
