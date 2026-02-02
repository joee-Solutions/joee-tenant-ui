"use client";

import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Clock } from "lucide-react";
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

const AppointmentSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  doctorId: z.string().min(1, "Provider is required"),
  date: z.string().min(1, "Appointment date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  description: z.string().optional(),
});

type AppointmentSchemaType = z.infer<typeof AppointmentSchema>;

export default function AddAppointment({ slug }: { slug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validate slug and get orgId - handle both string and number
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

  // Fetch data for dropdowns
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

  const onSubmit = async (data: AppointmentSchemaType) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const appointmentData = {
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description || "",
      };

      const res = await processRequestAuth(
        "post",
        `/super/tenants/${slug}/appointments/${data.patientId}/${data.doctorId}`,
        appointmentData
      );

      if (res && (res.status === true || res.status === 200 || res.success)) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/dashboard/organization/${slug}/appointments`);
        }, 1500);
      } else {
        // Check for validation errors first
        if (res?.validationErrors && Array.isArray(res.validationErrors)) {
          setError(res.validationErrors.join(", "));
        } else {
          setError(res?.message || res?.error || "Failed to create appointment. Please try again.");
        }
      }
    } catch (err: unknown) {
      console.error("Appointment creation error:", err);
      
      // Extract error message from response
      let errorMessage = "Failed to create appointment. Please check your connection and try again.";
      
      if (err && typeof err === 'object' && 'response' in err) {
        const errorResponse = (err as any).response;
        if (errorResponse?.data) {
          const errorData = errorResponse.data;
          
          // Check for validation errors array
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 px-6 my-8 shadow-[0px_0px_4px_1px_#0000004D]">
      <div className="flex justify-between items-center border-b-2  py-4 mb-8">
        <h1 className="font-semibold text-xl text-black">Add Appointment</h1>

        <Link href={`/dashboard/organization/${slug}/appointments`}>
          <Button variant="outline" className="h-[60px] border border-[#003465] text-[#003465] font-medium text-base px-6 hover:bg-[#003465] hover:text-white">
            Back
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Appointment created successfully! Redirecting...
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                    <SelectValue placeholder={isLoadingPatients ? "Loading patients..." : "Select patient"} />
                  </SelectTrigger>
                  <SelectContent className="z-10 bg-white max-h-[300px] overflow-y-auto">
                    {isLoadingPatients ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500">Loading patients...</div>
                    ) : Array.isArray(patientsData?.data?.data) && patientsData.data.data.length > 0 ? (
                      patientsData.data.data.map((patient: any) => (
                        <SelectItem key={patient.id} value={patient.id.toString()} className="hover:bg-gray-200">
                          {patient.firstname} {patient.lastname} {patient.gender && `(${patient.gender})`}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500">
                        {patientsData ? 'No patients available' : 'Loading...'}
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                    <SelectValue placeholder={isLoadingEmployees ? "Loading providers..." : "Select provider"} />
                  </SelectTrigger>
                  <SelectContent className="z-10 bg-white max-h-[300px] overflow-y-auto">
                    {isLoadingEmployees ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500">Loading providers...</div>
                    ) : Array.isArray(employeesData?.data) && employeesData.data.length > 0 ? (
                      employeesData.data.map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id.toString()} className="hover:bg-gray-200">
                          {employee.firstname} {employee.lastname}
                          {employee.department?.name && ` - ${employee.department.name}`}
                          {employee.designation && ` (${employee.designation})`}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500">
                        {employeesData ? 'No providers available' : 'Loading...'}
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
              render={({ field }) => (
                <DatePicker
                  date={field.value ? parseISOStringToLocalDate(field.value) : undefined}
                  onDateChange={(date) => field.onChange(date ? formatDateLocal(date) : '')}
                  placeholder="Select appointment date"
                />
              )}
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
                    placeholder="Select appointment start time"
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
                    placeholder="Select appointment end time"
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
                Creating...
              </>
            ) : (
              "Create Appointment"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}