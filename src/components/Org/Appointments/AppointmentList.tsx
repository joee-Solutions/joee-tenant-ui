"use client";

import { AppointmentData } from "@/components/shared/table/data";

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

export default function Page({ slug }: { slug: string }) {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOrg, setIsAddOrg] = useState<"add" | "none" | "edit">("none");
  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.TENANTS_APPOINTMENTS(parseInt(slug)),
    authFectcher
  );

  if (isLoading) {
    return (
      <section className="px-[30px] mb-10">
        <div className="px-6 py-8 shadow-[0px_0px_4px_1px_#0000004D]">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading appointments...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-[30px] mb-10">
        <div className="px-6 py-8 shadow-[0px_0px_4px_1px_#0000004D]">
          <div className="flex items-center justify-center py-12">
            <div className="text-red-600 text-center">
              <p className="text-lg font-semibold">Failed to load appointments</p>
              <p className="text-sm text-gray-600 mt-2">Please try again later</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-[30px] mb-10">

      <>
        <section className="px-6 py-8 shadow-[0px_0px_4px_1px_#0000004D]">
          <header className="flex justify-between items-center border-b-2  py-4 mb-8">
            <h2 className="font-semibold text-xl text-black">
              Appointments
            </h2>

            <Button
              onClick={() => setIsAddOrg("add")}
              className="text-base text-[#4E66A8] font-normal"
            >
              Add Appointment
            </Button>
          </header>
          <header className="flex items-center justify-between gap-5 py-6">
            <ListView pageSize={pageSize} setPageSize={setPageSize} />
            <SearchInput onSearch={(query) => console.log('Searching:', query)} />


          </header>
          <DataTable tableDataObj={AppointmentData[0]}>
            {Array.isArray(data?.data) && data.data.length > 0 ? (
              data.data.map((appointment: any) => {
                return (
                  <TableRow key={appointment.id} className="px-3 odd:bg-white even:bg-gray-50  hover:bg-gray-100">
                    <TableCell>{appointment.id}</TableCell>
                    <TableCell className="py-[21px]">
                      <div className="flex items-center gap-[10px]">
                        <span className="w-[42px] h-[42px] rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                          {appointment.patient?.image ? (
                            <Image
                              src={appointment.patient.image}
                              alt="patient image"
                              className="object-cover aspect-square w-full h-full"
                            />
                          ) : (
                            <span className="text-gray-500 text-sm">
                              {appointment.patient?.first_name?.charAt(0) || 'P'}
                            </span>
                          )}
                        </span>
                        <p className="font-medium text-xs text-black">
                          {appointment.patient?.first_name} {appointment.patient?.last_name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {appointment.patient?.date_of_birth ? 
                        new Date().getFullYear() - new Date(appointment.patient.date_of_birth).getFullYear() : 
                        'N/A'
                      }
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {appointment.user?.first_name} {appointment.user?.last_name}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {appointment.user?.department?.name || 'N/A'}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {appointment.date ? new Date(appointment.date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {appointment.startTime} - {appointment.endTime}
                    </TableCell>
                    <TableCell>
                      <button className="flex items-center justify-center px-2 h-6 rounded-[2px] border border-[#BFBFBF] bg-[#EDF0F6]">
                        <Ellipsis className="text-black size-5" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No appointments found
                </TableCell>
              </TableRow>
            )}
          </DataTable>
          <Pagination
            dataLength={AppointmentData.length}
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
