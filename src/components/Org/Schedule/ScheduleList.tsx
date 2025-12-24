"use client";

import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState, useEffect } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { MoreVertical, Edit, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search";
import useSWR from "swr";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import { ScheduleList } from "@/components/shared/table/data";
import AddSchedule from "./AddSchedule";
import Link from "next/link";
import { processRequestAuth } from "@/framework/https";
import { toast } from "react-toastify";

export default function Page({ slug }: { slug: string }) {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOrg, setIsAddOrg] = useState<"add" | "none" | "edit">("none");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);

  const { data, isLoading, error, mutate } = useSWR(
    API_ENDPOINTS.TENANTS_SCHEDULES(parseInt(slug)),
    authFectcher
  );

  // Get schedules array safely
  const schedules = data?.data?.data || [];
  console.log(schedules, 'data');

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

  const handleDelete = async (scheduleId: number) => {
    setDeletingId(scheduleId);
    try {
      await processRequestAuth(
        "delete",
        `${API_ENDPOINTS.TENANTS_SCHEDULES(parseInt(slug))}/${scheduleId}`
      );
      toast.success("Schedule deleted successfully");
      mutate();
      setOpenDropdownId(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete schedule");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (schedule: any) => {
    setSelectedSchedule(schedule);
    setEditModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleEditDone = () => {
    setEditModalOpen(false);
    setSelectedSchedule(null);
    mutate();
  };

  return (
    <section className="mb-10">
      <section className="px-6 py-8 my-8 shadow-[0px_0px_4px_1px_#0000004D]">
        <header className="flex justify-between items-center border-b-2  py-4 mb-8">
          <h2 className="font-semibold text-xl text-black">
            Schedule List
          </h2>

          <Link href={`/dashboard/organization/${slug}/schedules/new`}>
            <Button className="h-[60px] bg-[#003465] text-white font-medium text-base px-6">
              Add Schedule
            </Button>
          </Link>
        </header>
        <header className="flex items-center justify-between gap-5 py-6">
          <ListView pageSize={pageSize} setPageSize={setPageSize} />
          <SearchInput onSearch={(query) => console.log('Searching:', query)} />


        </header>
        <DataTable tableDataObj={ScheduleList[0]} showAction>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                Loading schedules...
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No schedules found
              </TableCell>
            </TableRow>
          ) : Array.isArray(schedules) && schedules.length > 0 ? (
            schedules.map((schedule: any) => {
              // Flatten the availableDays array to show each day as a separate row
              return schedule.availableDays?.map((day: any, dayIndex: number) => {
                const dropdownKey = `${schedule.id}-${dayIndex}`;
                return (
                  <TableRow key={dropdownKey} className="px-3 odd:bg-white even:bg-gray-50 hover:bg-gray-100">
                  <TableCell>{schedule.id}</TableCell>
                  <TableCell className="py-[21px]">
                    <div className="flex items-center gap-[10px]">
                      <p className="font-medium text-xs text-black">
                        {schedule.user?.firstname} {schedule.user?.lastname}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-[#737373]">
                    {schedule.department}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-[#737373]">
                    {day.day}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-[#737373]">
                    {day.startTime}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-[#737373]">
                    {day.endTime}
                  </TableCell>
                    <TableCell>
                      <div className="relative">
                        <button
                          className="h-8 w-8 p-0 border-0 bg-transparent hover:bg-gray-100 rounded flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === dropdownKey ? null : dropdownKey);
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openDropdownId === dropdownKey && (
                          <div 
                            className="absolute right-0 top-10 z-50 min-w-[120px] overflow-hidden rounded-md border bg-white p-1 shadow-md"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(schedule);
                              }}
                              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </div>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete this schedule? This action cannot be undone.`)) {
                                  handleDelete(schedule.id);
                                }
                              }}
                              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-red-600 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {deletingId === schedule.id ? "Deleting..." : "Delete"}
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                </TableRow>
                );
              });
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No schedules found
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

      {/* Edit Schedule Modal */}
      {editModalOpen && selectedSchedule && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
          onClick={() => {
            setEditModalOpen(false);
            setSelectedSchedule(null);
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-black">Edit Schedule</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedSchedule(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              <p>Employee: {selectedSchedule.user?.firstname} {selectedSchedule.user?.lastname}</p>
              <p>Department: {selectedSchedule.department}</p>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Note: Schedule editing functionality will be available here. For now, please delete and recreate the schedule.
            </p>
            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedSchedule(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
