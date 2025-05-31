"use client";

import { DepartmentList } from "@/components/shared/table/data";
import NewOrg from "@/app/(dashboard)/dashboard/organization/NewOrg";
import OrgManagement from "@/app/(dashboard)/dashboard/organization/OrgManagement";

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
import { formatDateFn } from "@/lib/utils";

export default function Page({ slug }: { slug: string }) {
  const [pageSize, setPageSize] = useState(10);
  const [isAddOrg, setIsAddOrg] = useState<"add" | "none" | "edit">("none");
  const { data, isLoading,error } = useSWR(
    API_ENDPOINTS.TENANTS_DEPARTMENTS(parseInt(slug)),
    authFectcher
  );

  console.log(data);
  return (
    <section className="max-sm:px-5 mb-10">
      {isAddOrg === "add" ? (
        <NewOrg setIsAddOrg={setIsAddOrg} />
      ) : isAddOrg === "edit" ? (
        <OrgManagement setIsAddOrg={setIsAddOrg} />
      ) : (
        <>
          <section className="p-[29px_14px_30px_24px] my-8 shadow-[0px_0px_4px_1px_#0000004D]">
            <header className="flex items-center justify-between border-b-2 gap-5 py-2">
              <h2 className="font-semibold text-xl text-black">
                Department List
              </h2>

              <Button
                onClick={() => setIsAddOrg("add")}
                className="text-base text-[#4E66A8] font-normal"
              >
                Add Department
              </Button>
            </header>
            <header className="flex items-center justify-between gap-5 py-6">
              <ListView pageSize={pageSize} setPageSize={setPageSize} />
              <SearchInput
                onSearch={(query) => console.log("Searching:", query)}
              />
            </header>
            <DataTable tableDataObj={DepartmentList[0]}>
              {data?.departments &&
                data.departments.map((data, index) => {
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
                })}
            </DataTable>
            <Pagination
              dataLength={DepartmentList.length}
              numOfPages={1}
              pageSize={pageSize}
            />
          </section>
        </>
      )}
    </section>
  );
}
