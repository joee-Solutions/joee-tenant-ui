"use client";

import { Spinner } from "@/components/icons/Spinner";
import FieldBox from "@/components/shared/form/FieldBox";
import FieldSelect from "@/components/shared/form/FieldSelect";
import FormComposer from "@/components/shared/form/FormComposer";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { processRequestAuth } from "@/framework/https";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

const NewOrganizationSchema = z.object({
  name: z.string().min(1, "This field is required"),
  address: z.string().min(1, "This field is required"),
  city: z.string().min(1, "This field is required"),
  state: z.string().min(1, "This field is required"),
  zipCode: z.string().min(1, "This field is required").optional(),
  country: z.string().min(1, "This field is required"),
  phone_number: z.string().min(1, "This field is required"),
  organizationFax: z.string().optional(),
  email: z
    .string()
    .email("Invalid email address")
    .min(1, "This field is required"),
  website: z
    .string()
    .url("Invalid URL address")
    .min(1, "This field is required"),
  adminName: z
    .string()
    .min(1, "This field is required")
    .refine((val) => val.trim().split(" ").length >= 2, {
      message: "Please enter a full name (first and last)",
    }),
  adminPhoneNumber: z.string().min(1, "This field is required"),
  adminEmail: z
    .string()
    .email("Invalid email address")
    .min(1, "This field is required"),
  org_type: z.string().min(1, "This field is required"),
  domain: z.string().min(1, "This field is required"),
});

type NewOrganizationSchemaType = z.infer<typeof NewOrganizationSchema>;

const cities = ["Lagos", "Osogbo"];
const states = ["Lagos", "Osun"];
const countries = ["Nigeria", "Ghana", "Kuwait"];

interface NewOrgProps {
  setIsAddOrg: (val: "add" | "edit" | "none") => void;
}

export default function NewOrg({ setIsAddOrg }: NewOrgProps) {
  const router = useRouter();
  const form = useForm<NewOrganizationSchemaType>({
    resolver: zodResolver(NewOrganizationSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      address: "",
      adminEmail: "",
      adminName: "",
      adminPhoneNumber: "",
      city: "",
      country: "",
      email: "",
      organizationFax: "",
      phone_number: "",
      org_type: "",
      state: "",
      website: "",
      zipCode: "",
      domain:''
    },
  });

  console.log(form.formState);
  const onSubmit = async (payload: NewOrganizationSchemaType) => {
    try {
      const {
        address,
        city,
        state,
        zipCode,
        country,
        adminName,
        adminPhoneNumber,
        adminEmail,
        ...rest
      } = payload;
      const [firstname, lastname] = adminName.split(" ");
      const formattedPayload = {
        ...rest,
        address_metadata: {
          address: address,
          city: city,
          state: state,
          zip_code: zipCode,
          country: country,
        },
        admin_info: {
          phone_number: adminPhoneNumber,
          firstname: firstname,
          lastname: lastname,
          email: adminEmail,
        },
      };

      console.log("Formatted Payload:", formattedPayload);
      const res = await processRequestAuth(
        "post",
        API_ENDPOINTS.CREATE_TENANTs,
        formattedPayload
      );
      if (res.status) {
        // Optionally, you can redirect or show a success message
        router.push(`/dashboard/organization/${payload.domain}`);
      }
    } catch (error) {
      console.error("Error creating organization:", error);
      // Handle error appropriately, e.g., show a toast notification
    }
    // router.push("/dashboard/organization/test");
  };

  return (
    <div className="flex flex-col gap-[30px]">
      <div>
        <Button
          onClick={() => setIsAddOrg("none")}
          className="font-semibold text-2xl text-black gap-1 p-0"
        >
          <CircleArrowLeft className="fill-[#003465] text-white size-[39px]" />
          Create Organization
        </Button>
      </div>
      <div className="pt-10 pb-[52px] px-[49px] shadow-[0px_0px_4px_1px_#0000004D] rounded-md">
        <FormComposer form={form} onSubmit={onSubmit}>
          <div className="flex flex-col gap-[30px]">
            <FieldBox
              name="name"
              control={form.control}
              labelText="Organization name"
              type="text"
              placeholder="Enter here"
            />
            <FieldBox
              name="address"
              control={form.control}
              labelText="Address"
              type="text"
              placeholder="Enter here"
            />

            <div className="flex items-center gap-[30px]">
              <FieldSelect
                name="city"
                control={form.control}
                options={cities}
                labelText="City"
                placeholder="Select"
              />
              <FieldSelect
                name="state"
                control={form.control}
                options={states}
                labelText="State"
                placeholder="Select"
              />
            </div>
            <div className="flex items-center gap-[30px]">
              <FieldBox
                name="zipCode"
                type="text"
                control={form.control}
                labelText="Zip/Post code"
                placeholder="Enter here"
              />
              <FieldSelect
                name="country"
                control={form.control}
                options={countries}
                labelText="Country"
                placeholder="Select"
              />
            </div>
            <div className="flex items-center gap-[30px]">
              <FieldBox
                type="text"
                name="phone_number"
                control={form.control}
                labelText="Organization Phone number"
                placeholder="Enter here"
              />
              <FieldBox
                type="text"
                name="organizationFax"
                control={form.control}
                labelText="Organization Fax"
                placeholder="Enter here"
              />
            </div>
            <div className="flex items-center gap-[30px]">
              <FieldBox
                type="text"
                name="email"
                control={form.control}
                labelText="Organization Email"
                placeholder="Enter here"
              />
              <FieldBox
                type="text"
                name="website"
                control={form.control}
                labelText="Website"
                placeholder="Enter here"
              />
            </div>
            <div className="flex items-center gap-[30px]">
              <FieldSelect
                name="org_type"
                control={form.control}
                options={["hospital"]}
                labelText="Organization Type"
                placeholder="Select"
              />
              <FieldBox
                type="text"
                name="adminName"
                control={form.control}
                labelText="Admin/Contact Person name"
                placeholder="e.g John Doe"
              />
            </div>
            <div className="flex items-center gap-[30px]">
              <FieldBox
                type="text"
                name="adminPhoneNumber"
                control={form.control}
                labelText="Admin Phone number"
                placeholder="Enter here"
              />
              <FieldBox
                type="text"
                name="adminEmail"
                control={form.control}
                labelText="Admin Email"
                placeholder="Enter here"
              />
            </div>
            <FieldBox
                type="text"
                name="domain"
                control={form.control}
                labelText="Sub Domain"
                placeholder="E.g braincare"
              />

            <Button
              className="h-[60px] bg-[#003465] text-base font-medium text-white rounded"
              type="submit"
            >
              {form.formState.isSubmitting ? (
                <Spinner />
              ) : (
                "Create Organization"
              )}
            </Button>
          </div>
        </FormComposer>
      </div>
    </div>
  );
}
