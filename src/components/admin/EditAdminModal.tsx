"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import FieldBox from "@/components/shared/form/FieldBox";
import FieldSelect, {
  matchSelectValueToOption,
} from "@/components/shared/form/FieldSelect";
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
    .min(1, "This field is required")
    .email("Invalid email address"),
  role: z.string().min(1, "This field is required"),
  phone_number: z.string().min(1, "This field is required"),
  company: z.string().min(1, "This field is required"),
  address: z.string().optional(),
});

type EditAdminSchemaType = z.infer<typeof EditAdminSchema>;

const ROLE_OPTIONS = ["Admin", "Super_Admin"];

function getAdminRoleString(admin: AdminUser): string {
  const single = (admin as { role?: string }).role;
  if (typeof single === "string" && single.trim()) return single.trim();

  const rolesUnknown = (admin as { roles?: unknown }).roles;

  if (typeof rolesUnknown === "string" && rolesUnknown.trim()) {
    const t = rolesUnknown.trim();
    if (t.startsWith("[") && t.endsWith("]")) {
      try {
        const parsed = JSON.parse(t) as unknown;
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0] != null) {
          return String(parsed[0]).trim();
        }
      } catch {
        /* use raw string */
      }
    }
    return t;
  }

  if (!rolesUnknown) return "";

  if (Array.isArray(rolesUnknown)) {
    if (rolesUnknown.length === 0) return "";
    const first = rolesUnknown[0];
    if (typeof first === "string") return first.trim();
    if (typeof first === "number" || typeof first === "boolean") {
      return String(first);
    }
    if (first && typeof first === "object" && first !== null) {
      const o = first as { name?: unknown; role?: unknown };
      if (typeof o.name === "string" && o.name.trim()) return o.name.trim();
      if (typeof o.role === "string" && o.role.trim()) return o.role.trim();
    }
    return "";
  }

  const user = (admin as { user?: { roles?: unknown; role?: string } }).user;
  if (user?.role && typeof user.role === "string" && user.role.trim()) {
    return user.role.trim();
  }
  if (Array.isArray(user?.roles) && user.roles.length > 0) {
    const fr = user.roles[0];
    if (typeof fr === "string") return fr.trim();
  }

  return "";
}

function getRoleForForm(roleStr: string): string {
  if (!roleStr) return "";
  const trimmed = roleStr.trim();
  if (ROLE_OPTIONS.includes(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase().replace(/\s+/g, "_");
  const found = ROLE_OPTIONS.find(
    (o) => o.toLowerCase().replace(/\s+/g, "_") === lower
  );
  return found ?? trimmed;
}

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

  const roleOptions = useMemo(() => {
    const raw = getAdminRoleString(admin).trim();
    const normalized = (getRoleForForm(raw) || raw).trim();
    const opts = [...ROLE_OPTIONS];
    if (raw && !opts.includes(raw)) opts.push(raw);
    if (normalized && !opts.includes(normalized)) opts.push(normalized);
    return opts;
  }, [admin]);

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

  // Populate form when admin data is available (role must match a SelectItem value)
  useEffect(() => {
    if (!admin) return;
    const roleRaw = getAdminRoleString(admin);
    const normalized = getRoleForForm(roleRaw) || roleRaw;
    const role =
      matchSelectValueToOption(normalized, roleOptions) ??
      matchSelectValueToOption(roleRaw, roleOptions) ??
      "";

    form.reset({
      first_name: admin.first_name || "",
      last_name: admin.last_name || "",
      email: admin.email || "",
      phone_number: admin.phone_number || "",
      role,
      company: "Joee Solution",
      address: admin.address || "",
    });

    // Radix Select often misses the first programmatic value; sync after paint.
    if (role) {
      queueMicrotask(() => {
        form.setValue("role", role, { shouldValidate: true, shouldDirty: false });
      });
    }
  }, [admin, form, roleOptions]);

  const handleSubmit = async (payload: EditAdminSchemaType) => {
    if (!admin?.id) return;

    setIsUpdating(true);
    try {
      const updatePayload = {
        first_name: payload.first_name,
        last_name: payload.last_name,
        address: payload.address ?? "",
        email: payload.email,
        phone_number: payload.phone_number,
        role: payload.role,
        company: payload.company,
      };

      const response = await processRequestAuth(
        "patch",
        API_ENDPOINTS.UPDATE_ADMIN_PROFILE(admin.id),
        updatePayload
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

              <div className="w-full overflow-visible">
                <FieldSelect
                  bgSelectClass="bg-[#D9EDFF] border-[#D9EDFF]"
                  name="role"
                  control={form.control}
                  options={roleOptions}
                  labelText="Role"
                  placeholder="Select"
                  selectKey={`${admin.id}-${form.watch("role") || "none"}`}
                />
              </div>

              <FieldBox
                bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
                name="company"
                control={form.control}
                labelText="Company"
                type="text"
                placeholder="Enter here"
                disabled={true}
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

