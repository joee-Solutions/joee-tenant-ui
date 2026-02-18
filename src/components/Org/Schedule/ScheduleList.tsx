"use client";

import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState, useEffect } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { MoreVertical, Edit, Trash2, X, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search";
import useSWR from "swr";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import { ScheduleList } from "@/components/shared/table/data";
import AddSchedule from "./AddSchedule";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { processRequestAuth } from "@/framework/https";
import { toast } from "react-toastify";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/icons/Spinner";
import DeleteWarningModal from "@/components/shared/modals/DeleteWarningModal";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse } from "date-fns";

const ScheduleEditSchema = z.object({
  availableDays: z.array(z.object({
    date: z.date({ required_error: "Date is required" }),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  })).min(1, "At least one schedule day is required"),
});

type ScheduleEditSchemaType = z.infer<typeof ScheduleEditSchema>;

function EditScheduleModal({ slug, schedule, onClose, onSuccess }: { slug: string; schedule: any; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);

  // Helper function to convert day name to a date (next occurrence of that day)
  const getDateFromDayName = (dayName: string): Date => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndex = days.findIndex(d => d.toLowerCase() === dayName.toLowerCase());
    if (dayIndex === -1) return new Date();
    
    const today = new Date();
    const currentDay = today.getDay();
    let daysUntil = dayIndex - currentDay;
    if (daysUntil <= 0) daysUntil += 7; // Next week if today or past
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntil);
    return nextDate;
  };

  const editForm = useForm<ScheduleEditSchemaType>({
    resolver: zodResolver(ScheduleEditSchema),
    defaultValues: {
      availableDays: (schedule.availableDays || []).map((day: any) => ({
        date: day.day ? getDateFromDayName(day.day) : new Date(),
        startTime: day.startTime || "",
        endTime: day.endTime || "",
      })),
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
          day: day.date ? format(day.date, 'EEEE') : '', // Convert date to day name
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
                  <label className="block text-base text-black font-normal mb-2">Date</label>
                  <Controller
                    name={`availableDays.${index}.date`}
                    control={editForm.control}
                    render={({ field }) => (
                      <DatePicker
                        date={field.value}
                        onDateChange={field.onChange}
                        placeholder="Pick a date"
                        className="w-full"
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-base text-black font-normal mb-2">Start Time</label>
                  <Input
                    type="time"
                    {...editForm.register(`availableDays.${index}.startTime`)}
                    className="w-full p-3 border border-[#737373] h-14 rounded"
                  />
                  {editForm.formState.errors.availableDays?.[index]?.startTime && (
                    <p className="text-red-500 text-sm mt-1">
                      {editForm.formState.errors.availableDays[index]?.startTime?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-base text-black font-normal mb-2">End Time</label>
                  <Input
                    type="time"
                    {...editForm.register(`availableDays.${index}.endTime`)}
                    className="w-full p-3 border border-[#737373] h-14 rounded"
                  />
                  {editForm.formState.errors.availableDays?.[index]?.endTime && (
                    <p className="text-red-500 text-sm mt-1">
                      {editForm.formState.errors.availableDays[index]?.endTime?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => append({ date: new Date(), startTime: "", endTime: "" })}
            className="mt-4 w-full sm:w-auto bg-[#003465] hover:bg-[#00254a] text-white border-[#003465] font-medium px-6 py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Date
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
  const router = useRouter();
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

          <Button 
            onClick={() => router.push(`/dashboard/organization/${slug}/schedules/new`)}
            className="h-[60px] bg-[#003465] text-white font-medium text-base px-6"
          >
            Add Schedule
          </Button>
        </header>
        <header className="flex items-center justify-between gap-5 py-6">
          <ListView pageSize={pageSize} setPageSize={setPageSize} />
          <SearchInput onSearch={(query: string) => {
            setSearch(query);
            setCurrentPage(1);
          }} />


        </header>
        <div className="mt-6">
          <DataTable tableDataObj={{
            "S/N": "S/N",
            "Employee": "Employee",
            "Department": "Department",
            "Day": "Day",
            "Start Time": "Start Time",
            "End Time": "End Time"
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
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <button 
                            type="button"
                            className="flex items-center justify-center px-2 py-1 rounded-[2px] border border-[#BFBFBF] bg-[#EDF0F6] hover:bg-[#D9DDE5] transition-colors relative z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <MoreVertical className="text-black size-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg z-[100]">
                          <DropdownMenuItem
                            onClick={() => handleEditClick(scheduleItem)}
                            className="cursor-pointer flex items-center gap-2"
                          >
                            <Edit className="size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(scheduleItem)}
                            className="cursor-pointer flex items-center gap-2 text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="size-4" />
                            {deletingId === scheduleItem.id ? "Deleting..." : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
        </div>
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
        <DeleteWarningModal
          title="Delete Schedule"
          message="Are you sure you want to delete the schedule for"
          itemName={`${scheduleToDelete.user?.firstname} ${scheduleToDelete.user?.lastname}`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteWarning(false);
            setScheduleToDelete(null);
          }}
          isDeleting={deletingId !== null}
        />
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
