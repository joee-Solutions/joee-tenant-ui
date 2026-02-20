"use client";

import React, { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import FieldBox from "@/components/shared/form/FieldBox";
import FieldSelect from "@/components/shared/form/FieldSelect";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";
import { AdminUser } from "@/lib/types";
import { Spinner } from "@/components/icons/Spinner";

const EditAdminSchema = z.object({
  first_name: z.string().min(1, "This field is required"),
  last_name: z.string().min(1, "This field is required"),
  email: z
    .string()
    .email("Invalid email address")
    .min(1, "This field is required"),
  role: z.string().min(1, "This field is required"),
  phone_number: z.string().min(1, "This field is required"),
  company: z.string().min(1, "This field is required"),
  address: z.string().optional(),
});

type EditAdminSchemaType = z.infer<typeof EditAdminSchema>;

const orgStatus = ["Admin", "Super_Admin", "User"];

interface EditAdminModalProps {
  admin: AdminUser;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditAdminModal({
  admin,
  onClose,
  onSuccess,
}: EditAdminModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<EditAdminSchemaType>({
    resolver: zodResolver(EditAdminSchema),
    mode: "onChange",
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      role: "",
      company: "",
      address: "",
    },
  });

  // Populate form when admin data is available
  useEffect(() => {
    if (admin) {
      form.reset({
        first_name: admin.first_name || "",
        last_name: admin.last_name || "",
        email: admin.email || "",
        phone_number: admin.phone_number || "",
        role: admin.roles?.[0] || "",
        company: "Joee Solution", // Default or from admin data if available
        address: admin.address || "",
      });
    }
  }, [admin, form]);

  const handleSubmit = async (payload: EditAdminSchemaType) => {
    if (!admin?.id) return;

    setIsUpdating(true);
    try {
      const response = await processRequestAuth(
        "put",
        API_ENDPOINTS.UPDATE_ADMIN(admin.id),
        payload
      );

      const hasError =
        response?.error ||
        response?.validationErrors ||
        (response?.statusCode && response.statusCode >= 400);
      const isSuccess =
        (response?.success || response?.status) && !hasError;

      if (!isSuccess || hasError) {
        const errorMessage =
          response?.error ||
          response?.validationErrors ||
          response?.message ||
          "Failed to update admin";
        toast.error(errorMessage);
        return;
      }

      toast.success("Admin updated successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error updating admin:", error);
      let errorMessage = "Failed to update admin";

      if (error?.response?.data) {
        errorMessage =
          error.response.data.error ||
          error.response.data.validationErrors ||
          error.response.data.message ||
          errorMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-black">Edit Admin</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-5">
                <FieldBox
                  bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
                  name="first_name"
                  control={form.control}
                  labelText="First Name"
                  type="text"
                  placeholder="Enter First name"
                />
                <FieldBox
                  bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
                  type="text"
                  name="last_name"
                  control={form.control}
                  labelText="Last Name"
                  placeholder="Enter Last name"
                />
              </div>

              <FieldBox
                bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
                type="text"
                name="email"
                control={form.control}
                labelText="Email"
                placeholder="Enter email"
              />

              <FieldBox
                bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
                type="text"
                name="address"
                control={form.control}
                labelText="Address"
                placeholder="Enter Address"
              />

              <FieldBox
                bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
                type="text"
                name="phone_number"
                control={form.control}
                labelText="Phone number"
                placeholder="Enter Phone number"
              />

              <FieldSelect
                bgSelectClass="bg-[#D9EDFF] border-[#D9EDFF]"
                name="role"
                control={form.control}
                options={orgStatus}
                labelText="Role"
                placeholder="Select"
              />

              <FieldBox
                bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
                name="company"
                control={form.control}
                labelText="Company"
                type="text"
                placeholder="Enter here"
              />

              <div className="flex gap-3 justify-end mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 bg-[#003465] text-white hover:bg-[#003465]/90"
                >
                  {isUpdating ? (
                    <>
                      <Spinner className="mr-2" />
                      Updating...
                    </>
                  ) : (
                    "Update Admin"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}

