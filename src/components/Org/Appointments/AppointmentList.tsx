"use client";

import { AppointmentData } from "@/components/shared/table/data";

import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState, useEffect, useRef } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { MoreVertical, Edit, Trash2, X, Calendar as CalendarIcon, List, Plus, Filter } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search";
import useSWR from "swr";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { processRequestAuth } from "@/framework/https";
import { toast } from "react-toastify";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/icons/Spinner";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, parseISO } from "date-fns";

const AppointmentSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  doctorId: z.string().min(1, "Provider is required"),
  date: z.string().min(1, "Appointment date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  description: z.string().optional(),
});

type AppointmentSchemaType = z.infer<typeof AppointmentSchema>;

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
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filterProvider, setFilterProvider] = useState<string>("");
  const [calendarAppointmentModal, setCalendarAppointmentModal] = useState<any | null>(null);
  const { data, isLoading, error, mutate } = useSWR(
    API_ENDPOINTS.TENANTS_APPOINTMENTS(parseInt(slug)),
    authFectcher
  );

  // Fetch data for dropdowns
  const { data: patientsData } = useSWR(
    API_ENDPOINTS.TENANTS_PATIENTS(parseInt(slug)),
    authFectcher
  );

  const { data: employeesData } = useSWR(
    API_ENDPOINTS.GET_TENANTS_EMPLOYEES(parseInt(slug)),
    authFectcher
  );

  const doctors = Array.isArray(employeesData?.data)
    ? employeesData.data.filter((employee: any) => {
      const designation = typeof employee.designation === 'string' 
        ? employee.designation.toLowerCase() 
        : '';
      const departmentName = typeof employee.department === 'string'
        ? employee.department.toLowerCase()
        : (employee.department?.name || '').toLowerCase();
      
      return designation.includes('doctor') ||
        designation.includes('physician') ||
        designation.includes('medical') ||
        departmentName.includes('medical');
    })
    : [];

  const editForm = useForm<AppointmentSchemaType>({
    resolver: zodResolver(AppointmentSchema),
    mode: "onChange",
    defaultValues: {
      patientId: "",
      doctorId: "",
      date: "",
      startTime: "",
      endTime: "",
      description: "",
    },
  });

  // Get appointments array safely
  const appointments = data?.data?.data || [];
  
  // Filter appointments based on search query, provider filter, and date
  const filteredAppointments = Array.isArray(appointments)
    ? appointments.filter((appointment: any) => {
        // Search filter
        if (search.trim()) {
          const searchLower = search.toLowerCase();
          const patientName = `${appointment.patient?.first_name || ''} ${appointment.patient?.last_name || ''}`.toLowerCase();
          const doctorName = `${appointment.user?.firstname || ''} ${appointment.user?.lastname || ''}`.toLowerCase();
          const department = appointment.user?.department?.name?.toLowerCase() || '';
          const date = appointment.date ? new Date(appointment.date).toLocaleDateString().toLowerCase() : '';
          
          if (!patientName.includes(searchLower) &&
              !doctorName.includes(searchLower) &&
              !department.includes(searchLower) &&
              !date.includes(searchLower)) {
            return false;
          }
        }
        
        // Provider filter
        if (filterProvider && appointment.user?.id !== parseInt(filterProvider)) {
          return false;
        }
        
        // Date filter (for calendar view)
        if (viewMode === "calendar" && selectedDate && appointment.date) {
          const appointmentDate = parseISO(appointment.date);
          if (!isSameDay(appointmentDate, selectedDate)) {
            return false;
          }
        }
        
        return true;
      })
    : [];

  // Get appointments for a specific date (for calendar highlighting)
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((appointment: any) => {
      if (!appointment.date) return false;
      const appointmentDate = parseISO(appointment.date);
      return isSameDay(appointmentDate, date);
    });
  };

  // Get dates with appointments (for calendar highlighting)
  const datesWithAppointments = Array.isArray(appointments)
    ? appointments
        .filter((app: any) => app.date)
        .map((app: any) => parseISO(app.date))
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

  const handleDelete = async (appointmentId: number) => {
    setDeletingId(appointmentId);
    try {
      await processRequestAuth(
        "delete",
        `${API_ENDPOINTS.TENANTS_APPOINTMENTS(parseInt(slug))}/${appointmentId}`
      );
      toast.success("Appointment deleted successfully");
      mutate();
      setOpenDropdownId(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete appointment");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    editForm.reset({
      patientId: String(appointment.patient?.id || ""),
      doctorId: String(appointment.user?.id || ""),
      date: appointment.date || "",
      startTime: appointment.startTime || "",
      endTime: appointment.endTime || "",
      description: appointment.description || "",
    });
    setEditModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleEditSubmit = async (data: AppointmentSchemaType) => {
    if (!selectedAppointment) return;
    try {
      await processRequestAuth(
        "put",
        `${API_ENDPOINTS.TENANTS_APPOINTMENTS(parseInt(slug))}/${selectedAppointment.id}`,
        data
      );
      toast.success("Appointment updated successfully");
      mutate();
      setEditModalOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update appointment");
    }
  };
  const handleCalendarDateClick = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    const dayAppointments = getAppointmentsForDate(date);
    if (dayAppointments.length > 0) {
      // Show first appointment or allow selection
      setCalendarAppointmentModal(dayAppointments[0]);
    }
  };

  const handleAppointmentClick = (appointment: any) => {
    setCalendarAppointmentModal(appointment);
  };

  return (
    <section className="mb-10 relative">
      <section className="px-6 py-8 shadow-[0px_0px_4px_1px_#0000004D]">
        <header className="flex justify-between items-center border-b-2 py-4 mb-8">
          <h2 className="font-semibold text-xl text-black">
            Appointments
          </h2>

          <div className="flex gap-3">
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              onClick={() => setViewMode("calendar")}
              className="h-[60px] font-medium text-base px-6"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              className="h-[60px] font-medium text-base px-6"
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
            <Link href={`/dashboard/organization/${slug}/appointments/new`}>
              <Button className="h-[60px] bg-[#003465] text-white font-medium text-base px-6">
                Add Appointment
              </Button>
            </Link>
          </div>
        </header>

        {/* Filters */}
        <div className="flex items-center justify-between gap-5 py-6 mb-6 border-b">
          <div className="flex items-center gap-4 flex-1">
            {viewMode === "list" && (
              <ListView pageSize={pageSize} setPageSize={setPageSize} />
            )}
            <SearchInput onSearch={(query: string) => setSearch(query)} />
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={filterProvider} onValueChange={setFilterProvider}>
                <SelectTrigger className="w-[200px] h-14 border border-[#737373] rounded">
                  <SelectValue placeholder="Filter by Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {doctors.map((doctor: any) => (
                    <SelectItem key={doctor.id} value={String(doctor.id)}>
                      {doctor.firstname} {doctor.lastname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <div className="mb-8">
            <div className="flex gap-6">
              <div className="flex-1">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleCalendarDateClick}
                  className="rounded-md border"
                  modifiers={{
                    hasAppointments: datesWithAppointments,
                  }}
                  modifiersClassNames={{
                    hasAppointments: "bg-blue-100 text-blue-800 font-semibold rounded-md",
                  }}
                  classNames={{
                    day: "relative",
                  }}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-4">
                  {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}
                </h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {getAppointmentsForDate(selectedDate || new Date()).length > 0 ? (
                    getAppointmentsForDate(selectedDate || new Date()).map((appointment: any) => (
                      <div
                        key={appointment.id}
                        onClick={() => handleAppointmentClick(appointment)}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">
                              {appointment.patient?.first_name} {appointment.patient?.last_name}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {appointment.user?.firstname} {appointment.user?.lastname}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {appointment.startTime} - {appointment.endTime}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No appointments for this date</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <>
          <DataTable tableDataObj={AppointmentData[0]} showAction>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Loading appointments...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No appointments found
                </TableCell>
              </TableRow>
            ) : paginatedAppointments.length > 0 ? (
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
                    <TableCell>
                      <div className="relative">
                        <button
                          className="h-8 w-8 p-0 border-0 bg-transparent hover:bg-gray-100 rounded flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === appointment.id ? null : appointment.id);
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openDropdownId === appointment.id && (
                          <div 
                            className="absolute right-0 top-10 z-50 min-w-[120px] overflow-hidden rounded-md border bg-white p-1 shadow-md"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(appointment);
                              }}
                              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </div>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete this appointment? This action cannot be undone.`)) {
                                  handleDelete(appointment.id);
                                }
                              }}
                              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-red-600 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {deletingId === appointment.id ? "Deleting..." : "Delete"}
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
                  No appointments found
                </TableCell>
              </TableRow>
            )}
          </DataTable>
          <Pagination
            dataLength={filteredAppointments.length || 0}
            numOfPages={Math.max(1, Math.ceil((filteredAppointments.length || 0) / pageSize))}
            pageSize={pageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
          </>
        )}

      {/* Edit Appointment Modal */}
      {editModalOpen && selectedAppointment && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
          onClick={() => {
            setEditModalOpen(false);
            setSelectedAppointment(null);
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-black">Edit Appointment</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedAppointment(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Patient Selection */}
                <div>
                  <label className="block text-base text-black font-normal mb-2">Patient</label>
                  <Controller
                    name="patientId"
                    control={editForm.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded">
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(patientsData?.data?.data) && patientsData.data.data.map((patient: any) => (
                            <SelectItem key={patient.id} value={String(patient.id)}>
                              {patient.firstname} {patient.lastname}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {editForm.formState.errors.patientId && (
                    <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.patientId.message}</p>
                  )}
                </div>

                {/* Provider Selection */}
                <div>
                  <label className="block text-base text-black font-normal mb-2">Provider</label>
                  <Controller
                    name="doctorId"
                    control={editForm.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doctor: any) => (
                            <SelectItem key={doctor.id} value={String(doctor.id)}>
                              {doctor.firstname} {doctor.lastname}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {editForm.formState.errors.doctorId && (
                    <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.doctorId.message}</p>
                  )}
                </div>

                {/* Appointment Date */}
                <div>
                  <label className="block text-base text-black font-normal mb-2">Appointment Date</label>
                  <Controller
                    name="date"
                    control={editForm.control}
                    render={({ field }) => (
                      <DatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                        placeholder="Select appointment date"
                      />
                    )}
                  />
                  {editForm.formState.errors.date && (
                    <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.date.message}</p>
                  )}
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-base text-black font-normal mb-2">Start Time</label>
                  <Input
                    placeholder="Enter start time"
                    type="time"
                    {...editForm.register("startTime")}
                    className="w-full p-3 border border-[#737373] h-14 rounded"
                  />
                  {editForm.formState.errors.startTime && (
                    <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.startTime.message}</p>
                  )}
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-base text-black font-normal mb-2">End Time</label>
                  <Input
                    placeholder="Enter end time"
                    type="time"
                    {...editForm.register("endTime")}
                    className="w-full p-3 border border-[#737373] h-14 rounded"
                  />
                  {editForm.formState.errors.endTime && (
                    <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.endTime.message}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-base text-black font-normal mb-2">Description</label>
                <Textarea
                  placeholder="Enter appointment description"
                  {...editForm.register("description")}
                  className="w-full p-3 border border-[#737373] min-h-32 rounded"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  className="border border-[#EC0909] text-[#EC0909] hover:bg-[#ec090922] py-8 px-16 text-md rounded"
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedAppointment(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#003465] hover:bg-[#0d2337] text-white py-8 px-10 text-md rounded min-w-56"
                  disabled={editForm.formState.isSubmitting}
                >
                  {editForm.formState.isSubmitting ? <Spinner/> : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar Appointment Detail Popup */}
      {calendarAppointmentModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
          onClick={() => setCalendarAppointmentModal(null)}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-md mx-auto my-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-black">Appointment Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCalendarAppointmentModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <p className="text-sm text-gray-600">Patient</p>
                <p className="font-semibold">
                  {calendarAppointmentModal.patient?.first_name} {calendarAppointmentModal.patient?.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Provider</p>
                <p className="font-semibold">
                  {calendarAppointmentModal.user?.firstname} {calendarAppointmentModal.user?.lastname}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">
                  {calendarAppointmentModal.date ? format(parseISO(calendarAppointmentModal.date), "PPP") : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-semibold">
                  {calendarAppointmentModal.startTime} - {calendarAppointmentModal.endTime}
                </p>
              </div>
              {calendarAppointmentModal.description && (
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="font-semibold">{calendarAppointmentModal.description}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                className="flex-1 border border-[#EC0909] text-[#EC0909] hover:bg-[#ec090922] py-6 text-md rounded"
                onClick={() => {
                  setCalendarAppointmentModal(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 bg-[#003465] hover:bg-[#0d2337] text-white py-6 text-md rounded"
                onClick={() => {
                  handleEditClick(calendarAppointmentModal);
                  setCalendarAppointmentModal(null);
                }}
              >
                Edit
              </Button>
            </div>
          </div>
        </div>
      )}
      </section>
    </section>
  );
}
