"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/Textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { X } from "lucide-react";
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
import { Spinner } from "@/components/icons/Spinner";
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

interface EditAppointmentModalProps {
  slug: string;
  tenantIdForPath?: number | string;
  appointment: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditAppointmentModal({ 
  slug, 
  tenantIdForPath,
  appointment, 
  onClose, 
  onSuccess 
}: EditAppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const orgId = useMemo(() => {
    if (tenantIdForPath != null && tenantIdForPath !== "") {
      return tenantIdForPath;
    }
    if (!slug) return null;
    return /^\d+$/.test(String(slug)) ? parseInt(String(slug), 10) : null;
  }, [slug, tenantIdForPath]);

  const toHHmm = (time: string) => {
    if (!time) return "";
    const parts = time.trim().split(":");
    if (parts.length >= 2) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    return time;
  };

  const { data: patientsData, isLoading: isLoadingPatients } = useSWR(
    orgId ? API_ENDPOINTS.TENANTS_PATIENTS(orgId) : null,
    authFectcher
  );

  const { data: employeesData, isLoading: isLoadingEmployees } = useSWR(
    orgId ? API_ENDPOINTS.GET_TENANTS_EMPLOYEES(orgId) : null,
    authFectcher
  );

  const form = useForm<AppointmentSchemaType>({
    resolver: zodResolver(AppointmentSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      date: "",
      startTime: "",
      endTime: "",
      description: "",
    },
  });

  const patients = useMemo(
    () => extractPatientsFromResponse(patientsData),
    [patientsData]
  );
  const employees = useMemo(
    () => extractEmployeesFromResponse(employeesData),
    [employeesData]
  );

  const resolvedPatientId = useMemo(
    () => resolveAppointmentPatientId(appointment, patients),
    [appointment, patients]
  );
  const resolvedDoctorId = useMemo(
    () => resolveAppointmentDoctorId(appointment, employees),
    [appointment, employees]
  );

  const getPatientSelectValue = (p: any): string => {
    const id = p?.id ?? p?.patient_id ?? p?.patientId ?? p?.user_id ?? p?.userId;
    return id != null && id !== "" ? String(id) : "";
  };
  const getProviderSelectValue = (e: any): string => {
    const id =
      e?.id ??
      e?.userId ??
      e?.user_id ??
      e?.employeeId ??
      e?.employee_id ??
      e?.providerId ??
      e?.provider_id;
    return id != null && id !== "" ? String(id) : "";
  };

  useEffect(() => {
    if (!appointment?.id) return;
    form.reset({
      patientId: resolvedPatientId,
      doctorId: resolvedDoctorId,
      date: appointment.date || "",
      startTime: normalizeTimeForSelect(appointment.startTime ?? appointment.start_time ?? ""),
      endTime: normalizeTimeForSelect(appointment.endTime ?? appointment.end_time ?? ""),
      description: appointment.description || "",
    });
  }, [appointment, resolvedPatientId, resolvedDoctorId, form]);

  const handleSubmit = async (data: AppointmentSchemaType) => {
    if (!appointment?.id || orgId == null) return;
    setLoading(true);
    try {
      const appointmentData = {
        patientId: Number(data.patientId),
        doctorId: Number(data.doctorId),
        date: data.date,
        startTime: toHHmm(data.startTime),
        endTime: toHHmm(data.endTime),
        description: data.description || "",
      };

      await processRequestAuth(
        "patch",
        `${API_ENDPOINTS.TENANTS_APPOINTMENTS(orgId)}/${appointment.id}`,
        appointmentData
      );

      onSuccess();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update appointment";
      toast.error(errorMessage);
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
          <h2 className="text-2xl font-bold text-black">Edit Appointment</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                    <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded">
                      <SelectValue placeholder={isLoadingPatients ? "Loading patients..." : "Select patient"} />
                    </SelectTrigger>
                    <SelectContent className="z-[10000] bg-white max-h-[300px] overflow-y-auto">
                      {isLoadingPatients ? (
                        <div className="px-2 py-1.5 text-sm text-gray-500">Loading patients...</div>
                      ) : patients.length > 0 ? (
                        patients.map((patient: any) => {
                          const value = getPatientSelectValue(patient);
                          if (!value) return null;
                          return (
                            <SelectItem key={value} value={value}>
                            {patient.firstname || patient.first_name} {patient.lastname || patient.last_name}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-gray-500">No patients available</div>
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
                    <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded">
                      <SelectValue placeholder={isLoadingEmployees ? "Loading providers..." : "Select provider"} />
                    </SelectTrigger>
                    <SelectContent className="z-[10000] bg-white max-h-[300px] overflow-y-auto">
                      {isLoadingEmployees ? (
                        <div className="px-2 py-1.5 text-sm text-gray-500">Loading providers...</div>
                      ) : employees.length > 0 ? (
                        employees.map((employee: any) => {
                          const value = getProviderSelectValue(employee);
                          if (!value) return null;
                          return (
                            <SelectItem key={value} value={value}>
                            {employee.firstname} {employee.lastname}
                            {employee.department?.name && ` - ${employee.department.name}`}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-gray-500">No providers available</div>
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

          {/* Date, Start Time, End Time */}
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
                        dateValue = undefined;
                      }
                    } catch (e) {
                      dateValue = undefined;
                    }
                  }
                  
                  return (
                    <DatePicker
                      key={`date-picker-${field.value || 'empty'}`}
                      date={dateValue}
                      onDateChange={(date) => {
                        const formattedDate = date ? formatDateLocal(date) : '';
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

            {/* Start Time (24h) */}
            <div>
              <label className="block text-base text-black font-normal mb-2">Start Time (24h)</label>
              <Controller
                name="startTime"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ? String(field.value) : undefined}>
                    <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded">
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

            {/* End Time (24h) */}
            <div>
              <label className="block text-base text-black font-normal mb-2">End Time (24h)</label>
              <Controller
                name="endTime"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ? String(field.value) : undefined}>
                    <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded">
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

          {/* Description */}
          <div>
            <label className="block text-base text-black font-normal mb-2">Description (Optional)</label>
            <Textarea
              {...form.register("description")}
              placeholder="Enter appointment description..."
              className="w-full p-3 min-h-32 border border-[#737373] rounded"
            />
          </div>

          {/* Action Buttons */}
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

