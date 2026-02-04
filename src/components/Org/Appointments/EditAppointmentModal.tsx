"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/Textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Clock, X } from "lucide-react";
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
  appointment: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditAppointmentModal({ 
  slug, 
  appointment, 
  onClose, 
  onSuccess 
}: EditAppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const appointmentDataLoadedRef = useRef(false);

  // Validate slug and get orgId
  const orgId = useMemo(() => {
    if (!slug) return null;
    const slugStr = String(slug);
    const parsed = parseInt(slugStr);
    return isNaN(parsed) ? null : parsed;
  }, [slug]);

  // Fetch patients and employees
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

  // Load appointment data into form
  useEffect(() => {
    if (appointment && !appointmentDataLoadedRef.current && !isLoadingPatients && !isLoadingEmployees) {
      appointmentDataLoadedRef.current = true;
      
      // Extract patient ID
      let patientId = "";
      if (appointment.patientId) {
        patientId = String(appointment.patientId);
      } else if (appointment.patient?.id) {
        patientId = String(appointment.patient.id);
      } else if (appointment.patient_id) {
        patientId = String(appointment.patient_id);
      }

      // Extract doctor/provider ID
      let doctorId = "";
      if (appointment.doctorId) {
        doctorId = String(appointment.doctorId);
      } else if (appointment.doctor?.id) {
        doctorId = String(appointment.doctor.id);
      } else if (appointment.doctor_id) {
        doctorId = String(appointment.doctor_id);
      } else if (appointment.user?.id) {
        doctorId = String(appointment.user.id);
      } else if (appointment.userId) {
        doctorId = String(appointment.userId);
      } else if (appointment.provider?.id) {
        doctorId = String(appointment.provider.id);
      } else if (appointment.providerId) {
        doctorId = String(appointment.providerId);
      } else if (appointment.employee?.id) {
        doctorId = String(appointment.employee.id);
      } else if (appointment.employeeId) {
        doctorId = String(appointment.employeeId);
      } else {
        // Last resort: search through numeric fields
        for (const [key, value] of Object.entries(appointment)) {
          if (typeof value === 'number' && value > 0) {
            const keyLower = key.toLowerCase();
            if (keyLower !== 'id' && 
                !keyLower.includes('patient') && 
                !keyLower.includes('appointment') &&
                value !== appointment.id &&
                value !== (appointment as any).patientId &&
                value !== (appointment as any).patient?.id) {
              doctorId = String(value);
              break;
            }
          }
        }
      }

      const formValues = {
        patientId,
        doctorId: doctorId ? String(doctorId) : "",
        date: appointment.date || "",
        startTime: appointment.startTime || appointment.start_time || "",
        endTime: appointment.endTime || appointment.end_time || "",
        description: appointment.description || "",
      };

      setTimeout(() => {
        form.reset(formValues);
        form.setValue("patientId", patientId, { shouldValidate: false, shouldDirty: false });
        form.setValue("doctorId", formValues.doctorId, { shouldValidate: false, shouldDirty: false });
        form.setValue("date", formValues.date, { shouldValidate: false, shouldDirty: false });
        form.setValue("startTime", formValues.startTime, { shouldValidate: false, shouldDirty: false });
        form.setValue("endTime", formValues.endTime, { shouldValidate: false, shouldDirty: false });
        form.setValue("description", formValues.description, { shouldValidate: false, shouldDirty: false });
      }, 200);
    }
  }, [appointment, isLoadingPatients, isLoadingEmployees, form]);

  const handleSubmit = async (data: AppointmentSchemaType) => {
    setLoading(true);
    try {
      const appointmentData = {
        patientId: Number(data.patientId),
        doctorId: Number(data.doctorId),
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description || "",
      };

      await processRequestAuth(
        "patch",
        `${API_ENDPOINTS.TENANTS_APPOINTMENTS(orgId!)}/${appointment.id}`,
        appointmentData
      );

      toast.success("Appointment updated successfully");
      onSuccess();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update appointment";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const patients = useMemo(() => {
    const data = patientsData?.data?.data || patientsData?.data || patientsData || [];
    return Array.isArray(data) ? data : [];
  }, [patientsData]);

  const employees = useMemo(() => {
    const data = employeesData?.data || employeesData || [];
    return Array.isArray(data) ? data : [];
  }, [employeesData]);

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
                    value={field.value}
                  >
                    <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded">
                      <SelectValue placeholder={isLoadingPatients ? "Loading patients..." : "Select patient"} />
                    </SelectTrigger>
                    <SelectContent className="z-[10000] bg-white max-h-[300px] overflow-y-auto">
                      {isLoadingPatients ? (
                        <div className="px-2 py-1.5 text-sm text-gray-500">Loading patients...</div>
                      ) : patients.length > 0 ? (
                        patients.map((patient: any) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            {patient.firstname || patient.first_name} {patient.lastname || patient.last_name}
                          </SelectItem>
                        ))
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
                    value={field.value}
                  >
                    <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded">
                      <SelectValue placeholder={isLoadingEmployees ? "Loading providers..." : "Select provider"} />
                    </SelectTrigger>
                    <SelectContent className="z-[10000] bg-white max-h-[300px] overflow-y-auto">
                      {isLoadingEmployees ? (
                        <div className="px-2 py-1.5 text-sm text-gray-500">Loading providers...</div>
                      ) : employees.length > 0 ? (
                        employees.map((employee: any) => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.firstname} {employee.lastname}
                            {employee.department?.name && ` - ${employee.department.name}`}
                          </SelectItem>
                        ))
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

            {/* Start Time */}
            <div>
              <label className="block text-base text-black font-normal mb-2">Start Time</label>
              <Controller
                name="startTime"
                control={form.control}
                render={({ field }) => (
                  <div className="relative">
                    <input
                      placeholder="Select start time"
                      type="time"
                      value={field.value || ''}
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
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.startTime.message}</p>
              )}
            </div>

            {/* End Time */}
            <div>
              <label className="block text-base text-black font-normal mb-2">End Time</label>
              <Controller
                name="endTime"
                control={form.control}
                render={({ field }) => (
                  <div className="relative">
                    <input
                      placeholder="Select end time"
                      type="time"
                      value={field.value || ''}
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

