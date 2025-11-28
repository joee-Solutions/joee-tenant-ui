"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useSWR from "swr";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import { Spinner } from "@/components/icons/Spinner";
import { processRequestAuth } from "@/framework/https";
import { toast } from "react-toastify";
import { DatePicker } from "@/components/ui/date-picker";

const EmployeeSchema = z.object({
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone_number: z.string().min(1, "Phone number is required"),
  address: z.string().optional(),
  region: z.string().optional(),
  date_of_birth: z.date().optional(),
  specialty: z.string().optional(),
  designation: z.string().min(1, "Designation is required"),
  department: z.string().min(1, "Department is required"),
  gender: z.string().optional(),
  image_url: z.string().optional(),
  hire_date: z.date().optional(),
  about: z.string().optional(),
  status: z.string(),
});

type EmployeeSchemaType = z.infer<typeof EmployeeSchema>;

interface EditEmployeeProps {
  slug: string;
  employeeId: number;
  onDone?: () => void;
}

export default function EditEmployee({ slug, employeeId, onDone }: EditEmployeeProps) {
  const router = useRouter();
  const [fileSelected, setFileSelected] = useState<string>("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [hireDate, setHireDate] = useState<Date | undefined>(undefined);
  const hasPopulated = useRef(false);

  // Validate slug and employeeId - parse but don't return early (hooks must be called)
  const orgId = parseInt(slug);
  const isValidOrgId = !isNaN(orgId) && orgId > 0;
  const isValidEmployeeId = !isNaN(employeeId) && employeeId > 0;

  const form = useForm<EmployeeSchemaType>({
    resolver: zodResolver(EmployeeSchema),
    mode: "onSubmit", // Only validate on submit to prevent errors showing prematurely
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

  const { data: deptRes } = useSWR(
    isValidOrgId ? API_ENDPOINTS.TENANTS_DEPARTMENTS(orgId) : null,
    authFectcher
  );
  const departments: Array<{ id: number; name: string }> = Array.isArray(deptRes?.data) ? deptRes.data : [];

  const genders = ["Male", "Female", "Other", "Prefer not to say"];
  
  const choosenDepartment = form.watch("department");
  const deptId = departments.find((d) => d.name === choosenDepartment)?.id;

  // load employee
  const { data: employeeRes, isLoading } = useSWR(
    isValidOrgId ? API_ENDPOINTS.GET_TENANTS_EMPLOYEES(orgId) : null,
    authFectcher
  );
  const employee = useMemo(() => {
    if (!Array.isArray(employeeRes?.data)) {
      console.log("Employee data is not an array:", employeeRes);
      return undefined;
    }
    const found = employeeRes.data.find((e: any) => e.id === employeeId);
    console.log("Looking for employee with ID:", employeeId);
    console.log("Found employee:", found);
    console.log("All employees:", employeeRes.data.map((e: any) => ({ id: e.id, name: `${e.firstname} ${e.lastname}` })));
    return found;
  }, [employeeRes, employeeId]);

  useEffect(() => {
    // Wait for both employee and departments to be loaded
    if (employee && departments.length > 0 && !hasPopulated.current) {
      console.log("Populating form with employee data:", employee);
      console.log("Available departments:", departments);
      hasPopulated.current = true;
      
      // Parse dates from strings
      let validDob: Date | undefined = undefined;
      let validHire: Date | undefined = undefined;
      
      if ((employee as any).date_of_birth) {
        const dobStr = String((employee as any).date_of_birth);
        const dob = new Date(dobStr.includes('T') ? dobStr.slice(0, 10) : dobStr);
        validDob = !isNaN(dob.getTime()) ? dob : undefined;
      }
      
      if ((employee as any).hire_date) {
        const hireStr = String((employee as any).hire_date);
        const hire = new Date(hireStr.includes('T') ? hireStr.slice(0, 10) : hireStr);
        validHire = !isNaN(hire.getTime()) ? hire : undefined;
      }
      
      // Set date states
      if (validDob) {
        setDateOfBirth(validDob);
        console.log("Set dateOfBirth:", validDob);
      }
      if (validHire) {
        setHireDate(validHire);
        console.log("Set hireDate:", validHire);
      }
      
      // Set file selected if image_url exists
      const imageUrl = (employee as any).image_url || (employee as any).imageUrl || "";
      if (imageUrl) {
        setFileSelected(imageUrl);
      }
      
      // Get status - convert from string to string (should already be "active" or "inactive")
      const employeeStatus = String((employee as any).status || "").toLowerCase();
      const statusValue = employeeStatus === "active" ? "active" : employeeStatus === "inactive" ? "inactive" : "active";
      
      // Get department name - ensure it matches one of the available departments
      let deptName = "";
      if (employee.department) {
        if (typeof employee.department === "object") {
          deptName = (employee.department as any)?.name || "";
        } else {
          // If it's a number/ID, find the department name
          const deptId = typeof employee.department === "number" ? employee.department : parseInt(String(employee.department));
          if (!isNaN(deptId) && departments.length > 0) {
            const foundDept = departments.find(d => d.id === deptId);
            deptName = foundDept?.name || "";
          } else {
            deptName = String(employee.department);
          }
        }
      }
      
      // Ensure department name exists in the departments list (case-insensitive match)
      if (deptName && departments.length > 0) {
        const exactMatch = departments.find(d => d.name === deptName);
        if (!exactMatch) {
          // Try case-insensitive match
          const caseInsensitiveMatch = departments.find(d => 
            d.name.toLowerCase() === deptName.toLowerCase()
          );
          if (caseInsensitiveMatch) {
            deptName = caseInsensitiveMatch.name; // Use the exact case from departments list
          } else {
            console.warn("Department not found in list:", deptName);
            deptName = ""; // Reset if no match found
          }
        }
      }
      
      // Get gender - ensure it matches one of the available genders (case-insensitive)
      let genderValue = "";
      const employeeGender = String((employee as any).gender || "").trim();
      if (employeeGender) {
        // Find exact match first
        const exactMatch = genders.find(g => g === employeeGender);
        if (exactMatch) {
          genderValue = exactMatch;
        } else {
          // Try case-insensitive match
          const caseInsensitiveMatch = genders.find(g => 
            g.toLowerCase() === employeeGender.toLowerCase()
          );
          if (caseInsensitiveMatch) {
            genderValue = caseInsensitiveMatch; // Use the exact case from genders array
          } else {
            genderValue = employeeGender; // Use as-is if no match
          }
        }
      }
      
      const formData = {
        firstname: employee.firstname || "",
        lastname: employee.lastname || "",
        email: employee.email || "",
        phone_number: employee.phone_number || "",
        address: (employee as any).address || "",
        region: (employee as any).region || "",
        date_of_birth: validDob || undefined,
        specialty: (employee as any).specialty || "",
        designation: employee.designation || "",
        department: deptName,
        gender: genderValue,
        image_url: (employee as any).image_url || (employee as any).imageUrl || "",
        hire_date: validHire || undefined,
        about: (employee as any).about || "",
        status: statusValue,
      };
      
      console.log("Form data to reset:", formData);
      console.log("Available departments:", departments.map(d => d.name));
      console.log("Department match:", deptName);
      console.log("Gender match:", genderValue);
      
      form.reset(formData, {
        keepDefaultValues: false,
      });
      
      // Force update Select components after a brief delay to ensure they reflect the values
      setTimeout(() => {
        if (deptName) {
          form.setValue("department", deptName, { shouldValidate: false });
        }
        if (genderValue) {
          form.setValue("gender", genderValue, { shouldValidate: false });
        }
        console.log("Form reset completed");
        console.log("Form values after reset:", form.getValues());
        console.log("Department value:", form.getValues("department"));
        console.log("Gender value:", form.getValues("gender"));
      }, 100);
    }
  }, [employee, departments, form]);

  const onSubmit = async (data: EmployeeSchemaType) => {
    try {
      // Get the current status value directly from form state
      const currentStatus = form.getValues("status");
      const statusToSend = currentStatus || data.status;
      
      // Validate status
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
      
      const payload: Record<string, any> = {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        phone_number: data.phone_number,
        designation: data.designation,
      department: deptId,
        status: statusToSend, // "active" or "inactive" string
      };
      
      // Only include optional fields if they have values
      if (data.address) payload.address = data.address;
      if (data.region) payload.region = data.region;
      if (data.date_of_birth instanceof Date) payload.date_of_birth = data.date_of_birth.toISOString().split('T')[0];
      if (data.specialty) payload.specialty = data.specialty;
      if (data.gender) payload.gender = data.gender;
      if (data.image_url) payload.image_url = data.image_url;
      if (data.hire_date instanceof Date) payload.hire_date = data.hire_date.toISOString().split('T')[0];
      if (data.about) payload.about = data.about;
      
      const res = await processRequestAuth(
        "put",
        API_ENDPOINTS.UPDATE_TENANT_EMPLOYEE(orgId, employeeId),
        payload
      );
      
      if (res?.status || res?.success) {
        toast.success("Employee updated successfully!", {
          toastId: "employee-update-success",
        });
        setTimeout(() => {
          if (onDone) {
            onDone();
          } else {
            router.push(`/dashboard/organization/${slug}/employees`);
          }
        }, 1000);
      } else {
        toast.error(res?.message || "Failed to update employee. Please try again.", {
          toastId: "employee-update-error",
        });
      }
    } catch (error: any) {
      console.error("Error updating employee:", error);
      
      const responseData = error?.response?.data;
      const errorMessage = 
        responseData?.validationErrors ||
        responseData?.error ||
        responseData?.message || 
        error?.message ||
        "An error occurred while updating the employee. Please try again.";
      
      // Check for duplicate email errors
      const errorString = errorMessage.toLowerCase();
      if (errorString.includes("email") && (errorString.includes("already") || errorString.includes("exist") || errorString.includes("duplicate"))) {
        form.setError("email", {
          type: "manual",
          message: "This email is already registered. Please use a different email.",
        });
        toast.error("Email already exists. Please use a different email.", {
          toastId: "employee-update-error",
        });
        return;
      }
      
      toast.error(errorMessage, {
        toastId: "employee-update-error",
      });
    }
  };

  // Show error if IDs are invalid (after all hooks are called)
  if (!isValidOrgId) {
    return (
      <div className="py-8 px-6 my-8 shadow-[0px_0px_4px_1px_#0000004D] mx-8">
        <div className="p-8 text-center text-red-500">
          <p className="font-semibold text-lg mb-2">Invalid Organization ID</p>
          <p className="text-sm">Received: {slug}</p>
        </div>
      </div>
    );
  }

  if (!isValidEmployeeId) {
    return (
      <div className="py-8 px-6 my-8 shadow-[0px_0px_4px_1px_#0000004D] mx-8">
        <div className="p-8 text-center text-red-500">
          <p className="font-semibold text-lg mb-2">Invalid Employee ID</p>
          <p className="text-sm">Received: {employeeId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-6 my-8 shadow-[0px_0px_4px_1px_#0000004D] mx-8">
      <div className="flex justify-between items-center border-b-2  py-4 mb-8">
        <h1 className="font-semibold text-xl text-black">EDIT EMPLOYEE</h1>
        <Button
          type="button"
          onClick={() => {
            router.back();
          }}
          className="font-normal text-base text-white bg-[#003465] h-[60px] px-6"
        >
          Back
        </Button>
      </div>

      {isLoading && !employee ? (
        <Spinner />
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base text-black font-normal mb-2">First name</label>
              <Input placeholder="Enter here" {...form.register("firstname")} className="w-full h-14 p-3 border border-[#737373] rounded" />
              {form.formState.errors.firstname && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.firstname.message}</p>
              )}
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Last name</label>
              <Input placeholder="Enter here" {...form.register("lastname")} className="w-full h-14 p-3 border border-[#737373] rounded" />
              {form.formState.errors.lastname && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.lastname.message}</p>
              )}
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Email</label>
              <Input placeholder="Enter here" type="email" {...form.register("email")} className="w-full h-14 p-3 border border-[#737373] rounded" />
              {form.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Phone number</label>
              <Input placeholder="Enter here" {...form.register("phone_number")} className="w-full h-14 p-3 border border-[#737373] rounded" />
              {form.formState.errors.phone_number && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.phone_number.message}</p>
              )}
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Address</label>
              <Input placeholder="Enter here" {...form.register("address")} className="w-full h-14 p-3 border border-[#737373] rounded" />
              {form.formState.errors.address && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.address.message}</p>
              )}
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Region/State</label>
              <Input
                placeholder="Enter here"
                {...form.register("region")}
                className="w-full h-14 p-3 border border-[#737373] rounded"
              />
              {form.formState.errors.region && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.region.message}</p>
              )}
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Date of Birth</label>
              <DatePicker
                date={dateOfBirth}
                onDateChange={(date) => {
                  setDateOfBirth(date);
                  if (date) {
                    form.setValue("date_of_birth", date, { shouldValidate: true });
                  } else {
                    form.setValue("date_of_birth", null as any, { shouldValidate: true });
                  }
                }}
                placeholder="Select date of birth"
                className="w-full"
              />
              {form.formState.errors.date_of_birth && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.date_of_birth.message}</p>
              )}
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Specialty</label>
              <Input placeholder="Enter here" {...form.register("specialty")} className="w-full h-14 p-3 border border-[#737373] rounded" />
              {form.formState.errors.specialty && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.specialty.message}</p>
              )}
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Designation</label>
              <Input placeholder="Enter here" {...form.register("designation")} className="w-full h-14 p-3 border border-[#737373] rounded" />
              {form.formState.errors.designation && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.designation.message}</p>
              )}
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Department</label>
              <Select 
                value={form.watch("department") || ""} 
                onValueChange={(v) => {
                  form.setValue("department", v, { shouldValidate: true });
                  form.clearErrors("department"); // Clear error when value is selected
                }}
              >
                <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="z-10 bg-white">
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.department && form.formState.isSubmitted && !form.watch("department") && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.department.message}</p>
              )}
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Gender</label>
              <Select 
                value={form.watch("gender") || ""} 
                onValueChange={(v) => {
                  form.setValue("gender", v, { shouldValidate: true });
                }}
              >
                <SelectTrigger className="w-full h-14 p-3 border border-[#737373] rounded flex justify-between items-center">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="z-10 bg-white">
                  {genders.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.gender && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.gender.message}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="file-upload-edit"
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
                    {fileSelected || form.watch("image_url") || "Choose File"}
                  </span>
                </div>
                <Button
                  type="button"
                  className="bg-[#003465] hover:bg-[#0d2337] text-white px-6 py-2 h-14 rounded"
                  onClick={() => document.getElementById("fileInputEdit")?.click()}
                >
                  Browse
                </Button>
                <input
                  id="fileInputEdit"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFileSelected(file.name);
                      form.setValue("image_url", file.name, { shouldValidate: true });
                    }
                  }}
                />
              </div>
              {form.formState.errors.image_url && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.image_url.message}</p>
              )}
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Hire date</label>
              <DatePicker
                date={hireDate}
                onDateChange={(date) => {
                  setHireDate(date);
                  if (date) {
                    form.setValue("hire_date", date, { shouldValidate: true });
                  } else {
                    form.setValue("hire_date", null as any, { shouldValidate: true });
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

          <div>
            <label className="block text-base text-black font-normal mb-2">Short Biography</label>
            <Textarea placeholder="Your Message" {...form.register("about")} className="w-full p-3 min-h-52 border border-[#737373] rounded" />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Status</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inactive"
                  checked={form.watch("status") === "inactive"}
                  onCheckedChange={(checked) => {
                    if (checked) {
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

          <div className="flex space-x-4 pt-4">
            <Button
              type="button"
              className=" border border-[#EC0909] text-[#EC0909] hover:bg-[#ec090922] py-8 px-16 text-md rounded"
              onClick={() => {
                router.back();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className=" bg-[#003465] hover:bg-[#0d2337] text-white py-8 px-16 text-md rounded min-w-[200px]"
            >
              {form.formState.isSubmitting ? <Spinner /> : "Save Changes"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

