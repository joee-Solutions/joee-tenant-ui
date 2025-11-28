"use client";

import { AppointmentData } from "@/components/shared/table/data";

import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState, useEffect, useRef } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Ellipsis } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search";
import useSWR from "swr";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function Page({ slug }: { slug: string }) {
  const router = useRouter();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isAddOrg, setIsAddOrg] = useState<"add" | "none" | "edit">("none");
  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.TENANTS_APPOINTMENTS(parseInt(slug)),
    authFectcher
  );

  // Filter appointments based on search query
  const filteredAppointments = data?.data?.data && Array.isArray(data.data.data)
    ? data.data.data.filter((appointment: any) => {
        if (!search.trim()) return true;
        const searchLower = search.toLowerCase();
        const patientName = `${appointment.patient?.first_name || ''} ${appointment.patient?.last_name || ''}`.toLowerCase();
        const doctorName = `${appointment.user?.firstname || ''} ${appointment.user?.lastname || ''}`.toLowerCase();
        const department = appointment.user?.department?.name?.toLowerCase() || '';
        const date = appointment.date ? new Date(appointment.date).toLocaleDateString().toLowerCase() : '';
        
        return patientName.includes(searchLower) ||
               doctorName.includes(searchLower) ||
               department.includes(searchLower) ||
               date.includes(searchLower);
      })
    : [];

  // Paginate filtered appointments
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to page 1 when search changes
  const prevSearch = useRef(search);
  useEffect(() => {
    if (prevSearch.current !== search) {
      setCurrentPage(1);
    }
    prevSearch.current = search;
  }, [search]);

  if (isLoading) {
    return (
      <section className="mb-10">
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
    <section className="mb-10">

      <>
        <section className="px-6 py-8 shadow-[0px_0px_4px_1px_#0000004D]">
          <header className="flex justify-between items-center border-b-2  py-4 mb-8">
            <h2 className="font-semibold text-xl text-black">
              Appointments
            </h2>

            <Link href={`/dashboard/organization/${slug}/appointments/new`}>
              <Button className="h-[60px] bg-[#003465] text-white font-medium text-base px-6">
                Add Appointment
              </Button>
            </Link>
          </header>
          <header className="flex items-center justify-between gap-5 py-6">
            <ListView pageSize={pageSize} setPageSize={setPageSize} />
            <SearchInput onSearch={(query: string) => setSearch(query)} />


          </header>
          <DataTable tableDataObj={AppointmentData[0]}>
            {paginatedAppointments.length > 0 ? (
              paginatedAppointments.map((appointment: any) => {
                return (
                  <TableRow key={appointment.id} className="px-3 odd:bg-white even:bg-gray-50  hover:bg-gray-100">
                    <TableCell>{appointment.id}</TableCell>
                    <TableCell className="py-[21px]">
                      <div className="flex items-center gap-[10px]">
                        <span className="w-[42px] h-[42px] rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                          {appointment.patient?.image ? (
                            <Image
                              src={getValidImageSrc(appointment.patient.image, AppointmentData[0].appointment.image)}
                              alt="patient image"
                              width={42}
                              height={42}
                              className="object-cover aspect-square w-full h-full"
                              unoptimized={typeof appointment.patient.image === 'string' && (appointment.patient.image.startsWith('http') || appointment.patient.image.startsWith('data:'))}
                            />
                          ) : (
                            <span className="text-gray-500 text-sm">
                              {appointment.patient?.first_name?.charAt(0) || appointment.patient?.first_name?.charAt(0) || 'P'}
                              {appointment.patient?.last_name?.charAt(0) || appointment.patient?.last_name?.charAt(0) || 'P'}
                            </span>
                          )}
                        </span>
                        <p className="font-medium text-xs text-black flex flex-col gap-1">
                          <span>
                            {appointment.patient?.first_name} {appointment.patient?.last_name}
                          </span>
                          <span className="text-xs text-[#737373]">
                            {appointment.patient?.sex}
                          </span>
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
                      {appointment.user?.firstname} {appointment.user?.lastname}
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
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No appointments found
                </TableCell>
              </TableRow>
            )}
          </DataTable>
          <Pagination
            dataLength={filteredAppointments.length}
            numOfPages={Math.max(1, Math.ceil(filteredAppointments.length / pageSize))}
            pageSize={pageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </section>
      </>

    </section>
  );
}
