import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useFormContext, useFieldArray } from "react-hook-form";
import { FormData } from "../AddPatient";
import { z } from "zod";

// Define the type for a family history entry
type FamilyHistoryEntry = {
  id: number;
  relative: string;
  conditions: string;
  ageOfDiagnosis: string;
  currentAge: string;
};

export const famHistorySchema = z.array(
  z.object({
    relative: z.string().optional(),
    conditions: z.string().optional(),
    ageOfDiagnosis: z.string().optional(),
    currentAge: z.string().optional(),
  })
).optional();
export type FamilyHistoryData = z.infer<typeof famHistorySchema>;

export default function FamilyHistoryForm() {
  const { register, formState: { errors }, control } = useFormContext<Pick<FormData, 'famhistory'>>()
  const {
    fields, remove, append
  } = useFieldArray({
    control,
    name: "famhistory",
  })

  return (
    <div className=" mx-auto p-6 ">
      <h1 className="text-2xl font-bold mb-6">Family History</h1>

      {
        fields.map((field, index) => (
          <div key={field.id} className="mb-8 border-b pb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Family History Entry {index + 1}</h2>
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
                    onClick={() => append({ relative: "", conditions: "", ageOfDiagnosis: "", currentAge: "" })}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Add Another
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Relative */}
              <div>
                <label
                  htmlFor={`relative-${field.id}`}
                  className="block text-base text-black font-normal mb-2"
                >
                  Relative
                </label>
                <Input
                  type="text"
                  {...register(`famhistory.${index}.relative`, { required: "Relative is required" })}
                  className="w-full h-14 p-3 border border-[#737373] rounded"
                  placeholder="Enter relative"
                />
                {errors.famhistory?.[index]?.relative && (
                  <p className="text-red-500 text-sm mt-1">{errors.famhistory[index].relative.message}</p>
                )}
              </div>

              {/* Conditions */}
              <div>
                <label
                  htmlFor={`conditions-${field.id}`}
                  className="block text-base text-black font-normal mb-2"
                >
                  Conditions
                </label>
                <Input
                  type="text"
                  {...register(`famhistory.${index}.conditions`, { required: "Conditions are required" })}
                  className="w-full h-14 p-3 border border-[#737373] rounded"
                  placeholder="Enter conditions"
                />
                {errors.famhistory?.[
                  index]?.conditions && (
                    <p className="text-red-500 text-sm mt-1">{errors.famhistory[index].conditions.message}</p>
                  )}
              </div>
              {/* Age of Diagnosis */}
              <div>
                <label
                  htmlFor={`ageOfDiagnosis-${field.id}`}
                  className="block text-base text-black font-normal mb-2"
                >
                  Age of Diagnosis
                </label>
                <Input
                  type="text"
                  {...register(`famhistory.${index}.ageOfDiagnosis`, { required: "Age of diagnosis is required" })}
                  className="w-full h-14 p-3 border border-[#737373] rounded"
                  placeholder="Enter age of diagnosis"
                />
                {errors.famhistory?.[index]?.ageOfDiagnosis && (
                  <p className="text-red-500 text-sm mt-1">{errors.famhistory[index].ageOfDiagnosis.message}</p>
                )}
              </div>
              {/* Current Age */}
              <div>
                <label
                  htmlFor={`currentAge-${field.id}`}
                  className="block text-base text-black font-normal mb-2"
                >
                  Current Age
                </label>
                <Input
                  type="text"
                  {...register(`famhistory.${index}.currentAge`, { required: "Current age is required" })}
                  className="w-full h-14 p-3 border border-[#737373] rounded"
                  placeholder="Enter current age"
                />
                {errors.famhistory?.[index]?.currentAge && (
                  <p className="text-red-500 text-sm mt-1">{errors.famhistory[index].currentAge.message}</p>
                )}
              </div>
            </div>
          </div>
        ))
      }


    </div>
  );
}