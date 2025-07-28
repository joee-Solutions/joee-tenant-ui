"use client";
import React, { useState } from "react";
import FormComposer from "@/components/shared/form/FormComposer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Key,
  Save,
  ArrowLeft
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import FieldBox from "../shared/form/FieldBox";
import FieldSelect from "../shared/form/FieldSelect";
import { useRouter } from "next/navigation";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";

const PermissionFormSchema = z.object({
  name: z.string().min(1, "Permission name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
});

type PermissionFormSchemaType = z.infer<typeof PermissionFormSchema>;

interface PermissionFormProps {
  mode?: "create" | "edit";
  initialData?: any;
  onSuccess?: () => void;
}

const permissionCategories = [
  "user",
  "tenant", 
  "department",
  "patient",
  "appointment",
  "employee",
  "record",
  "notification",
  "system"
];

export default function PermissionForm({ 
  mode = "create", 
  initialData,
  onSuccess 
}: PermissionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const form = useForm<PermissionFormSchemaType>({
    resolver: zodResolver(PermissionFormSchema),
    mode: "onChange",
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      category: initialData?.category || "",
    },
  });

  const onSubmit = async (payload: PermissionFormSchemaType) => {
    setLoading(true);
    setError("");

    try {
      const endpoint = mode === "create" 
        ? API_ENDPOINTS.CREATE_PERMISSION
        : API_ENDPOINTS.UPDATE_PERMISSION(initialData.id);

      const method = mode === "create" ? "post" : "put";

      const response = await processRequestAuth(method, endpoint, payload);

      if (response.status) {
        toast.success(response.message || "Permission saved successfully");
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard/permissions");
        }
      } else {
        setError(response.message || "Failed to save permission");
      }
    } catch (error: any) {
      console.error("Error saving permission:", error);
      setError(error.message || "An error occurred while saving");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-10 pt-[32px] pb-[56px] shadow-[0px_0px_4px_1px_#0000004D] rounded-md h-fit max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-2 mb-6">
        <Key className="w-6 h-6 text-[#003465]" />
        <h2 className="font-bold text-xl text-black">
          {mode === "create" ? "Create New Permission" : "Edit Permission"}
        </h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <FormComposer form={form} onSubmit={onSubmit}>
        <div className="flex flex-col gap-[30px]">
          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            name="name"
            control={form.control}
            labelText="Permission Name"
            type="text"
            placeholder="Enter permission name (e.g., manage_users)"
          />

          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            name="description"
            control={form.control}
            labelText="Description"
            type="text"
            placeholder="Enter permission description"
          />

          <FieldSelect
            bgSelectClass="bg-[#D9EDFF] border-[#D9EDFF]"
            name="category"
            control={form.control}
            options={permissionCategories}
            labelText="Category"
            placeholder="Select category"
          />

          <div className="flex items-center gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  type="submit"
                  disabled={loading}
                  className="h-[60px] bg-[#003465] text-base font-medium text-white rounded flex items-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {mode === "create" ? "Create Permission" : "Update Permission"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white flex flex-col items-center text-center">
                <AlertDialogHeader className="flex flex-col items-center">
                  <CheckCircle2 className="size-[100px] fill-[#3FA907] text-white" />
                  <AlertDialogTitle className="font-medium text-[#3FA907] text-4xl">
                    Success
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-normal text-base text-[#737373]">
                    Permission has been {mode === "create" ? "created" : "updated"} successfully
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction className="h-[60px] w-[291px] bg-[#3FA907] text-white font-medium text-base">
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </FormComposer>
    </div>
  );
} 