"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseISO } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import {
  Calendar as CalendarIcon,
  List,
  Trash2,
  Plus,
  Edit,
  MoreVertical,
  X,
} from "lucide-react";

import { AppointmentData } from "@/components/shared/table/data";
import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import AppointmentsCalendar, {
  Appointment,
  ViewMode,
} from "@/components/Org/Appointments/AppointmentsCalendar";

import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import { processRequestAuth } from "@/framework/https";
import { formatDateFn } from "@/lib/utils";
import EditAppointmentModal from "./EditAppointmentModal";
import DeleteWarningModal from "@/components/shared/modals/DeleteWarningModal";

/* ---------------- schema ---------------- */

const AppointmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  description: z.string().optional(),
});

type FormType = z.infer<typeof AppointmentSchema>;

const imgSrc = (src: any, fallback: any) =>
  typeof src === "string" && src.startsWith("http") ? src : fallback;

/* ---------------- page ---------------- */

export default function Page({ slug }: { slug: string }) {
  const router = useRouter();

  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
  const [calendarViewMode, setCalendarViewMode] =
    useState<ViewMode>("month");

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterProvider, setFilterProvider] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<any | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  /* ---------------- data ---------------- */

  const orgId = slug && !isNaN(parseInt(slug)) ? parseInt(slug) : null;

  // Debug logging
  console.log("=== APPOINTMENT LIST DEBUG ===");
  console.log("viewMode:", viewMode);
  console.log("calendarViewMode:", calendarViewMode);
  console.log("orgId:", orgId);
  console.log("slug:", slug);
  console.log("API Endpoint:", orgId ? API_ENDPOINTS.TENANTS_APPOINTMENTS(orgId) : "null");

  // Only fetch if orgId is valid
  const appointmentsEndpoint = orgId && orgId > 0 ? API_ENDPOINTS.TENANTS_APPOINTMENTS(orgId) : null;
  
  const { data, error: appointmentsError, mutate } = useSWR(
    appointmentsEndpoint,
    authFectcher,
    {
      onError: (error) => {
        console.error("=== SWR APPOINTMENTS ERROR ===");
        console.error("Error:", error);
        console.error("Error response:", (error as any)?.response);
        console.error("Error status:", (error as any)?.response?.status);
        console.error("Error data:", (error as any)?.response?.data);
        console.error("orgId:", orgId);
        console.error("Endpoint:", appointmentsEndpoint);
      }
    }
  );

  const employeesEndpoint = orgId && orgId > 0 ? API_ENDPOINTS.GET_TENANTS_EMPLOYEES(orgId) : null;
  
  const { data: employeesData, error: employeesError } = useSWR(
    employeesEndpoint,
    authFectcher,
    {
      onError: (error) => {
        console.error("=== SWR EMPLOYEES ERROR ===");
        console.error("Error:", error);
        console.error("Error response:", (error as any)?.response);
        console.error("orgId:", orgId);
        console.error("Endpoint:", employeesEndpoint);
      }
    }
  );

  // Log errors
  if (appointmentsError) {
    console.error("=== APPOINTMENTS ERROR ===");
    console.error("Error:", appointmentsError);
    console.error("orgId:", orgId);
    console.error("Endpoint:", orgId ? API_ENDPOINTS.TENANTS_APPOINTMENTS(orgId) : "null");
  }

  if (employeesError) {
    console.error("=== EMPLOYEES ERROR ===");
    console.error("Error:", employeesError);
    console.error("orgId:", orgId);
  }

  const appointments = data?.data?.data || [];

  console.log("=== APPOINTMENT DATA DEBUG ===");
  console.log("data:", data);
  console.log("data?.data:", data?.data);
  console.log("data?.data?.data:", data?.data?.data);
  console.log("appointments:", appointments);
  console.log("appointments length:", appointments.length);

  const doctors = (employeesData?.data || []).filter((e: any) =>
    `${e.designation} ${e.department?.name}`
      .toLowerCase()
      .includes("doctor")
  );

  console.log("employeesData:", employeesData);
  console.log("employeesData?.data:", employeesData?.data);

  /* ---------------- filtering ---------------- */

  const filtered = appointments.filter((a: any) => {
    if (search) {
      const s = search.toLowerCase();
      const patientName = `${a.patient?.first_name || ''} ${a.patient?.last_name || ''}`.toLowerCase();
      const doctorName = `${a.user?.firstname || ''} ${a.user?.lastname || ''}`.toLowerCase();
      const department = (a.user?.department?.name || '').toLowerCase();
      const date = (a.date || '').toLowerCase();
      const time = `${a.startTime || ''} - ${a.endTime || ''}`.toLowerCase();
      
      if (
        !patientName.includes(s) &&
        !doctorName.includes(s) &&
        !department.includes(s) &&
        !date.includes(s) &&
        !time.includes(s)
      ) {
        return false;
      }
    }
    if (filterProvider && String(a.user?.id) !== filterProvider) return false;
    return true;
  });

  /* ---------------- calendar mapping ---------------- */

  const calendarAppointments: Appointment[] = filtered.map((a: any) => ({
    id: String(a.id),
    patientName: `${a.patient?.first_name} ${a.patient?.last_name}`,
    doctorName: `${a.user?.firstname} ${a.user?.lastname}`,
    department: a.user?.department?.name ?? "",
    date: a.date,
    time: `${a.startTime} - ${a.endTime}`,
    status: "Upcoming",
    description: a.description,
    age: a.patient?.age,
    appointmentDate: parseISO(a.date),
  }));

  console.log("=== CALENDAR APPOINTMENTS DEBUG ===");
  console.log("filtered:", filtered);
  console.log("calendarAppointments:", calendarAppointments);
  console.log("calendarAppointments length:", calendarAppointments.length);

  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const prevSearch = useRef(search);
  useEffect(() => {
    if (prevSearch.current !== search) setCurrentPage(1);
    prevSearch.current = search;
  }, [search]);

  /* ---------------- actions ---------------- */

  const handleDeleteClick = (appointment: any) => {
    setAppointmentToDelete(appointment);
    setShowDeleteWarning(true);
    setOpenDropdownId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!appointmentToDelete || !orgId) {
      toast.error("Invalid appointment or organization ID");
      return;
    }
    setDeletingId(appointmentToDelete.id);
    try {
    await processRequestAuth(
      "delete",
        `${API_ENDPOINTS.TENANTS_APPOINTMENTS(orgId)}/${appointmentToDelete.id}`
    );
      toast.success("Appointment deleted successfully");
    mutate();
      setShowDeleteWarning(false);
      setAppointmentToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete appointment");
    } finally {
    setDeletingId(null);
    }
  };

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

  const handleEditClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setEditModalOpen(true);
    setOpenDropdownId(null);
  };

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

  /* ---------------- render ---------------- */

  return (
    <section className="px-6 py-8">
      <header className="flex justify-between mb-6">
        <h2 className="text-xl font-semibold">Appointments</h2>
        {viewMode === "list" && (
        <div className="flex gap-3">
          <Button
              variant="outline"
            onClick={() => setViewMode("calendar")}
          >
            <CalendarIcon className="mr-2 w-4 h-4" /> Calendar
          </Button>
          <Button
              variant="default"
            onClick={() => setViewMode("list")}
              className="bg-[#003465] text-white hover:bg-[#00254a]"
          >
            <List className="mr-2 w-4 h-4" /> List
          </Button>
          <Link href={`/dashboard/organization/${slug}/appointments/new`}>
              <Button className="bg-[#003465] text-white hover:bg-[#00254a]">
                Add Appointment
              </Button>
          </Link>
        </div>
        )}
      </header>

      <div className="flex gap-4 mb-6 items-center">
        {viewMode === "list" && (
          <ListView pageSize={pageSize} setPageSize={setPageSize} />
        )}
        <div className="flex-1">
        <SearchInput onSearch={setSearch} />
        </div>
        <Select value={filterProvider} onValueChange={setFilterProvider}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filter provider" />
          </SelectTrigger>
          <SelectContent>
            {doctors.map((d: any) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.firstname} {d.lastname}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!orgId && (
        <div className="p-8 text-center">
          <p className="text-red-500">Error: Invalid organization ID. Please check the URL.</p>
          <p className="text-sm text-gray-500 mt-2">orgId: {orgId}, slug: {slug}</p>
        </div>
      )}

      {orgId && appointmentsError && (
        <div className="p-8 text-center">
          <p className="text-red-500">Error loading appointments: {appointmentsError?.message || "Unknown error"}</p>
          <p className="text-sm text-gray-500 mt-2">
            Endpoint: {API_ENDPOINTS.TENANTS_APPOINTMENTS(orgId)}
          </p>
          <p className="text-sm text-gray-500">Status: {(appointmentsError as any)?.response?.status || "N/A"}</p>
        </div>
      )}

      {viewMode === "calendar" && orgId && !appointmentsError && (
        <>
          {console.log("Rendering calendar with appointments:", calendarAppointments.length)}
        <AppointmentsCalendar
          viewMode={calendarViewMode}
          setViewMode={setCalendarViewMode}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          appointments={calendarAppointments}
            onViewAppointment={(apt) => {
              const foundAppointment = appointments.find((a: any) => String(a.id) === apt.id);
              if (foundAppointment) {
                router.push(`/dashboard/organization/${slug}/appointments/${foundAppointment.id}/edit`);
              }
            }}
          onAddAppointment={() =>
            router.push(
              `/dashboard/organization/${slug}/appointments/new`
            )
          }
            onShowList={() => setViewMode("list")}
          />
        </>
      )}

      {/* Floating action buttons - only show in calendar view */}
      {viewMode === "calendar" && (
        <div className="fixed bottom-10 right-10 flex flex-col gap-4 z-50">
          <Link href={`/dashboard/organization/${slug}/appointments/new`}>
            <Button
              type="button"
              className="rounded-full w-14 h-14 bg-[#003465] hover:bg-[#00254a] shadow-lg flex items-center justify-center"
            >
              <Plus className="w-6 h-6 text-white" />
            </Button>
          </Link>
          <Button
            type="button"
            onClick={() => setViewMode("list")}
            className="rounded-full w-14 h-14 bg-[#003465] hover:bg-[#00254a] shadow-lg flex items-center justify-center"
          >
            <List className="w-6 h-6 text-white" />
          </Button>
        </div>
      )}

      {viewMode === "list" && (
        <>
          <div className="mt-6">
            <DataTable tableDataObj={AppointmentData[0]}>
            {paginated.map((a: any, index: number) => (
              <TableRow key={a.id}>
                <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                <TableCell>
                  <div className="flex gap-2 items-center">
                    <Image
                      src={imgSrc(
                        a.patient?.image,
                        AppointmentData[0].Patient.image
                      )}
                      alt=""
                      width={42}
                      height={42}
                      className="rounded-full"
                    />
                    {a.patient?.first_name || a.patient?.firstname} {a.patient?.last_name || a.patient?.lastname}
                  </div>
                </TableCell>
                <TableCell>{a.date ? formatDateFn(a.date) : a.date}</TableCell>
                <TableCell>
                  {a.user?.firstname} {a.user?.lastname}
                  {a.user?.department?.name && ` - ${a.user.department.name}`}
                </TableCell>
                <TableCell>
                  {a.startTime} - {a.endTime}
                </TableCell>
                <TableCell>
                  <div className="relative">
                    <button
                      className="h-8 w-8 p-0 border-0 bg-transparent hover:bg-gray-100 rounded flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(openDropdownId === a.id ? null : a.id);
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                  </button>
                    {openDropdownId === a.id && (
                      <div 
                        className={`absolute right-0 z-[100] min-w-[120px] overflow-visible rounded-md border bg-white p-1 shadow-lg ${
                          index >= paginated.length - 2 || paginated.length === 1 ? 'bottom-10' : 'top-10'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: 'absolute' }}
                      >
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(a);
                          }}
                          className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(a);
                          }}
                          className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-red-600 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </div>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
          </div>

          <Pagination
            dataLength={filtered.length}
            numOfPages={Math.ceil(filtered.length / pageSize)}
            pageSize={pageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </>
      )}

      {/* Delete Warning Modal */}
      {showDeleteWarning && appointmentToDelete && (
        <DeleteWarningModal
          title="Delete Appointment"
          message="Are you sure you want to delete this appointment for"
          itemName={`${appointmentToDelete.patient?.first_name || appointmentToDelete.patient?.firstname} ${appointmentToDelete.patient?.last_name || appointmentToDelete.patient?.lastname}`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteWarning(false);
            setAppointmentToDelete(null);
          }}
          isDeleting={deletingId !== null}
        />
      )}
    </section>
  );
}