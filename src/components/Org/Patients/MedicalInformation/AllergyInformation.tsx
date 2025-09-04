"use client";

import React from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";



// schema.ts
import { z } from "zod";
import { FormData } from "../AddPatient";

export const allergySchema = z
  .array(
    z.object({
      allergy: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      severity: z.string().optional(),
      reactions: z.string().optional(),
      comments: z.string().optional(),
    })
  )
  .optional();

export type AllergyFormData = z.infer<typeof allergySchema>;

export default function AllergyInformationForm() {
  const allergyOptions = [
    "Penicillin",
    "Peanuts",
    "Dairy",
    "Shellfish",
    "Eggs",
    "Tree nuts",
    "Wheat",
    "Soy",
    "Fish",
    "Latex",
    "Other",
  ];

  const severityLevels = ["Mild", "Moderate", "Severe", "Life-threatening"];

  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<Pick<FormData, 'allergies'>>();

  const { fields, append, remove } = useFieldArray<Pick<FormData, 'allergies'>>({
    control,
    name: "allergies",
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Allergy Information</h1>

      {fields.map((field, index) => (
        <div key={field.id} className="mb-8 border-b pb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Allergy {index + 1}</h2>
            <div className="flex gap-2">
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => remove(index)}
                >
                  Remove
                </Button>
              )}
              {index === fields.length - 1 && (
                <Button
                  type="button"
                  onClick={() =>
                    append({
                      allergy: "",
                      startDate: "",
                      endDate: "",
                      severity: "",
                      reactions: "",
                      comments: "",
                    })
                  }
                >
                  Add Another
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Allergy */}
            <div>
              <label className="block mb-2">Allergy</label>
              <Controller
                control={control}
                name={`allergies.${index}.allergy`}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full h-14 p-3 border border-gray-400 rounded z-[1000]">
                      <SelectValue placeholder="Select an allergy" />
                    </SelectTrigger>
                    <SelectContent className="z-[1000] bg-white">
                      {allergyOptions.map((opt) => (
                        <SelectItem key={opt} value={opt} className="hover:bg-gray-200 py-2">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {
                errors.allergies?.[index]?.allergy && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.allergies[index].allergy.message}
                  </p>
                )
              }
            </div>

            {/* Start Date */}
            <div>
              <label className="block mb-2">Start Date</label>
              <Controller
                name={`allergies.${index}.startDate`}
                control={control}
                render={({ field }) => (
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                    placeholder="Select start date"
                  />
                )}
              />
              {
                errors.allergies?.[index]?.startDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.allergies[index].startDate.message}
                  </p>
                )
              }
            </div>

            {/* End Date */}
            <div>
              <label className="block mb-2">End Date</label>
              <Controller
                name={`allergies.${index}.endDate`}
                control={control}
                render={({ field }) => (
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                    placeholder="Select end date"
                  />
                )}
              />
              {
                errors.allergies?.[index]?.endDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.allergies[index].endDate.message}
                  </p>
                )
              }
            </div>

            {/* Severity */}
            <div>
              <label className="block mb-2">Severity</label>
              <Controller
                control={control}
                name={`allergies.${index}.severity`}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full h-14 p-3 border border-gray-400 rounded">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-[1000]">
                      {severityLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {
                errors.allergies?.[index]?.severity && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.allergies[index].severity.message}
                  </p>
                )
              }
            </div>

            {/* Reactions */}
            <div>
              <label className="block mb-2">Reactions</label>
              <Textarea
                className="w-full h-32 p-3 border border-gray-400 rounded"
                placeholder="Enter reactions here"
                {...register(`allergies.${index}.reactions`)}
              />
              {
                errors.allergies?.[index]?.reactions && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.allergies[index].reactions.message}
                  </p>
                )
              }
            </div>

            {/* Comments */}
            <div>
              <label className="block mb-2">Comments</label>
              <Textarea
                className="w-full h-32 p-3 border border-gray-400 rounded"
                placeholder="Enter comments here"
                {...register(`allergies.${index}.comments`)}
              />
              {
                errors.allergies?.[index]?.comments && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.allergies[index].comments.message}
                  </p>
                )
              }
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
