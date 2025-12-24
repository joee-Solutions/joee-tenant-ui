"use client";

import { PatientData } from "@/components/shared/table/data";

import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState, useEffect } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { MoreVertical, Edit, Trash2, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import useSWR from "swr";
import Link from "next/link";
import { formatDateFn } from "@/lib/utils";
import { processRequestAuth } from "@/framework/https";
import { toast } from "react-toastify";
import PatientStepper from "./PatientStepper";

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
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const { data, isLoading, error, mutate } = useSWR(
    API_ENDPOINTS.TENANTS_PATIENTS(parseInt(org)),
    authFectcher
  );

  console.log(data);
  
  // Get patients array safely
  const patients = data?.data?.data || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId !== null) {
        setOpenDropdownId(null);
      }
    };
    if (openDropdownId !== null) {
      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [openDropdownId]);

  const handleDelete = async (patientId: number) => {
    setDeletingId(patientId);
    try {
      await processRequestAuth(
        "delete",
        API_ENDPOINTS.DELETE_PATIENT(parseInt(org), patientId)
      );
      toast.success("Patient deleted successfully");
      mutate();
      setOpenDropdownId(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete patient");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (patient: any) => {
    setSelectedPatientId(patient.id);
    setEditModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleEditDone = () => {
    setEditModalOpen(false);
    setSelectedPatientId(null);
    mutate();
  };

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
          <DataTable tableDataObj={PatientData[0]} showAction>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Loading patients...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No patients found
                </TableCell>
              </TableRow>
            ) : Array.isArray(patients) && patients.length > 0 ? (
              patients.map((patient) => {
                return (
                  <TableRow
                    key={patient.id}
                    className="px-3 odd:bg-white even:bg-gray-50  hover:bg-gray-100"
                  >
                    <TableCell>{patient.id}</TableCell>
                    <TableCell className="py-[21px]">
                      <div className="flex items-center gap-[10px]">
                        <span className="w-[42px] h-[42px] rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                          <Image
                            src={getValidImageSrc(patient?.image, PatientData[0].patient.image)}
                            alt="patient image"
                            width={42}
                            height={42}
                            className="object-cover aspect-square w-full h-full"
                            unoptimized={typeof patient?.image === 'string' && (patient.image.startsWith('http') || patient.image.startsWith('data:'))}
                          />
                        </span>
                        <p className="font-medium text-xs text-black">
                          {patient?.firstname} {patient?.lastname}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {patient?.address}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {patient?.gender}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {formatDateFn(patient?.date_of_birth)}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {patient?.phone_number}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {patient?.email}
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <button
                          className="h-8 w-8 p-0 border-0 bg-transparent hover:bg-gray-100 rounded flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === patient.id ? null : patient.id);
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openDropdownId === patient.id && (
                          <div 
                            className="absolute right-0 top-10 z-50 min-w-[120px] overflow-hidden rounded-md border bg-white p-1 shadow-md"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(patient);
                              }}
                              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </div>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete "${patient.firstname} ${patient.lastname}"? This action cannot be undone.`)) {
                                  handleDelete(patient.id);
                                }
                              }}
                              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-red-600 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {deletingId === patient.id ? "Deleting..." : "Delete"}
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No patients found
                </TableCell>
              </TableRow>
            )}
          </DataTable>
          <Pagination
            dataLength={data?.data?.meta?.total || 0}
            numOfPages={data?.data?.meta?.totalPages || 1}
            pageSize={data?.data?.meta?.limit || pageSize}
            currentPage={data?.data?.meta?.page || currentPage}
            setCurrentPage={setCurrentPage}
          />
        </section>
      </>

      {/* Edit Patient Modal */}
      {editModalOpen && selectedPatientId && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
          onClick={() => {
            setEditModalOpen(false);
            setSelectedPatientId(null);
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-black">Edit Patient</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedPatientId(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <PatientStepper slug={org} />
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedPatientId(null);
                }}
                className="mr-4"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditDone}
                className="bg-[#003465] text-white"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
