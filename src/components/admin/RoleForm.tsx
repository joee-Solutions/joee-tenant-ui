"use client";
import React, { useState, useEffect } from "react";
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
  Shield,
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
import { Permission } from "@/lib/types";

const RoleFormSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().min(1, "Description is required"),
  permissions: z.array(z.string()).min(1, "At least one permission is required"),
});

type RoleFormSchemaType = z.infer<typeof RoleFormSchema>;

interface RoleFormProps {
  mode?: "create" | "edit";
  initialData?: any;
  onSuccess?: () => void;
}

export default function RoleForm({ 
  mode = "create", 
  initialData,
  onSuccess 
}: RoleFormProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const form = useForm<RoleFormSchemaType>({
    resolver: zodResolver(RoleFormSchema),
    mode: "onChange",
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      permissions: initialData?.permissions?.map((p: Permission) => p.name) || [],
    },
  });

  const fetchPermissions = async () => {
    try {
      const response = await processRequestAuth("get", API_ENDPOINTS.GET_ALL_PERMISSIONS);
      
      if (response && typeof response === 'object' && 'success' in response) {
        if (response.success && response.data) {
          setPermissions(Array.isArray(response.data) ? response.data : []);
        }
      } else {
        setPermissions(response?.data || response || []);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast.error("Failed to load permissions");
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const onSubmit = async (payload: RoleFormSchemaType) => {
    setLoading(true);
    setError("");

    try {
      const endpoint = mode === "create" 
        ? API_ENDPOINTS.CREATE_ROLE
        : API_ENDPOINTS.UPDATE_ROLE(initialData.id);

      const method = mode === "create" ? "post" : "put";

      const response = await processRequestAuth(method, endpoint, payload);

      if (response.status) {
        toast.success(response.message || "Role saved successfully");
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard/roles");
        }
      } else {
        setError(response.message || "Failed to save role");
      }
    } catch (error: any) {
      console.error("Error saving role:", error);
      setError(error.message || "An error occurred while saving");
    } finally {
      setLoading(false);
    }
  };

  const permissionCategories = [...new Set(permissions.map(p => p.category))];

  return (
    <div className="px-10 pt-[32px] pb-[56px] shadow-[0px_0px_4px_1px_#0000004D] rounded-md h-fit max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-6 h-6 text-[#003465]" />
        <h2 className="font-bold text-xl text-black">
          {mode === "create" ? "Create New Role" : "Edit Role"}
        </h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <FormComposer form={form} onSubmit={onSubmit}>
        <div className="flex flex-col gap-[30px]">
          <div className="grid grid-cols-2 gap-5">
            <FieldBox
              bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
              name="name"
              control={form.control}
              labelText="Role Name"
              type="text"
              placeholder="Enter role name"
            />
            <FieldBox
              bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
              name="description"
              control={form.control}
              labelText="Description"
              type="text"
              placeholder="Enter role description"
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900">Permissions</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select the permissions that this role should have access to
            </p>

            {permissionCategories.map((category) => (
              <div key={category} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 capitalize">{category} Permissions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {permissions
                    .filter(p => p.category === category)
                    .map((permission) => (
                      <label key={permission.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          value={permission.name}
                          {...form.register("permissions")}
                          className="rounded border-gray-300 text-[#003465] focus:ring-[#003465]"
                        />
                        <span className="text-sm text-gray-700">{permission.name}</span>
                      </label>
                    ))}
                </div>
              </div>
            ))}
          </div>

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
                  {mode === "create" ? "Create Role" : "Update Role"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white flex flex-col items-center text-center">
                <AlertDialogHeader className="flex flex-col items-center">
                  <CheckCircle2 className="size-[100px] fill-[#3FA907] text-white" />
                  <AlertDialogTitle className="font-medium text-[#3FA907] text-4xl">
                    Success
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-normal text-base text-[#737373]">
                    Role has been {mode === "create" ? "created" : "updated"} successfully
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