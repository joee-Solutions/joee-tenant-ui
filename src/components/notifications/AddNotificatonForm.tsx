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
import Link from "next/link";
import React, { useState } from "react";
import { useTenantsData, useAdminProfile } from "@/hooks/swr";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";
import { Spinner } from "@/components/icons/Spinner";
import { mutate } from "swr";

// Removed NotificationType and NotificationPriority enums as they are no longer needed

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
  sender: z.string().min(1, "Sender is required"),
  sendToAllTenants: z.boolean().default(false),
  tenantId: z.number().optional(),
});

type NotificationSchemaType = z.infer<typeof notificationSchema>;


export default function AddNotification() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Fetch tenants data for dropdown
  const { data: tenantsData, isLoading: tenantsLoading, error: tenantsError } = useTenantsData();
  
  // Fetch admin profile to get userId
  const { data: adminData } = useAdminProfile();
  const admin = Array.isArray(adminData) ? adminData[0] : adminData;
  const userId = admin?.id;

  const form = useForm<NotificationSchemaType>({
    resolver: zodResolver(notificationSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      message: "",
      sendToAllTenants: false,
      sender: admin?.first_name && admin?.last_name
  ? `${admin.first_name} ${admin.last_name}`
  : "Admin",
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
      // Prepare the notification data
      const notificationData: any = {
        title: data.title,
        message: data.message,
        sender: admin?.first_name && admin?.last_name
  ? `${admin.first_name} ${admin.last_name}`
  : "Admin",
        userId: userId || 1, // Use admin user ID, fallback to 1 if not available
      };

      // Determine which endpoint to use based on sendToAllTenants
      let endpoint: string;
      if (data.sendToAllTenants) {
        // Send to all tenants
        endpoint = API_ENDPOINTS.CREATE_NOTIFICATION;
      } else {
        // Send to specific tenant
        if (!data.tenantId) {
          toast.error("Please select an organization");
          form.setError("tenantId", {
            type: "manual",
            message: "Organization selection is required",
          });
          setIsSubmitting(false);
          return;
        }
        endpoint = API_ENDPOINTS.CREATE_TENANT_NOTIFICATION(data.tenantId);
      }

      // Send notification
      const response = await processRequestAuth("post", endpoint, notificationData);
      
      // Check for success indicators
      if (response?.status || response?.success || (response && !response.error)) {
        // Invalidate and refetch notifications cache to update the bell icon immediately
        mutate(API_ENDPOINTS.GET_NOTIFICATIONS);
        
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
        {/* Title */}
        <div className="mb-4">
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


