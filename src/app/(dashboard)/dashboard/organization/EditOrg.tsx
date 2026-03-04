import FieldBox from "@/components/shared/form/FieldBox";
import FieldSelect from "@/components/shared/form/FieldSelect";
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
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { processRequestAuth } from "@/framework/https";
import { getChangedFields } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Edit, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const EditOrganizationSchema = z.object({
  name: z.string().min(1, "This field is required"),
  status: z.string().min(1, "This field is required"),
  phoneNumber: z.string().min(1, "This field is required"),
  organizationEmail: z
    .string()
    .email("Invalid email address")
    .min(1, "This field is required"),
  organization_type: z.string().optional(),
  adminFirstname: z.string().optional(),
  adminLastname: z.string().optional(),
  adminPhoneNumber: z.string().optional(),
  adminEmail: z
    .string()
    .email("Invalid email address")
    .min(1, "This field is required"),
});

type EditOrganizationSchemaType = z.infer<typeof EditOrganizationSchema>;

const orgStatus = ["active", "inactive", "deactivated"];
const orgTypes = [
  "Hospital",
  "Clinic",
  "Medical Center",
  "Pharmacy",
  "Laboratory",
  "Diagnostic Center",
  "Rehabilitation Center",
  "Nursing Home",
  "Urgent Care",
  "Specialty Clinic",
  "Dental Clinic",
  "Eye Clinic",
  "Mental Health Center",
  "Other",
];

export default function EditOrg({ data, slug }: { data: any; slug: string }) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [defaults, setDefault] = useState<Partial<EditOrganizationSchemaType> | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<EditOrganizationSchemaType>({
    resolver: zodResolver(EditOrganizationSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      adminEmail: "",
      adminFirstname: "",
      adminLastname: "",
      adminPhoneNumber: "",
      organizationEmail: "",
      organization_type: "",
      phoneNumber: "",
      status: "",
    },
  });
  useEffect(() => {
    const adminInfo = data?.admin_info || data?.profile || {};
    const datas = {
      name: data?.name || "",
      adminEmail: adminInfo?.email ?? data?.profile?.admin_email ?? "",
      phoneNumber: data?.phone_number || "",
      adminPhoneNumber: adminInfo?.phone_number ?? data?.profile?.phone_number ?? "",
      organizationEmail: data?.email || "",
      organization_type: data?.organization_type ?? data?.org_type ?? "",
      status: (data?.status || "inactive").toLowerCase() === "active" ? "active" : "inactive",
      adminFirstname: adminInfo?.firstname ?? adminInfo?.first_name ?? "",
      adminLastname: adminInfo?.lastname ?? adminInfo?.last_name ?? "",
    };
    form.reset(datas);
    setDefault(datas as any);
  }, [data]);
  const onSubmit = async (payload: EditOrganizationSchemaType) => {
    try {
      const changedFields = getChangedFields(defaults, payload);
      if (Object.keys(changedFields).length === 0) {
        return;
      }
      const updatePayload: Record<string, unknown> = {};
      if (changedFields.name !== undefined) updatePayload.name = changedFields.name;
      if (changedFields.organizationEmail !== undefined) updatePayload.email = changedFields.organizationEmail;
      if (changedFields.phoneNumber !== undefined) updatePayload.phone_number = changedFields.phoneNumber;
      if (changedFields.organization_type !== undefined) updatePayload.organization_type = changedFields.organization_type || null;
      if (changedFields.status !== undefined) {
        const v = String(changedFields.status).toLowerCase();
        updatePayload.status = v === "active" ? "active" : "deactivated";
      }
      if (
        changedFields.adminFirstname !== undefined ||
        changedFields.adminLastname !== undefined ||
        changedFields.adminPhoneNumber !== undefined
      ) {
        updatePayload.admin_info = {
          phone_number: changedFields.adminPhoneNumber ?? defaults?.adminPhoneNumber ?? "",
          firstname: changedFields.adminFirstname ?? defaults?.adminFirstname ?? "",
          lastname: changedFields.adminLastname ?? defaults?.adminLastname ?? "",
        };
      }
      const res = await processRequestAuth(
        "put",
        API_ENDPOINTS.EDIT_ORGANIZATION(slug),
        updatePayload
      );
      setIsOpen(true);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <>
      <h2 className="font-bold text-base text-black mb-[30px]">
        Organization Profile
      </h2>
      <FormComposer form={form} onSubmit={onSubmit}>
        <div className="flex flex-col gap-[30px]">
          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            name="name"
            control={form.control}
            labelText="Organization name"
            type="text"
            placeholder="Enter here"
          />
          {/* <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            name="address"
            control={form.control}
            labelText="Address"
            type="text"
            placeholder="Enter here"
          /> */}

          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            name="adminFirstname"
            control={form.control}
            labelText="Admin first name"
            type="text"
            placeholder="Enter here"
          />
          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            type="text"
            name="adminLastname"
            control={form.control}
            labelText="Admin last name"
            placeholder="Enter here"
          />

          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            type="text"
            name="phoneNumber"
            control={form.control}
            labelText="Organization Phone number"
            placeholder="Enter here"
          />

          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            type="text"
            name="adminPhoneNumber"
            control={form.control}
            labelText="Admin Phone number"
            placeholder="Enter here"
          />

          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            type="text"
            name="organizationEmail"
            control={form.control}
            labelText="Organization Email"
            placeholder="Enter here"
          />

          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            type="text"
            name="adminEmail"
            control={form.control}
            labelText="Admin Email"
            placeholder="Enter here"
          />

          <FieldSelect
            bgSelectClass="bg-[#D9EDFF] border-[#D9EDFF]"
            name="status"
            control={form.control}
            options={orgStatus}
            defaultOption={data?.status}
            labelText="Status"
            placeholder="Select"
          />
          <FieldSelect
            bgSelectClass="bg-[#D9EDFF] border-[#D9EDFF]"
            name="organization_type"
            control={form.control}
            options={orgTypes}
            labelText="Organization type"
            placeholder="Select"
          />

          <div className="flex items-center gap-7">
            <AlertDialog open={isOpen} onOpenChange={(open) => open && isOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  className="h-[60px] bg-[#003465] text-base font-medium text-white rounded w-full"
                  type="submit"
                >
                  Edit <Edit size={20} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white flex flex-col items-center text-center">
                <AlertDialogHeader className="flex flex-col items-center">
                  <CheckCircle2 className="size-[100px] fill-[#3FA907] text-white" />
                  <AlertDialogTitle className="font-medium text-[#3FA907] text-4xl">
                    Success
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-normal text-base text-[#737373]">
                    You have successfully saved changes
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction
                    className="h-[60px] w-[291px] bg-[#3FA907] text-white font-medium text-base"
                    onClick={() => setIsOpen(false)}
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              type="button"
              variant="outline"
              className="h-[60px] border border-[#EC0909] text-base font-normal text-[#D40808] rounded w-full"
            >
              Delete <Trash2 size={24} />
            </Button>
          </div>
        </div>
      </FormComposer>
    </>
  );
}
