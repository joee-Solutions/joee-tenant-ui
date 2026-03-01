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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import ViewEditAppointmentModal from "./ViewEditAppointmentModal";
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

  // Resolve tenant from API so we use the same id the backend uses (avoids 404 on PATCH)
  const tenantEndpoint = slug ? API_ENDPOINTS.GET_TENANT(slug) : null;
  const { data: tenantData } = useSWR(tenantEndpoint, authFectcher);
  const tenant = tenantData?.data ?? tenantData;
  const orgId = tenant?.id != null
    ? (typeof tenant.id === "number" ? tenant.id : Number(tenant.id))
    : (slug && /^\d+$/.test(String(slug)) ? parseInt(String(slug), 10) : null);
  const tenantIdForPath = tenant?.id != null ? tenant.id : (orgId ?? slug);

  // Only fetch if we have a valid tenant identifier
  const appointmentsEndpoint = tenantIdForPath != null && tenantIdForPath !== "" ? API_ENDPOINTS.TENANTS_APPOINTMENTS(tenantIdForPath) : null;
  
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

  const employeesEndpoint = tenantIdForPath != null && tenantIdForPath !== "" ? API_ENDPOINTS.GET_TENANTS_EMPLOYEES(tenantIdForPath) : null;
  
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
    if (!appointmentToDelete || (tenantIdForPath == null || tenantIdForPath === "")) {
      toast.error("Invalid appointment or organization ID");
      return;
    }
    setDeletingId(appointmentToDelete.id);
    try {
    await processRequestAuth(
      "delete",
        `${API_ENDPOINTS.TENANTS_APPOINTMENTS(tenantIdForPath)}/${appointmentToDelete.id}`
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

  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

  const handleViewAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
    setOpenDropdownId(null);
  };

  const handleCloseAppointmentModal = () => {
    setShowAppointmentModal(false);
    setSelectedAppointment(null);
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

      {tenantIdForPath == null || tenantIdForPath === "" ? (
        <div className="p-8 text-center">
          <p className="text-red-500">Error: Invalid organization. Please check the URL.</p>
          <p className="text-sm text-gray-500 mt-2">slug: {slug}</p>
        </div>
      ) : null}

      {tenantIdForPath != null && tenantIdForPath !== "" && appointmentsError && appointments.length === 0 && (
        <div className="p-8 text-center">
          {appointmentsError?.message?.includes("offline") || appointmentsError?.message?.includes("No cached data") || (typeof window !== 'undefined' && !navigator.onLine) ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-yellow-800 font-medium mb-2">You're currently offline</p>
              <p className="text-yellow-700 text-sm">
                No cached appointments available. Please connect to the internet to load appointments, or visit this page while online to cache it for offline use.
              </p>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-800 font-medium mb-2">Error loading appointments</p>
              <p className="text-red-700 text-sm">{appointmentsError?.message || "Unknown error"}</p>
            </div>
          )}
        </div>
      )}
      
      {tenantIdForPath != null && tenantIdForPath !== "" && appointmentsError && appointments.length > 0 && (typeof window !== 'undefined' && !navigator.onLine) && (
        <div className="p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            ⚠️ You're offline. Showing cached appointments. Some data may be outdated.
          </p>
        </div>
      )}

      {viewMode === "calendar" && tenantIdForPath != null && tenantIdForPath !== "" && !appointmentsError && (
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
                handleViewAppointment(foundAppointment);
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
                        onClick={() => handleViewAppointment(a)}
                        className="cursor-pointer flex items-center gap-2"
                      >
                        <Edit className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(a)}
                        className="cursor-pointer flex items-center gap-2 text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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

      {/* View / Edit Appointment Modal (calendar click or list Edit) */}
      {showAppointmentModal && selectedAppointment && tenantIdForPath != null && tenantIdForPath !== "" && (
        <ViewEditAppointmentModal
          appointment={selectedAppointment}
          orgId={typeof tenantIdForPath === "number" ? tenantIdForPath : (/^\d+$/.test(String(tenantIdForPath)) ? parseInt(String(tenantIdForPath), 10) : undefined)}
          tenantIdForPath={tenantIdForPath}
          onClose={handleCloseAppointmentModal}
          onUpdate={() => mutate()}
        />
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