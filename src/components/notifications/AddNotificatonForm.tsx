"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/Checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import Link from "next/link";
import { useState } from "react";
import { useTenantsData } from "@/hooks/swr";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";

// Notification types enum (matching backend)
enum NotificationType {
  APPOINTMENT = "appointment",
  MEDICAL_RECORD = "medical_record",
  PATIENT = "patient",
  SYSTEM = "system",
  REMINDER = "reminder",
  ALERT = "alert",
}

// Notification priority enum (matching backend)
enum NotificationPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

// Tenant interface
interface Tenant {
  id: number;
  name: string;
  status: string;
  createdAt: string;
  profile?: {
    organization_logo?: string;
    address_metadata?: {
      state?: string;
      country?: string;
    };
  };
}

const notificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.nativeEnum(NotificationType).default(NotificationType.SYSTEM),
  priority: z.nativeEnum(NotificationPriority).default(NotificationPriority.MEDIUM),
  sendToAllTenants: z.boolean().default(false),
  tenantId: z.number().optional(),
  expiresAt: z.date().optional(),
});

type NotificationSchemaType = z.infer<typeof notificationSchema>;

export default function AddNotification() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch tenants data for dropdown
  const { data: tenantsData, isLoading: tenantsLoading } = useTenantsData();

  const form = useForm<NotificationSchemaType>({
    resolver: zodResolver(notificationSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      message: "",
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.MEDIUM,
      sendToAllTenants: false,
    },
  });

  const sendToAllTenants = form.watch("sendToAllTenants");

  const onSubmit = async (data: NotificationSchemaType) => {
    setIsSubmitting(true);
    
    try {
      // Prepare the notification data
      const notificationData = {
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority,
        ...(data.expiresAt && data.expiresAt instanceof Date && { expiresAt: data.expiresAt.toISOString() }),
        ...(data.tenantId && !data.sendToAllTenants && { tenantId: data.tenantId }),
      };

      console.log('Sending notification data:', notificationData);

      // Send notification
      const response = await processRequestAuth("post", API_ENDPOINTS.GET_NOTIFICATIONS, notificationData);
      
      if (response) {
        toast.success("Notification sent successfully!");
        router.push("/dashboard/notifications");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8 px-6 my-8 shadow-[0px_0px_4px_1px_#0000004D]">
      <div className="flex justify-between items-center border-b-2 py-4 mb-8">
        <h1 className="font-semibold text-xl text-black">Send Notification</h1>
        <Link
          className="text-base text-[#003465] font-normal"
          href={"/dashboard/notifications"}
        >
          Notification List
        </Link>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title and Type */}
        <div className="mb-4 flex flex-col space-y-6 md:flex-row md:space-y-0 md:space-x-6">
          <div className="flex-1">
            <Label className="block text-base text-black font-normal mb-2">
              Title *
            </Label>
            <Input
              placeholder="Enter notification title"
              {...form.register("title")}
              className="w-full h-14 p-3 border border-[#737373] rounded"
            />
            {form.formState.errors.title && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div className="flex-1">
            <Label className="block text-base text-black font-normal mb-2">
              Type
            </Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value) => form.setValue("type", value as NotificationType)}
            >
              <SelectTrigger className="w-full h-14 p-3 border border-[#737373] rounded">
                <SelectValue placeholder="Select notification type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NotificationType.SYSTEM}>System</SelectItem>
                <SelectItem value={NotificationType.ALERT}>Alert</SelectItem>
                <SelectItem value={NotificationType.APPOINTMENT}>Appointment</SelectItem>
                <SelectItem value={NotificationType.MEDICAL_RECORD}>Medical Record</SelectItem>
                <SelectItem value={NotificationType.PATIENT}>Patient</SelectItem>
                <SelectItem value={NotificationType.REMINDER}>Reminder</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Priority and Expiry Date */}
        <div className="mb-4 flex flex-col space-y-6 md:flex-row md:space-y-0 md:space-x-6">
          <div className="flex-1">
            <Label className="block text-base text-black font-normal mb-2">
              Priority
            </Label>
            <Select
              value={form.watch("priority")}
              onValueChange={(value) => form.setValue("priority", value as NotificationPriority)}
            >
              <SelectTrigger className="w-full h-14 p-3 border border-[#737373] rounded">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NotificationPriority.LOW}>Low</SelectItem>
                <SelectItem value={NotificationPriority.MEDIUM}>Medium</SelectItem>
                <SelectItem value={NotificationPriority.HIGH}>High</SelectItem>
                <SelectItem value={NotificationPriority.URGENT}>Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="block text-base text-black font-normal mb-2">
              Expiry Date (Optional)
            </Label>
            <DatePicker
              date={form.watch("expiresAt")}
              onDateChange={(date) => form.setValue("expiresAt", date)}
              placeholder="Select expiry date"
            />
          </div>
        </div>

        {/* Send to All Tenants Checkbox */}
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendToAllTenants"
              checked={sendToAllTenants}
              onCheckedChange={(checked) => {
                form.setValue("sendToAllTenants", checked as boolean);
                if (checked) {
                  form.setValue("tenantId", undefined);
                }
              }}
            />
            <Label htmlFor="sendToAllTenants" className="text-base text-black font-normal">
              Send to all organizations
            </Label>
          </div>
        </div>

        {/* Tenant Selection */}
        {!sendToAllTenants && (
          <div className="mb-4">
            <Label className="block text-base text-black font-normal mb-2">
              Select Organization
            </Label>
            <Select
              value={form.watch("tenantId")?.toString() || ""}
              onValueChange={(value) => form.setValue("tenantId", parseInt(value))}
            >
              <SelectTrigger className="w-full h-14 p-3 border border-[#737373] rounded">
                <SelectValue placeholder={tenantsLoading ? "Loading organizations..." : "Select an organization"} />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  // Handle both possible response structures
                  let tenantsArray = [];
                  if (tenantsData?.data) {
                    // If data.data exists, it could be either the direct array or wrapped in another data object
                    if (Array.isArray(tenantsData.data)) {
                      tenantsArray = tenantsData.data;
                    } else if (tenantsData.data.tenants && Array.isArray(tenantsData.data.tenants)) {
                      tenantsArray = tenantsData.data.tenants;
                    }
                  } else if (tenantsData?.tenants && Array.isArray(tenantsData.tenants)) {
                    tenantsArray = tenantsData.tenants;
                  }

                  return tenantsArray.length > 0 ? (
                    tenantsArray.map((tenant: Tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id.toString()}>
                        {tenant.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-organizations" disabled>
                      {tenantsLoading ? "Loading..." : "No organizations available"}
                    </SelectItem>
                  );
                })()}
              </SelectContent>
            </Select>
            {!sendToAllTenants && !form.watch("tenantId") && (
              <p className="text-red-500 text-sm mt-1">Please select an organization or check &quot;Send to all organizations&quot;</p>
            )}
          </div>
        )}

        {/* Message */}
        <div className="">
          <Label className="block text-base text-black font-normal mb-2">
            Message *
          </Label>
          <Textarea
            placeholder="Enter your notification message"
            {...form.register("message")}
            className="w-full p-3 min-h-52 border border-[#737373] rounded"
          />
          {form.formState.errors.message && (
            <p className="text-red-500 text-sm mt-1">{form.formState.errors.message.message}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#003465] hover:bg-[#0d2337] text-white py-8 px-16 text-md rounded disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send Notification"}
          </Button>
          <Button
            type="button"
            className="border border-[#EC0909] text-[#EC0909] hover:bg-[#ec090922] py-8 px-16 text-md rounded"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
