"use client";

import { PatientData } from "@/components/shared/table/data";

import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Ellipsis } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import useSWR from "swr";
import Link from "next/link";
import { formatDateFn } from "@/lib/utils";

// Helper function to validate and normalize image URLs
function getValidImageSrc(imageSrc: string | undefined | null, fallback: any): string | any {
  if (!imageSrc) return fallback;
  
  // If it's already a StaticImageData or valid object, return as is
  if (typeof imageSrc === 'object' && imageSrc !== null) {
    return imageSrc;
  }
  
  const src = String(imageSrc).trim();
  
  // If it's a valid URL (http:// or https://), return as is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // If it's a valid path starting with /, return as is
  if (src.startsWith('/')) {
    return src;
  }
  
  // If it's a data URL (base64), return as is
  if (src.startsWith('data:')) {
    return src;
  }
  
  // If it's just a filename (like "1 (1).jpg"), use fallback
  // Next.js Image component can't handle bare filenames
  if (!src.includes('/') && !src.includes('http')) {
    return fallback;
  }
  
  // Try to construct a valid path - if it looks like a relative path, prepend /
  if (src.includes('.') && !src.startsWith('/')) {
    // Assume it's meant to be in public folder
    return '/' + src;
  }
  
  return fallback;
}

export default function PatientList({ org }: { org: string }) {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOrg, setIsAddOrg] = useState<"add" | "none" | "edit">("none");
  const { data, isLoading } = useSWR(
    API_ENDPOINTS.TENANTS_PATIENTS(parseInt(org)),
    authFectcher
  );

  console.log(data);

  return (
    <section className=" mb-10">
      <>
        <section className="px-6 py-8 shadow-[0px_0px_4px_1px_#0000004D]">
          <header className="flex justify-between items-center border-b-2  py-4 mb-8">
            <h2 className="font-semibold text-xl text-black">Patient List</h2>

            <Link href={`/dashboard/organization/${org}/patients/new`}>
              <Button className="h-[60px] bg-[#003465] text-white font-medium text-base px-6">
                Add Patient
              </Button>
            </Link>
          </header>
          <header className="flex items-center justify-between gap-5 py-6">
            <ListView pageSize={pageSize} setPageSize={setPageSize} />
            <SearchInput
              onSearch={(query) => console.log("Searching:", query)}
            />
          </header>
          <DataTable tableDataObj={PatientData[0]}>
            {data?.data &&
              data?.data.data.map((data) => {
                return (
                  <TableRow
                    key={data.id}
                    className="px-3 odd:bg-white even:bg-gray-50  hover:bg-gray-100"
                  >
                    <TableCell>{data.id}</TableCell>
                    <TableCell className="py-[21px]">
                      <div className="flex items-center gap-[10px]">
                        <span className="w-[42px] h-[42px] rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                          <Image
                            src={getValidImageSrc(data?.image, PatientData[0].patient.image)}
                            alt="employee image"
                            width={42}
                            height={42}
                            className="object-cover aspect-square w-full h-full"
                            unoptimized={typeof data?.image === 'string' && (data.image.startsWith('http') || data.image.startsWith('data:'))}
                          />
                        </span>
                        <p className="font-medium text-xs text-black">
                          {data?.firstname} {data?.lastname}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {data?.address}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {data?.gender}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {formatDateFn(data?.date_of_birth)}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {data?.phone_number}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {data?.email}
                    </TableCell>
                    {/* <TableCell
                      className={`font-semibold text-xs ${
                        data?.status &&
                        data?.status.toLowerCase() === "active"
                          ? "text-[#3FA907]"
                          : "text-[#EC0909]"
                      }`}
                    >
                      {data.status}
                    </TableCell> */}
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
            dataLength={data?.data?.meta?.total}
            numOfPages={data?.data?.meta?.totalPages}
            pageSize={data?.data?.meta?.limit}
            currentPage={data?.data?.meta?.page}
            setCurrentPage={setCurrentPage}
          />
        </section>
      </>
    </section>
  );
}
