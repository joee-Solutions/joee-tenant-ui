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
  const [calendarModal, setCalendarModal] = useState<any>(null);

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterProvider, setFilterProvider] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  /* ---------------- data ---------------- */

  const { data, mutate } = useSWR(
    API_ENDPOINTS.TENANTS_APPOINTMENTS(Number(slug)),
    authFectcher
  );

  const { data: employeesData } = useSWR(
    API_ENDPOINTS.GET_TENANTS_EMPLOYEES(Number(slug)),
    authFectcher
  );

  const appointments = data?.data?.data || [];

  const doctors = (employeesData?.data || []).filter((e: any) =>
    `${e.designation} ${e.department?.name}`
      .toLowerCase()
      .includes("doctor")
  );

  /* ---------------- calendar mapping ---------------- */

  const calendarAppointments: Appointment[] = appointments.map((a: any) => ({
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

  /* ---------------- filtering ---------------- */

  const filtered = appointments.filter((a: any) => {
    if (search) {
      const s = search.toLowerCase();
      if (
        !`${a.patient?.first_name} ${a.patient?.last_name}`
          .toLowerCase()
          .includes(s)
      )
        return false;
    }
    if (filterProvider && String(a.user?.id) !== filterProvider) return false;
    return true;
  });

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

  const del = async (id: number) => {
    setDeletingId(id);
    await processRequestAuth(
      "delete",
      `${API_ENDPOINTS.TENANTS_APPOINTMENTS(Number(slug))}/${id}`
    );
    toast.success("Deleted");
    mutate();
    setDeletingId(null);
  };

  /* ---------------- render ---------------- */

  return (
    <section className="px-6 py-8">
      <header className="flex justify-between mb-6">
        <h2 className="text-xl font-semibold">Appointments</h2>
        <div className="flex gap-3">
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            onClick={() => setViewMode("calendar")}
          >
            <CalendarIcon className="mr-2 w-4 h-4" /> Calendar
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
          >
            <List className="mr-2 w-4 h-4" /> List
          </Button>
          <Link href={`/dashboard/organization/${slug}/appointments/new`}>
            <Button>Add Appointment</Button>
          </Link>
        </div>
      </header>

      <div className="flex gap-4 mb-6">
        {viewMode === "list" && (
          <ListView pageSize={pageSize} setPageSize={setPageSize} />
        )}
        <SearchInput onSearch={setSearch} />
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

      {viewMode === "calendar" && (
        <AppointmentsCalendar
          viewMode={calendarViewMode}
          setViewMode={setCalendarViewMode}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          appointments={calendarAppointments}
          onViewAppointment={(apt) =>
            setCalendarModal(
              appointments.find((a: any) => String(a.id) === apt.id)
            )
          }
          onAddAppointment={() =>
            router.push(
              `/dashboard/organization/${slug}/appointments/new`
            )
          }
        />
      )}

      {viewMode === "list" && (
        <>
          <DataTable tableDataObj={AppointmentData[0]} showAction>
            {paginated.map((a: any) => (
              <TableRow key={a.id}>
                <TableCell>{a.id}</TableCell>
                <TableCell>
                  <div className="flex gap-2 items-center">
                    <Image
                      src={imgSrc(
                        a.patient?.image,
                        AppointmentData[0].appointment.image
                      )}
                      alt=""
                      width={42}
                      height={42}
                      className="rounded-full"
                    />
                    {a.patient?.first_name} {a.patient?.last_name}
                  </div>
                </TableCell>
                <TableCell>{a.user?.firstname}</TableCell>
                <TableCell>{a.date}</TableCell>
                <TableCell>
                  {a.startTime} - {a.endTime}
                </TableCell>
                <TableCell>
                  <button onClick={() => del(a.id)}>
                    {deletingId === a.id ? "..." : <Trash2 />}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </DataTable>

          <Pagination
            dataLength={filtered.length}
            numOfPages={Math.ceil(filtered.length / pageSize)}
            pageSize={pageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </>
      )}

      {calendarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-96">
            <h3 className="font-bold mb-2">Appointment</h3>
            <p>
              {calendarModal.patient?.first_name}{" "}
              {calendarModal.patient?.last_name}
            </p>
            <Button onClick={() => setCalendarModal(null)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}