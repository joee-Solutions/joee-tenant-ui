"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Textarea } from "@/components/ui/Textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDateLocal, parseISOStringToLocalDate } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { processRequestAuth } from "@/framework/https";
import useSWR from "swr";
import { authFectcher } from "@/hooks/swr";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";
import { useCrudSuccessModal } from "@/hooks/useCrudSuccessModal";
import {
  extractPatientsFromResponse,
  extractEmployeesFromResponse,
  resolveAppointmentPatientId,
  resolveAppointmentDoctorId,
} from "@/components/Org/Appointments/appointmentFormUtils";
import {
  TIME_OPTIONS_24H,
  normalizeTimeForSelect,
} from "@/components/Org/Schedule/scheduleFormUtils";

const AppointmentSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  doctorId: z.string().min(1, "Provider is required"),
  date: z.string().min(1, "Appointment date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  description: z.string().optional(),
}).refine((data) => {
  // Validate that startTime is less than endTime
  if (data.startTime && data.endTime) {
    const [startHour, startMin] = data.startTime.split(':').map(Number);
    const [endHour, endMin] = data.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return startMinutes < endMinutes;
  }
  return true;
}, {
  message: "Start time must be earlier than end time",
  path: ["endTime"],
});

type AppointmentSchemaType = z.infer<typeof AppointmentSchema>;

