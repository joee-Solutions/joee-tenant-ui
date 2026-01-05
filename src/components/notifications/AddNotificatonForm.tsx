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
import React, { useState } from "react";
import { useTenantsData, useAdminProfile } from "@/hooks/swr";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";
import { Spinner } from "@/components/icons/Spinner";

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
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [success, setSuccess] = useState(false);
  
  // Fetch tenants data for dropdown
  const { data: tenantsData, isLoading: tenantsLoading, error: tenantsError } = useTenantsData();
  
  // Fetch admin profile to get userId
  const { data: adminData } = useAdminProfile();
  const admin = Array.isArray(adminData) ? adminData[0] : adminData;
  const userId = admin?.id;

  // Debug: Log tenants data structure
  React.useEffect(() => {
    console.log("Tenants data:", tenantsData);
    console.log("Tenants data type:", typeof tenantsData);
    console.log("Is array:", Array.isArray(tenantsData));
    if (tenantsError) {
      console.error("Error fetching tenants:", tenantsError);
    }
  }, [tenantsData, tenantsError]);

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
    // Validate tenant selection if not sending to all
    if (!data.sendToAllTenants && !data.tenantId) {
      toast.error("Please select an organization or check 'Send to all organizations'");
      form.setError("tenantId", {
        type: "manual",
        message: "Organization selection is required",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get the expiry date from the separate state (source of truth from DatePicker)
      // The expiryDate state is managed by DatePicker and is the most reliable
      const expiresAtValue = expiryDate;
      
      // Prepare the notification data - matching Swagger format
      const notificationData: any = {
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority,
        userId: userId || 1, // Use admin user ID, fallback to 1 if not available
        metadata: {}, // Empty metadata object as required by backend
      };

      // Handle expiresAt - backend expects ISO string format: "2025-11-27T13:18:35.445Z"
      // The error "expiresAt must be a Date instance" suggests backend validation expects a valid date string
      // We'll always include expiresAt - either as ISO string or null
      if (expiresAtValue) {
        try {
          // Ensure we have a valid Date object
          const dateObj = expiresAtValue instanceof Date 
            ? expiresAtValue 
            : new Date(expiresAtValue);
          
          // Validate the date is valid
          if (!isNaN(dateObj.getTime())) {
            // Format as ISO string - this is what the backend expects
            notificationData.expiresAt = dateObj.toISOString();
          } else {
            console.error('Invalid date value:', expiresAtValue);
            // Set to null if invalid (backend might need the field present)
            notificationData.expiresAt = null;
          }
        } catch (error) {
          console.error('Error processing expiresAt:', error);
          // Set to null on error (backend might need the field present)
          notificationData.expiresAt = null;
        }
      } else {
        // Always include expiresAt field, even if not provided (set to null)
        // Some backends require the field to be present for validation
        notificationData.expiresAt = null;
      }

      // Include tenantId - matching Swagger format
      // If sending to specific tenant, include the tenantId
      // If sending to all tenants, we might omit it or backend handles it differently
      // Based on Swagger example, tenantId is always included when specified
      if (!data.sendToAllTenants && data.tenantId) {
        notificationData.tenantId = data.tenantId;
      }
      // Note: When sending to all tenants, we don't include tenantId
      // The backend will handle broadcasting to all tenants

      // Debug logging
      console.log('Sending notification data:', JSON.stringify(notificationData, null, 2));
      console.log('ExpiryDate state:', expiryDate);
      console.log('ExpiryDate type:', typeof expiryDate);
      console.log('ExpiryDate is Date:', expiryDate instanceof Date);
      if (expiryDate instanceof Date) {
        console.log('ExpiryDate getTime():', expiryDate.getTime());
        console.log('ExpiryDate isValid:', !isNaN(expiryDate.getTime()));
        console.log('ExpiryDate toISOString():', expiryDate.toISOString());
      }
      if (notificationData.expiresAt) {
        console.log('ExpiresAt ISO string being sent:', notificationData.expiresAt);
        console.log('ExpiresAt type:', typeof notificationData.expiresAt);
      } else {
        console.log('ExpiresAt not included in payload (optional field)');
      }

      // Send notification - using POST to /notifications endpoint
      const response = await processRequestAuth("post", API_ENDPOINTS.CREATE_NOTIFICATION, notificationData);
      
      // Check for success indicators
      if (response?.status || response?.success || (response && !response.error)) {
        setSuccess(true);
        toast.success("Notification sent successfully!");
        setTimeout(() => {
          router.push("/dashboard/notifications");
        }, 2000);
      } else {
        const errorMessage = response?.message || response?.error || "Failed to send notification. Please try again.";
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error sending notification:", error);
      console.error("Error response:", error?.response);
      console.error("Error response data:", error?.response?.data);
      
      let errorMessage = "Failed to send notification. Please try again.";
      let isDatabaseError = false;
      
      // Handle specific error cases
      if (error?.response?.data) {
        const responseData = error.response.data;
        const errorText = responseData.error || "";
        const errorString = errorText.toLowerCase();
        
        // Database table doesn't exist error (500)
        if (
          responseData.statusCode === 500 &&
          (errorString.includes("does not exist") || 
           errorString.includes("relation") ||
           errorString.includes("table") ||
           errorString.includes("database"))
        ) {
          errorMessage = "The notification system is currently unavailable. The database table has not been set up. Please contact your system administrator to set up the notifications table.";
          isDatabaseError = true;
        }
        // Validation errors (400)
        else if (responseData.validationErrors && Array.isArray(responseData.validationErrors)) {
          errorMessage = responseData.validationErrors.join(", ");
        }
        // Other error messages
        else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Show error with appropriate styling
      toast.error(errorMessage, {
        toastId: "notification-error",
        autoClose: isDatabaseError ? 8000 : 5000, // Longer timeout for database errors
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8 px-6 my-8 shadow-[0px_0px_4px_1px_#0000004D]">
      <div className="flex justify-between items-center border-b-2 py-4 mb-8">
        <h1 className="font-semibold text-xl text-black">Send Notification</h1>
        <Link href={"/dashboard/notifications"}>
          <Button className="font-normal text-base text-white bg-[#003465] h-[60px] px-6">
          Notification List
          </Button>
        </Link>
      </div>

      {success && (
        <div className="bg-green-50 border-2 border-green-200 text-green-800 px-6 py-4 rounded-lg mb-6 flex items-center gap-3">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-base">Notification sent successfully!</p>
            <p className="text-sm mt-1">Redirecting to notification list...</p>
          </div>
        </div>
      )}

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
              date={expiryDate}
              onDateChange={(date) => {
                // Only set if it's a valid Date instance
                if (date && date instanceof Date && !isNaN(date.getTime())) {
                  setExpiryDate(date);
                  // Also update form state for validation, but we'll use expiryDate state for submission
                  form.setValue("expiresAt", date, { shouldValidate: false });
                  form.clearErrors("expiresAt");
                } else {
                  // Clear both states when date is removed
                  setExpiryDate(undefined);
                  form.setValue("expiresAt", undefined, { shouldValidate: false });
                  form.clearErrors("expiresAt");
                }
              }}
              placeholder="Select expiry date"
            />
            {form.formState.errors.expiresAt && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.expiresAt.message}</p>
            )}
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
              onValueChange={(value) => {
                form.setValue("tenantId", parseInt(value));
                form.clearErrors("tenantId");
              }}
            >
              <SelectTrigger className="w-full h-14 p-3 border border-[#737373] rounded">
                <SelectValue placeholder={tenantsLoading ? "Loading organizations..." : tenantsError ? "Error loading organizations" : "Select an organization"} />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  // useTenantsData returns data directly as an array (extracted via extractData)
                  const tenantsArray = Array.isArray(tenantsData) ? tenantsData : [];

                  if (tenantsError) {
                    return (
                      <SelectItem value="error" disabled>
                        Error loading organizations
                      </SelectItem>
                    );
                  }

                  return tenantsArray.length > 0 ? (
                    tenantsArray.map((tenant: any) => (
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
            {tenantsError && (
              <p className="text-red-500 text-sm mt-1">Failed to load organizations. Please refresh the page.</p>
            )}
            {!sendToAllTenants && !form.watch("tenantId") && form.formState.isSubmitted && (
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
            {isSubmitting ? <Spinner /> : "Send Notification"}
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
