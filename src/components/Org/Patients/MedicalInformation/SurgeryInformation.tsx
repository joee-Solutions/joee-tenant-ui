import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { DatePicker } from "@/components/ui/date-picker";

// Define the type for a surgery entry
type SurgeryEntry = {
  id: number;
  surgeryType: string;
  date: string;
  additionalInfo: string;
};

const surgeryTypes = [
  "Appendectomy",
  "Tonsillectomy",
  "Gallbladder removal",
  "Hip replacement",
  "Knee replacement",
  "Cesarean section",
  "Heart surgery",
  "Cataract surgery",
  "Hernia repair",
  "Thyroid surgery",
  "Other",
];

// schema.ts
import { z } from "zod";
import { FormData } from "../AddPatient";
export const surgeryHistorySchema = z.array(
  z.object({
    surgeryType: z.string().optional(),
    date: z.string().optional(),
    additionalInfo: z.string().optional(),
  })
).optional();

export type SurgeryHistoryData = z.infer<typeof surgeryHistorySchema>;
export default function SurgeryHistoryForm() {

  const { control, register, formState: { errors } } = useFormContext<Pick<FormData, 'surgeryHistory'>>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "surgeryHistory",
  })

  return (
    <div className=" mx-auto p-6 ">
      <h1 className="text-2xl font-bold mb-6">Surgery History</h1>

      {
        fields.map((field, index) => (
          <div key={field.id} className="mb-8 border-b pb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Surgery Entry {index + 1}</h2>
              <div className="flex gap-2">
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Remove
                  </button>
                )}
                {index === fields.length - 1 && (
                  <button
                    type="button"
                    onClick={() => append({ surgeryType: "", date: "", additionalInfo: "" })}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Add Another
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Surgery Type */}
              <Controller
                name={`surgeryHistory.${index}.surgeryType`}
                control={control}
                render={({ field }) => (
                  <div>
                    <label
                      htmlFor={`surgeryType}`}
                      className="block text-base text-black font-normal mb-2"
                    >
                      Surgery Type
                    </label>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                        <SelectValue placeholder="Select surgery type" />
                      </SelectTrigger>
                      <SelectContent className="z-10 bg-white">
                        {surgeryTypes.map((type) => (
                          <SelectItem key={type} value={type} className="hover:bg-gray-200">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              {/* Date */}
              <div>
                <label
                  htmlFor={'date'}
                  className="block text-base text-black font-normal mb-2"
                >
                  Date
                </label>
                <Controller
                  name={`surgeryHistory.${index}.date`}
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                      placeholder="Select surgery date"
                    />
                  )}
                />
                {errors.surgeryHistory?.[index]?.date && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.surgeryHistory[index].date.message}
                  </p>
                )}

              </div>
              {/* Additional Information */}
              <div className="mt-6">
                <label
                  htmlFor={`additionalInfo-${field.additionalInfo}`}
                  className="block text-base text-black font-normal mb-2"
                >
                  Additional Information
                </label>
                <Textarea
                  {...register(`surgeryHistory.${index}.additionalInfo`)}
                  className="w-full h-32 p-3 border border-[#737373] rounded"
                  rows={4}
                  placeholder="Enter additional information"
                />
                {errors.surgeryHistory?.[index]?.additionalInfo && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.surgeryHistory[index].additionalInfo.message}
                  </p>
                )}
              </div>
            </div>

          </div>
        ))
      }
    </div>
  )
}