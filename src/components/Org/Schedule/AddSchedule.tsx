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
    day: z.string().min(1, "Day is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  })).min(1, "At least one schedule day is required"),
});

type ScheduleSchemaType = z.infer<typeof ScheduleSchema>;

export default function ScheduleForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch employees for dropdown
  const { data: employeesData } = useSWR(
    API_ENDPOINTS.GET_TENANTS_EMPLOYEES(parseInt(slug)),
    authFectcher
  );

  const form = useForm<ScheduleSchemaType>({
    resolver: zodResolver(ScheduleSchema),
    defaultValues: {
      employeeId: "",
      availableDays: [
        {
          day: "",
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
          day: day.day,
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
        // setTimeout(() => {
        //   router.push(`/dashboard/organization/${slug}/schedules`);
        // }, 1500);
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
    <div className="py-8 px-6 my-8 shadow-[0px_0px_4px_1px_#0000004D]">
      <div className="flex justify-between items-center border-b-2  py-4 mb-8">
        <h1 className="text-2xl font-bold">ADD SCHEDULE</h1>
        <Link href={`/dashboard/organization/${slug}/schedules`}>
          <Button variant="outline" className="h-[60px] border border-[#003465] text-[#003465] font-medium text-base px-6 hover:bg-[#003465] hover:text-white">
            Back
          </Button>
        </Link>
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

      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Employee Section */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-medium mb-2">Employee</h2>
          <p className="text-gray-600 mb-4">Select employee to create schedule</p>

          <div className="my-8">
            <label className="block text-base text-black font-normal mb-2">
              Employee name
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
        <div className="p-6">
          <h2 className="text-xl font-medium mb-2">Schedule Days and Times</h2>
          <p className="text-gray-600 mb-4">
            Add the days and times when the employee is available
          </p>

          {fields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Schedule Day {index + 1}</h3>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Day Selection */}
                <div>
                  <label className="block text-base text-black font-normal mb-2">
                    Day
                  </label>
                  <Controller
                    name={`availableDays.${index}.day`}
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent className="z-10 bg-white">
                          {[
                            "Monday",
                            "Tuesday", 
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                            "Sunday"
                          ].map((day) => (
                            <SelectItem key={day} value={day} className="hover:bg-gray-200">
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.availableDays?.[index]?.day && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.availableDays[index]?.day?.message}
                    </p>
                  )}
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-base text-black font-normal mb-2">
                    Start Time
                  </label>
                  <Controller
                    name={`availableDays.${index}.startTime`}
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded">
                          <SelectValue placeholder="Select start time" />
                        </SelectTrigger>
                        <SelectContent className="z-10 bg-white">
                          {[
                            "08:00",
                            "09:00",
                            "10:00",
                            "11:00",
                            "12:00",
                            "13:00",
                            "14:00",
                            "15:00",
                            "16:00",
                            "17:00",
                          ].map((time) => (
                            <SelectItem key={time} value={time} className="hover:bg-gray-200">
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
                    End Time
                  </label>
                  <Controller
                    name={`availableDays.${index}.endTime`}
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded">
                          <SelectValue placeholder="Select end time" />
                        </SelectTrigger>
                        <SelectContent className="z-10 bg-white">
                          {[
                            "09:00",
                            "10:00",
                            "11:00",
                            "12:00",
                            "13:00",
                            "14:00",
                            "15:00",
                            "16:00",
                            "17:00",
                            "18:00",
                          ].map((time) => (
                            <SelectItem key={time} value={time} className="hover:bg-gray-200">
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
          <div className="my-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ day: "", startTime: "", endTime: "" })}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Day
            </Button>
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