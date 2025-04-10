"use client";

import { AllOrgTableData } from "@/components/shared/table/data";

import DataTable from "@/components/shared/table/DataTable";
import DataTableFilter, {
  ListView,
} from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Ellipsis } from "lucide-react";
import Image from "next/image";

export default function Page() {
  const [pageSize, setPageSize] = useState(10);

  return (
    <section className="px-[30px] mb-10">
  
        <>
          <section className="p-[29px_14px_30px_24px] shadow-[0px_0px_4px_1px_#0000004D]">
            <header className="flex items-center justify-between gap-5">
              <h2 className="font-semibold text-xl text-black">
                Department List
              </h2>
              <ListView pageSize={pageSize} setPageSize={setPageSize} />
            </header>
            <DataTableFilter />
            <DataTable tableDataObj={AllOrgTableData[0]}>
              {AllOrgTableData.map((data) => {
                return (
                  <TableRow key={data.id} className="px-3">
                    <TableCell>{data.id}</TableCell>
                    <TableCell className="py-[21px]">
                      <div className="flex items-center gap-[10px]">
                        <span className="w-[42px] h-42px rounded-full overflow-hidden">
                          <Image
                            src={data.organization.image}
                            alt="organization image"
                            className="object-cover aspect-square w-full h-full"
                          />
                        </span>
                        <p className="font-medium text-xs text-black">
                          {data.organization.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {data.created_at}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {data.location}
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
                    <TableCell>
                      <button className="flex items-center justify-center px-2 h-6 rounded-[2px] border border-[#BFBFBF] bg-[#EDF0F6]">
                        <Ellipsis className="text-black size-5" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </DataTable>
            <Pagination
              dataLength={AllOrgTableData.length}
              numOfPages={1000}
              pageSize={pageSize}
            />
          </section>
        </>

    </section>
  );
}
