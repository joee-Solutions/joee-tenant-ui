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
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { Spinner } from "@/components/icons/Spinner";
import { toast } from "react-toastify";

const DepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  description: z.string().min(1, "Department description is required"),
  status: z.boolean().default(false),
});

type DepartmentSchemaType = z.infer<typeof DepartmentSchema>;

export default function AddDepartment({ slug }: { slug: string }) {
  const router = useRouter();
  const form = useForm<DepartmentSchemaType>({
    resolver: zodResolver(DepartmentSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      status: false,
    },
  });
  useEffect(() => {
    if(!slug){
      router.push(`/dashboard/organization/${slug}/departments`)
    }
  }, [slug])

  const onSubmit = async (data: DepartmentSchemaType) => {
    try {
      const payload = {
        name: data.name,
        description: data.description,
        status: data.status === false ? "inactive" : "active",
      };
      const res = await processRequestAuth(
        "post",
        API_ENDPOINTS.TENANTS_DEPARTMENTS(parseInt(slug)),
        payload
      );
      if (res && (res.success || res.status)) {
        toast.success("Department created successfully");
        router.push(`/dashboard/organization/${slug}/departments`);
      } else {
        toast.error(res?.message || "Failed to create department");
      }
    } catch (error: any) {
      console.log(error,"error")
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.validationErrors?.join(", ") ||
                          error?.message || 
                          "Failed to create department";
      toast.error(errorMessage);
    }
    // Handle form submission
  };

  return (
    <div className="py-8 px-6 my-8 shadow-[0px_0px_4px_1px_#0000004D]">
      <div className="flex justify-between items-center border-b-2  py-4 mb-8">
        <h1 className="font-semibold text-xl text-black">Add Department</h1>
        <Button
          onClick={() => router.push(`/dashboard/organization/${slug}/departments`)}
          className="font-normal text-base text-white bg-[#003465] h-[60px] px-6"
        >
          Back 
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="mb-4">
          <label className="block text-base text-black font-normal mb-2">
            Department name
          </label>
          <Input
            placeholder="Enter here"
            {...form.register("name")}
            className="w-full h-14 p-3 border border-[#737373] rounded"
          />
        </div>

        <div className="">
          <label className="block text-base text-black font-normal mb-2">
            Department Description
          </label>
          <Textarea
            placeholder="Enter description"
            {...form.register("description")}
            className="w-full p-3 min-h-52 border border-[#737373] rounded"
          />
        </div>

        <div className="">
          <h3 className="block text-base text-black font-normal mb-2">
            Status
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={!form.watch("status")}
                onCheckedChange={() => form.setValue("status", false)}
                className="accent-green-600 w-6 h-6 rounded"
              />
              <label htmlFor="active">Inactive</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inactive"
                checked={form.watch("status")}
                onCheckedChange={() => form.setValue("status", true)}
                className="accent-green-600 w-6 h-6 rounded"
              />
              <label htmlFor="inactive">Active</label>
            </div>
          </div>
        </div>

        <div className="flex space-x-4 pt-4 ">
          <Button
            type="button"
            className=" border border-[#EC0909] text-[#EC0909] hover:bg-[#ec090922] py-8 px-16 text-md rounded"
            onClick={() => router.push(`/dashboard/organization/${slug}/departments`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className=" bg-[#003465] hover:bg-[#0d2337] text-white py-8 px-10 text-md rounded min-w-56"
          >
            {
              form.formState.isSubmitting ? <Spinner/> : "Submit"
            }
          </Button>
        </div>
      </form>
    </div>
  );
}
