"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useSWR from "swr";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import { Spinner } from "@/components/icons/Spinner";
import { processRequestAuth } from "@/framework/https";
import { parse } from "path";
import { toast } from "react-toastify";
import { DatePicker } from "@/components/ui/date-picker";

const EmployeeSchema = z.object({
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone_number: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  region: z.string().min(1, "Region/State is required"),
  date_of_birth: z.date({ required_error: "Date of birth is required" }),
  specialty: z.string().optional(),
  designation: z.string().min(1, "Designation is required"),
  department: z.string().min(1, "Department is required"),
  gender: z.string().min(1, "Gender is required"),
  image_url: z.string().optional(),
  hire_date: z.date({ required_error: "Hire date is required" }),
  about: z.string().optional(),
  status: z.string(),
});

type EmployeeSchemaType = z.infer<typeof EmployeeSchema>;

export default function AddEmployee({ slug }: { slug: string }) {
  const router = useRouter();
  const [fileSelected, setFileSelected] = useState<string>("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [hireDate, setHireDate] = useState<Date | undefined>(undefined);

  const form = useForm<EmployeeSchemaType>({
    resolver: zodResolver(EmployeeSchema),
    mode: "onChange",
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      phone_number: "",
      address: "",
      region: "",
      date_of_birth: undefined,
      specialty: "",
      designation: "",
      department: "",
      gender: "",
      image_url: "",
      hire_date: undefined,
      about: "",
      status: undefined,
    },
  });

  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.TENANTS_DEPARTMENTS(parseInt(slug)),
    authFectcher
  );
  useEffect(() => {
    if(!slug){
      router.push(`/dashboard/organization/${slug}/employees`)
    }
  }, [slug])

  if (isLoading) {
    return <Spinner />;
  }

  const departments = Array.isArray(data?.data) && data.data.length > 0
    ? data.data.map((dept) => dept.name)
    : [];

  const choosenDepartment = form.watch("department");
  const deptId = Array.isArray(data?.data)
    ? data.data.find((dept) => dept.name === choosenDepartment)?.id
    : undefined;
  console.log(deptId, "department id");
  const genders = ["Male", "Female", "Other", "Prefer not to say"];

  if (error) {
    return <div className="p-8 text-center text-red-500">Failed to load departments.</div>;
  }
  if (!departments.length) {
    return <div className="p-8 text-center text-gray-500">No departments found. Please add a department first.</div>;
  }

  const onSubmit = async (data: EmployeeSchemaType) => {
    try {
      // Validate that status is selected
      if (!data.status) {
        toast.error("Please select a status (Active or Inactive)", {
          toastId: "status-required-error",
        });
        form.setError("status", {
          type: "manual",
          message: "Status is required. Please select Active or Inactive.",
        });
        return;
      }
      
      // Get the current status value directly from form state to ensure accuracy
      const currentStatus = form.getValues("status");
      const statusToSend = currentStatus || data.status;
      
      // Ensure status is explicitly set and is either "active" or "inactive"
      if (!statusToSend || (statusToSend !== "active" && statusToSend !== "inactive")) {
        toast.error("Please select a status (Active or Inactive)", {
          toastId: "status-required-error",
        });
        form.setError("status", {
          type: "manual",
          message: "Status is required. Please select Active or Inactive.",
        });
        return;
      }
      
      const payload = {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        phone_number: data.phone_number,
        address: data.address,
        region: data.region,
        date_of_birth: data.date_of_birth instanceof Date ? data.date_of_birth.toISOString().split('T')[0] : '',
        specialty: data.specialty,
        designation: data.designation,
        department: deptId,
        gender: data.gender,
        image_url: data.image_url,
        hire_date: data.hire_date instanceof Date ? data.hire_date.toISOString().split('T')[0] : '',
        about: data.about,
        status: statusToSend, // Explicitly set status as "active" or "inactive"
      };

      const res = await processRequestAuth(
        "post",
        API_ENDPOINTS.TENANTS_EMPLOYEES(parseInt(slug), parseInt(deptId)),
        payload
      );
      
      // Check if response contains an error (even if status code suggests success)
      const errorText = typeof res?.error === 'string' ? res.error : '';
      const hasConstraintError = errorText.includes('duplicate key value violates unique constraint');
      const hasError = res?.error || 
                       res?.statusCode === 500 || 
                       (res?.statusCode && res.statusCode >= 400) || 
                       res?.validationErrors ||
                       hasConstraintError;
      
      if (hasError) {
        const errorMessage = res?.validationErrors || res?.error || res?.message || "Failed to create employee. Please try again.";
        
        // Check for specific unique constraint violations using constraint IDs
        // Employee email duplicate constraint: UQ_80e5f0171fb2f6ac7196005f30b
        if (errorMessage.includes("UQ_80e5f0171fb2f6ac7196005f30b")) {
          form.setError("email", {
            type: "manual",
            message: "This email is already registered. Please use a different email.",
          });
          toast.error("Email already exists. Please use a different email.", {
            toastId: "employee-create-error",
          });
          return;
        }
        
        const errorString = errorMessage.toLowerCase();
        if (errorString.includes("email") && (errorString.includes("already") || errorString.includes("exist") || errorString.includes("duplicate"))) {
          form.setError("email", {
            type: "manual",
            message: "This email is already registered. Please use a different email.",
          });
          toast.error("Email already exists. Please use a different email.", {
            toastId: "employee-create-error",
          });
          return;
        }
        
        toast.error(errorMessage, {
          toastId: "employee-create-error",
        });
        return;
      }
      
      if (res?.status || res?.success) {
        toast.success("Employee created successfully!", {
          toastId: "employee-create-success",
        });
        setTimeout(() => {
          router.push(`/dashboard/organization/${slug}/employees`);
        }, 1000);
      } else {
        toast.error(res?.message || "Failed to create employee. Please try again.", {
          toastId: "employee-create-error",
        });
      }
    } catch (error: any) {
      console.error("Error creating employee:", error);
      
      const responseData = error?.response?.data;
      const errorMessage = 
        responseData?.validationErrors ||
        responseData?.error ||
        responseData?.message || 
        error?.message ||
        "An error occurred while creating the employee. Please try again.";
      
      // Check for specific unique constraint violations using constraint IDs
      // Employee email duplicate constraint: UQ_80e5f0171fb2f6ac7196005f30b
      if (errorMessage.includes("UQ_80e5f0171fb2f6ac7196005f30b")) {
        form.setError("email", {
          type: "manual",
          message: "This email is already registered. Please use a different email.",
        });
        toast.error("Email already exists. Please use a different email.", {
          toastId: "employee-create-error",
        });
        return;
      }
      
      const errorString = errorMessage.toLowerCase();
      
      // Check for duplicate email errors (generic fallback)
      if (errorString.includes("email") && (errorString.includes("already") || errorString.includes("exist") || errorString.includes("duplicate"))) {
        form.setError("email", {
          type: "manual",
          message: "This email is already registered. Please use a different email.",
        });
        toast.error("Email already exists. Please use a different email.", {
          toastId: "employee-create-error",
        });
        return;
      }
      
      toast.error(errorMessage, {
        toastId: "employee-create-error",
      });
    }
  };
  return (
    <div className="py-8 px-6 my-8 shadow-[0px_0px_4px_1px_#0000004D] mx-8">
      <div className="flex justify-between items-center border-b-2  py-4 mb-8">
        <h1 className="font-semibold text-xl text-black">ADD EMPLOYEE</h1>

        <Button
          onClick={() => router.push(`/dashboard/organization/${slug}/employees`)}
          className="font-normal text-base text-white bg-[#003465] h-[60px] px-6"
        >
          Back
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First name */}
          <div>
            <label className="block text-base text-black font-normal mb-2">
              First name
            </label>
            <Input
              placeholder="Enter here"
              {...form.register("firstname")}
              className="w-full h-14 p-3 border border-[#737373] rounded"
            />
          </div>

          {/* Last name */}
          <div>
            <label className="block text-base text-black font-normal mb-2">
              Last name
            </label>
            <Input
              placeholder="Enter here"
              {...form.register("lastname")}
              className="w-full h-14 p-3 border border-[#737373] rounded"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-base text-black font-normal mb-2">
              Email
            </label>
            <Input
              placeholder="Enter here"
              type="email"
              {...form.register("email")}
              className="w-full h-14 p-3 border border-[#737373] rounded"
            />
            {form.formState.errors.email && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Phone number */}
          <div>
            <label className="block text-base text-black font-normal mb-2">
              Phone number
            </label>
            <Input
              placeholder="Enter here"
              {...form.register("phone_number")}
              className="w-full h-14 p-3 border border-[#737373] rounded"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-base text-black font-normal mb-2">
              Address
            </label>
            <Input
              placeholder="Enter here"
              {...form.register("address")}
              className="w-full h-14 p-3 border border-[#737373] rounded"
            />
          </div>

          {/* Region/State */}
          <div>
            <label className="block text-base text-black font-normal mb-2">
              Region/State
            </label>
            <Input
              placeholder="Enter here"
              {...form.register("region")}
              className="w-full h-14 p-3 border border-[#737373] rounded"
            />
            {form.formState.errors.region && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.region.message}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-base text-black font-normal mb-2">
              Date of Birth
            </label>
            <DatePicker
              date={dateOfBirth}
              onDateChange={(date) => {
                setDateOfBirth(date);
                if (date) {
                  form.setValue("date_of_birth", date, { shouldValidate: true });
                } else {
                  form.setValue("date_of_birth", undefined as any, { shouldValidate: true });
                }
              }}
              placeholder="Select date of birth"
              className="w-full"
            />
            {form.formState.errors.date_of_birth && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.date_of_birth.message}</p>
            )}
          </div>

          {/* Specialty */}
          <div>
            <label className="block text-base text-black font-normal mb-2">
              Specialty
            </label>
            <Input
              placeholder="Enter here"
              {...form.register("specialty")}
              className="w-full h-14 p-3 border border-[#737373] rounded"
            />
          </div>

          {/* Designation */}
          <div>
            <label className="block text-base text-black font-normal mb-2">
              Designation
            </label>
            <Input
              placeholder="Enter here"
              {...form.register("designation")}
              className="w-full h-14 p-3 border border-[#737373] rounded"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-base text-black font-normal mb-2">
              Department
            </label>
            <Select
              onValueChange={(value) => form.setValue("department", value)}
            >
              <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                <SelectValue placeholder="select" />
              </SelectTrigger>
              <SelectContent className="z-10 bg-white">
                {departments.map((dept) => (
                  <SelectItem
                    key={dept}
                    value={dept}
                    className="hover:bg-gray-200"
                  >
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-base text-black font-normal mb-2">
              Gender
            </label>
            <Select onValueChange={(value) => form.setValue("gender", value)}>
              <SelectTrigger className="w-full h-14 p-3 border border-[#737373] rounded flex justify-between items-center">
                <SelectValue placeholder="select" />
              </SelectTrigger>
              <SelectContent className="z-10 bg-white">
                {genders.map((gender) => (
                  <SelectItem
                    key={gender}
                    value={gender}
                    className="hover:bg-gray-200"
                  >
                    {gender}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload Employee Image */}
          <div>
            <label
              htmlFor="file-upload"
              className="block text-base text-black font-normal mb-2"
            >
              Upload Employee Image
            </label>
            <div className="flex">
              <div className="flex-1 border rounded flex items-center px-4 h-14 border-[#737373]">
                <span className="mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </span>
                <span className="text-gray-500">
                  {fileSelected || "Choose File"}
                </span>
              </div>
              <Button
                type="button"
                className="bg-[#003465] hover:bg-[#0d2337] text-white px-6 py-2 h-14 rounded"
                onClick={() => document.getElementById("fileInput")?.click()}
              >
                Browse
              </Button>
              <input
                id="fileInput"
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFileSelected(file.name);
                    form.setValue("image_url", file.name);
                  }
                }}
              />
            </div>
          </div>

          {/* Hire date */}
          <div>
            <label className="block text-base text-black font-normal mb-2">
              Hire date
            </label>
            <DatePicker
              date={hireDate}
              onDateChange={(date) => {
                setHireDate(date);
                if (date) {
                  form.setValue("hire_date", date, { shouldValidate: true });
                } else {
                  form.setValue("hire_date", undefined as any, { shouldValidate: true });
                }
              }}
              placeholder="Select hire date"
              className="w-full"
            />
            {form.formState.errors.hire_date && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.hire_date.message}</p>
            )}
          </div>
        </div>

        {/* Short Biography */}
        <div>
          <label className="block text-base text-black font-normal mb-2">
            Short Biography
          </label>
          <Textarea
            placeholder="Your Message"
            {...form.register("about")}
            className="w-full p-3 min-h-52 border border-[#737373] rounded"
          />
        </div>

        {/* Status */}
        <div>
          <h3 className="text-lg font-medium mb-4">Status</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inactive"
                checked={form.watch("status") === "inactive"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    // When inactive checkbox is checked, set status to "inactive"
                    form.setValue("status", "inactive", { shouldValidate: true });
                  }
                }}
                className="accent-green-600 w-6 h-6 rounded"
              />
              <label 
                htmlFor="inactive" 
                className="cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  form.setValue("status", "inactive", { shouldValidate: true });
                }}
              >
                Inactive
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={form.watch("status") === "active"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    // When active checkbox is checked, set status to "active"
                    form.setValue("status", "active", { shouldValidate: true });
                  }
                }}
                className="accent-green-600 w-6 h-6 rounded"
              />
              <label 
                htmlFor="active" 
                className="cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  form.setValue("status", "active", { shouldValidate: true });
                }}
              >
                Active
              </label>
            </div>
          </div>
          {form.formState.errors.status && (
            <p className="text-red-500 text-sm mt-2">{form.formState.errors.status.message}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          <Button
            type="button"
            className=" border border-[#EC0909] text-[#EC0909] hover:bg-[#ec090922] py-8 px-16 text-md rounded"
            onClick={() => router.push(`/dashboard/organization/${slug}/employees`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!form.formState.isValid || form.formState.isSubmitting}
            className=" bg-[#003465] hover:bg-[#0d2337] text-white py-8 px-16 text-md rounded min-w-[200px]"
          >
            {form.formState.isSubmitting ? <Spinner /> : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
}
