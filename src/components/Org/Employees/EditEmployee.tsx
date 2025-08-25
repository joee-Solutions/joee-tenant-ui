"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const EmployeeSchema = z.object({
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone_number: z.string().min(1, "Phone number is required"),
  address: z.string().optional(),
  region: z.string().optional(),
  date_of_birth: z.string().optional(),
  specialty: z.string().optional(),
  designation: z.string().min(1, "Designation is required"),
  department: z.string().min(1, "Department is required"),
  gender: z.string().optional(),
  image_url: z.string().optional(),
  hire_date: z.string().optional(),
  about: z.string().optional(),
  status: z.boolean().default(false),
});

type EmployeeSchemaType = z.infer<typeof EmployeeSchema>;

interface EditEmployeeProps {
  slug: string;
  employeeId: number;
  onDone?: () => void;
}

export default function EditEmployee({ slug, employeeId, onDone }: EditEmployeeProps) {
  const [fileSelected, setFileSelected] = useState<string>("");

  const form = useForm<EmployeeSchemaType>({
    resolver: zodResolver(EmployeeSchema),
    mode: "onChange",
  });

  const { data: deptRes } = useSWR(
    API_ENDPOINTS.TENANTS_DEPARTMENTS(parseInt(slug)),
    authFectcher
  );
  const departments: Array<{ id: number; name: string }> = Array.isArray(deptRes?.data) ? deptRes.data : [];

  const regions = ["New York", "Lagos", "Texas", "Florida", "Abuja"];
  const genders = ["Male", "Female", "Other", "Prefer not to say"];

  // load employee
  const { data: employeeRes, isLoading } = useSWR(
    API_ENDPOINTS.GET_TENANTS_EMPLOYEES(parseInt(slug)),
    authFectcher
  );
  const employee = useMemo(
    () => (Array.isArray(employeeRes?.data) ? employeeRes.data.find((e: any) => e.id === employeeId) : undefined),
    [employeeRes, employeeId]
  );

  useEffect(() => {
    if (employee) {
      form.reset({
        firstname: employee.firstname || "",
        lastname: employee.lastname || "",
        email: employee.email || "",
        phone_number: employee.phone_number || "",
        address: (employee as any).address || "",
        region: (employee as any).region || "",
        date_of_birth: (employee as any).date_of_birth ? String((employee as any).date_of_birth).slice(0, 10) : "",
        specialty: (employee as any).specialty || "",
        designation: employee.designation || "",
        department: typeof employee.department === "object" ? (employee.department as any)?.name || "" : (employee.department as any) || "",
        gender: (employee as any).gender || "",
        image_url: (employee as any).image_url || "",
        hire_date: (employee as any).hire_date ? String((employee as any).hire_date).slice(0, 10) : "",
        about: (employee as any).about || "",
        status: String((employee as any).status).toLowerCase() !== "active",
      });
    }
  }, [employee, form]);

  const onSubmit = async (data: EmployeeSchemaType) => {
    const deptId = departments.find((d) => d.name === data.department)?.id;
    const payload = {
      ...data,
      department: deptId,
      status: data.status === false ? "active" : "inactive",
    } as Record<string, any>;
    await processRequestAuth("put", API_ENDPOINTS.UPDATE_TENANT_EMPLOYEE(Number(slug), employeeId), payload);
    onDone?.();
  };

  return (
    <div className="py-8 px-6 my-8 shadow-[0px_0px_4px_1px_#0000004D] mx-8">
      <div className="flex justify-between items-center border-b-2  py-4 mb-8">
        <h1 className="font-semibold text-xl text-black">EDIT EMPLOYEE</h1>
      </div>

      {isLoading && !employee ? (
        <Spinner />
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base text-black font-normal mb-2">First name</label>
              <Input placeholder="Enter here" {...form.register("firstname")} className="w-full h-14 p-3 border border-[#737373] rounded" />
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Last name</label>
              <Input placeholder="Enter here" {...form.register("lastname")} className="w-full h-14 p-3 border border-[#737373] rounded" />
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Email</label>
              <Input placeholder="Enter here" type="email" {...form.register("email")} className="w-full h-14 p-3 border border-[#737373] rounded" />
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Phone number</label>
              <Input placeholder="Enter here" {...form.register("phone_number")} className="w-full h-14 p-3 border border-[#737373] rounded" />
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Address</label>
              <Input placeholder="Enter here" {...form.register("address")} className="w-full h-14 p-3 border border-[#737373] rounded" />
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Region/State</label>
              <Select value={form.watch("region") || ""} onValueChange={(v) => form.setValue("region", v)}>
                <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                  <SelectValue placeholder="select" />
                </SelectTrigger>
                <SelectContent className="z-10 bg-white">
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Date of Birth</label>
              <Input placeholder="DD/MM/YYYY" type="date" {...form.register("date_of_birth")} className="w-full h-14 p-3 border border-[#737373] rounded" />
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Specialty</label>
              <Input placeholder="Enter here" {...form.register("specialty")} className="w-full h-14 p-3 border border-[#737373] rounded" />
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Designation</label>
              <Input placeholder="Enter here" {...form.register("designation")} className="w-full h-14 p-3 border border-[#737373] rounded" />
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Department</label>
              <Select value={form.watch("department") || ""} onValueChange={(v) => form.setValue("department", v)}>
                <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                  <SelectValue placeholder="select" />
                </SelectTrigger>
                <SelectContent className="z-10 bg-white">
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Gender</label>
              <Select value={form.watch("gender") || ""} onValueChange={(v) => form.setValue("gender", v)}>
                <SelectTrigger className="w-full h-14 p-3 border border-[#737373] rounded flex justify-between items-center">
                  <SelectValue placeholder="select" />
                </SelectTrigger>
                <SelectContent className="z-10 bg-white">
                  {genders.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Upload Employee Image</label>
              <Input placeholder="Image URL or filename" {...form.register("image_url")} className="w-full h-14 p-3 border border-[#737373] rounded" />
            </div>
            <div>
              <label className="block text-base text-black font-normal mb-2">Hire date</label>
              <Input placeholder="Enter here" type="date" {...form.register("hire_date")} className="w-full h-14 p-3 border border-[#737373] rounded" />
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
                <Checkbox id="active" checked={!form.watch("status")} onCheckedChange={() => form.setValue("status", false)} className="accent-green-600 w-6 h-6 rounded" />
                <label htmlFor="active">Active</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="inactive" checked={form.watch("status")} onCheckedChange={() => form.setValue("status", true)} className="accent-green-600 w-6 h-6 rounded" />
                <label htmlFor="inactive">Inactive</label>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting} className=" bg-[#003465] hover:bg-[#0d2337] text-white py-8 px-16 text-md rounded min-w-[200px]">
              {form.formState.isSubmitting ? <Spinner /> : "Save Changes"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