export default function EditAppointment({ slug, appointmentId }: { slug: string; appointmentId: number }) {
  const router = useRouter();
  const { triggerSuccess, SuccessModal } = useCrudSuccessModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate slug and get orgId
  const orgId = useMemo(() => {
    if (!slug) {
      return null;
    }
    const slugStr = String(slug);
    const parsed = parseInt(slugStr);
    if (isNaN(parsed)) {
      return null;
    }
    return parsed;
  }, [slug]);

  // Fetch all appointments and find the one we need
  // This is a workaround if the single appointment endpoint doesn't work
  const appointmentsEndpoint = orgId && orgId > 0 ? API_ENDPOINTS.TENANTS_APPOINTMENTS(orgId) : null;
  
  const { data: allAppointmentsData, isLoading: isLoadingAllAppointments, error: allAppointmentsError } = useSWR(
    appointmentsEndpoint,
    authFectcher,
    {
      onError: (error) => {
        // Error handled silently, will use cached data if available
      }
    }
  );

  // Try to fetch single appointment first, fallback to finding in list
  const appointmentEndpoint = orgId && orgId > 0 && appointmentId && appointmentId > 0 
    ? `${API_ENDPOINTS.TENANTS_APPOINTMENTS(orgId)}/${appointmentId}` 
    : null;
  
  const { data: singleAppointmentData, isLoading: isLoadingSingleAppointment, error: singleAppointmentError } = useSWR(
    appointmentEndpoint,
    authFectcher,
    {
      onError: (error) => {
        // Error handled silently, will use cached data if available
      }
    }
  );

  // Use single appointment data if available, otherwise find in list
  const appointmentData = useMemo(() => {
    if (singleAppointmentData) {
      return singleAppointmentData;
    }
    
    if (allAppointmentsData && appointmentId) {
      const appointments = allAppointmentsData?.data?.data || 
                          allAppointmentsData?.data?.results || 
                          allAppointmentsData?.data || 
                          allAppointmentsData || [];
      
      const found = Array.isArray(appointments) 
        ? appointments.find((a: any) => String(a?.id) === String(appointmentId))
        : null;
      
      if (found) {
        return { data: found };
      }
    }
    return null;
  }, [singleAppointmentData, allAppointmentsData, appointmentId]);

  const isLoadingAppointment = isLoadingSingleAppointment || isLoadingAllAppointments;
  const appointmentError = (!isLoadingAppointment && !appointmentData && singleAppointmentError && allAppointmentsError) 
    ? singleAppointmentError || allAppointmentsError 
    : null;

  // Fetch data for dropdowns
  const { data: patientsData, isLoading: isLoadingPatients } = useSWR(
    orgId ? API_ENDPOINTS.TENANTS_PATIENTS(orgId) : null,
    authFectcher
  );

  const { data: employeesData, isLoading: isLoadingEmployees } = useSWR(
    orgId ? API_ENDPOINTS.GET_TENANTS_EMPLOYEES(orgId) : null,
    authFectcher
  );

  const patients = useMemo(
    () => extractPatientsFromResponse(patientsData),
    [patientsData]
  );

  const providers = useMemo(
    () => extractEmployeesFromResponse(employeesData),
    [employeesData]
  );

  const form = useForm<AppointmentSchemaType>({
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

  const { reset } = form;

  useEffect(() => {
    if (
      !appointmentData ||
      isLoadingAppointment ||
      !appointmentId ||
      isLoadingPatients ||
      isLoadingEmployees
    ) {
      return;
    }

    let appointment: any = appointmentData;
    if (appointmentData?.data?.data) {
      appointment = appointmentData.data.data;
    } else if (appointmentData?.data) {
      appointment = appointmentData.data;
    }

    if (!appointment || typeof appointment !== "object") return;

    const patientId = resolveAppointmentPatientId(appointment, patients);
    const doctorId = resolveAppointmentDoctorId(appointment, providers);

    reset({
      patientId,
      doctorId,
      date: appointment.date || "",
      startTime: normalizeTimeForSelect(
        appointment.startTime ?? appointment.start_time ?? ""
      ),
      endTime: normalizeTimeForSelect(
        appointment.endTime ?? appointment.end_time ?? ""
      ),
      description: appointment.description || "",
    });
  }, [
    appointmentData,
    isLoadingAppointment,
    appointmentId,
    isLoadingPatients,
    isLoadingEmployees,
    patients,
    providers,
    reset,
  ]);

  const toHHmm = (time: string) => {
    if (!time) return "";
    const parts = time.trim().split(":");
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    }
    return time;
  };

  const onSubmit = async (data: AppointmentSchemaType) => {
    setLoading(true);
    setError(null);

    try {
      const patchPayload = {
        patientId: Number(data.patientId),
        doctorId: Number(data.doctorId),
        date: data.date,
        startTime: toHHmm(data.startTime),
        endTime: toHHmm(data.endTime),
        description: data.description || "",
      };

      const res = await processRequestAuth(
        "patch",
        `${API_ENDPOINTS.TENANTS_APPOINTMENTS(orgId!)}/${appointmentId}`,
        patchPayload
      );

      if (res && (res.status === true || res.status === 200 || res.success)) {
        triggerSuccess({
          message: "Appointment updated successfully.",
          onContinue: () => {
            router.push(`/dashboard/organization/${slug}/appointments`);
          },
        });
      } else {
        if (res?.validationErrors && Array.isArray(res.validationErrors)) {
          setError(res.validationErrors.join(", "));
        } else {
          setError(res?.message || res?.error || "Failed to update appointment. Please try again.");
        }
      }
    } catch (err: unknown) {
      
      let errorMessage = "Failed to update appointment. Please check your connection and try again.";
      
      if (err && typeof err === 'object' && 'response' in err) {
        const errorResponse = (err as any).response;
        if (errorResponse?.data) {
          const errorData = errorResponse.data;
          
          if (errorData.validationErrors && Array.isArray(errorData.validationErrors)) {
            errorMessage = errorData.validationErrors.join(", ");
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = (err as { message: string }).message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingAppointment) {
    return (
      <div className="py-8 px-6 my-8 shadow-[0px_0px_4px_1px_#0000004D]">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003465]"></div>
        </div>
      </div>
    );
  }

  // Only show error if we've finished loading and still don't have data
  if (!isLoadingAppointment && !appointmentData && appointmentError) {
    return (
      <div className="py-8 px-6 my-8 shadow-[0px_0px_4px_1px_#0000004D]">
        <div className="p-8 text-center">
          <p className="text-red-500 text-lg font-semibold mb-2">Error loading appointment</p>
          <p className="text-sm text-gray-600 mb-4">
            {appointmentError?.message || (appointmentError as any)?.response?.data?.message || "Unknown error"}
          </p>
          <p className="text-xs text-gray-500 mb-2">
            Single endpoint: {appointmentEndpoint || "N/A"}
          </p>
          <p className="text-xs text-gray-500 mb-2">
            List endpoint: {appointmentsEndpoint || "N/A"}
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Status: {(appointmentError as any)?.response?.status || "N/A"}
          </p>
          <Link href={`/dashboard/organization/${slug}/appointments`}>
            <Button className="mt-4">Back to Appointments</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-6 my-8 shadow-[0px_0px_4px_1px_#0000004D]">
      <div className="flex justify-between items-center border-b-2  py-4 mb-8">
        <h1 className="font-semibold text-xl text-black">Edit Appointment</h1>

        <Link href={`/dashboard/organization/${slug}/appointments`}>
          <Button variant="outline" className="h-[60px] border border-[#003465] text-[#003465] font-medium text-base px-6 hover:bg-[#003465] hover:text-white">
            Back
          </Button>
        </Link>
      </div>


      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Selection */}
          <div>
            <label className="block text-base text-black font-normal mb-2">Patient</label>
            <Controller
              name="patientId"
              control={form.control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value ? String(field.value) : undefined}
                >
                  <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                    <SelectValue placeholder={isLoadingPatients ? "Loading patients..." : "Select patient"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-[300px] overflow-y-auto">
                    {isLoadingPatients ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500">Loading patients...</div>
                    ) : patients.length > 0 ? (
                      patients.map((patient: any) => (
                        <SelectItem
                          key={patient.id}
                          value={String(patient.id)}
                          className="hover:bg-gray-200"
                        >
                          {patient.first_name || patient.firstname} {patient.last_name || patient.lastname}
                          {patient.gender && ` (${patient.gender})`}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500">
                        {patientsData ? "No patients available" : "Loading..."}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.patientId && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.patientId.message}</p>
            )}
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-base text-black font-normal mb-2">Provider</label>
            <Controller
              name="doctorId"
              control={form.control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value ? String(field.value) : undefined}
                >
                  <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                    <SelectValue placeholder={isLoadingEmployees ? "Loading providers..." : "Select provider"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-[300px] overflow-y-auto">
                    {isLoadingEmployees ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500">Loading providers...</div>
                    ) : providers.length > 0 ? (
                      providers.map((employee: any) => (
                        <SelectItem
                          key={employee.id}
                          value={String(employee.id)}
                          className="hover:bg-gray-200"
                        >
                          {employee.firstname || employee.first_name} {employee.lastname || employee.last_name}
                          {employee.department?.name && ` - ${employee.department.name}`}
                          {employee.designation && ` (${employee.designation})`}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500">
                        {employeesData ? "No providers available" : "Loading..."}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.doctorId && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.doctorId.message}</p>
            )}
          </div>
        </div>

        {/* Appointment Date, Start Time, and End Time on the same row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Appointment Date */}
          <div>
            <label className="block text-base text-black font-normal mb-2">Appointment Date</label>
            <Controller
              name="date"
              control={form.control}
              render={({ field }) => {
                let dateValue: Date | undefined = undefined;
                if (field.value) {
                  try {
                    dateValue = parseISOStringToLocalDate(field.value);
                    if (isNaN(dateValue.getTime())) {
                      dateValue = new Date(field.value);
                    }
                    if (isNaN(dateValue.getTime())) {
                      dateValue = undefined;
                    }
                  } catch (e) {
                    console.error("Error parsing date:", e);
                    dateValue = undefined;
                  }
                }
                
                return (
                  <DatePicker
                    key={`date-picker-${field.value || 'empty'}`}
                    date={dateValue}
                    onDateChange={(date) => {
                      const formattedDate = date ? formatDateLocal(date) : "";
                      field.onChange(formattedDate);
                    }}
                    placeholder="Select appointment date"
                  />
                );
              }}
            />
            {form.formState.errors.date && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.date.message}</p>
            )}
          </div>

          {/* Start time (24h) */}
          <div>
            <label className="block text-base text-black font-normal mb-2">Start time (24h)</label>
            <Controller
              name="startTime"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ? field.value : undefined}>
                  <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-[280px]">
                    {TIME_OPTIONS_24H.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.startTime && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.startTime.message}</p>
            )}
          </div>

          {/* End time (24h) */}
          <div>
            <label className="block text-base text-black font-normal mb-2">End time (24h)</label>
            <Controller
              name="endTime"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ? field.value : undefined}>
                  <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                    <SelectValue placeholder="Select end time" />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-[280px]">
                    {TIME_OPTIONS_24H.map((t) => (
                      <SelectItem key={`e-${t}`} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.endTime && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.endTime.message}</p>
            )}
          </div>
        </div>

        {/* Appointment Description */}
        <div>
          <label className="block text-base text-black font-normal mb-2">Description (Optional)</label>
          <Textarea
            {...form.register("description")}
            placeholder="Enter appointment description..."
            className="w-full p-3 min-h-32 border border-[#737373] rounded"
          />
          {form.formState.errors.description && (
            <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          <Button
            type="button"
            className="border border-[#EC0909] text-[#EC0909] hover:bg-[#ec090922] py-8 px-16 text-md rounded"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-[#003465] hover:bg-[#0d2337] text-white py-8 px-16 text-md rounded disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              "Update Appointment"
            )}
          </Button>
        </div>
      </form>
      {SuccessModal}
    </div>
  );
}

