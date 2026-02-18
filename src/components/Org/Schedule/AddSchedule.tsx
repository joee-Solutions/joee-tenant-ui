"use client";

import { useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
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
import Link from "next/link";

const ScheduleSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  availableDays: z.array(z.object({
    date: z.date({ required_error: "Date is required" }),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  })).min(1, "At least one schedule day is required"),
});

type ScheduleSchemaType = z.infer<typeof ScheduleSchema>;

interface ScheduleFormProps {
  slug: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ScheduleForm({ slug, onSuccess, onCancel }: ScheduleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch employees for dropdown
  const orgId = slug && !isNaN(parseInt(slug)) ? parseInt(slug) : null;
  
  const { data: employeesData } = useSWR(
    orgId ? API_ENDPOINTS.GET_TENANTS_EMPLOYEES(orgId) : null,
    authFectcher
  );

  const form = useForm<ScheduleSchemaType>({
    resolver: zodResolver(ScheduleSchema),
    defaultValues: {
      employeeId: "",
      availableDays: [
        {
          date: undefined,
          startTime: "",
          endTime: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "availableDays",
  });

  const onSubmit = async (data: ScheduleSchemaType) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const scheduleData = {
        availableDays: data.availableDays.map(day => ({
          day: day.date ? format(day.date, 'EEEE') : '', // Convert date to day name
          startTime: day.startTime,
          endTime: day.endTime,
        })),
      };

      const res = await processRequestAuth(
        "post",
        `/super/tenants/${slug}/schedules/${data.employeeId}`,
        scheduleData
      );

      if (res && (res.status === true || res.status === 200 || res.success)) {
        setSuccess(true);
        form.reset({
          employeeId: "",
          availableDays: [{
            date: undefined,
            startTime: "",
            endTime: "",
          }],
        });
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(`/dashboard/organization/${slug}/schedules`);
          }
        }, 1500);
      } else {
        setError(res?.message || res?.error || "Failed to create schedule. Please try again.");
      }
    } catch (err: unknown) {
      console.error("Schedule creation error:", err);
      const errorMessage = err instanceof Error ? err.message : 
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 
        (err as { message?: string })?.message || 
        "Failed to create schedule. Please check your connection and try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 px-6 my-8 shadow-[0px_0px_4px_1px_#0000004D] rounded-lg bg-white">
      <div className="flex justify-between items-center border-b-2 border-gray-200 py-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Schedule</h1>
          <p className="text-sm text-gray-600 mt-1">Create a new schedule for an employee</p>
        </div>
        {onCancel ? (
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="h-[60px] border border-[#003465] text-[#003465] font-medium text-base px-6 hover:bg-[#003465] hover:text-white"
          >
            Back
          </Button>
        ) : (
          <Link href={`/dashboard/organization/${slug}/schedules`}>
            <Button variant="outline" className="h-[60px] border border-[#003465] text-[#003465] font-medium text-base px-6 hover:bg-[#003465] hover:text-white">
              Back
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          Schedule created successfully! Redirecting...
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Employee Section */}
        <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#003465] flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Employee Information</h2>
              <p className="text-sm text-gray-600">Select the employee for this schedule</p>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-base text-gray-900 font-medium mb-2">
              Employee Name <span className="text-red-500">*</span>
            </label>
            <Controller
              name="employeeId"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent className="z-10 bg-white">
                    {Array.isArray(employeesData?.data) && employeesData.data.map((employee: any) => (
                      <SelectItem key={employee.id} value={employee.id.toString()} className="hover:bg-gray-200">
                        {employee.firstname} {employee.lastname}
                        {employee.department?.name && ` - ${employee.department.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.employeeId && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.employeeId.message}</p>
            )}
          </div>
        </div>

        {/* Schedule Days Section */}
        <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#003465] flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Schedule Days and Times</h2>
              <p className="text-sm text-gray-600">
            Add the days and times when the employee is available
          </p>
            </div>
          </div>

          <div className="space-y-4">
          {fields.map((field, index) => (
              <div key={field.id} className="border border-gray-300 rounded-lg p-5 bg-white shadow-sm">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Schedule Day {index + 1}</h3>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {/* Date Selection */}
                <div>
                  <label className="block text-base text-black font-normal mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name={`availableDays.${index}.date`}
                    control={form.control}
                    render={({ field }) => (
                      <DatePicker
                        date={field.value}
                        onDateChange={field.onChange}
                        placeholder="Pick a date"
                        className="w-full"
                      />
                    )}
                  />
                  {form.formState.errors.availableDays?.[index]?.date && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.availableDays[index]?.date?.message}
                    </p>
                  )}
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-base text-black font-normal mb-2">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="time"
                    {...form.register(`availableDays.${index}.startTime`)}
                    className="w-full p-3 border border-[#737373] h-14 rounded"
                  />
                  {form.formState.errors.availableDays?.[index]?.startTime && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.availableDays[index]?.startTime?.message}
                    </p>
                  )}
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-base text-black font-normal mb-2">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="time"
                    {...form.register(`availableDays.${index}.endTime`)}
                    className="w-full p-3 border border-[#737373] h-14 rounded"
                  />
                  {form.formState.errors.availableDays?.[index]?.endTime && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.availableDays[index]?.endTime?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add Another Day Button */}
            <div className="mt-6">
            <Button
              type="button"
              variant="outline"
               onClick={() => append({ date: new Date(), startTime: "", endTime: "" })}
                className="w-full md:w-auto text-[#003465] border-[#003465] hover:bg-[#003465] hover:text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Date
            </Button>
            </div>
          </div>
        </div>

        {/* Form Actions */}
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
              "Create Schedule"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}