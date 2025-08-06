"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import { DatePicker } from "@/components/ui/date-picker";
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
  doctorId: z.string().min(1, "Doctor is required"),
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
  
  // Fetch data for dropdowns
  const { data: patientsData } = useSWR(
    API_ENDPOINTS.TENANTS_PATIENTS(parseInt(slug)),
    authFectcher
  );
  
  const { data: employeesData } = useSWR(
    API_ENDPOINTS.GET_TENANTS_EMPLOYEES(parseInt(slug)),
    authFectcher
  );

  // Filter employees to only show doctors/medical staff
  const doctors = Array.isArray(employeesData?.data) 
    ? employeesData.data.filter((employee: any) => 
        employee.role?.name?.toLowerCase().includes('doctor') || 
        employee.role?.name?.toLowerCase().includes('physician') ||
        employee.role?.name?.toLowerCase().includes('medical') ||
        employee.department?.name?.toLowerCase().includes('medical')
      )
    : [];
  
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
        `super/tenants/${slug}/appointments/${data.doctorId}/${data.patientId}`,
        appointmentData
      );
      
      if (res && (res.status === true || res.status === 200 || res.success)) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/dashboard/organization/${slug}/appointments`);
        }, 1500);
      } else {
        setError(res?.message || res?.error || "Failed to create appointment. Please try again.");
      }
    } catch (err: unknown) {
      console.error("Appointment creation error:", err);
      const errorMessage = err instanceof Error ? err.message : 
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 
        (err as { message?: string })?.message || 
        "Failed to create appointment. Please check your connection and try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 px-6 my-8 shadow-[0px_0px_4px_1px_#0000004D] mx-8">
      <div className="flex justify-between items-center border-b-2  py-4 mb-8">
        <h1 className="font-semibold text-xl text-black">Add Appointment</h1>
    
        <Button
                      onClick={() => ("add")}
                      className="text-base text-[#4E66A8] font-normal"
                    >
                      Appointment List
                    </Button>
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
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent className="z-10 bg-white">
                    {Array.isArray(patientsData?.data) && patientsData.data.map((patient: any) => (
                      <SelectItem key={patient.id} value={patient.id.toString()} className="hover:bg-gray-200">
                        {patient.firstname} {patient.lastname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.patientId && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.patientId.message}</p>
            )}
          </div>
          
          {/* Doctor Selection */}
          <div>
            <label className="block text-base text-black font-normal mb-2">Doctor</label>
            <Controller
              name="doctorId"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent className="z-10 bg-white">
                    {doctors.length > 0 ? (
                      doctors.map((doctor: any) => (
                        <SelectItem key={doctor.id} value={doctor.id.toString()} className="hover:bg-gray-200">
                          {doctor.first_name} {doctor.last_name} 
                          {doctor.department?.name && ` - ${doctor.department.name}`}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500">
                        No doctors available
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
          
          {/* Appointment Date */}
          <div>
            <label className="block text-base text-black font-normal mb-2">Appointment Date</label>
            <Controller
              name="date"
              control={form.control}
              render={({ field }) => (
                <DatePicker
                  date={field.value ? new Date(field.value) : undefined}
                  onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
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
            <Input 
              placeholder="Enter start time"
              type="time"
              {...form.register("startTime")}
              className="w-full p-3 border border-[#737373] h-14 rounded"
            />
            {form.formState.errors.startTime && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.startTime.message}</p>
            )}
          </div>
          
          {/* End Time */}
          <div>
            <label className="block text-base text-black font-normal mb-2">End Time</label>
            <Input 
              placeholder="Enter end time"
              type="time"
              {...form.register("endTime")}
              className="w-full p-3 border border-[#737373] h-14 rounded"
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
            className="bg-blue-600 hover:bg-blue-700 text-white py-8 px-16 text-md rounded disabled:opacity-50"
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