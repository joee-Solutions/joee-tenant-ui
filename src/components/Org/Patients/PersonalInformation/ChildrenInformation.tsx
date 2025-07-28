import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormData } from "../AddPatient";

// Validation schema
export const childrenSchema = z.object({
  fullName: z.string().optional(),
  sex: z.enum(["male", "female", "other"]).optional(),
  relationship: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
});


export default function GuardianInfoForm() {
  // const {
  //   register,
  //   handleSubmit,
  //   formState: { errors },
  //   setValue,
  //   watch,
  // } = useForm<FormData>({
  //   resolver: zodResolver(schema),
  // });

  const {
    register,
    formState: { errors },
    control

  } = useFormContext<Pick<FormData, 'children'>>();


  return (
    <div className=" mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Guardian Information</h2>

      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Guardian Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-base text-black font-normal mb-2"
            >
              Guardian Full Name
            </label>
            <Input
              type="text"
              id="fullName"
              placeholder="Enter here"
              className="w-full h-14 p-3 border border-[#737373] rounded"
              {...register("children.fullName",)}
            />
            {errors.children?.fullName && (
              <p className="text-red-500 text-sm">
                {errors.children.fullName.message}
              </p>
            )}
          </div>

          {/* Sex */}

          <Controller
            name='children.sex'
            control={control}
            render={({ field }) => (
              <div>
                <label
                  htmlFor="Sex"
                  className="block text-base text-black font-normal mb-2"
                >
                  Sex
                </label>
                <Select
                  {...field}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                    <SelectValue placeholder={`Select Country`} />

                  </SelectTrigger>
                  <SelectContent className="z-10 bg-white">
                    {['male', 'female', 'other'].map((option) => (
                      <SelectItem key={option} value={option} className="hover:bg-gray-200">
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors?.children?.sex && (
                  <p className="text-red-500 text-sm">{errors.children?.sex.message}</p>
                )}
              </div>
            )}

          />

          {/* Relationship */}
          <div>
            <label
              htmlFor="relationship"
              className="block text-base text-black font-normal mb-2"
            >
              Relationship
            </label>
            <Input
              type="text"
              id="relationship"
              placeholder="Enter here"
              className="w-full h-14 p-3 border border-[#737373] rounded"
              {...register('children.relationship')}
            />
            {errors.children?.relationship && (
              <p className="text-red-500 text-sm">
                {errors.children?.relationship.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-base text-black font-normal mb-2"
            >
              Phone
            </label>
            <Input
              type="tel"
              id="phone"
              placeholder="Enter here"
              className="w-full h-14 p-3 border border-[#737373] rounded"
              {...register("children.phone")}
            />
            {errors.children?.phone && (
              <p className="text-red-500 text-sm">
                {errors.children?.phone.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="md:col-span-2">
            <label
              htmlFor="email"
              className="block text-base text-black font-normal mb-2"
            >
              Email
            </label>
            <Input
              type="email"
              id="email"
              placeholder="Enter here"
              className="w-full h-14 p-3 border border-[#737373] rounded"
              {...register("children.email")}
            />
            {errors.children?.email && (
              <p className="text-red-500 text-sm">
                {errors.children?.email.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
