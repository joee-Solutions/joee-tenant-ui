"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { processRequestAuth } from "@/framework/https";

const EditEmployeeSchema = z.object({
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone_number: z.string().min(1, "Phone number is required"),
  designation: z.string().optional(),
  department: z.string().optional(),
  status: z.string().optional(),
});

type EditEmployeeSchemaType = z.infer<typeof EditEmployeeSchema>;

export default function EditEmployeePage() {
  const pathname = usePathname();
  const router = useRouter();
  const segments = pathname.split("/");
  const org = segments[4];
  const employeeId = Number(segments[6]);

  const form = useForm<EditEmployeeSchemaType>({
    resolver: zodResolver(EditEmployeeSchema),
    mode: "onChange",
  });

  const { data: employeeRes } = useSWR(
    API_ENDPOINTS.GET_TENANTS_EMPLOYEES(parseInt(org)),
    authFectcher
  );

  const employee = Array.isArray(employeeRes?.data)
    ? employeeRes.data.find((e: any) => e.id === employeeId)
    : undefined;

  // Initialize defaults once loaded
  if (employee && !form.getValues("firstname")) {
    form.reset({
      firstname: employee.firstname || "",
      lastname: employee.lastname || "",
      email: employee.email || "",
      phone_number: employee.phone_number || "",
      designation: employee.designation || "",
      department: typeof employee.department === "object" ? String(employee.department?.id || "") : "",
      status: employee.status || "",
    });
  }

  const { data: deptRes } = useSWR(
    API_ENDPOINTS.TENANTS_DEPARTMENTS(parseInt(org)),
    authFectcher
  );

  const departments: Array<{ id: number; name: string }> = Array.isArray(deptRes?.data)
    ? deptRes.data
    : [];

  const onSubmit = async (payload: EditEmployeeSchemaType) => {
    const dto: Record<string, any> = { ...payload };
    if (dto.department) dto.department = Number(dto.department);
    await processRequestAuth(
      "put",
      API_ENDPOINTS.UPDATE_TENANT_EMPLOYEE(Number(org), employeeId),
      dto
    );
    router.push(`/dashboard/organization/${org}/view`);
  };

  return (
    <div className="px-6 py-8 bg-white shadow-[0px_0px_4px_1px_#0000004D] rounded">
      <h2 className="text-xl font-semibold mb-6">Edit Employee</h2>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">First name</label>
          <Input {...form.register("firstname")} placeholder="Enter first name" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Last name</label>
          <Input {...form.register("lastname")} placeholder="Enter last name" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <Input type="email" {...form.register("email")} placeholder="Enter email" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Phone number</label>
          <Input {...form.register("phone_number")} placeholder="Enter phone number" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Designation</label>
          <Input {...form.register("designation")} placeholder="Designation" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Department</label>
          <Select value={form.watch("department") || ""} onValueChange={(v) => form.setValue("department", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {departments.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <Select value={form.watch("status") || ""} onValueChange={(v) => form.setValue("status", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {(["ACTIVE", "INACTIVE", "DEACTIVATED"] as const).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 flex gap-3 mt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </div>
  );
}

