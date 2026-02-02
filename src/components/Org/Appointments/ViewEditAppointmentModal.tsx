"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Edit, Check, Clock } from "lucide-react";
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
  orgId: number;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ViewEditAppointmentModal({
  appointment,
  orgId,
  onClose,
  onUpdate,
}: ViewEditAppointmentModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch data for dropdowns
  const { data: patientsData, error: patientsError, isLoading: isLoadingPatients } = useSWR(
    orgId ? API_ENDPOINTS.TENANTS_PATIENTS(orgId) : null,
    authFectcher
  );

  const { data: employeesData, error: employeesError, isLoading: isLoadingEmployees } = useSWR(
    orgId ? API_ENDPOINTS.GET_TENANTS_EMPLOYEES(orgId) : null,
    authFectcher
  );

  console.log("=== MODAL DATA FETCH DEBUG ===");
  console.log("orgId:", orgId);
  console.log("patientsData:", patientsData);
  console.log("patientsError:", patientsError);
  console.log("isLoadingPatients:", isLoadingPatients);
  console.log("employeesData:", employeesData);
  console.log("employeesError:", employeesError);
  console.log("isLoadingEmployees:", isLoadingEmployees);

  const patients = useMemo(() => {
    // Try different data structures like AddAppointment does
    let result = [];
    if (Array.isArray(patientsData?.data?.data)) {
      result = patientsData.data.data;
    } else if (Array.isArray(patientsData?.data)) {
      result = patientsData.data;
    } else if (Array.isArray(patientsData)) {
      result = patientsData;
    }
    console.log("=== PATIENTS DEBUG ===");
    console.log("patientsData:", patientsData);
    console.log("patients array:", result);
    console.log("patients length:", result.length);
    return result;
  }, [patientsData]);

  const providers = useMemo(() => {
    // Try different data structures like AddAppointment does
    let result = [];
    if (Array.isArray(employeesData?.data)) {
      result = employeesData.data;
    } else if (Array.isArray(employeesData)) {
      result = employeesData;
    }
    console.log("=== PROVIDERS DEBUG ===");
    console.log("employeesData:", employeesData);
    console.log("providers array:", result);
    console.log("providers length:", result.length);
    return result;
  }, [employeesData]);

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

  // Load appointment data into form when appointment or data changes
  useEffect(() => {
    if (appointment && appointment.id) {
      console.log("=== APPOINTMENT DEBUG ===");
      console.log("appointment:", appointment);
      console.log("appointment.patient:", appointment.patient);
      console.log("appointment.patient?.id:", appointment.patient?.id);
      console.log("appointment.user:", appointment.user);
      console.log("appointment.user?.id:", appointment.user?.id);
      console.log("appointment.date:", appointment.date);
      
      const patientId = appointment.patient?.id ? String(appointment.patient.id) : "";
      const doctorId = appointment.user?.id ? String(appointment.user.id) : "";
      
      console.log("Setting form values:");
      console.log("patientId:", patientId);
      console.log("doctorId:", doctorId);
      console.log("date:", appointment.date || "");
      
      // Use setTimeout to ensure form state is ready
      setTimeout(() => {
        form.reset({
          patientId,
          doctorId,
          date: appointment.date || "",
          startTime: appointment.startTime || "",
          endTime: appointment.endTime || "",
          description: appointment.description || "",
        });
        
        console.log("Form values after reset:", form.getValues());
      }, 100);
    }
  }, [appointment?.id, form]);

  const handleEdit = () => {
    if (!appointment) return;
    
    const patientId = appointment.patient?.id ? String(appointment.patient.id) : "";
    const doctorId = appointment.user?.id ? String(appointment.user.id) : "";
    
    console.log("=== HANDLE EDIT DEBUG ===");
    console.log("Setting edit mode with values:");
    console.log("patientId:", patientId);
    console.log("doctorId:", doctorId);
    console.log("date:", appointment.date);
    console.log("startTime:", appointment.startTime);
    console.log("endTime:", appointment.endTime);
    
    // Set form values BEFORE switching to edit mode
    form.setValue("patientId", patientId, { shouldValidate: false, shouldDirty: false });
    form.setValue("doctorId", doctorId, { shouldValidate: false, shouldDirty: false });
    form.setValue("date", appointment.date || "", { shouldValidate: false, shouldDirty: false });
    form.setValue("startTime", appointment.startTime || "", { shouldValidate: false, shouldDirty: false });
    form.setValue("endTime", appointment.endTime || "", { shouldValidate: false, shouldDirty: false });
    form.setValue("description", appointment.description || "", { shouldValidate: false, shouldDirty: false });
    
    // Then switch to edit mode
    setIsEditMode(true);
    
    // Verify values after a short delay
    setTimeout(() => {
      console.log("Form values after edit mode:", form.getValues());
    }, 100);
  };

  const handleCancel = () => {
    if (isEditMode) {
      setIsEditMode(false);
      // Reset form to original values
      if (appointment) {
        const patientId = appointment.patient?.id ? String(appointment.patient.id) : "";
        const doctorId = appointment.user?.id ? String(appointment.user.id) : "";
        
        form.reset({
          patientId,
          doctorId,
          date: appointment.date || "",
          startTime: appointment.startTime || "",
          endTime: appointment.endTime || "",
          description: appointment.description || "",
        });
      }
    } else {
      onClose();
    }
  };

  const handleSave = async (data: AppointmentSchemaType) => {
    if (!appointment?.id) return;

    setLoading(true);
    try {
      await processRequestAuth(
        "put",
        `${API_ENDPOINTS.TENANTS_APPOINTMENTS(orgId)}/${appointment.id}`,
        {
          patientId: Number(data.patientId),
          doctorId: Number(data.doctorId),
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          description: data.description || "",
        }
      );
      toast.success("Appointment updated successfully");
      setIsEditMode(false);
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update appointment");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment?.id) return;
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    setLoading(true);
    try {
      await processRequestAuth(
        "delete",
        `${API_ENDPOINTS.TENANTS_APPOINTMENTS(orgId)}/${appointment.id}`
      );
      toast.success("Appointment canceled successfully");
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to cancel appointment");
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  // Reset edit mode when appointment changes
  useEffect(() => {
    if (appointment?.id) {
      setIsEditMode(false);
      // Reload form data when appointment changes
      const patientId = appointment.patient?.id ? String(appointment.patient.id) : "";
      const doctorId = appointment.user?.id ? String(appointment.user.id) : "";
      
      form.reset({
        patientId,
        doctorId,
        date: appointment.date || "",
        startTime: appointment.startTime || "",
        endTime: appointment.endTime || "",
        description: appointment.description || "",
      });
    }
  }, [appointment?.id, form]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {isEditMode ? "Edit Appointment" : "View Appointment"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={form.handleSubmit(handleSave)} className="p-6 space-y-6">
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
                  console.log("=== PATIENT SELECT DEBUG ===");
                  console.log("field.value:", field.value);
                  console.log("currentValue:", currentValue);
                  console.log("patients:", patients);
                  console.log("patients length:", patients.length);
                  
                  return (
                    <Select
                      value={currentValue || undefined}
                      onValueChange={(value) => {
                        console.log("Patient selected:", value);
                        field.onChange(value);
                      }}
                      disabled={loading || isLoadingPatients}
                    >
                      <SelectTrigger className="w-full h-12">
                        <SelectValue placeholder={isLoadingPatients ? "Loading patients..." : "Select patient"} />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-white max-h-[300px] overflow-y-auto">
                        {isLoadingPatients ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">Loading patients...</div>
                        ) : patients.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">No patients available</div>
                        ) : (
                          patients.map((patient: any) => (
                            <SelectItem
                              key={patient.id}
                              value={String(patient.id)}
                            >
                              {patient.first_name || patient.firstname} {patient.last_name || patient.lastname}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            ) : (
              <div className="w-full h-12 px-3 py-2 border border-gray-300 rounded flex items-center">
                {appointment.patient?.first_name} {appointment.patient?.last_name}
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
                  console.log("=== PROVIDER SELECT DEBUG ===");
                  console.log("field.value:", field.value);
                  console.log("currentValue:", currentValue);
                  console.log("providers:", providers);
                  console.log("providers length:", providers.length);
                  
                  return (
                    <Select
                      value={currentValue || undefined}
                      onValueChange={(value) => {
                        console.log("Provider selected:", value);
                        field.onChange(value);
                      }}
                      disabled={loading || isLoadingEmployees}
                    >
                      <SelectTrigger className="w-full h-12">
                        <SelectValue placeholder={isLoadingEmployees ? "Loading providers..." : "Select provider"} />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-white max-h-[300px] overflow-y-auto">
                        {isLoadingEmployees ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">Loading providers...</div>
                        ) : providers.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">No providers available</div>
                        ) : (
                          providers.map((provider: any) => (
                            <SelectItem
                              key={provider.id}
                              value={String(provider.id)}
                            >
                              {provider.firstname} {provider.lastname}
                              {provider.department?.name &&
                                ` - ${provider.department.name}`}
                              {provider.designation && ` (${provider.designation})`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            ) : (
              <div className="w-full h-12 px-3 py-2 border border-gray-300 rounded flex items-center">
                {appointment.user?.firstname} {appointment.user?.lastname}
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
                      // Try parsing as ISO string first
                      dateValue = parseISOStringToLocalDate(field.value);
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
                  
                  console.log("=== DATE PICKER DEBUG ===");
                  console.log("field.value:", field.value);
                  console.log("dateValue:", dateValue);
                  console.log("isEditMode:", isEditMode);
                  
                  return (
                    <DatePicker
                      key={`date-picker-${field.value || 'empty'}`}
                      date={dateValue}
                      onDateChange={(date) => {
                        console.log("Date selected:", date);
                        const formattedDate = date ? formatDateLocal(date) : "";
                        console.log("formattedDate:", formattedDate);
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

          {/* Appointment Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Time
            </label>
            {isEditMode ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Controller
                    name="startTime"
                    control={form.control}
                    render={({ field }) => (
                      <div className="relative">
                        <input
                          placeholder="Select appointment start time"
                          type="time"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          onBlur={field.onBlur}
                          name={field.name}
                          className="w-full p-3 pl-12 border border-[#737373] h-14 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#003465] focus:border-transparent"
                        />
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                      </div>
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
                      <div className="relative">
                        <input
                          placeholder="Select appointment end time"
                          type="time"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          onBlur={field.onBlur}
                          name={field.name}
                          className="w-full p-3 pl-12 border border-[#737373] h-14 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#003465] focus:border-transparent"
                        />
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                      </div>
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
                {formatTimeRange(appointment.startTime, appointment.endTime)}
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

