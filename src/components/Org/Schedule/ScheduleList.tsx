"use client";

import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState, useEffect } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { MoreVertical, Edit, Trash2, X, Plus } from "lucide-react";
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
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/icons/Spinner";

const ScheduleEditSchema = z.object({
  availableDays: z.array(z.object({
    day: z.string().min(1, "Day is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  })).min(1, "At least one schedule day is required"),
});

type ScheduleEditSchemaType = z.infer<typeof ScheduleEditSchema>;

function EditScheduleModal({ slug, schedule, onClose, onSuccess }: { slug: string; schedule: any; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);

  const editForm = useForm<ScheduleEditSchemaType>({
    resolver: zodResolver(ScheduleEditSchema),
    defaultValues: {
      availableDays: schedule.availableDays || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: editForm.control,
    name: "availableDays",
  });

  const handleSubmit = async (data: ScheduleEditSchemaType) => {
    setLoading(true);
    try {
      const scheduleData = {
        availableDays: data.availableDays.map(day => ({
          day: day.day,
          startTime: day.startTime,
          endTime: day.endTime,
        })),
      };

      // Use employeeId instead of scheduleId for the API endpoint
      const employeeId = schedule.user?.id || schedule.userId || schedule.employeeId;
      if (!employeeId) {
        toast.error("Employee ID not found");
        return;
      }
      
      await processRequestAuth(
        "patch",
        `${API_ENDPOINTS.TENANTS_SCHEDULES(parseInt(slug))}/${employeeId}`,
        scheduleData
      );
      toast.success("Schedule updated successfully");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" 
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-auto" 
        onClick={(e) => e.stopPropagation()}
        style={{ margin: '0 auto' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-black">Edit Schedule</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          <p className="font-semibold">Employee: {schedule.user?.firstname} {schedule.user?.lastname}</p>
          <p>Department: {schedule.department}</p>
        </div>

        <form onSubmit={editForm.handleSubmit(handleSubmit)} className="space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Schedule Day {index + 1}</h3>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-base text-black font-normal mb-2">Day</label>
                  <Controller
                    name={`availableDays.${index}.day`}
                    control={editForm.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent className="z-[10000] bg-white">
                          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <label className="block text-base text-black font-normal mb-2">Start Time</label>
                  <Controller
                    name={`availableDays.${index}.startTime`}
                    control={editForm.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded">
                          <SelectValue placeholder="Select start time" />
                        </SelectTrigger>
                        <SelectContent className="z-[10000] bg-white">
                          {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <label className="block text-base text-black font-normal mb-2">End Time</label>
                  <Controller
                    name={`availableDays.${index}.endTime`}
                    control={editForm.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded">
                          <SelectValue placeholder="Select end time" />
                        </SelectTrigger>
                        <SelectContent className="z-[10000] bg-white">
                          {["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"].map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => append({ day: "", startTime: "", endTime: "" })}
            className="mt-4 w-full sm:w-auto bg-[#003465] hover:bg-[#00254a] text-white border-[#003465] font-medium px-6 py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Day
          </Button>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#003465] hover:bg-[#0d2337] text-white"
            >
              {loading ? <Spinner /> : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Page({ slug }: { slug: string }) {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isAddOrg, setIsAddOrg] = useState<"add" | "none" | "edit">("none");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<any | null>(null);

  const { data, isLoading, error, mutate } = useSWR(
    API_ENDPOINTS.TENANTS_SCHEDULES(parseInt(slug)),
    authFectcher
  );

  // Get schedules array safely
  const schedules = data?.data?.data || [];
  
  // Filter schedules based on search query
  const filteredSchedules = Array.isArray(schedules)
    ? schedules.filter((schedule: any) => {
        if (!search.trim()) return true;
        const searchLower = search.toLowerCase();
        const employeeName = `${schedule.user?.firstname || ''} ${schedule.user?.lastname || ''}`.toLowerCase();
        const department = (schedule.department || '').toLowerCase();
        
        // Check if any day matches
        const dayMatch = schedule.availableDays?.some((day: any) => 
          day.day?.toLowerCase().includes(searchLower)
        );
        
        return employeeName.includes(searchLower) ||
               department.includes(searchLower) ||
               dayMatch;
      })
    : [];

  // Flatten schedules for display – keep original schedule fields on the item
  const flattenedSchedules = filteredSchedules.flatMap((schedule: any) =>
    schedule.availableDays?.map((day: any, dayIndex: number) => ({
      ...schedule,
      day,
      dayIndex,
      dropdownKey: `${schedule.id}-${dayIndex}`,
    })) || []
  );

  // Paginate flattened schedules
  const paginatedSchedules = flattenedSchedules.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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

  const handleDeleteClick = (schedule: any) => {
    setScheduleToDelete(schedule);
    setShowDeleteWarning(true);
    setOpenDropdownId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!scheduleToDelete) return;
    setDeletingId(scheduleToDelete.id);
    try {
      // Use employeeId instead of scheduleId for the API endpoint
      const employeeId = scheduleToDelete.user?.id || scheduleToDelete.userId || scheduleToDelete.employeeId;
      if (!employeeId) {
        toast.error("Employee ID not found");
        setDeletingId(null);
        return;
      }
      
      await processRequestAuth(
        "delete",
        `${API_ENDPOINTS.TENANTS_SCHEDULES(parseInt(slug))}/${employeeId}`
      );
      toast.success("Schedule deleted successfully");
      mutate();
      setShowDeleteWarning(false);
      setScheduleToDelete(null);
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
          <SearchInput onSearch={(query: string) => {
            setSearch(query);
            setCurrentPage(1);
          }} />


        </header>
        <DataTable tableDataObj={{
          sn: "S/N",
          employee: "Employee",
          department: "Department",
          day: "Day",
          start_time: "Start Time",
          end_time: "End Time"
        }} showAction>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                Loading schedules...
              </TableCell>
            </TableRow>
          ) : error && (!schedules || (Array.isArray(schedules) && schedules.length === 0)) ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No schedules found
              </TableCell>
            </TableRow>
          ) : paginatedSchedules.length > 0 ? (
            paginatedSchedules.map((scheduleItem: any, index: number) => {
              const { day, dropdownKey } = scheduleItem;
                return (
                  <TableRow key={dropdownKey} className="px-3 odd:bg-white even:bg-gray-50 hover:bg-gray-100">
                  <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                  <TableCell className="py-[21px]">
                    <div className="flex items-center gap-[10px]">
                      <p className="font-medium text-xs text-black">
                        {scheduleItem.user?.firstname} {scheduleItem.user?.lastname}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-[#737373]">
                    {scheduleItem.department}
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
                            className={`absolute right-0 z-[100] min-w-[120px] overflow-visible rounded-md border bg-white p-1 shadow-lg ${
                              // Show above if it's the last item, last 2 items, or if there's only 1 item
                              index >= paginatedSchedules.length - 2 || paginatedSchedules.length === 1 ? 'bottom-10' : 'top-10'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                            style={{ position: 'absolute' }}
                          >
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                              handleEditClick(scheduleItem);
                              }}
                              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </div>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                              handleDeleteClick(scheduleItem);
                              }}
                              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-red-600 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                            {deletingId === scheduleItem.id ? "Deleting..." : "Delete"}
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
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No schedules found
              </TableCell>
            </TableRow>
          )}
        </DataTable>
        <Pagination
          dataLength={flattenedSchedules.length || 0}
          numOfPages={Math.max(1, Math.ceil((flattenedSchedules.length || 0) / pageSize))}
          pageSize={pageSize}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </section>

      {/* Delete Warning Modal */}
      {showDeleteWarning && scheduleToDelete && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }} 
          onClick={() => {
            setShowDeleteWarning(false);
            setScheduleToDelete(null);
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-md mx-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-black">Delete Schedule</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDeleteWarning(false);
                  setScheduleToDelete(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete the schedule for{" "}
              <span className="font-semibold">
                {scheduleToDelete.user?.firstname} {scheduleToDelete.user?.lastname}
              </span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteWarning(false);
                  setScheduleToDelete(null);
                }}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deletingId !== null}
                className="px-6 bg-red-600 hover:bg-red-700 text-white"
              >
                {deletingId !== null ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {editModalOpen && selectedSchedule && (
        <EditScheduleModal
          slug={slug}
          schedule={selectedSchedule}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedSchedule(null);
          }}
          onSuccess={() => {
            setEditModalOpen(false);
            setSelectedSchedule(null);
            mutate();
          }}
        />
      )}
    </section>
  );
}
