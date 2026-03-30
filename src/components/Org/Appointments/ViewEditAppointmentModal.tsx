"use client";

import { useState, useEffect, useMemo, type MouseEvent } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Edit, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
});

type AppointmentSchemaType = z.infer<typeof AppointmentSchema>;

interface ViewEditAppointmentModalProps {
  appointment: any;
  /** Numeric org id (for SWR keys when tenant uses numeric id) */
  orgId?: number;
  /** Tenant id to use in API path (from GET_TENANT); use this for PATCH/DELETE to avoid 404 */
  tenantIdForPath?: number | string;
  /** When true (e.g. opened from list "Edit"), form opens in edit mode without an extra Edit click */
  openInEditMode?: boolean;
  onClose: () => void;
  onUpdate: () => void;
  /** Close the edit modal first, then show success (parent-owned success modal) */
  onOperationSuccess?: (message: string) => void;
}

export default function ViewEditAppointmentModal({
  appointment,
  orgId,
  tenantIdForPath,
  openInEditMode = false,
  onClose,
  onUpdate,
  onOperationSuccess,
}: ViewEditAppointmentModalProps) {
  const tenantId = tenantIdForPath ?? orgId ?? null;
  const [isEditMode, setIsEditMode] = useState(openInEditMode);
  const [loading, setLoading] = useState(false);

  // Normalize time to HH:mm for API (backend rejects HH:mm:ss)
  const toHHmm = (time: string) => {
    if (!time) return "";
    const parts = time.trim().split(":");
    if (parts.length >= 2) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    return time;
  };

  // Fetch data for dropdowns
  const { data: patientsData, isLoading: isLoadingPatients } = useSWR(
    tenantId != null && tenantId !== "" ? API_ENDPOINTS.TENANTS_PATIENTS(tenantId) : null,
    authFectcher
  );

  const { data: employeesData, isLoading: isLoadingEmployees } = useSWR(
    tenantId != null ? API_ENDPOINTS.GET_TENANTS_EMPLOYEES(tenantId) : null,
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

  const resolvedPatientId = useMemo(
    () => resolveAppointmentPatientId(appointment, patients),
    [appointment, patients]
  );

  const resolvedDoctorId = useMemo(
    () => resolveAppointmentDoctorId(appointment, providers),
    [appointment, providers]
  );

  // Format time for display (HH:mm to HH:MM AM/PM)
  const formatTimeForDisplay = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Format time range for display
  const formatTimeRange = (start: string, end: string) => {
    if (!start || !end) return "";
    return `${formatTimeForDisplay(start)} - ${formatTimeForDisplay(end)}`;
  };

  const getPatientSelectValue = (p: any): string => {
    const id =
      p?.id ??
      p?.patient_id ??
      p?.patientId ??
      p?.user_id ??
      p?.userId;
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

  // Format date for display (e.g., "10 February, 2022")
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "";
    const date = parseISOStringToLocalDate(dateString);
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

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

  // Reset form when appointment or resolved dropdown ids change (SWR may load after open).
  useEffect(() => {
    if (!appointment?.id) return;
    reset({
      patientId: resolvedPatientId,
      doctorId: resolvedDoctorId,
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
    appointment?.id,
    appointment?.date,
    appointment?.description,
    appointment?.startTime,
    appointment?.endTime,
    appointment?.start_time,
    appointment?.end_time,
    resolvedPatientId,
    resolvedDoctorId,
    reset,
  ]);

  // Only sync edit vs view when opening a different appointment or explicit openInEditMode — not when SWR fills ids.
  useEffect(() => {
    if (!appointment?.id) return;
    setIsEditMode(!!openInEditMode);
  }, [appointment?.id, openInEditMode]);

  const handleEdit = (e?: MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!appointment) return;
    form.setValue("patientId", resolvedPatientId, { shouldValidate: false, shouldDirty: false });
    form.setValue("doctorId", resolvedDoctorId, { shouldValidate: false, shouldDirty: false });
    form.setValue("date", appointment.date || "", { shouldValidate: false, shouldDirty: false });
    form.setValue(
      "startTime",
      normalizeTimeForSelect(appointment.startTime ?? appointment.start_time ?? ""),
      { shouldValidate: false, shouldDirty: false }
    );
    form.setValue(
      "endTime",
      normalizeTimeForSelect(appointment.endTime ?? appointment.end_time ?? ""),
      { shouldValidate: false, shouldDirty: false }
    );
    form.setValue("description", appointment.description || "", { shouldValidate: false, shouldDirty: false });

    setIsEditMode(true);
  };

  const handleCancel = () => {
    if (openInEditMode) {
      onClose();
      return;
    }
    if (isEditMode) {
      setIsEditMode(false);
      if (appointment) {
        form.reset({
          patientId: resolvedPatientId,
          doctorId: resolvedDoctorId,
          date: appointment.date || "",
          startTime: normalizeTimeForSelect(
            appointment.startTime ?? appointment.start_time ?? ""
          ),
          endTime: normalizeTimeForSelect(
            appointment.endTime ?? appointment.end_time ?? ""
          ),
          description: appointment.description || "",
        });
      }
      return;
    }
    onClose();
  };

  const handleSave = async (data: AppointmentSchemaType) => {
    if (!appointment?.id || tenantId == null) return;

    setLoading(true);
    try {
      await processRequestAuth(
        "patch",
        `${API_ENDPOINTS.TENANTS_APPOINTMENTS(tenantId)}/${appointment.id}`,
        {
          patientId: Number(data.patientId),
          doctorId: Number(data.doctorId),
          date: data.date,
          startTime: toHHmm(data.startTime),
          endTime: toHHmm(data.endTime),
          description: data.description || "",
        }
      );
      setLoading(false);
      if (onOperationSuccess) {
        onOperationSuccess("Appointment updated successfully.");
      } else {
        onUpdate();
        onClose();
        toast.success("Appointment updated successfully");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update appointment");
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment?.id || tenantId == null) return;
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    setLoading(true);
    try {
      await processRequestAuth(
        "delete",
        `${API_ENDPOINTS.TENANTS_APPOINTMENTS(tenantId)}/${appointment.id}`
      );
      setLoading(false);
      if (onOperationSuccess) {
        onOperationSuccess("Appointment canceled successfully.");
      } else {
        onUpdate();
        onClose();
        toast.success("Appointment canceled successfully");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to cancel appointment");
      setLoading(false);
    }
  };

  if (!appointment) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {openInEditMode || isEditMode ? "Edit Appointment" : "View Appointment"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isEditMode) return;
            void form.handleSubmit(handleSave)(e);
          }}
          className="p-6 space-y-6"
        >
          {/* Patient Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient name
            </label>
            {isEditMode ? (
              <Controller
                name="patientId"
                control={form.control}
                render={({ field }) => {
                  const currentValue = field.value ? String(field.value) : "";
                  return (
                    <Select
                      value={currentValue || undefined}
                      onValueChange={field.onChange}
                      disabled={loading || isLoadingPatients}
                    >
                      <SelectTrigger className="w-full h-12">
                        <SelectValue placeholder={isLoadingPatients ? "Loading patients..." : "Select patient"} />
                      </SelectTrigger>
                      <SelectContent className="z-[10001] bg-white max-h-[300px] overflow-y-auto">
                        {isLoadingPatients ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">Loading patients...</div>
                        ) : patients.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">No patients available</div>
                        ) : (
                          patients.map((patient: any) => {
                            const value = getPatientSelectValue(patient);
                            if (!value) return null;
                            return (
                              <SelectItem key={value} value={value}>
                                {patient.first_name || patient.firstname}{" "}
                                {patient.last_name || patient.lastname}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            ) : (
              <div className="w-full h-12 px-3 py-2 border border-gray-300 rounded flex items-center">
                {appointment.patient?.first_name || appointment.patient?.firstname} {appointment.patient?.last_name || appointment.patient?.lastname}
              </div>
            )}
            {form.formState.errors.patientId && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.patientId.message}
              </p>
            )}
          </div>

          {/* Appointment With (Provider) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment with
            </label>
            {isEditMode ? (
              <Controller
                name="doctorId"
                control={form.control}
                render={({ field }) => {
                  const currentValue = field.value ? String(field.value) : "";
                  return (
                    <Select
                      value={currentValue || undefined}
                      onValueChange={field.onChange}
                      disabled={loading || isLoadingEmployees}
                    >
                      <SelectTrigger className="w-full h-12">
                        <SelectValue placeholder={isLoadingEmployees ? "Loading providers..." : "Select provider"} />
                      </SelectTrigger>
                      <SelectContent className="z-[10001] bg-white max-h-[300px] overflow-y-auto">
                        {isLoadingEmployees ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">Loading providers...</div>
                        ) : providers.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">No providers available</div>
                        ) : (
                          providers.map((provider: any) => {
                            const value = getProviderSelectValue(provider);
                            if (!value) return null;
                            return (
                              <SelectItem key={value} value={value}>
                                {provider.firstname || provider.first_name}{" "}
                                {provider.lastname || provider.last_name}
                                {provider.department?.name &&
                                  ` - ${provider.department.name}`}
                                {provider.designation && ` (${provider.designation})`}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            ) : (
              <div className="w-full h-12 px-3 py-2 border border-gray-300 rounded flex items-center">
                {appointment.user?.firstname || appointment.user?.first_name} {appointment.user?.lastname || appointment.user?.last_name}
              </div>
            )}
            {form.formState.errors.doctorId && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.doctorId.message}
              </p>
            )}
          </div>

          {/* Appointment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Date
            </label>
            {isEditMode ? (
              <Controller
                name="date"
                control={form.control}
                render={({ field }) => {
                  // Parse the date string to a Date object for the DatePicker
                  let dateValue: Date | undefined = undefined;
                  if (field.value) {
                    try {
                      // field.value is always a string from the form
                      dateValue = parseISOStringToLocalDate(String(field.value));
                      // If that fails, try creating a new Date directly
                      if (isNaN(dateValue.getTime())) {
                        dateValue = new Date(field.value);
                      }
                      // If still invalid, set to undefined
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
                      disabled={loading}
                    />
                  );
                }}
              />
            ) : (
              <div className="w-full h-12 px-3 py-2 border border-gray-300 rounded flex items-center">
                {formatDateForDisplay(appointment.date)}
              </div>
            )}
            {form.formState.errors.date && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.date.message}
              </p>
            )}
          </div>

          {/* Appointment Time (24h) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment time (24h)
            </label>
            {isEditMode ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Controller
                    name="startTime"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ? field.value : undefined}
                      >
                        <SelectTrigger className="w-full h-14 border border-[#737373]">
                          <SelectValue placeholder="Start time" />
                        </SelectTrigger>
                        <SelectContent className="z-[10001] bg-white max-h-[280px]">
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
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.startTime.message}
                    </p>
                  )}
                </div>
                <div>
                  <Controller
                    name="endTime"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ? field.value : undefined}
                      >
                        <SelectTrigger className="w-full h-14 border border-[#737373]">
                          <SelectValue placeholder="End time" />
                        </SelectTrigger>
                        <SelectContent className="z-[10001] bg-white max-h-[280px]">
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
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.endTime.message}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full h-12 px-3 py-2 border border-gray-300 rounded flex items-center">
                {formatTimeRange(
                  appointment.startTime ?? appointment.start_time ?? "",
                  appointment.endTime ?? appointment.end_time ?? ""
                )}
              </div>
            )}
          </div>

          {/* Appointment Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Description
            </label>
            {isEditMode ? (
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder="Enter appointment description"
                    className="min-h-[100px]"
                    disabled={loading}
                  />
                )}
              />
            ) : (
              <div className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded">
                {appointment.description || "No description provided"}
              </div>
            )}
          </div>

          {isEditMode && (
            <div className="flex justify-end -mt-2">
              <button
                type="button"
                className="text-sm text-red-600 hover:underline disabled:opacity-50"
                disabled={loading}
                onClick={() => void handleDelete()}
              >
                Cancel this appointment
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <Button
              type="button"
              onClick={isEditMode ? handleCancel : handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12"
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              {isEditMode ? "Cancel" : "Cancel Appointment"}
            </Button>
            {isEditMode ? (
              <Button
                type="submit"
                className="flex-1 bg-[#003465] hover:bg-[#00254a] text-white h-12"
                disabled={loading}
              >
                <Check className="w-4 h-4 mr-2" />
                Save
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleEdit}
                className="flex-1 bg-[#003465] hover:bg-[#00254a] text-white h-12"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

