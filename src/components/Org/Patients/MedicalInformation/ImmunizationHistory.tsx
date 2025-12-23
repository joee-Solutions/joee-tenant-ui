import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { DatePicker } from "@/components/ui/date-picker";
import { FormDataStepper } from "../PatientStepper";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const immunizationTypes = [
  "Influenza (Flu)",
  "COVID-19",
  "Tdap (Tetanus, Diphtheria, Pertussis)",
  "MMR (Measles, Mumps, Rubella)",
  "HPV",
  "Hepatitis B",
  "Pneumococcal",
  "Varicella (Chickenpox)",
  "Meningococcal",
];

export const immunizationHistorySchema = z.array(
  z.object({
    immunizationType: z.string().optional(),
    date: z.string().optional(),
    additionalInfo: z.string().optional(),
  })
).optional();
export type ImmunizationHistoryData = z.infer<typeof immunizationHistorySchema>;

export default function ImmunizationForm() {
  const { register, formState: { errors }, control } = useFormContext<Pick<FormDataStepper, 'immunizationHistory'>>()
  const {
    fields, remove, append
  } = useFieldArray({
    control,
    name: "immunizationHistory",
  })
  return (
    <div className=" mx-auto p-6 ">
      <h1 className="text-2xl font-bold mb-6">Immunization History</h1>

      {
        fields.map((field, index) => (
          <div key={field.id} className="mb-8 border-b pb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Immunization Entry {index + 1}</h2>
              <div className="flex gap-2">
                {fields.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => remove(index)}
                    variant="outline"
                    className="border border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 h-[60px] px-6 font-normal text-base"
                  >
                    Remove
                  </Button>
                )}
                {index === fields.length - 1 && (
                  <Button
                    type="button"
                    onClick={() => append({ immunizationType: "", date: "", additionalInfo: "" })}
                    className="font-normal text-base text-white bg-[#003465] h-[60px] px-6 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Immunization Type */}
              <div>
                <label
                  htmlFor={`immunizationType-${field.id}`}
                  className="block text-base text-black font-normal mb-2"
                >
                  Immunization Type
                </label>
                <Controller
                  name={`immunizationHistory.${index}.immunizationType`}
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                        <SelectValue placeholder="Select immunization type" />
                      </SelectTrigger>
                      <SelectContent className="z-10 bg-white">
                        {immunizationTypes.map((type) => (
                          <SelectItem key={type} value={type} className="hover:bg-gray-200">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {
                  errors.immunizationHistory?.[index]?.immunizationType && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.immunizationHistory[index].immunizationType.message}
                    </p>
                  )
                }
              </div>

              {/* Date */}
              <div>
                <label
                  htmlFor={`date-${field.id}`}
                  className="block text-base text-black font-normal mb-2"
                >
                  Date
                </label>
                <Controller
                  name={`immunizationHistory.${index}.date`}
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                      placeholder="Select immunization date"
                    />
                  )}
                />
                {
                  errors.immunizationHistory?.[index]?.date && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.immunizationHistory[index].date.message}
                    </p>
                  )
                }
              </div>

              {/* Additional Information */}
              <div className="mt-6">
                <label
                  htmlFor={`additionalInfo-${field.id}`}
                  className="block text-base text-black font-normal mb-2"
                >
                  Additional Information
                </label>
                <Textarea
                  {...register(`immunizationHistory.${index}.additionalInfo`)}
                  className="w-full h-32 p-3 border border-[#737373] rounded"
                  rows={4}
                  placeholder="Enter additional information"
                />
                {errors.immunizationHistory?.[index]?.additionalInfo && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.immunizationHistory[index].additionalInfo.message}
                  </p>
                )}

              </div>
            </div>
          </div>
        ))

      }

    </div>
  );
}